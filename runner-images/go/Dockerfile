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

# Прогретый кэш сборки стандартной библиотеки.
#
# Зачем: /tmp — tmpfs, он создаётся заново на каждый запуск, поэтому кэш всегда
# пустой, и `go run` каждый раз компилирует стандартную библиотеку с нуля. Для
# `fmt.Println` это несколько секунд из двадцати отведённых — большая часть
# времени ответа уходила не на код пользователя, а на пересборку одного и того
# же. Готовый кэш лежит в слое образа, а команда запуска копирует его в /tmp.
#
# Собираются только часто используемые пакеты, а не вся stdlib: кэш копируется
# в tmpfs при каждом запуске, и его размер — это и время копирования, и
# оперативная память. Размер печатается в логе сборки, чтобы расхождение с
# лимитом tmpfs (см. LANGUAGE_SPECS.go.tmpfs) было видно сразу.
RUN GOCACHE=/gocache go build \
      fmt os strings strconv errors sort time math math/rand bufio io bytes \
      encoding/json sync regexp \
 && chmod -R a+rX /gocache \
 && echo "размер прогретого кэша, МБ:" && du -sm /gocache

RUN adduser -D -u 10001 runner

WORKDIR /app
USER 10001
