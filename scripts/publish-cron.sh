#!/bin/sh
# Почасовой запуск автопубликации постов в @levainlab на сервере levainlab.ru.
#
# Зачем: раньше расписание жило в GitHub Actions, который на бесплатном тарифе
# часто опаздывал и пропускал прогоны. Постоянно включённый сервер с обычным cron
# срабатывает строго по времени — пропусков нет.
#
# Как поставить (один раз, на сервере, под root):
#   crontab -e
#   и добавить строку (запуск каждые 15 минут):
#     */15 * * * * /opt/sourdough/scripts/publish-cron.sh
#
# Состояние очереди хранится здесь же, в content/scheduled-posts.json и
# content/bot-state.json. Деплой их не трогает (см. deploy.sh) — это и есть память бота.

export HOME=/root                       # чтобы нашёлся ~/.secrets/sourdough-tokens
LOG=/var/log/levain-bot.log
cd /opt/sourdough || exit 1

# flock -n: если предыдущий прогон ещё не завершился — тихо выходим, чтобы два
# запуска не наложились и не задвоили публикацию.
{
  echo "=== $(date '+%Y-%m-%d %H:%M:%S %Z') ==="
  /usr/bin/flock -n /tmp/levain-bot.lock /usr/bin/node scripts/publish-post.mjs --scheduled
  echo
} >> "$LOG" 2>&1
