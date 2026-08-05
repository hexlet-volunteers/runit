# Образ для серверного исполнения Bash-сниппетов.
# Особенности:
# - Официальный образ bash даёт настоящий GNU bash 5.2, а не busybox ash,
#   который лежит в /bin/sh обычного alpine (иначе массивы, [[ ]], process
#   substitution работали бы не так, как ожидает пользователь).
# - ENTRYPOINT базового образа — сам bash; раннер передаёт команду целиком
#   (`bash main.sh`), поэтому CMD здесь не задаём.
# - Утилиты — busybox-версии (coreutils/grep/sed урезанные), сети нет
#   (--network=none): curl/wget/apk в сниппетах не сработают.
# - Писать можно только в /tmp (HOME=/tmp задаёт раннер), rootfs read-only.
FROM bash:5.2-alpine3.20

RUN adduser -D -u 10001 runner

WORKDIR /app
USER 10001
