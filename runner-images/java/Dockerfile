# Образ для серверного исполнения Java-сниппетов.
# Нужен именно JDK (не JRE): запуск одиночного файла `java Main.java` (JEP 330)
# компилирует его на лету.
# Образ `openjdk` (использовался в старом стеке) объявлен deprecated — берём Temurin.
FROM eclipse-temurin:21-jdk-alpine

RUN adduser -D -u 10001 runner

WORKDIR /app
USER 10001
