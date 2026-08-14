# Образ фронтенда: собранная статика Vite, отдаётся Caddy.
# Caddy же проксирует /trpc на бэкенд — статику отдаёт веб-сервер, а не Node,
# поэтому код приложения для этого менять не нужно.
#
# ВАЖНО: контекст сборки — корень репозитория (не frontend/), потому что фронт
# импортирует типы бэкенда из ../../types. См. docker-compose.yml.
#   docker build -f frontend/Dockerfile .

# ---------- Сборка ----------
FROM node:24-slim AS build

WORKDIR /app

# .npmrc обязателен: в нём legacy-peer-deps=true, без него npm ci падает на
# конфликте peer-зависимостей stylelint-config-prettier ↔ stylelint 17.
COPY frontend/package.json frontend/package-lock.json frontend/.npmrc ./
RUN npm ci

# Типы бэкенда: фронт импортирует их как ../../types/... — в контейнере это /types.
COPY types /types
COPY frontend ./

# Переменные Vite подставляются на сборке, а не читаются в рантайме: собранная
# статика — это уже готовые файлы, менять их значения через environment
# контейнера невозможно. Пока их не передавали, два механизма молча не работали
# в прод-образе:
#  * VITE_SENTRY_DSN — отчёты об ошибках фронтенда никуда не уходили;
#  * VITE_PUBLIC_BASE_URL — ссылки «Поделиться» строились по window.location,
#    то есть с портом стенда, если сайт открыт не через основной домен.
# Пустые значения безопасны: sentry.ts без DSN ничего не включает, а
# publicBaseUrl() возвращается к window.location.origin.
ARG VITE_SENTRY_DSN=""
ARG VITE_PUBLIC_BASE_URL=""
ENV VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_PUBLIC_BASE_URL=$VITE_PUBLIC_BASE_URL

RUN npm run build

# ---------- Раздача ----------
FROM caddy:2-alpine AS runtime

COPY --from=build /app/dist /srv
COPY frontend/Caddyfile.docker /etc/caddy/Caddyfile

EXPOSE 80

# Живость веб-контейнера. Без проверки compose считал сервис поднятым сразу
# после старта процесса: при ошибке в Caddyfile контейнер оставался «здоровым»,
# отдавая 502, и деплой по тегу проходил успешно с нерабочим сайтом.
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
