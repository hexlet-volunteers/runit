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

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Типы бэкенда: фронт импортирует их как ../../types/... — в контейнере это /types.
COPY types /types
COPY frontend ./

RUN npm run build

# ---------- Раздача ----------
FROM caddy:2-alpine AS runtime

COPY --from=build /app/dist /srv
COPY frontend/Caddyfile.docker /etc/caddy/Caddyfile

EXPOSE 80
