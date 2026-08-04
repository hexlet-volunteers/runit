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

## Серверное исполнение кода (раннер)

**JavaScript** исполняется в браузере (Web Worker) — Docker не нужен, работает всегда.

**Python, PHP, Ruby, Java** исполняются на сервере в изолированном Docker-контейнере.
Чтобы это работало локально, нужен запущенный Docker и собранные образы:

```bash
npm run runner:build-images
```

Без Docker приложение полностью работоспособно: при запуске такого сниппета в консоли
появляется подсказка («Docker-демон не запущен…»), а не ошибка сервера.

Юнит-тесты раннера (не требуют Docker):

```bash
npm run test:runner
```

E2E-тесты языков, требующие Docker:

```bash
npm run test:withDocker
```

### Изоляция песочницы

Код пользователя запускается с жёсткими ограничениями: без сети (`--network=none`),
без capabilities (`--cap-drop=ALL`), от непривилегированного пользователя, с
read-only файловой системой (writable только `/tmp` в памяти), с лимитами памяти,
CPU, числа процессов, времени выполнения и размера вывода. Параллельные запуски
ограничены семафором. Флаги собираются в одном месте — `src/runner/dockerArgs.ts`,
и покрыты тестами, чтобы изоляцию нельзя было ослабить незаметно.

### Настройки (переменные окружения)

| Переменная | По умолчанию | Назначение |
| --- | --- | --- |
| `RUNNER_ENABLED` | `true` | Полностью выключить серверный запуск |
| `RUNNER_LANGUAGES` | все | Список языков через запятую |
| `RUNNER_TIMEOUT_MS` | `10000` | Лимит времени (Java — 20000) |
| `RUNNER_MEMORY` | `256m` | Лимит памяти (Java — 512m) |
| `RUNNER_CPUS` | `1` | Лимит CPU |
| `RUNNER_PIDS_LIMIT` | `64` | Лимит процессов (Java — 256) |
| `RUNNER_MAX_OUTPUT_BYTES` | `65536` | Лимит размера вывода |
| `RUNNER_MAX_CONCURRENT` | `4` | Одновременных запусков |
| `RUNNER_DOCKER_BIN` | `docker` | Путь к docker CLI |
| `RUNNER_TMP_DIR` | системный tmp | Каталог для кода (для удалённого демона) |

### Замечания для деплоя

* Серверу нужен доступ к Docker. **Доступ к docker-сокету равносилен root на хосте** —
  не монтируйте сокет в контейнер приложения, которое исполняет чужой код, без
  отдельной изоляции (выделенный runner-хост, rootless или удалённый демон по mTLS).
* Там, где Docker недоступен (например, Heroku), раннер корректно деградирует:
  сайт работает, серверный запуск отвечает подсказкой.
* Установка пакетов (`pip install` и т.п.) из кода невозможна — сети в контейнере нет.
  Нужные библиотеки добавляются в образы (`runner-images/`).

## Старая API документация

Структура API старого проекта находится [здесь](https://runit.hexlet.ru/api).

## Полезные ссылки

* [Гайдлайн по TS от Microsoft](https://github.com/microsoft/TypeScript/wiki/Coding-guidelines)
* [Гайдлайн по TS от Google](https://google.github.io/styleguide/tsguide.html)

---

[![© ООО «Хекслет Рус» logo](https://raw.githubusercontent.com/Hexlet/assets/master/images/hexlet_logo128.png)](https://hexlet.io/?utm_source=github&utm_medium=link&utm_campaign=hexlet-editor)

Этот репозиторий создаётся и поддерживается командой и сообществом © ООО «Хекслет Рус», образовательный проект. [Подробнее о Хекслете](https://hexlet.io/?utm_source=github&utm_medium=link&utm_campaign=hexlet-editor).
 