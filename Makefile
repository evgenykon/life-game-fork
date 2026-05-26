build:
	docker compose -f docker-compose.dev.yml build

dev:
	docker compose -f docker-compose.dev.yml up -d

down:
	docker compose -f docker-compose.dev.yml down

run:
	docker compose -f docker-compose.dev.yml run --rm life $(cmd)

generate-gh:
	docker compose -f docker-compose.dev.yml run --rm -e NUXT_APP_BASE_URL=/three-body-problem/ life npm run generate