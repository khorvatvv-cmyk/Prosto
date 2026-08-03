# Секреты проекта «Просто»: безопасная передача

Этот файл - не место для реальных паролей и API-ключей. Его можно передавать разработчикам как карту того, какие доступы нужны и где они находятся.

## Где смотреть реальные значения

- Cloudflare: Workers & Pages -> `prosto-support` -> Settings -> Variables and Secrets.
- Render: service `srv-d9ms8a3ncjis7390ve00` -> Environment.
- Локально: `.dev.vars`, `.env`, `.env.android` на машине разработчика.
- GitHub: https://github.com/khorvatvv-cmyk/Prosto

## Что нужно передать через менеджер паролей

```text
Cloudflare account login: <передать отдельно>
Cloudflare project/worker: prosto-support
Cloudflare D1 database: prosto-db

Render account login: <передать отдельно>
Render service id: srv-d9ms8a3ncjis7390ve00
Render service URL: https://prosto-0eq7.onrender.com

GitHub repository access: https://github.com/khorvatvv-cmyk/Prosto

Application admin email: <значение ADMIN_EMAIL>
Application admin password: <значение ADMIN_PASSWORD или новый пароль>

JWT_SECRET: <секрет>
PASSWORD_PEPPER: <секрет>
ASSISTANT_ID: <id ассистента>
ASSISTANT_API_KEY: <ключ ассистента>
ASSISTANT_BASE_URL: https://portarius.1bitai.ru
```

## Важное предупреждение

Ключ ассистента уже передавался в чате. Его нужно считать раскрытым, заменить в сервисе-источнике, затем обновить `ASSISTANT_API_KEY` в Cloudflare и Render.

## Минимальные правила

- Не вставлять реальные секреты в README, handoff, issue, commit, APK или чат с внешним подрядчиком.
- Не добавлять `.dev.vars`, `.env`, release keystore и пароли в Git.
- Пароль администратора должен быть минимум 12 символов.
- После смены `PASSWORD_PEPPER` старые пароли пользователей перестанут проверяться, если не сделать миграцию/сброс паролей.
- После смены `JWT_SECRET` все текущие сессии пользователей станут недействительными, это нормальное поведение.

