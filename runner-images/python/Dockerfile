# Образ для серверного исполнения Python-сниппетов.
# Собирается через `npm run runner:build-images`.
FROM python:3.13-slim

# Непривилегированный пользователь. Раннер дополнительно передаёт --user 10001:10001,
# поэтому защита сохранится даже если образ пересоберут без USER.
RUN useradd --uid 10001 --create-home --home-dir /home/runner runner

WORKDIR /app
USER 10001
