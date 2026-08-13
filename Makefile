install:
	npm install
	npm install --prefix frontend

dev:
	npm run dev

dev-frontend:
	npm run start --prefix frontend

build:
	npm run build

lint-backend:
	npm run lint

lint-fix-backend:
	npm run lint:fix

# Юниты раннера и тесты авторизации/политики паролей. Последним нужна
# запущенная PostgreSQL — поднимается через `docker compose up -d db`.
test:
	npm test

# Применить миграции к базе (сами миграции лежат в drizzle/ и версионируются).
db-migrate:
	npm run db:migrate

# Сгенерировать миграцию после правки схемы — результат нужно закоммитить.
db-generate:
	npm run db:generate

db-studio:
	npm run db:studio

.PHONY: install dev dev-frontend build lint-backend lint-fix-backend test db-migrate db-generate db-studio
