#!/usr/bin/env node
/**
 * Запись в Google-док очереди через Docs API (service account).
 *
 * Ключ робота: ~/.secrets/google-docs-sa.json (НЕ в git, НЕ в content/).
 * Док расшарен на email робота (k.client_email) с правами Editor.
 * Сеть — через curl (Node fetch в этой среде по сети не ходит), JWT подписываем crypto.
 * Индексы Docs API — в UTF-16 (как .length в JS), поэтому смещения совпадают.
 *
 * ПРАВИЛО: скрипт только ДОБАВЛЯЕТ текст в конец дока. Он НИКОГДА не удаляет и не
 * редактирует уже существующий текст в доке (никаких deleteContentRange и правок чужих
 * абзацев). Так задумано по требованию пользователя — чистка/переносы только вручную.
 *
 * Режимы:
 *   --test                  вставить тестовый абзац в конец дока (проверка доступа).
 *   --posts [файл]          ДОПИСАТЬ посты из файла в конец дока (в песочницу, ниже «ЧЕРНОВИКИ»).
 *   --posts-dry [файл]      только распарсить файл и показать, что нашлось (без записи).
 * Файл по умолчанию: content/week-posts-draft.md.
 * Заголовок поста → стиль HEADING_1, **жирный** → жирный.
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import crypto from 'crypto';
import { resolve } from 'path';

const DOC_ID = '1q3Qp9hBYyYjeyddgNcSq1z7KYsFkKrnb5vl0qtdjYIw';
const KEY_PATH = resolve(process.env.HOME, '.secrets/google-docs-sa.json');
const ROOT = resolve(new URL('..', import.meta.url).pathname);
const BATCH_URL = `https://docs.googleapis.com/v1/documents/${DOC_ID}:batchUpdate`;

const key = JSON.parse(readFileSync(KEY_PATH, 'utf-8'));

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// --- Access token из service account (JWT → oauth token), через curl ---
function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/documents',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${claims}`;
  const signature = b64url(crypto.createSign('RSA-SHA256').update(signingInput).sign(key.private_key));
  const jwt = `${signingInput}.${signature}`;

  const body = `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`;
  writeFileSync('/tmp/gdoc-token-body.txt', body);
  const res = execSync(
    'curl -s --max-time 30 -X POST -H "Content-Type: application/x-www-form-urlencoded" ' +
    '--data @/tmp/gdoc-token-body.txt https://oauth2.googleapis.com/token',
    { encoding: 'utf-8' }
  );
  const data = JSON.parse(res);
  if (!data.access_token) {
    console.error('Не удалось получить токен Google:', res);
    process.exit(1);
  }
  return data.access_token;
}

function apiGet(token, url) {
  const res = execSync(`curl -s --max-time 30 -H "Authorization: Bearer ${token}" "${url}"`, { encoding: 'utf-8' });
  return JSON.parse(res);
}

function apiPost(token, url, bodyObj) {
  writeFileSync('/tmp/gdoc-req.json', JSON.stringify(bodyObj));
  const res = execSync(
    `curl -s --max-time 30 -X POST -H "Authorization: Bearer ${token}" ` +
    `-H "Content-Type: application/json" --data @/tmp/gdoc-req.json "${url}"`,
    { encoding: 'utf-8' }
  );
  return JSON.parse(res);
}

const getDoc = (token) => apiGet(token, `https://docs.googleapis.com/v1/documents/${DOC_ID}`);

// Индекс для вставки в самый конец тела дока (перед финальным переводом строки).
const endInsertIndex = (doc) => doc.body.content[doc.body.content.length - 1].endIndex - 1;

// --- Разбор файла недели постов (формат content/week-posts-draft.md) ---
function parsePostsFile(path) {
  const lines = readFileSync(path, 'utf-8').split('\n');
  const markers = [];
  lines.forEach((l, i) => { if (/^=== ПОСТ /.test(l)) markers.push(i); });
  const posts = [];
  for (let m = 0; m < markers.length; m++) {
    const from = markers[m] + 2; // пропускаем «=== ПОСТ …» и «====» под ней
    const to = (m + 1 < markers.length) ? markers[m + 1] - 1 : lines.length;
    let chunk = lines.slice(from, to).filter((l) => !/^=+$/.test(l.trim()));
    while (chunk.length && chunk[0].trim() === '') chunk.shift();
    while (chunk.length && chunk[chunk.length - 1].trim() === '') chunk.pop();
    if (!chunk.length) continue;
    const title = chunk[0].trim();
    let bodyLines = chunk.slice(1);
    while (bodyLines.length && bodyLines[0].trim() === '') bodyLines.shift();
    posts.push({ title, body: bodyLines.join('\n').trim() });
  }
  return posts;
}

// Единый текст + диапазоны (offset в UTF-16) для заголовков и жирного.
function buildInsertion(posts) {
  let clean = '';
  const headings = [];
  const bolds = [];
  for (const p of posts) {
    const tStart = clean.length;
    clean += p.title;
    headings.push([tStart, clean.length]);
    clean += '\n';
    const body = p.body;
    let i = 0;
    while (i < body.length) {
      if (body.startsWith('**', i)) {
        const e = body.indexOf('**', i + 2);
        if (e !== -1) {
          const inner = body.slice(i + 2, e);
          const bStart = clean.length;
          clean += inner;
          bolds.push([bStart, clean.length]);
          i = e + 2;
          continue;
        }
      }
      clean += body[i];
      i++;
    }
    clean += '\n\n';
  }
  return { text: '\n' + clean, headings, bolds, prefix: 1 };
}

// Вставить посты в конец дока (с форматированием).
function insertPosts(token, doc, posts) {
  const { text, headings, bolds, prefix } = buildInsertion(posts);
  const base = endInsertIndex(doc);
  const off = base + prefix;
  const requests = [{ insertText: { location: { index: base }, text } }];
  for (const [s, e] of headings) {
    requests.push({ updateParagraphStyle: {
      range: { startIndex: off + s, endIndex: off + e },
      paragraphStyle: { namedStyleType: 'HEADING_1' }, fields: 'namedStyleType',
    } });
  }
  for (const [s, e] of bolds) {
    requests.push({ updateTextStyle: {
      range: { startIndex: off + s, endIndex: off + e },
      textStyle: { bold: true }, fields: 'bold',
    } });
  }
  const r = apiPost(token, BATCH_URL, { requests });
  if (r.error) { console.error('Ошибка записи:', r.error.message); process.exit(1); }
  console.log(`✅ Залито постов: ${posts.length} (заголовков: ${headings.length}, жирных: ${bolds.length}).`);
}

// --- main ---
const mode = process.argv[2];
const fileArg = process.argv[3];
const filePath = fileArg || resolve(ROOT, 'content/week-posts-draft.md');

if (mode === '--posts-dry') {
  const posts = parsePostsFile(filePath);
  console.log(`Найдено постов: ${posts.length}`);
  posts.forEach((p, i) => console.log(`  ${i + 1}. ${p.title}  (${p.body.length} симв.)`));
  process.exit(0);
}

const token = getAccessToken();
let doc = getDoc(token);
if (doc.error) {
  console.error('Ошибка доступа к доку:', doc.error.message);
  if (doc.error.code === 403) {
    console.error(`\nПохоже, док НЕ расшарен на робота:\n  ${key.client_email}\nОткрой док → «Поделиться» → добавь этот email как Editor.`);
  }
  process.exit(1);
}
console.log('Док:', JSON.stringify(doc.title));

if (mode === '--test') {
  const at = endInsertIndex(doc);
  const r = apiPost(token, BATCH_URL, {
    requests: [{ insertText: { location: { index: at }, text: '\n🤖 Тест записи из скрипта — этот абзац можно удалить.' } }],
  });
  if (r.error) { console.error('Ошибка записи:', r.error.message); process.exit(1); }
  console.log('✅ Тестовый абзац вставлен в конец дока (песочница).');

} else if (mode === '--posts') {
  const posts = parsePostsFile(filePath);
  if (!posts.length) { console.error('В файле не найдено постов:', filePath); process.exit(1); }
  insertPosts(token, doc, posts);
  console.log('Посты ДОПИСАНЫ в конец дока (песочница, ниже «ЧЕРНОВИКИ»). Ничего не удалялось и не менялось.');

} else {
  console.log('Режимы: --test | --posts [файл] | --posts-dry [файл]');
}
