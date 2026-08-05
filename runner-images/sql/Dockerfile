# Образ для серверного исполнения SQL-сниппетов через sqlite3 CLI.
# Особенности:
# - Пакет `sqlite` в alpine даёт именно CLI-бинарник /usr/bin/sqlite3
#   (в отличие от sqlite-libs, где только библиотека).
# - Сниппет исполняется в in-memory БД либо во временном файле в /tmp:
#   rootfs read-only, поэтому любые sqlite-файлы (включая журнал/WAL) должны
#   лежать только в writable tmpfs /tmp.
# - Сети нет (--network=none): ATTACH к удалённым источникам невозможен,
#   загрузка расширений тоже (и её не стоит включать).
FROM alpine:3.20

RUN apk add --no-cache sqlite

RUN adduser -D -u 10001 runner

WORKDIR /app
USER 10001
