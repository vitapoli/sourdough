# План: дублирование постов из Telegram в группу ВКонтакте

Статус: согласован 2026-06-15, выполнять начиная с 2026-06-16.

## Цель
Те же посты, что автопубликуются в Telegram-канал @levainlab, дублировать в группу ВКонтакте.

## Решения (уже согласованы с пользователем)
- **Только текст** (без картинок) — проще и надёжнее, не нужна возня со скачиванием фото из ТГ и загрузкой в ВК.
- Группа ВК **уже есть**, пользователь — **админ**.
- ВК **не поддерживает** жирный/курсив в постах → форматирование теряется, уходит обычный текст (содержание то же).
- Отправка в ВК — **best-effort**: если ВК не настроен или ответил ошибкой, публикация в Telegram всё равно проходит; в ЛС админу приходит пометка об ошибке ВК.

## Где встраиваем
Единственный путь публикации в канал — режим `--scheduled` в `scripts/publish-post.mjs`,
запускается раз в час из `.github/workflows/scheduled.yml`. Другого workflow (`publish.yml`) нет.
Точка вставки — главный цикл публикации (сейчас ~строка 435, после `const how = publishScheduledPost(p);`).

---

## ЧАСТЬ 1. Изменения в коде (делает Claude)

### 1.1. `scripts/publish-post.mjs`

**(a) Новые секреты** — после строки `const ADMIN_CHAT_ID = secrets.TG_ADMIN_CHAT_ID;` (стр. 32):
```js
const VK_TOKEN = secrets.VK_TOKEN;
const VK_GROUP_ID = secrets.VK_GROUP_ID;   // числовой ID группы, положительный
const VK_API_VERSION = '5.199';
```

**(b) Функции ВК** — рядом с `tgRequest` (после стр. ~108). Через curl, как и Telegram:
```js
// --- VK API (через curl). Постинг на стену группы от имени сообщества ---
function vkRequest(method, params) {
  const url = `https://api.vk.com/method/${method}`;
  const form = new URLSearchParams({ ...params, access_token: VK_TOKEN, v: VK_API_VERSION });
  const tmpFile = '/tmp/vk-request-body.txt';
  writeFileSync(tmpFile, form.toString());
  const result = execSync(
    `curl -s --max-time 30 -X POST -H "Content-Type: application/x-www-form-urlencoded" --data-binary @${tmpFile} "${url}"`,
    { encoding: 'utf-8' }
  );
  const data = JSON.parse(result);
  if (data.error) throw new Error(`[${data.error.error_code}] ${data.error.error_msg}`);
  return data.response;
}

// Текст, который уйдёт в ВК (форматирование ВК не поддерживает — отдаём plain).
// Для поста-с-фото берём только подпись (картинку в ВК не шлём — договорились text-only).
function plainTextForVk(post) {
  const r = post.edited;
  if (r && (r.type === 'photo' || r.type === 'document_photo')) return r.caption || '';
  if (r && r.type === 'text') return r.text || '';
  return post.text || '';
}

function vkPost(message) {
  return vkRequest('wall.post', {
    owner_id: `-${VK_GROUP_ID}`,
    from_group: 1,
    message,
  });
}
```

**(c) Вызов в главном цикле** — после `const how = publishScheduledPost(p);` (стр. ~435),
перед `sendMessage(ADMIN_CHAT_ID, ...✅...)`. Меняем сообщение об успехе, добавляя статус ВК:
```js
let vkNote = '';
if (VK_TOKEN && VK_GROUP_ID) {
  const msg = plainTextForVk(p);
  if (msg && msg.trim()) {
    try { vkPost(msg); vkNote = ' + ВК'; }
    catch (e) { vkNote = ` ⚠️ВК: ${e.message}`; console.error('VK error:', e.message); }
  }
}
sendMessage(ADMIN_CHAT_ID, `✅ Опубликован пост на ${formatWhen(p.publishAt)} (${how})${vkNote}.`);
```
(заменяет существующий `sendMessage(ADMIN_CHAT_ID, ...)` на стр. 440)

### 1.2. `.github/workflows/scheduled.yml`
В шаге «Создать файл секретов» дописать VK в printf:
```yaml
          printf "TG_BOT_TOKEN=%s\nTG_CHANNEL_ID=%s\nTG_ADMIN_CHAT_ID=%s\nVK_TOKEN=%s\nVK_GROUP_ID=%s\n" \
            "${{ secrets.TG_BOT_TOKEN }}" \
            "${{ secrets.TG_CHANNEL_ID }}" \
            "${{ secrets.TG_ADMIN_CHAT_ID }}" \
            "${{ secrets.VK_TOKEN }}" \
            "${{ secrets.VK_GROUP_ID }}" \
            > ~/.secrets/sourdough-tokens
