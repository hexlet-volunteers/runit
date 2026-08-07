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

# Живые тесты: юниты раннера. Набор e2e в tests/ смотрел на удалённый
# легаси-интерфейс, поэтому его переписывание — это #177.
test:
	npm run test:runner

db-setup:
	npm run db:setup

db-reset:
	npm run db:reset

db-studio:
	npm run db:studio

.PHONY: install dev dev-frontend build lint-backend lint-fix-backend test db-setup db-reset db-studio
