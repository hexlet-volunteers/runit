install:
	npm install
	npm install --prefix frontend

dev:
	npm run dev

dev-frontend:
	npm run start --prefix frontend

build:
	npm run build

lint:
	npm run lint
	npm run lint --prefix frontend

lint-fix:
	npm run lint:fix
	npm run lint:fix --prefix frontend

test:
	npm test

db-setup:
	npm run db:setup

db-reset:
	npm run db:reset

db-studio:
	npm run db:studio

.PHONY: install dev dev-frontend build lint lint-fix test db-setup db-reset db-studio
