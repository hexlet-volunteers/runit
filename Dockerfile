# Образ бэкенда Runit (Fastify + tRPC + Drizzle).
# Фронтенд собирается отдельно: frontend/Dockerfile (статика + Caddy).
#
# Нативных модулей в прод-дереве больше нет: драйвер PostgreSQL (postgres-js) —
# чистый JS. Прежний better-sqlite3 требовал в образе python3, make и g++ и
# компилировался node-gyp на каждой сборке — тулчейн и эти стадии удалены.
# Осталась одна оговорка: bcrypt тоже нативный, но у него есть готовые сборки
# под Node 24, и npm ci их скачивает.

# ---------- Прод-зависимости ----------
FROM node:24-slim AS prod-deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---------- Сборка ----------
FROM node:24-slim AS build

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

ENV PORT=3001
ENV HOST=0.0.0.0

# DATABASE_URL по умолчанию не задаётся намеренно: в production приложение
# требует её явно и падает на старте, если переменной нет (см. config/env.ts).
# Значение по умолчанию указывало бы на localhost, и контейнер молча поднялся
# бы на пустой базе вместо боевой.

RUN chown -R node:node /app
USER node

EXPOSE 3001

# Контейнер считается живым, только если приложение отвечает и видит БД.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Миграции прогоняются в src/index.ts при старте (runMigrations).
CMD ["node", "dist/server.js"]
