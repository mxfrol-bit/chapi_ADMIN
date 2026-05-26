# Chappy Candidate Lab

Готовый мини-проект под **Railway + Supabase**: кандидатка проходит тест, добавляет AI-тренды по одному, заполняет кейсы, упаковку и kaizen-блок. Результат сохраняется в Supabase и отображается в админке.

## Что внутри

- React + Vite frontend.
- Express backend для Railway.
- Supabase через `SUPABASE_SERVICE_ROLE_KEY` только на сервере.
- Кандидатская форма: `/#candidate`.
- Админка: `/#admin`.
- Динамическое добавление трендов: не фиксированные 10, а сколько кандидатка сможет.
- Автосохранение черновика в браузере.
- Авторасчёт score / role / grade.
- Админка со статусами, заметками и просмотром всех ответов.

## Быстрый запуск локально

```bash
npm install
cp .env.example .env
# заполни .env
npm run dev
```

Открой:

- кандидат: `http://localhost:5173/#candidate`
- админка: `http://localhost:5173/#admin`

## Supabase

1. Открой Supabase → SQL Editor.
2. Вставь и выполни `supabase/schema.sql`.
3. В Project Settings → API возьми:
   - `Project URL` → `SUPABASE_URL`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

Важно: `service_role` нельзя вставлять во frontend. В этом проекте он хранится только в Railway env и используется Express-сервером.

## Railway deploy

1. Создай новый Railway project.
2. Подключи GitHub repo.
3. Добавь Variables:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ADMIN_PIN=your-strong-admin-pin
VITE_APP_TITLE=Chappy Candidate Lab
```

4. Railway сам выполнит:

```bash
npm install && npm run build
npm run start
```

## Проверка после деплоя

- `/api/health` — должен вернуть `ok: true` и `supabase: true`.
- `/#candidate` — форма кандидатки.
- `/#admin` — админка, PIN = `ADMIN_PIN`.

## Где менять вопросы

Файл `shared/scoring.js`:

- `PSYCHOLOGY_QUESTIONS` — психологические вопросы.
- `CASES` — рабочие кейсы.
- `calculateScores()` — логика score / роли / грейда.

## Статусы в админке

- `submitted` — новая анкета.
- `reviewed` — просмотрено.
- `interview` — звать на собеседование.
- `reject` — отказ.
- `hired` — взяли в работу.
