# Образ для серверного исполнения TypeScript-сниппетов.
# Особенности:
# - Node 24 исполняет .ts-файлы напрямую (type stripping включён по умолчанию
#   начиная с Node 23.6), поэтому раннеру достаточно `node main.ts`.
# - НИКАКИХ npm install / tsx / ts-node в образе: в контейнере нет сети
#   (--network=none), rootfs read-only, и лишние зависимости только увеличили бы
#   поверхность атаки.
# - Важно: type stripping только удаляет типы, он НЕ проверяет их и не поддерживает
#   конструкции, требующие кодогенерации (enum, namespace с рантайм-кодом,
#   experimental decorators, parameter properties) — такой код упадёт с ошибкой.
# - HOME=/tmp приходит от раннера, npm/node сюда ничего не пишут при запуске.
FROM node:24-alpine

RUN adduser -D -u 10001 runner

WORKDIR /app
USER 10001
