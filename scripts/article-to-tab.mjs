#!/usr/bin/env node
/**
 * Запись готовой статьи в НОВУЮ ВКЛАДКУ (tab) Google-дока «Тексты для статей».
 * Используется скиллом dzen-post: статья для Дзена/ВК ложится отдельной вкладкой
 * в тот же док, откуда берутся исходные тексты.
 *
 * Тот же сервис-аккаунт, что и push-to-doc.mjs / texts-doc.mjs
 * (ключ ~/.secrets/google-docs-sa.json). Для ЗАПИСИ док должен быть расшарен
 * на робота с правами «Редактор» (для чтения хватало «Читателя»).
 *
 * docId: --doc <url|id> | env TEXTS_DOC_ID | content/texts-doc-config.json
 *
 * Режимы:
 *   --write <файл.md> [--title "Название вкладки"]
 *        создать новую вкладку и записать в неё статью из файла.
 *   --delete-tab <tabId>
 *        удалить вкладку по ID (для уборки/тестов).
 *
 * Формат файла статьи (простой markdown):
 *   # Заголовок            → стиль «Заголовок 1»
 *   ## Подзаголовок        → стиль «Заголовок 2»
 *   ### Под-подзаголовок   → стиль «Заголовок 3»
 *   **жирный**             → жирный фрагмент
 *   пустая строка          → новый абзац
 *
 * ПРАВИЛО: только ДОБАВЛЯЕМ (новая вкладка). Существующие вкладки не трогаем
 * (кроме явного --delete-tab).
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import crypto from 'crypto';
import { resolve } from 'path';

const KEY_PATH = resolve(process.env.HOME, '.secrets/google-docs-sa.json');
const ROOT = resolve(new URL('..', import.meta.url).pathname);
const CFG_PATH = resolve(ROOT, 'content/texts-doc-config.json');
const key = JSON.parse(readFileSync(KEY_PATH, 'utf-8'));

const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function extractId(s) {
  const m = String(s).match(/\/d\/([A-Za-z0-9_-]+)/);
  return (m ? m[1] : String(s).trim());
}

function loadDocId() {
  const i = process.argv.indexOf('--doc');
  if (i > 0 && process.argv[i + 1]) return extractId(process.argv[i + 1]);
  if (process.env.TEXTS_DOC_ID) return extractId(process.env.TEXTS_DOC_ID);
  if (existsSync(CFG_PATH)) {
    try { const c = JSON.parse(readFileSync(CFG_PATH, 'utf-8')); if (c.docId) return c.docId; } catch { /* ignore */ }
  }
  return null;
}

function flagValue(name) {
  const i = process.argv.indexOf(name);
  return (i > 0 && process.argv[i + 1]) ? process.argv[i + 1] : null;
}

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
  writeFileSync('/tmp/a2t-token.txt', body);
  const res = execSync(
    'curl -s --max-time 30 -X POST -H "Content-Type: application/x-www-form-urlencoded" --data @/tmp/a2t-token.txt https://oauth2.googleapis.com/token',
    { encoding: 'utf-8' });
  const data = JSON.parse(res);
  if (!data.access_token) { console.error('Нет токена Google:', res); process.exit(1); }
  return data.access_token;
}

function apiGet(token, url) {
  return JSON.parse(execSync(`curl -s --max-time 30 -H "Authorization: Bearer ${token}" "${url}"`, { encoding: 'utf-8' }));
}
function batchUpdate(token, docId, requests) {
  writeFileSync('/tmp/a2t-req.json', JSON.stringify({ requests }));
  return JSON.parse(execSync(
    `curl -s --max-time 30 -X POST -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" ` +
    `--data @/tmp/a2t-req.json "https://docs.googleapis.com/v1/documents/${docId}:batchUpdate"`,
    { encoding: 'utf-8' }));
}

function die403(err) {
  console.error('Ошибка записи:', err.message);
  if (err.code === 403) console.error(`\nДля записи нужен доступ «Редактор». Открой док → «Поделиться» → дай роботу права «Редактор»:\n  ${key.client_email}`);
  process.exit(1);
}

