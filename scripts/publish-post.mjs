#!/usr/bin/env node
/**
 * Автопубликация постов в Telegram-канал @levainlab (режим --scheduled).
 *
 * Источник постов — Google-док (см. content/queue-config.json), разделённый заголовками.
 * Бот сам ставит даты (по одному посту в день в 08:00 МСК), за 24ч шлёт админу черновик
 * в ЛС, ловит правку и публикует именно её (с форматированием); если правки нет — оригинал.
 * Состояние очереди — content/scheduled-posts.json. Пауза — content/bot-state.json.
 * Команды от админа в ЛС: /stop — остановить публикации, /start — возобновить.
 * Запускается из cron на сервере levainlab.ru (см. scripts/publish-cron.sh) раз в N минут.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { fetchDocHtml, parsePostsFromHeadings } from './doc-queue.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// --- Загрузка секретов ---
const secretsPath = resolve(process.env.HOME, '.secrets/sourdough-tokens');
const secrets = {};
readFileSync(secretsPath, 'utf-8').split('\n').forEach(line => {
  const [key, ...val] = line.split('=');
  if (key && val.length) secrets[key.trim()] = val.join('=').trim();
});

const BOT_TOKEN = secrets.TG_BOT_TOKEN;
const CHANNEL_ID = secrets.TG_CHANNEL_ID;
const ADMIN_CHAT_ID = secrets.TG_ADMIN_CHAT_ID;

// --- Состояние паузы бота (content/bot-state.json) ---
const botStatePath = resolve(ROOT, 'content/bot-state.json');

function getBotState() {
  if (existsSync(botStatePath)) {
    try { return JSON.parse(readFileSync(botStatePath, 'utf-8')); } catch {}
  }
  return { paused: false, lastCmdId: 0 };
}

function saveBotState(s) {
  writeFileSync(botStatePath, JSON.stringify(s, null, 2));
}

// --- Команды от админа: /stop (пауза) и /start (возобновить) ---
// Возвращает true, если состояние паузы изменилось (нужно сохранить).
function processCommands(state) {
  const STOP = ['/stop', '/pause', '/стоп', '/пауза'];
  const GO = ['/start', '/resume', '/go', '/старт', '/пуск'];
  let updates;
  try { updates = tgRequest('getUpdates', { offset: -100 }); } catch { return false; }

  const cmds = [];
  let maxId = state.lastCmdId || 0;
  for (const u of updates) {
    const m = u.message || u.edited_message;
    if (!m || !m.from || m.from.id.toString() !== ADMIN_CHAT_ID || !m.text) continue;
    if (u.update_id > maxId) maxId = u.update_id;
    if (u.update_id <= (state.lastCmdId || 0)) continue;
    const t = m.text.trim().toLowerCase();
    if (STOP.includes(t)) cmds.push({ id: u.update_id, pause: true });
    else if (GO.includes(t)) cmds.push({ id: u.update_id, pause: false });
  }

  let changed = false;
  if (maxId !== (state.lastCmdId || 0)) { state.lastCmdId = maxId; changed = true; }
  if (cmds.length) {
    cmds.sort((a, b) => a.id - b.id);
    const wanted = cmds[cmds.length - 1].pause; // действует последняя команда
    if (state.paused !== wanted) {
      state.paused = wanted;
      changed = true;
      sendMessage(ADMIN_CHAT_ID, wanted
        ? '⏸ Публикации остановлены. Чтобы возобновить — пришли /start'
        : '▶️ Публикации возобновлены.');
    }
  }
  return changed;
}

// --- Telegram API (через curl, т.к. Node fetch не проходит по сети) ---
function tgRequest(method, body) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/${method}`;
  // Пишем body в temp-файл чтобы избежать проблем с экранированием
  const tmpFile = '/tmp/tg-request-body.json';
  writeFileSync(tmpFile, JSON.stringify(body));
  const result = execSync(
    `curl -s --max-time 30 -X POST -H "Content-Type: application/json" -d @${tmpFile} "${url}"`,
    { encoding: 'utf-8' }
  );
  const data = JSON.parse(result);
  if (!data.ok) {
    console.error(`TG API error (${method}):`, data);
    process.exit(1);
  }
  return data.result;
}

function sendMessage(chatId, text) {
  return tgRequest('sendMessage', {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
  });
}

// --- Поиск правки от админа (текст, фото с подписью, или два сообщения) ---
function getAdminResponse(afterDate) {
  const updates = tgRequest('getUpdates', { offset: -100 });
  console.log(`getUpdates вернул ${updates.length} апдейтов`);

  // Собираем все сообщения от админа после отправки черновика
  // edited_message — когда админ редактирует уже отправленное сообщение
  const adminMessages = [];
  for (const update of updates) {
    const msg = update.message || update.edited_message;
    if (!msg) continue;
    if (!msg.from || msg.from.id.toString() !== ADMIN_CHAT_ID) continue;
    if (msg.date <= afterDate) continue;
    if (msg.text === '/start' || (msg.text && msg.text.startsWith('/'))) continue;
    adminMessages.push(msg);
  }

  console.log(`Сообщений от админа после черновика: ${adminMessages.length}`);
  for (const msg of adminMessages) {
    console.log(`  date=${msg.date}, photo=${!!msg.photo}, text=${!!msg.text}, caption=${!!msg.caption}, document=${!!msg.document}`);
  }

  if (adminMessages.length === 0) {
    console.log('Ответ от админа не найден.');
    return null;
  }

  // 1. Фото с подписью в одном сообщении — идеально
  const photoWithCaption = adminMessages.find(m => m.photo && m.caption);
  if (photoWithCaption) {
    return {
      type: 'photo',
      photo: photoWithCaption.photo[photoWithCaption.photo.length - 1].file_id,
      caption: photoWithCaption.caption,
      caption_entities: photoWithCaption.caption_entities || [],
    };
  }

  // 2. Фото и текст двумя отдельными сообщениями (в любом порядке)
  //    Telegram не даёт подпись длиннее 1024 символов, поэтому админ
  //    отправляет фото отдельно, а текст отдельно
  const photoMsg = adminMessages.find(m => m.photo);
  const textMsg = [...adminMessages].reverse().find(m => m.text); // последний текст
  if (photoMsg && textMsg) {
    return {
      type: 'photo',
      photo: photoMsg.photo[photoMsg.photo.length - 1].file_id,
      caption: textMsg.text,
      caption_entities: textMsg.entities || [],
    };
  }

  // 3. Только фото без текста
  if (photoMsg) {
    return {
      type: 'photo',
      photo: photoMsg.photo[photoMsg.photo.length - 1].file_id,
      caption: '',
      caption_entities: [],
    };
  }

  // 4. Документ-картинка (фото отправлено как файл)
  const docMsg = adminMessages.find(m => m.document && m.document.mime_type && m.document.mime_type.startsWith('image/'));
  if (docMsg) {
    const caption = textMsg ? textMsg.text : (docMsg.caption || '');
    const entities = textMsg ? (textMsg.entities || []) : (docMsg.caption_entities || []);
    return {
      type: 'document_photo',
      document: docMsg.document.file_id,
      caption,
      caption_entities: entities,
    };
  }

  // 5. Только текст
  if (textMsg) {
    return {
      type: 'text',
      text: textMsg.text,
      entities: textMsg.entities || [],
    };
  }

  console.log('Ответ от админа не найден.');
  return null;
}

// --- Конвертация **жирного** markdown в Telegram entities (offset/length в UTF-16) ---
function mdToEntities(src) {
  const entities = [];
  let out = '';
  let i = 0;
  while (i < src.length) {
    if (src.startsWith('**', i)) {
      const end = src.indexOf('**', i + 2);
      if (end !== -1) {
        const inner = src.slice(i + 2, end);
        entities.push({ type: 'bold', offset: out.length, length: inner.length });
        out += inner;
        i = end + 2;
        continue;
      }
    }
    out += src[i];
    i++;
  }
  return { text: out, entities };
}

// --- Человеческая дата по Москве: «сб, 13 июня, 08:00» ---
function formatWhen(iso) {
  try {
    return new Date(iso).toLocaleString('ru-RU', {
      weekday: 'short', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow',
    });
  } catch {
    return iso;
  }
}

// --- Следующий слот публикации: следующий день в 08:00 по Москве после iso ---
function nextMoscowSlot(iso) {
  const dt = new Date(iso.slice(0, 10) + 'T00:00:00Z');
  dt.setUTCDate(dt.getUTCDate() + 1);
  const p = (n) => String(n).padStart(2, '0');
  return `${dt.getUTCFullYear()}-${p(dt.getUTCMonth() + 1)}-${p(dt.getUTCDate())}T08:00:00+03:00`;
}

// --- Синхронизация очереди из Google-дока (настройки в content/queue-config.json) ---
// Посты в доке разделены заголовками. Бот сам ставит даты: по одному в день в 08:00 МСК,
// по порядку, следом за последним уже запланированным постом.
// Только добавляем — ничего не удаляем (сбой сети = просто ничего не делаем).
function syncDocPosts(scheduled) {
  const cfgPath = resolve(ROOT, 'content/queue-config.json');
  if (!existsSync(cfgPath)) return false;
  let cfg;
  try { cfg = JSON.parse(readFileSync(cfgPath, 'utf-8')); } catch { return false; }
  if (!cfg.enabled || !cfg.docId) return false;

  let docPosts;
  try {
    docPosts = parsePostsFromHeadings(fetchDocHtml(cfg.docId));
  } catch (e) {
    console.error('Не удалось прочитать Google-док:', e.message);
    return false;
  }

  // берём посты, начиная с cfg.startFrom (всё, что выше в доке, игнорируем),
  // и, если задан cfg.stopBefore, — до него (этот пост и всё ниже не трогаем)
  const sIdx = cfg.startFrom ? docPosts.findIndex(p => p.title === cfg.startFrom.trim()) : 0;
  const eIdx = cfg.stopBefore ? docPosts.findIndex(p => p.title === cfg.stopBefore.trim()) : -1;
  docPosts = docPosts.slice(sIdx < 0 ? docPosts.length : sIdx, eIdx < 0 ? docPosts.length : eIdx);

  // самый поздний запланированный день — от него продолжаем нумерацию
  let lastDate = scheduled.reduce((mx, p) => (p.publishAt > mx ? p.publishAt : mx),
    new Date().toISOString().slice(0, 10) + 'T08:00:00+03:00');

  let changed = false;
  for (const dp of docPosts) {
    const existing = scheduled.find(p => p.id === dp.id || p.title === dp.title);
    if (existing) {
      // подхватываем правки из дока — только для постов из дока, ещё не вышедших
      // и не отправленных на проверку (дату не трогаем)
      if (existing.id.startsWith('doc-') && !existing.published && !existing.reviewSentAt) {
        const same = existing.text === dp.text &&
          JSON.stringify(existing.entities || []) === JSON.stringify(dp.entities || []);
        if (!same) {
          Object.assign(existing, { title: dp.title, text: dp.text, entities: dp.entities });
          changed = true;
          console.log(`Обновил из дока: "${dp.title}"`);
        }
      }
      continue;
    }
    let slot = nextMoscowSlot(lastDate);
    while (new Date(slot).getTime() <= Date.now()) slot = nextMoscowSlot(slot);
    lastDate = slot;
    scheduled.push({ id: dp.id, title: dp.title, publishAt: slot, text: dp.text, entities: dp.entities });
    changed = true;
    console.log(`Из дока добавлен пост: "${dp.title}" → ${slot}`);
    // короткая шапка + сам пост с форматированием (чтобы сразу видеть оформление)
    sendMessage(ADMIN_CHAT_ID, `📥 Взял из дока новый пост, выйдет ${formatWhen(slot)}:`);
    tgRequest('sendMessage', {
      chat_id: ADMIN_CHAT_ID,
      text: dp.text,
      entities: dp.entities || [],
      disable_web_page_preview: true,
    });
  }
  return changed;
}

// --- Публикация запланированного поста: правка админа (с форматированием) или оригинал ---
function publishScheduledPost(post) {
  const r = post.edited;

  if (r && r.type === 'photo') {
    let caption = r.caption || '';
    let entities = r.caption_entities || [];
    if (caption.length > 1024) {
      const cut = caption.lastIndexOf('\n', 1021);
      caption = caption.substring(0, cut > 0 ? cut : 1021) + '...';
      entities = entities.filter(e => e.offset + e.length <= caption.length);
    }
    tgRequest('sendPhoto', { chat_id: CHANNEL_ID, photo: r.photo, caption, caption_entities: entities });
    return 'фото с подписью, твоя правка';
  }

  if (r && r.type === 'document_photo') {
    tgRequest('sendDocument', {
      chat_id: CHANNEL_ID, document: r.document,
      caption: r.caption || '', caption_entities: r.caption_entities || [],
    });
    return 'фото-документ, твоя правка';
  }

  if (r && r.type === 'text') {
    tgRequest('sendMessage', {
      chat_id: CHANNEL_ID, text: r.text,
      entities: r.entities || [], disable_web_page_preview: true,
    });
    return 'твоя правка';
  }

  // Правки не было — оригинал из файла со своим форматированием (entities из дока),
  // а если их нет — fallback на **жирный** markdown.
  const hasEnt = Array.isArray(post.entities) && post.entities.length > 0;
  const { text, entities } = hasEnt
    ? { text: post.text, entities: post.entities }
    : mdToEntities(post.text);
  tgRequest('sendMessage', {
    chat_id: CHANNEL_ID, text, entities, disable_web_page_preview: true,
  });
  return 'оригинал из файла';
}

// --- Основная логика ---
const mode = process.argv[2];

if (mode === '--scheduled') {
  // Посты из Google-дока (content/scheduled-posts.json). Запускается из cron на сервере раз в N минут.
  // Поток:
  //   0) обрабатываем команды /stop и /start; если на паузе — ничего не делаем;
  //   1) за LEAD_HOURS до выхода присылаем черновик админу в ЛС на проверку;
  //   2) ловим присланную админом правку и сохраняем её (с форматированием);
  //   3) в назначенное время публикуем правку админа, а если её нет — оригинал.

  // 0. Команды паузы от админа (/stop, /start). На паузе — выходим, ничего не публикуя.
  const botState = getBotState();
  if (processCommands(botState)) saveBotState(botState);
  if (botState.paused) {
    console.log('⏸ Публикации на паузе — пропускаю прогон.');
    process.exit(0);
  }

  const LEAD_HOURS = 24; // за сколько часов до выхода слать черновик на проверку

  const schedPath = resolve(ROOT, 'content/scheduled-posts.json');
  if (!existsSync(schedPath)) {
    console.log('Нет файла scheduled-posts.json — нечего публиковать.');
    process.exit(0);
  }
  const scheduled = JSON.parse(readFileSync(schedPath, 'utf-8'));
  const now = Date.now();
  let changed = false;

  // 0. Подтянуть новые/обновлённые посты из Google-дока (если включено в queue-config.json)
  if (syncDocPosts(scheduled)) changed = true;

  // 1. Черновик на проверку. Не больше одного поста «на проверке» одновременно —
  //    иначе непонятно, к какому посту относится ответ админа.
  const awaitingReview = scheduled.some(p => !p.published && p.reviewSentAt);
  if (!awaitingReview) {
    const next = scheduled
      .filter(p => !p.published && !p.reviewSentAt)
      .filter(p => {
        const at = new Date(p.publishAt).getTime();
        return !Number.isNaN(at) && at - now <= LEAD_HOURS * 3600 * 1000;
      })
      .sort((a, b) => new Date(a.publishAt) - new Date(b.publishAt))[0];
    if (next) {
      // черновик — с форматированием из файла (entities), иначе fallback на **жирный**
      const hasEnt = Array.isArray(next.entities) && next.entities.length > 0;
      const draft = hasEnt ? { text: next.text, entities: next.entities } : mdToEntities(next.text);
      tgRequest('sendMessage', {
        chat_id: ADMIN_CHAT_ID,
        text: draft.text,
        entities: draft.entities,
        disable_web_page_preview: true,
      });
      const info = `📅 Выйдет в канал: ${formatWhen(next.publishAt)}\n\n` +
        `Можешь поправить и прислать обратно — опубликую твою версию.\n` +
        `Не ответишь — выйдет этот вариант.`;
      sendMessage(ADMIN_CHAT_ID, info);
      next.reviewSentAt = Math.floor(now / 1000);
      changed = true;
      console.log(`Черновик на проверку отправлен: "${next.title}" (выход ${next.publishAt})`);
    }
  }

  // 2. Ловим правку админа и сохраняем (пока пост не опубликован).
  for (const p of scheduled) {
    if (p.published || !p.reviewSentAt) continue;
    const response = getAdminResponse(p.reviewSentAt);
    if (response && JSON.stringify(response) !== JSON.stringify(p.edited || null)) {
      p.edited = response;
      changed = true;
      sendMessage(ADMIN_CHAT_ID, `✏️ Принял твою правку для поста на ${formatWhen(p.publishAt)} — опубликую в назначенное время.`);
      console.log(`Захвачена правка для "${p.title}"`);
    }
  }

  // 3. Публикуем по времени: правку админа, а если её нет — оригинал из файла.
  let publishedCount = 0;
  for (const p of scheduled) {
    if (p.published) continue;
    const at = new Date(p.publishAt).getTime();
    if (Number.isNaN(at)) {
      console.error(`Плохая дата у поста "${p.title || ''}": ${p.publishAt}`);
      continue;
    }
    if (at > now) continue;

    const how = publishScheduledPost(p);
    p.published = true;
    p.publishedAt = Math.floor(now / 1000);
    changed = true;
    publishedCount++;
    sendMessage(ADMIN_CHAT_ID, `✅ Опубликован пост на ${formatWhen(p.publishAt)} (${how}).`);
    console.log(`Опубликован запланированный пост: "${p.title}" — ${how}`);
  }

  if (changed) writeFileSync(schedPath, JSON.stringify(scheduled, null, 2));
  if (publishedCount === 0) console.log('Постов к публикации на текущий момент нет.');

} else {
  console.log('Использование: node publish-post.mjs --scheduled');
  process.exit(1);
}
