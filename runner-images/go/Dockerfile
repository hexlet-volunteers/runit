# Образ для серверного исполнения Go-сниппетов (`go run main.go`).
# Особенности:
# - `go run` компилирует код перед запуском и обязательно требует writable кэш
#   сборки. Rootfs у контейнера read-only, писать можно только в tmpfs /tmp,
#   поэтому все пути кэша переносим туда (иначе получаем
#   "failed to initialize build cache ... read-only file system").
# - GOFLAGS=-buildvcs=false отключает попытку прочитать VCS-информацию:
#   в контейнере нет git, а без флага сборка может завершиться ошибкой.
# - GOTMPDIR тоже держим в /tmp — там же лежит промежуточный объектный код.
# - Сети нет (--network=none), поэтому доступна только стандартная библиотека:
#   любой `go get` / внешний импорт заведомо не скачается.
FROM golang:1.23-alpine

ENV GOCACHE=/tmp/gocache \
    GOPATH=/tmp/go \
    GOMODCACHE=/tmp/go/pkg/mod \
    GOTMPDIR=/tmp \
    GOFLAGS=-buildvcs=false

RUN adduser -D -u 10001 runner

WORKDIR /app
USER 10001
