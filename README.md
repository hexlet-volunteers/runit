# Runit

[![On Push](https://github.com/hexlet-volunteers/runit/actions/workflows/push.yml/badge.svg?event=push)](https://github.com/hexlet-volunteers/runit/actions/workflows/push.yml)

## Описание

Runit — это среда для написания и выполнения кода, которая активно используется на платформах © ООО «Хекслет Рус». Ближайший аналог — сервис repl.it.

Возможности (текущие и будущие):

* Редактирование кода онлайн
* Шаринг кода по ссылке
* Встраивание сниппетов на страницы
* Совместное редактирование

## Технологии

* **Язык:** TypeScript
* **Фронтенд:** React, Mantine, Redux Toolkit, Vite
* **Бэкенд:** Fastify, tRPC, Drizzle ORM, Node.js

## Системные требования

* node >= 24
* npm >= 9
* PostgreSQL для продакшена, либо SQLite для локальной разработки

## Установка зависимостей для бэкенда и его запуск

```bash
npm install
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
 