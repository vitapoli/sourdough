#!/usr/bin/env node
/**
 * Чтение ОТДЕЛЬНОГО Google-дока с текстами-заготовками для постов.
 *
 * Идея: ты держишь один док, где КАЖДАЯ ВКЛАДКА (tab) — отдельный текст-заготовка.
 * Скиллы tg-post / dzen-post берут вкладку по ПОРЯДКОВОМУ номеру (сверху вниз)
 * или по названию вкладки.
 *
 * Тот же сервис-аккаунт, что и sources-doc.mjs / push-to-doc.mjs
 * (ключ ~/.secrets/google-docs-sa.json). Док нужно расшарить на робота
 * (email печатается при ошибке 403) — достаточно прав «Читатель».
 *
 * docId берётся по приоритету:
 *   1) --doc <ссылка|id>
 *   2) переменная окружения TEXTS_DOC_ID
 *   3) content/texts-doc-config.json  (поле docId)
 *
 * Режимы:
 *   --list              пронумерованный список вкладок (номер · название · длина).
 *   --get <N|название>  вывести полный текст вкладки (по номеру или по части названия).
 *   --set-doc <url>     сохранить docId в content/texts-doc-config.json (разовая настройка).
 *
 * ТОЛЬКО ЧТЕНИЕ дока. Ничего в нём не меняем.
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

// Из ссылки вида https://docs.google.com/document/d/<ID>/edit достаём <ID>.
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

function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/documents.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
  }));
  const input = `${header}.${claims}`;
  const sig = b64url(crypto.createSign('RSA-SHA256').update(input).sign(key.private_key));
  const body = `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${input}.${sig}`;
  writeFileSync('/tmp/texts-token.txt', body);
  const res = execSync(
    'curl -s --max-time 30 -X POST -H "Content-Type: application/x-www-form-urlencoded" --data @/tmp/texts-token.txt https://oauth2.googleapis.com/token',
    { encoding: 'utf-8' });
  const data = JSON.parse(res);
  if (!data.access_token) { console.error('Нет токена Google:', res); process.exit(1); }
  return data.access_token;
}

// includeTabsContent=true — чтобы получить содержимое ВСЕХ вкладок дока.
const getDoc = (token, docId) =>
  JSON.parse(execSync(
    `curl -s --max-time 30 -H "Authorization: Bearer ${token}" "https://docs.googleapis.com/v1/documents/${docId}?includeTabsContent=true"`,
    { encoding: 'utf-8' }));

// Плоский список вкладок по порядку (включая вложенные childTabs).
function flattenTabs(tabs, acc) {
  acc = acc || [];
  const sorted = (tabs || []).slice().sort((a, b) => {
    const ai = (a.tabProperties && a.tabProperties.index) || 0;
    const bi = (b.tabProperties && b.tabProperties.index) || 0;
    return ai - bi;
  });
  for (const t of sorted) {
    acc.push(t);
    if (t.childTabs && t.childTabs.length) flattenTabs(t.childTabs, acc);
  }
  return acc;
}

// Текст вкладки: склеиваем абзацы её documentTab.body, собираем ссылки.
function tabToText(tab) {
  const content = (tab.documentTab && tab.documentTab.body && tab.documentTab.body.content) || [];
  const lines = [];
  const urls = [];
  for (const el of content) {
    if (!el.paragraph) continue;
    let raw = '';
    for (const r of (el.paragraph.elements || [])) {
      if (!r.textRun) continue;
      raw += r.textRun.content;
      const link = r.textRun.textStyle && r.textRun.textStyle.link && r.textRun.textStyle.link.url;
      if (link) urls.push(link);
    }
    const line = raw.replace(/\n/g, '').trim();
    for (const m of line.matchAll(/https?:\/\/[^\s)]+/g)) urls.push(m[0]);
    lines.push(line);
  }
  return {
    body: lines.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    urls: [...new Set(urls)],
  };
}

function parseTabs(doc) {
  const tabs = flattenTabs(doc.tabs);
  return tabs.map((t, i) => {
    const title = (t.tabProperties && t.tabProperties.title) || `Вкладка ${i + 1}`;
    const { body, urls } = tabToText(t);
    return { title, body, urls };
  });
}

// --- main ---
const mode = process.argv[2];

if (mode === '--set-doc') {
  const arg = process.argv[3];
  if (!arg) { console.error('Укажи ссылку на док: --set-doc <url>'); process.exit(1); }
  const docId = extractId(arg);
  writeFileSync(CFG_PATH, JSON.stringify({ docId }, null, 2) + '\n');
  console.log(`✅ docId сохранён в ${CFG_PATH.replace(ROOT + '/', '')}:\n   ${docId}`);
  console.log(`\nНе забудь расшарить док на робота (права «Читатель»):\n   ${key.client_email}`);
  process.exit(0);
}

const docId = loadDocId();
if (!docId) {
  console.error('Не задан док с текстами.');
  console.error('Настрой один раз:  node scripts/texts-doc.mjs --set-doc <ссылка-на-док>');
  console.error(`И расшарь док на робота (Читатель):  ${key.client_email}`);
  process.exit(1);
}

const token = getAccessToken();
const doc = getDoc(token, docId);
if (doc.error) {
  console.error('Ошибка доступа к доку:', doc.error.message);
  if (doc.error.code === 403) console.error(`\nПохоже, док не расшарен на робота. Открой док → «Поделиться» → добавь как Читателя:\n  ${key.client_email}`);
  if (doc.error.code === 404) console.error('\nДок не найден — проверь ссылку/ID (node scripts/texts-doc.mjs --set-doc <url>).');
  process.exit(1);
}

const tabs = parseTabs(doc);

if (!tabs.length) {
  console.log(`Док: ${JSON.stringify(doc.title)} — вкладок не найдено.`);
  process.exit(0);
}

if (mode === '--get') {
  const arg = process.argv[3];
  if (!arg) { console.error('Укажи вкладку: --get <номер|название>'); process.exit(1); }
  let idx = -1;
  if (/^\d+$/.test(arg)) {
    idx = parseInt(arg, 10) - 1;
  } else {
    const q = arg.toLowerCase();
    idx = tabs.findIndex((t) => t.title.toLowerCase().includes(q));
  }
  if (idx < 0 || idx >= tabs.length) {
    console.error(`Не нашёл вкладку «${arg}». В доке вкладок: ${tabs.length} (1..${tabs.length}).`);
    tabs.forEach((t, i) => console.error(`  ${i + 1}. ${t.title}`));
    process.exit(1);
  }
  const t = tabs[idx];
  console.log(`# Вкладка ${idx + 1}: ${t.title}`);
  if (t.body) console.log('\n' + t.body);
  if (t.urls.length) {
    console.log('\nСсылки в этой вкладке:');
    t.urls.forEach((u) => console.log('  ' + u));
  }
} else {
  // --list (по умолчанию)
  console.log(`Док: ${JSON.stringify(doc.title)} — вкладок: ${tabs.length}\n`);
  tabs.forEach((t, i) => console.log(`${i + 1}. ${t.title}  (${t.body.length} симв.${t.urls.length ? ', ссылок: ' + t.urls.length : ''})`));
}
