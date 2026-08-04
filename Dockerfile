# Образ бэкенда Runit (Fastify + tRPC + Drizzle).
# Фронтенд собирается отдельно: frontend/Dockerfile (статика + Caddy).
#
# better-sqlite3 — нативный модуль, и для текущей версии готового бинарника под
# Node 24 нет, поэтому он компилируется через node-gyp. Тулчейн (python3, make,
# g++) нужен только на стадиях установки зависимостей: в финальный образ он не
# попадает — туда копируются уже собранные node_modules.

# ---------- Прод-зависимости (компилируются здесь) ----------
FROM node:24-slim AS prod-deps

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---------- Сборка ----------
FROM node:24-slim AS build

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Слой зависимостей кэшируется отдельно от кода.
COPY package.json package-lock.json ./
# npm ci нужен полный (в т.ч. dev): tsc и drizzle-kit — devDependencies.
RUN npm ci

COPY tsconfig.json drizzle.config.ts ./
COPY src ./src
COPY bin ./bin

# Сборка: генерация миграций из схемы, компиляция и добавление расширений в
# ESM-импорты (bin/fix-esm-imports.mjs — без него node dist/server.js падает).
# Прогон миграций — при старте контейнера, в build-стадии боевой БД нет.
RUN npm run build

# ---------- Рантайм ----------
FROM node:24-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

COPY package.json package-lock.json ./
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle

# По умолчанию БД лежит в томе /data (см. docker-compose).
ENV DB_PATH=/data/database.sqlite
ENV PORT=3001
ENV HOST=0.0.0.0

RUN mkdir -p /data && chown -R node:node /data /app
USER node

EXPOSE 3001

# Контейнер считается живым, только если приложение отвечает и видит БД.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Миграции прогоняются в src/index.ts при старте (runMigrations).
CMD ["node", "dist/server.js"]
