#!/usr/bin/env node
/**
 * Автопубликация постов в Telegram-канал @levainlab
 *
 * Режимы:
 *   --draft    — отправить черновик админу на проверку (за 24ч до публикации)
 *   --publish  — опубликовать в канал (если админ не прислал правку — берём оригинал)
 *
 * Посты берутся последовательно из content/tg-posts.md
 * Состояние (какой пост следующий) хранится в content/.publish-state.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

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

// --- Парсинг постов из markdown ---
function parsePosts() {
  const content = readFileSync(resolve(ROOT, 'content/tg-posts.md'), 'utf-8');
  const posts = [];
  const sections = content.split(/^## /m).slice(1);

  for (const section of sections) {
    const lines = section.trim().split('\n');
    const title = lines[0].trim();
    const body = lines.slice(1).join('\n').trim();
    if (body) {
      posts.push({ title, body });
    }
  }
  return posts;
}

// --- Состояние публикации ---
const statePath = resolve(ROOT, 'content/.publish-state.json');

function getState() {
  if (existsSync(statePath)) {
    return JSON.parse(readFileSync(statePath, 'utf-8'));
  }
  return { nextPost: 0, pendingDraft: null, draftSentAt: null };
}

function saveState(state) {
  writeFileSync(statePath, JSON.stringify(state, null, 2));
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

// --- Генерация Instagram-версии ---
function makeInstagramVersion(tgPost) {
  let text = tgPost
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/👉 sourdough\.viosay\.fun/g, '')
    .replace(/📎 Статья:.*$/gm, '')
    .replace(/📎.*$/gm, '')
    .trim();
  text += '\n\n#хлебназакваске #закваска #sourdough #домашнийхлеб #levainlab #выпечка #хлеб';
  return text;
}

// --- Основная логика ---
const mode = process.argv[2];

if (mode === '--draft') {
  const posts = parsePosts();
  const state = getState();

  if (state.nextPost >= posts.length) {
    console.log('Все посты опубликованы!');
    process.exit(0);
  }

  const post = posts[state.nextPost];
  const igVersion = makeInstagramVersion(post.body);

  // Отправляем чистый текст поста (без обёрток)
  sendMessage(ADMIN_CHAT_ID, post.body);

  // Отдельным сообщением — номер поста, лимит и инста-версия
  const charNote = `📏 ${post.body.length} символов` + (post.body.length > 1024 ? ` (лимит подписи к фото — 1024, нужно сократить)` : ` (ок для фото)`);
  const infoMsg = `#${state.nextPost + 1} · ${post.title}\n${charNote}\n\n── Instagram ──\n${igVersion}`;

  sendMessage(ADMIN_CHAT_ID, infoMsg);

  state.pendingDraft = post.body;
  state.draftSentAt = Math.floor(Date.now() / 1000);
  saveState(state);

  console.log(`Черновик отправлен: "${post.title}"`);

} else if (mode === '--publish') {
  const state = getState();
  const posts = parsePosts();

  if (state.nextPost >= posts.length) {
    console.log('Все посты опубликованы!');
    process.exit(0);
  }

  // Ищем ответ админа (текст или фото с форматированием)
  let published = false;

  if (state.draftSentAt) {
    const response = getAdminResponse(state.draftSentAt);

    if (response && response.type === 'photo') {
      let caption = response.caption;
      let entities = response.caption_entities;

      // Telegram лимит подписи к фото — 1024 символа
      if (caption.length > 1024) {
        console.log(`⚠️ Подпись ${caption.length} символов, обрезаю до 1024`);
        // Обрезаем по последнему переносу строки до лимита
        const cut = caption.lastIndexOf('\n', 1021);
        caption = caption.substring(0, cut > 0 ? cut : 1021) + '...';
        // Убираем entities, которые выходят за границу
        entities = entities.filter(e => e.offset + e.length <= caption.length);
      }

      tgRequest('sendPhoto', {
        chat_id: CHANNEL_ID,
        photo: response.photo,
        caption,
        caption_entities: entities,
      });
      published = true;
      console.log(`Опубликовано фото с подписью (${caption.length} символов).`);

    } else if (response && response.type === 'document_photo') {
      // Публикуем документ-фото с подписью
      tgRequest('sendDocument', {
        chat_id: CHANNEL_ID,
        document: response.document,
        caption: response.caption,
        caption_entities: response.caption_entities,
      });
      published = true;
      console.log('Опубликовано фото-документ с подписью (отредактированная версия).');

    } else if (response && response.type === 'text') {
      // Публикуем текст с форматированием
      tgRequest('sendMessage', {
        chat_id: CHANNEL_ID,
        text: response.text,
        entities: response.entities,
        disable_web_page_preview: true,
      });
      published = true;
      console.log('Опубликован текст с форматированием (отредактированная версия).');
    }
  }

  // Если правок не было — публикуем оригинал из файла
  if (!published) {
    let textToPublish = state.pendingDraft;
    if (!textToPublish) {
      const post = posts[state.nextPost];
      if (!post) {
        console.log('Нет поста для публикации!');
        process.exit(1);
      }
      textToPublish = post.body;
    }
    sendMessage(CHANNEL_ID, textToPublish);
    console.log('Правок не было, опубликован оригинал.');
  }

  // Уведомляем админа
  sendMessage(ADMIN_CHAT_ID, '✅ Пост опубликован в канал!');

  // Обновляем состояние
  state.nextPost++;
  state.pendingDraft = null;
  state.draftSentAt = null;
  saveState(state);

  console.log(`Опубликован пост #${state.nextPost}`);

} else if (mode === '--debug') {
  // Показать что бот видит в апдейтах, без публикации
  const state = getState();
  console.log('=== Текущее состояние ===');
  console.log(JSON.stringify(state, null, 2));
  console.log('');
  console.log('=== Апдейты от Telegram ===');
  const updates = tgRequest('getUpdates', { offset: -100 });
  console.log(`Всего апдейтов: ${updates.length}`);
  for (const update of updates) {
    const edited = !update.message && !!update.edited_message;
    const msg = update.message || update.edited_message;
    if (!msg) {
      console.log(`  update_id=${update.update_id}: нет message`);
      continue;
    }
    const from = msg.from ? `${msg.from.first_name} (id=${msg.from.id})` : 'unknown';
    const isAdmin = msg.from && msg.from.id.toString() === ADMIN_CHAT_ID;
    const afterDraft = msg.date > (state.draftSentAt || 0);
    console.log(`  update_id=${update.update_id}: ${edited ? '[EDIT] ' : ''}from=${from}, date=${msg.date}, admin=${isAdmin}, afterDraft=${afterDraft}`);
    if (msg.text) console.log(`    text: "${msg.text.substring(0, 80)}..."`);
    if (msg.photo) console.log(`    photo: ${msg.photo.length} sizes, file_id=${msg.photo[msg.photo.length-1].file_id.substring(0, 30)}...`);
    if (msg.caption) console.log(`    caption: "${msg.caption.substring(0, 80)}..."`);
    if (msg.document) console.log(`    document: ${msg.document.mime_type}, file_id=${msg.document.file_id.substring(0, 30)}...`);
  }

  // Проверяем, что найдёт getAdminResponse
  if (state.draftSentAt) {
    console.log('');
    console.log('=== Результат поиска ответа админа ===');
    const response = getAdminResponse(state.draftSentAt);
    if (response) {
      console.log(`Найден ответ: type=${response.type}`);
      console.log(JSON.stringify(response, null, 2));
    } else {
      console.log('Ответ админа НЕ НАЙДЕН');
    }
  }

} else {
  console.log('Использование: node publish-post.mjs --draft | --publish | --debug');
  process.exit(1);
}
