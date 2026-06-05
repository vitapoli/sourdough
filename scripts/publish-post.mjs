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

// --- Поиск правки от админа (текст, фото с подписью, или форматированный текст) ---
function getAdminResponse(afterDate) {
  const updates = tgRequest('getUpdates', { offset: -100 });

  // Ищем последнее сообщение от админа после отправки черновика
  for (const update of [...updates].reverse()) {
    const msg = update.message;
    if (!msg) continue;
    if (msg.from.id.toString() !== ADMIN_CHAT_ID) continue;
    if (msg.date <= afterDate) continue;
    if (msg.text === '/start' || (msg.text && msg.text.startsWith('/'))) continue;

    // Фото с подписью
    if (msg.photo && msg.caption) {
      return {
        type: 'photo',
        photo: msg.photo[msg.photo.length - 1].file_id, // наибольшее разрешение
        caption: msg.caption,
        caption_entities: msg.caption_entities || [],
      };
    }

    // Текстовое сообщение (с форматированием)
    if (msg.text) {
      return {
        type: 'text',
        text: msg.text,
        entities: msg.entities || [],
      };
    }
  }
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

  // Отдельным сообщением — номер поста и инста-версия
  const infoMsg = `#${state.nextPost + 1} · ${post.title}\n\n── Instagram ──\n${igVersion}`;

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
      // Публикуем фото с подписью и форматированием
      tgRequest('sendPhoto', {
        chat_id: CHANNEL_ID,
        photo: response.photo,
        caption: response.caption,
        caption_entities: response.caption_entities,
      });
      published = true;
      console.log('Опубликовано фото с подписью (отредактированная версия).');

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

} else {
  console.log('Использование: node publish-post.mjs --draft | --publish');
  process.exit(1);
}