// Разбор markdown-файла статьи → текст + диапазоны стилей абзацев и жирного.
function buildArticle(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  let clean = '';
  const paraStyles = []; // {start, end, style}
  const bolds = [];      // [start, end]
  const italics = [];    // [start, end]
  let firstTitle = '';
  const emit = (text, style) => {
    const pStart = clean.length;
    let i = 0;
    while (i < text.length) {
      if (text.startsWith('**', i)) {
        const e = text.indexOf('**', i + 2);
        if (e !== -1) {
          const inner = text.slice(i + 2, e);
          const bStart = clean.length;
          clean += inner;
          bolds.push([bStart, clean.length]);
          i = e + 2;
          continue;
        }
      } else if (text[i] === '*') {
        const e = text.indexOf('*', i + 1);
        if (e !== -1) {
          const inner = text.slice(i + 1, e);
          const iStart = clean.length;
          clean += inner;
          italics.push([iStart, clean.length]);
          i = e + 1;
          continue;
        }
      }
      clean += text[i];
      i++;
    }
    const pEnd = clean.length;
    if (style && pEnd > pStart) paraStyles.push({ start: pStart, end: pEnd, style });
    if (style === 'HEADING_1' && !firstTitle) firstTitle = text.replace(/\*\*/g, '').trim();
    clean += '\n';
  };
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    if (/^#\s+/.test(line)) emit(line.replace(/^#\s+/, ''), 'HEADING_1');
    else if (/^##\s+/.test(line)) emit(line.replace(/^##\s+/, ''), 'HEADING_2');
    else if (/^###\s+/.test(line)) emit(line.replace(/^###\s+/, ''), 'HEADING_3');
    else emit(line, null);
  }
  return { text: clean, paraStyles, bolds, italics, firstTitle };
}

// --- main ---
const mode = process.argv[2];
const docId = loadDocId();
if (!docId) {
  console.error('Не задан док. Настрой: node scripts/texts-doc.mjs --set-doc <ссылка>');
  process.exit(1);
}
const token = getAccessToken();
const docUrl = (tabId) => `https://docs.google.com/document/d/${docId}/edit?tab=${tabId}`;

if (mode === '--delete-tab') {
  const tabId = process.argv[3];
  if (!tabId) { console.error('Укажи tabId: --delete-tab <tabId>'); process.exit(1); }
  const r = batchUpdate(token, docId, [{ deleteTab: { tabId } }]);
  if (r.error) die403(r.error);
  console.log(`✅ Вкладка ${tabId} удалена.`);
  process.exit(0);
}

if (mode !== '--write') {
  console.log('Режимы: --write <файл.md> [--title "Название"] | --delete-tab <tabId>');
  process.exit(0);
}

const file = process.argv[3];
if (!file || file.startsWith('--')) { console.error('Укажи файл статьи: --write <файл.md>'); process.exit(1); }
const md = readFileSync(file, 'utf-8');
const { text, paraStyles, bolds, italics, firstTitle } = buildArticle(md);
if (!text.trim()) { console.error('Файл статьи пустой:', file); process.exit(1); }

const tabTitle = (flagValue('--title') || firstTitle || 'Статья').slice(0, 100);

// 1) Создаём вкладку.
const created = batchUpdate(token, docId, [{ addDocumentTab: { tabProperties: { title: tabTitle } } }]);
if (created.error) die403(created.error);
const tabId = created.replies && created.replies[0] && created.replies[0].addDocumentTab
  && created.replies[0].addDocumentTab.tabProperties && created.replies[0].addDocumentTab.tabProperties.tabId;
if (!tabId) { console.error('Не удалось получить id новой вкладки:', JSON.stringify(created)); process.exit(1); }

// 2) Узнаём индекс начала тела новой (пустой) вкладки.
const doc = apiGet(token, `https://docs.googleapis.com/v1/documents/${docId}?includeTabsContent=true`);
if (doc.error) die403(doc.error);
const findTab = (tabs) => {
  for (const t of (tabs || [])) {
    if (t.tabProperties && t.tabProperties.tabId === tabId) return t;
    if (t.childTabs) { const f = findTab(t.childTabs); if (f) return f; }
  }
  return null;
};
const tab = findTab(doc.tabs);
const content = (tab && tab.documentTab && tab.documentTab.body && tab.documentTab.body.content) || [];
const base = content.length ? content[content.length - 1].endIndex - 1 : 1;

// 3) Вставляем текст и навешиваем стили (всё с tabId новой вкладки).
const requests = [{ insertText: { location: { tabId, index: base }, text } }];
for (const p of paraStyles) {
  requests.push({ updateParagraphStyle: {
    range: { tabId, startIndex: base + p.start, endIndex: base + p.end },
    paragraphStyle: { namedStyleType: p.style }, fields: 'namedStyleType',
  } });
}
for (const [s, e] of bolds) {
  requests.push({ updateTextStyle: {
    range: { tabId, startIndex: base + s, endIndex: base + e },
    textStyle: { bold: true }, fields: 'bold',
  } });
}
for (const [s, e] of italics) {
  requests.push({ updateTextStyle: {
    range: { tabId, startIndex: base + s, endIndex: base + e },
    textStyle: { italic: true }, fields: 'italic',
  } });
}
const r = batchUpdate(token, docId, requests);
if (r.error) die403(r.error);

console.log(`✅ Статья записана в новую вкладку «${tabTitle}».`);
console.log(`   Заголовков: ${paraStyles.length}, жирных: ${bolds.length}, курсивов: ${italics.length}, символов: ${text.length}.`);
console.log(`   Открыть вкладку: ${docUrl(tabId)}`);
console.log(`   tabId: ${tabId}`);
