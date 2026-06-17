#!/usr/bin/env node
/**
 * Работа с Google-доком «Статьи для разбора» (источники для понедельничных постов).
 *
 * Док читаем через тот же service-account, что и docs-очередь
 * (ключ ~/.secrets/google-docs-sa.json; док расшарен на робота).
 *
 * ПРАВИЛО (как и для дока очереди): только ЧИТАЕМ и ДОПИСЫВАЕМ в конец.
 * Никогда не удаляем и не редактируем существующий текст в доке пользователя.
 *
 * Режимы:
 *   --read           показать список статей (блок текста + ссылки), пометив уже использованные.
 *   --seed           ОДИН РАЗ: дописать в конец дока статьи из content/article-sources.md.
 *   --mark <url>     отметить статью использованной (в локальном content/sources-used.json).
 *
 * «Использованные» хранятся ЛОКАЛЬНО (content/sources-used.json) — НЕ в доке пользователя.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import crypto from 'crypto';
import { resolve } from 'path';

const SOURCES_DOC_ID = '1w9hShNBTVMZWiZEBsL-7Tvg_NwPuRzz1nFYxXZY57dc';
const KEY_PATH = resolve(process.env.HOME, '.secrets/google-docs-sa.json');
const ROOT = resolve(new URL('..', import.meta.url).pathname);
const USED_PATH = resolve(ROOT, 'content/sources-used.json');
const key = JSON.parse(readFileSync(KEY_PATH, 'utf-8'));

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/documents',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }));
  const input = `${header}.${claims}`;
  const sig = b64url(crypto.createSign('RSA-SHA256').update(input).sign(key.private_key));
  const body = `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${input}.${sig}`;
  writeFileSync('/tmp/src-token.txt', body);
  const res = execSync(
    'curl -s --max-time 30 -X POST -H "Content-Type: application/x-www-form-urlencoded" --data @/tmp/src-token.txt https://oauth2.googleapis.com/token',
    { encoding: 'utf-8' });
  const data = JSON.parse(res);
  if (!data.access_token) { console.error('Нет токена:', res); process.exit(1); }
  return data.access_token;
}

function apiGet(token, url) {
  return JSON.parse(execSync(`curl -s --max-time 30 -H "Authorization: Bearer ${token}" "${url}"`, { encoding: 'utf-8' }));
}
function apiPost(token, url, bodyObj) {
  writeFileSync('/tmp/src-req.json', JSON.stringify(bodyObj));
  return JSON.parse(execSync(
    `curl -s --max-time 30 -X POST -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" --data @/tmp/src-req.json "${url}"`,
    { encoding: 'utf-8' }));
}

const getDoc = (token) => apiGet(token, `https://docs.googleapis.com/v1/documents/${SOURCES_DOC_ID}`);
const endIndex = (doc) => doc.body.content[doc.body.content.length - 1].endIndex - 1;

function loadUsed() {
  if (!existsSync(USED_PATH)) return [];
  try { return JSON.parse(readFileSync(USED_PATH, 'utf-8')); } catch { return []; }
}

// Разбор дока на «статьи»: блок = подряд идущие непустые абзацы (между пустыми строками).
// Статья = блок, в котором есть хотя бы одна ссылка (из гиперссылки или http в тексте).
function parseEntries(doc) {
  const blocks = [];
  let cur = { lines: [], urls: [] };
  const flush = () => { if (cur.lines.length) blocks.push(cur); cur = { lines: [], urls: [] }; };
  for (const el of doc.body.content) {
    if (!el.paragraph) { flush(); continue; }
    const runs = el.paragraph.elements || [];
    let text = '';
    for (const r of runs) {
      if (!r.textRun) continue;
      text += r.textRun.content;
      const link = r.textRun.textStyle && r.textRun.textStyle.link && r.textRun.textStyle.link.url;
      if (link) cur.urls.push(link);
    }
    const t = text.replace(/\n/g, ' ').trim();
    if (!t) { flush(); continue; }
    for (const m of t.matchAll(/https?:\/\/[^\s)]+/g)) cur.urls.push(m[0]);
    cur.lines.push(t);
  }
  flush();
  return blocks.filter((b) => b.urls.length).map((b) => ({
    text: b.lines.join(' ').trim(),
    urls: [...new Set(b.urls)],
  }));
}

const mode = process.argv[2];
const token = getAccessToken();
const doc = getDoc(token);
if (doc.error) {
  console.error('Ошибка доступа к доку источников:', doc.error.message);
  if (doc.error.code === 403) console.error(`Расшарь док на робота ${key.client_email} (Editor).`);
  process.exit(1);
}

if (mode === '--read') {
  const used = loadUsed();
  const entries = parseEntries(doc);
  console.log(`Док: ${JSON.stringify(doc.title)} — статей со ссылками: ${entries.length}\n`);
  entries.forEach((e, i) => {
    const isUsed = e.urls.some((u) => used.includes(u));
    console.log(`${i + 1}. [${isUsed ? '✔ использовано' : 'свободно'}] ${e.text}`);
    e.urls.forEach((u) => console.log(`     ${u}`));
  });

} else if (mode === '--seed') {
  const md = readFileSync(resolve(ROOT, 'content/article-sources.md'), 'utf-8');
  const clean = md.replace(/^#+\s*/gm, '').replace(/\*\*/g, '').replace(/^- /gm, '');
  const at = endIndex(doc);
  const r = apiPost(token, `https://docs.googleapis.com/v1/documents/${SOURCES_DOC_ID}:batchUpdate`,
    { requests: [{ insertText: { location: { index: at }, text: '\n' + clean } }] });
  if (r.error) { console.error('Ошибка записи:', r.error.message); process.exit(1); }
  console.log('✅ Статьи из article-sources.md дописаны в конец дока источников.');

} else if (mode === '--mark') {
  // Принимает одну ИЛИ несколько ссылок: если у статьи в абзаце 2+ ссылки — передать ВСЕ.
  const urls = process.argv.slice(3);
  if (!urls.length) { console.error('Укажи URL(ы): --mark <url> [url2 ...]'); process.exit(1); }
  const used = loadUsed();
  let added = 0;
  for (const u of urls) if (!used.includes(u)) { used.push(u); added++; }
  if (added) writeFileSync(USED_PATH, JSON.stringify(used, null, 2));
  console.log(`Отмечено использованными ссылок: ${urls.length} (новых: ${added}).`);

} else if (mode === '--add') {
  // Дописать новые статьи в конец дока (только добавление). Текст берём из файла.
  const f = process.argv[3];
  if (!f) { console.error('Укажи файл: --add <textfile>'); process.exit(1); }
  const txt = readFileSync(f, 'utf-8');
  const at = endIndex(doc);
  const r = apiPost(token, `https://docs.googleapis.com/v1/documents/${SOURCES_DOC_ID}:batchUpdate`,
    { requests: [{ insertText: { location: { index: at }, text: '\n' + txt.trim() + '\n' } }] });
  if (r.error) { console.error('Ошибка записи:', r.error.message); process.exit(1); }
  console.log('✅ Новые статьи дописаны в конец дока источников.');

} else {
  console.log('Режимы: --read | --seed | --mark <url> | --add <textfile>');
}
