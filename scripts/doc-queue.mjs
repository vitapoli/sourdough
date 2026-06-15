/**
 * Чтение постов из Google-документа с сохранением форматирования.
 *
 * Google-док экспортируется как HTML (?format=html). В нём:
 *   - жирный   = класс с font-weight:700
 *   - курсив   = font-style:italic
 *   - подчёркив.= text-decoration:underline
 * Мы превращаем это в Telegram entities (offset/length в UTF-16).
 *
 * Два входа:
 *   parsePostsByTitles(html, titles, stop) — нарезать посты по известным заголовкам
 *   parseQueueFromHtml(html)               — «очередь»: посты, под заголовком которых
 *                                            стоит строка «Выход: ДД.ММ.ГГГГ ЧЧ:ММ»
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

// --- Скачать HTML-экспорт Google-дока (через curl: Node fetch в этой среде не ходит по сети) ---
export function fetchDocHtml(docId) {
  const url = `https://docs.google.com/document/d/${docId}/export?format=html`;
  return execSync(`curl -sL --max-time 30 "${url}"`, { encoding: 'utf-8', maxBuffer: 20 * 1024 * 1024 });
}

// --- Декод HTML-сущностей ---
const NAMED = {
  nbsp: ' ', quot: '"', apos: "'", lt: '<', gt: '>', amp: '&',
  mdash: '—', ndash: '–', laquo: '«', raquo: '»',
  times: '×', minus: '−', plusmn: '±', deg: '°',
  hellip: '…', middot: '·', bull: '•',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”',
  sbquo: '‚', bdquo: '„', prime: '′', Prime: '″',
  rarr: '→', larr: '←', harr: '↔', uarr: '↑', darr: '↓',
  sup2: '²', sup3: '³', frac12: '½', frac14: '¼',
  copy: '©', reg: '®', trade: '™', euro: '€', sect: '§',
};
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, name) => (name in NAMED ? NAMED[name] : m));
}

// --- Карта классов оформления: имя -> {bold,italic,underline} ---
function parseStyleMap(html) {
  const map = new Map();
  const styleBlock = (html.match(/<style[^>]*>([\s\S]*?)<\/style>/i) || [, ''])[1];
  const re = /\.(c\d+)\{([^}]*)\}/g;
  let m;
  while ((m = re.exec(styleBlock))) {
    const props = m[2];
    map.set(m[1], {
      bold: /font-weight:700/.test(props),
      italic: /font-style:italic/.test(props),
      underline: /text-decoration:underline/.test(props),
    });
  }
  return map;
}

function classFlags(styleMap, classAttr) {
  const flags = { bold: false, italic: false, underline: false };
  if (!classAttr) return flags;
  for (const cls of classAttr.trim().split(/\s+/)) {
    const s = styleMap.get(cls);
    if (!s) continue;
    if (s.bold) flags.bold = true;
    if (s.italic) flags.italic = true;
    if (s.underline) flags.underline = true;
  }
  return flags;
}

// --- HTML -> блоки (абзацы/заголовки/пункты списка) ---
// Блок: { isList, runs: [{text, bold, italic, underline}] }
export function htmlToBlocks(html) {
  const styleMap = parseStyleMap(html);
  const body = (html.match(/<body[^>]*>([\s\S]*?)<\/body>/i) || [, html])[1];
  const blocks = [];
  const blockRe = /<(p|h[1-6]|li)\b([^>]*)>([\s\S]*?)<\/\1>/gi;
  let bm;
  while ((bm = blockRe.exec(body))) {
    const tag = bm[1].toLowerCase();
    // внутри блока убираем теги <a> (ссылку-обёртку), оставляя текст
    const inner = bm[3].replace(/<a\b[^>]*>/gi, '').replace(/<\/a>/gi, '');
    const runs = [];
    const spanRe = /<span\b([^>]*)>([\s\S]*?)<\/span>/gi;
    let sm, lastIndex = 0, found = false;
    while ((sm = spanRe.exec(inner))) {
      found = true;
      const between = decodeEntities(inner.slice(lastIndex, sm.index).replace(/<[^>]+>/g, ''));
      if (between) runs.push({ text: between, bold: false, italic: false, underline: false });
      const classAttr = (sm[1].match(/class="([^"]*)"/) || [, ''])[1];
      const flags = classFlags(styleMap, classAttr);
      const text = decodeEntities(sm[2].replace(/<[^>]+>/g, ''));
      runs.push({ text, ...flags });
      lastIndex = spanRe.lastIndex;
    }
    if (!found) {
      const text = decodeEntities(inner.replace(/<[^>]+>/g, ''));
      if (text) runs.push({ text, bold: false, italic: false, underline: false });
    } else {
      const tail = decodeEntities(inner.slice(lastIndex).replace(/<[^>]+>/g, ''));
      if (tail) runs.push({ text: tail, bold: false, italic: false, underline: false });
    }
    blocks.push({ isList: tag === 'li', isHeading: /^h[12]$/.test(tag), runs });
  }
  return blocks;
}

function blockText(b) {
  return b.runs.map(r => r.text).join('');
}
function isEmptyBlock(b) {
  return blockText(b).trim() === '';
}

// --- Блоки -> {text, entities (Telegram)} ---
// titleBold: первую строку делаем жирной (как принято в канале для заголовка).
export function blocksToPost(blocks, { titleBold = true } = {}) {
  let out = '';
  const entities = [];
  let firstContent = true, pendingBlank = false, isFirstLine = true;

  for (const b of blocks) {
    const bt = blockText(b).trim();
    // пропускаем пустые строки, разделители «---» и оставшиеся метки «Выход: дата»
    if (isEmptyBlock(b) || bt === '---' || /^выход\s*:\s*\d{1,2}[.\-/]/i.test(bt)) {
      if (!firstContent) pendingBlank = true;
      continue;
    }
    if (!firstContent) out += pendingBlank ? '\n\n' : '\n';
    firstContent = false;
    pendingBlank = false;

    if (b.isList) out += '• ';

    const lineStart = out.length;
    for (const r of b.runs) {
      const start = out.length;
      out += r.text;
      const len = out.length - start;
      if (len === 0) continue;
      if (r.bold) entities.push({ type: 'bold', offset: start, length: len });
      if (r.italic) entities.push({ type: 'italic', offset: start, length: len });
      if (r.underline) entities.push({ type: 'underline', offset: start, length: len });
    }
    if (isFirstLine && titleBold) {
      const len = out.length - lineStart;
      if (len > 0) entities.push({ type: 'bold', offset: lineStart, length: len });
    }
    isFirstLine = false;
  }

  // тримим края текста и подрезаем пробелы внутри выделений
  const text = out.replace(/^\s+/, '').replace(/\s+$/, '');
  const shift = out.length - out.replace(/^\s+/, '').length;
  const entitiesClean = entities
    .map(e => ({ ...e, offset: e.offset - shift }))
    .map(e => {
      let { offset, length } = e;
      while (length > 0 && /\s/.test(text[offset])) { offset++; length--; }
      while (length > 0 && /\s/.test(text[offset + length - 1])) { length--; }
      return { type: e.type, offset, length };
    })
    .filter(e => e.length > 0 && e.offset >= 0 && e.offset + e.length <= text.length)
    .sort((a, b) => a.offset - b.offset || a.length - b.length);

  // убираем точные дубли (например, заголовок, уже жирный в доке + авто-жирный заголовка)
  const seen = new Set();
  const deduped = entitiesClean.filter(e => {
    const key = `${e.type}:${e.offset}:${e.length}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return { text, entities: deduped };
}

// --- Нарезка по известным заголовкам (для разовой загрузки из существующего дока) ---
export function parsePostsByTitles(html, titles, stopText) {
  const blocks = htmlToBlocks(html);
  const findIdx = (sub, from = 0) => {
    for (let i = from; i < blocks.length; i++) {
      if (blockText(blocks[i]).trim().startsWith(sub)) return i;
    }
    return -1;
  };
  const idx = titles.map(t => findIdx(t));
  const result = [];
  for (let p = 0; p < titles.length; p++) {
    if (idx[p] < 0) { result.push(null); continue; }
    let end;
    if (p + 1 < titles.length && idx[p + 1] > idx[p]) {
      end = idx[p + 1];
    } else {
      end = blocks.length;
      for (let i = idx[p] + 1; i < blocks.length; i++) {
        const t = blockText(blocks[i]).trim();
        if (t === '---' || (stopText && t.startsWith(stopText))) { end = i; break; }
      }
    }
    result.push(blocksToPost(blocks.slice(idx[p], end)));
  }
  return result;
}

function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// --- Посты из дока. Разделитель — заголовок (стиль «Заголовок 1/2»). ---
// Тело поста = всё от его заголовка до следующего заголовка. Никаких дат в доке.
// Возвращает посты по порядку: [{ id, title, text, entities }].
export function parsePostsFromHeadings(html) {
  const blocks = htmlToBlocks(html);
  const posts = [];
  let start = -1; // индекс заголовка текущего поста
  const flush = (end) => {
    if (start < 0) return;
    const title = blockText(blocks[start]).trim();
    if (!title) return;
    const { text, entities } = blocksToPost(blocks.slice(start, end));
    posts.push({ id: `doc-${djb2(title)}`, title, text, entities });
  };
  for (let i = 0; i < blocks.length; i++) {
    if (blocks[i].isHeading && !isEmptyBlock(blocks[i])) {
      flush(i);   // закрываем предыдущий пост
      start = i;  // начинаем новый с этого заголовка
    }
  }
  flush(blocks.length);
  return posts;
}

// CLI для отладки: node doc-queue.mjs <docId> [--json out.json]
if (import.meta.url === `file://${process.argv[1]}`) {
  const docId = process.argv[2];
  const html = fetchDocHtml(docId);
  const posts = parsePostsFromHeadings(html);
  console.log(`Найдено постов: ${posts.length}`);
  for (const p of posts) console.log(`  • ${p.title}  (${p.text.length} симв., ${p.entities.length} выделений)`);
  const jsonFlag = process.argv.indexOf('--json');
  if (jsonFlag > 0 && process.argv[jsonFlag + 1]) {
    writeFileSync(process.argv[jsonFlag + 1], JSON.stringify(posts, null, 2));
    console.log(`Записано в ${process.argv[jsonFlag + 1]}`);
  }
}
