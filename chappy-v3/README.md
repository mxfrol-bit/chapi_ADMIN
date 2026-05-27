# Chappy Candidate Lab v3 · Junior

Railway + Supabase мини-приложение для упрощённого Junior-теста кандидаток в Chappy: распределение между Trend & Prompt Operator и Content & Creative Operator.

## Что внутри

- React + Vite frontend.
- Express backend для Railway.
- Supabase через `SUPABASE_SERVICE_ROLE_KEY` только на сервере.
- Кандидатская страница: `/#candidate`.
- Админка результатов: `/#admin`.
- Этапный тест с фиксацией времени прохождения каждого этапа:
  1. Найти 5 AI-трендов.
  2. Протестировать промт.
  3. Оформить карточку тренда.
  4. Написать пост / рассылку / промо-тизер.
  5. Объяснить сильное, слабое, метрики и улучшение через 24 часа.
  6. Короткий рабочий ритм.
- Тренды добавляются по одному: нужно 5 идей для Junior-теста.
- В админке видно: score, рекомендуемую роль, грейд, скорость по этапам, идеи, промт-тест, карточку, контент, анализ, статус и заметки руководителя. Автооценка — только подсказка.

## Supabase

В Supabase открой SQL Editor и запусти:

```sql
-- файл supabase/schema.sql
```

Если таблица v1 уже создана, этот файл безопасно добавит новые поля через `alter table ... add column if not exists`.

Таблица:

```txt
public.chappy_candidate_tests
```

Поля:

```txt
prompt_test jsonb
trend_card jsonb
timings jsonb
duration_seconds integer
```

## Railway Variables

Добавь в Railway:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
ADMIN_PIN=your-strong-admin-pin
VITE_APP_TITLE=Chappy Candidate Lab
```

`SUPABASE_SERVICE_ROLE_KEY` нельзя коммитить в GitHub.

## Локальный запуск

```bash
npm install
npm run dev
```

## Production

Railway использует:

```bash
npm run build
npm run start
```

Проверка:

```bash
curl https://YOUR_APP.railway.app/api/health
```

## GitHub push

```bash
git init
git add .
git commit -m "Chappy staged candidate test v2"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Railway build fix

This build intentionally does not include package-lock.json. Railway/Nixpacks sometimes selects Node 24 and npm 9 when a broad engine range is used; this project pins Node 20 via `.nvmrc`, `engines`, and `nixpacks.toml`.

Use only Railway Variables for secrets. Do not put `SUPABASE_SERVICE_ROLE_KEY` into GitHub files.
