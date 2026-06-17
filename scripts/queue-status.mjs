#!/usr/bin/env node
/**
 * Показать очередь автопубликации @levainlab: будущие (ещё не вышедшие) посты
 * с датой выхода и статусом заморозки.
 *
 * Запуск на сервере:  node /opt/sourdough/scripts/queue-status.mjs
 * Или удалённо:        ssh root@5.35.88.124 node /opt/sourdough/scripts/queue-status.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const posts = JSON.parse(readFileSync(resolve(ROOT, 'content/scheduled-posts.json'), 'utf-8'));

const upcoming = posts
  .filter(p => !p.published)
  .sort((a, b) => (a.publishAt > b.publishAt ? 1 : -1));

if (!upcoming.length) {
  console.log('Очередь пуста — будущих постов нет.');
} else {
  console.log(`Будущих постов в очереди: ${upcoming.length}\n`);
  for (const p of upcoming) {
    const status = p.reviewSentAt ? '🔒 на проверке (правь в ЛС)' : '✏️  можно править в доке';
    console.log(`${p.publishAt.slice(0, 10)}  ${status}  —  ${p.title}`);
  }
}
