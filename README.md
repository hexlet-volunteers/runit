# Runit

[![On Push](https://github.com/hexlet-volunteers/runit/actions/workflows/push.yml/badge.svg?event=push)](https://github.com/hexlet-volunteers/runit/actions/workflows/push.yml)

## Описание

Runit — это среда для написания и выполнения кода, которая активно используется на платформах © ООО «Хекслет Рус». Ближайший аналог — сервис repl.it.

Возможности (текущие и будущие):

* Редактирование кода онлайн
* Шаринг кода по ссылке
* Встраивание сниппетов на страницы
* Совместное редактирование

## Документация

Здесь — что это за проект и как его запустить. Всё остальное вынесено рядом,
чтобы нужное не приходилось искать в длинном файле.

| Документ | О чём |
| --- | --- |
| [docs/auth.md](docs/auth.md) | Как устроен вход: cookie, JWT, CSRF, политика паролей |
| [docs/runner.md](docs/runner.md) | Серверное исполнение кода: изоляция песочницы, настройки, замечания для деплоя |
| [docs/deployment.md](docs/deployment.md) | Развёртывание (контейнеры, свой стенд, PaaS), переменные окружения, выпуск версии |
| [docs/legal.md](docs/legal.md) | 152-ФЗ: документы, согласие, что обязательно сделать до запуска |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Порядок работы: ветки, мерж, ограничения main |

## Технологии

* **Язык:** TypeScript
* **Фронтенд:** React, Mantine, TanStack Query, Vite
* **Бэкенд:** Fastify, tRPC, Drizzle ORM, Node.js

## Системные требования

* node >= 24
* npm >= 9
* PostgreSQL >= 13 — и локально, и в проде

Одна и та же СУБД везде намеренно: держать в Drizzle два диалекта можно только
двумя копиями схемы, а они неизбежно разойдутся. Расхождение диалектов —
источник ошибок, которые видны только в проде: при переезде со SQLite молча
перестало работать распознавание конфликта уникальности, потому что опиралось
на текст ошибки SQLite.

Версия 13 и выше нужна тестам: они создают и удаляют свою базу через
`drop database … with (force)`.

## Установка зависимостей для бэкенда и его запуск

Нужна запущенная PostgreSQL. Проще всего поднять её из compose:

```bash
docker compose up -d db
```

Или указать свою в `DATABASE_URL`.

```bash
npm install
cp .env.example .env
npm run dev
```

<http://localhost:3001>

## Установка зависимостей для фронтенда и его запуск

```bash
cd frontend
npm install
npm run start
```

<http://localhost:3000>

## Миграции базы данных

Миграции лежат в [drizzle/](drizzle/) и **версионируются вместе с кодом**.
Приложение применяет их само при старте, отдельного шага в деплое не нужно.

После правки схемы в `src/db/schema/schema.ts`:

```bash
npm run db:generate   # создаст файл миграции в drizzle/
```

Полученный файл нужно закоммитить. Генерировать миграции в сборке или в CI
нельзя: тогда в образ попадает свежая «нулевая» миграция, журнал в боевой базе
считает её уже применённой, и изменения схемы молча не доезжают — на первом
деплое всё работает, а на втором данные расходятся со схемой.

Применить миграции к своей базе вручную:

```bash
npm run db:migrate
```

## Типы для фронтенда

Бэкенд генерирует TypeScript-типы для фронтенда через tRPC. При изменении схем или роутеров на бэкенде нужно перегенерировать типы:

```bash
npm run generate:types
```

Типы сохраняются в папку `types/` и используются фронтендом для автодополнения и проверки типов.

## Линтер (Biome)

На бэкенде используется [Biome](https://biomejs.dev/) — линтер и форматтер в одном инструменте. Конфиг находится в [biome.json](biome.json), покрывает папку `src/`.

Запуск линтера:

```bash
# Проверка только бэкенда
npm run lint

# Автоисправление только бэкенда
npm run lint:fix
```

Или через Makefile:

```bash
make lint-backend       # проверка
make lint-fix-backend   # автоисправление
```

В VSCode Biome работает автоматически при сохранении файла — нужно установить расширение [Biome](https://marketplace.visualstudio.com/items?itemName=biomejs.biome).

## Старая API документация

Структура API старого проекта находится [здесь](https://runit.hexlet.ru/api).

## Полезные ссылки

* [Гайдлайн по TS от Microsoft](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines)
* [Гайдлайн по TS от Google](https://google.github.io/styleguide/tsguide.html)

---

[![© ООО «Хекслет Рус» logo](https://raw.githubusercontent.com/Hexlet/assets/master/images/hexlet_logo128.png)](https://hexlet.io/?utm_source=github&utm_medium=link&utm_campaign=hexlet-editor)

Этот репозиторий создаётся и поддерживается командой и сообществом © ООО «Хекслет Рус», образовательный проект. [Подробнее о Хекслете](https://hexlet.io/?utm_source=github&utm_medium=link&utm_campaign=hexlet-editor).
