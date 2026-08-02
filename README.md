# просто.

Клиентское приложение «Бит.Поддержка»: регистрация, обращения по 1С, ответы L0-ассистента и передача вопроса команде сопровождения.

## Состав

- React + Vite — пользовательский интерфейс.
- Cloudflare Worker — основной API и публикация собранного интерфейса.
- Cloudflare D1 — постоянное хранение пользователей, обращений и сообщений.
- Express + SQLite через sql.js — локальный и резервный Node.js-вариант.
- Portarius Assistant API — автоматические ответы и сохранение контекста диалога по `thread_id`.

## Локальный запуск

1. Установите зависимости: `npm ci` и `npm --prefix server ci`.
2. Задайте переменные из `.env.example` в окружении. Не записывайте реальные ключи в репозиторий.
3. Соберите интерфейс: `npm run build`.
4. Запустите единое приложение: `npm start`.

По умолчанию приложение доступно на `http://localhost:3001`, проверка состояния — на `/api/health`.

## Проверки

- `npm run lint`
- `npm test`
- `npm run test:worker`
- `npm run build`

## Cloudflare Workers + D1

1. Создайте D1-базу `prosto-db` и укажите полученный `database_id` в `wrangler.jsonc`.
2. Примените схему: `npm run cf:migrate:remote`.
3. Добавьте секреты `JWT_SECRET`, `PASSWORD_PEPPER`, `ASSISTANT_ID` и `ASSISTANT_API_KEY` через `wrangler secret put`.
4. Выполните `npm run cf:deploy`.

Локальная D1-схема применяется командой `npm run cf:migrate:local`. Реальные секреты в `.dev.vars` и репозиторий не добавляются.

## Резервный Render-деплой

`render.yaml` собирает интерфейс и сервер как один web service. Значения `JWT_SECRET`, `ASSISTANT_ID` и `ASSISTANT_API_KEY` задаются только в переменных окружения Render.