```

Код безопасен без ключей: если `VK_TOKEN`/`VK_GROUP_ID` пустые — в ВК ничего не шлётся, Telegram работает как раньше.

---

## ЧАСТЬ 2. Действия пользователя (руками, Claude даёт пошагово)

### A. Узнать числовой ID группы
- Способ без токена: сервис вроде regvk.com/id (вставить ссылку на группу) → число.
- Или, когда уже есть токен, открыть в браузере:
  `https://api.vk.com/method/groups.getById?group_id=ИМЯ_ГРУППЫ&access_token=ТОКЕН&v=5.199`
  → в ответе `"id": ЧИСЛО`. Это и есть `VK_GROUP_ID` (кладём положительным; в коде станет `-ЧИСЛО`).

### B. Получить токен (от простого к запасному)
**Шаг 1 — ключ сообщества (просто, 2 клика):**
Группа → Управление → Настройки → «Работа с API» → Ключи доступа → Создать ключ →
отметить право **«Стена»** → скопировать. Это `VK_TOKEN`.
ВК-ключ сообщества не истекает. НО метод `wall.post` ключом сообщества часто отклоняется —
если после публикации придёт `⚠️ВК`, переходим к Шагу 2.

**Шаг 2 — токен пользователя-админа (запасной, не истекает):**
1. Нужно standalone-приложение на dev.vk.com (Мои приложения → Создать → Standalone). Взять `client_id` (ID приложения).
2. Открыть в браузере (подставить ID приложения):
   `https://oauth.vk.com/authorize?client_id=ID_ПРИЛОЖЕНИЯ&display=page&redirect_uri=https://oauth.vk.com/blank.html&scope=wall,offline,groups&response_type=token&v=5.199`
3. Разрешить доступ → браузер перекинет на `https://oauth.vk.com/blank.html#access_token=vk1.a.XXXX&expires_in=0&user_id=...`
4. Скопировать часть `vk1.a.XXXX` (между `access_token=` и `&`). `expires_in=0` = токен не истекает. Это `VK_TOKEN`.

### C. Добавить секреты в репозиторий на GitHub
GitHub → репозиторий → Settings → Secrets and variables → Actions → New repository secret.
Добавить два секрета (как делали для TG_BOT_TOKEN):
- `VK_TOKEN` — значение токена из пункта B.
- `VK_GROUP_ID` — число из пункта A (положительное).

---

## ЧАСТЬ 3. Проверка
1. Claude вносит правки кода (Часть 1), пользователь — секреты (Часть 2).
2. Закоммитить и запушить (команды даст Claude, пользователь выполняет сам).
3. Запустить workflow вручную: GitHub → Actions → «Levain Lab — посты из дока» → Run workflow.
   (ВК-пост уходит только когда наступает время публикации поста; если на сейчас постов к выходу нет — дождаться ближайшего запланированного или временно подвинуть `publishAt`.)
4. Успех — в ЛС админу `✅ ... + ВК` и пост виден в группе ВК. Ошибка — `⚠️ВК: <текст>` (по тексту понятно, нужен ли Шаг 2 токена).

## Порядок на завтра
1. Claude: правки в `publish-post.mjs` и `scheduled.yml`.
2. Пользователь параллельно: A (ID группы) → B Шаг 1 (ключ сообщества) → C (секреты на GitHub).
3. Коммит/пуш → ручной запуск workflow → проверка.
4. Если `⚠️ВК` — B Шаг 2 (токен пользователя), обновить секрет `VK_TOKEN`, повторить.
