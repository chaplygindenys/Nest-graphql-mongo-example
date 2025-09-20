SHELL := /bin/bash
APP_NAME := nest-graphql-mongo-starter
COMPOSE := docker compose

MONGO_SVC ?= mongo
MONGO_VOL ?= mongo_data
VPS_USER ?= root
VPS_HOST ?= your.vps.ip
VPS_PATH ?= /opt/$(APP_NAME)

.PHONY: install dev build start lint test dc-up dc-down logs deploy remote-setup mongo-up mongo-logs mongo-stop mongo-rm mongo-sh mongo-wipe

## Start only Mongo (detached)
mongo-up:
	$(COMPOSE) up -d $(MONGO_SVC)

## Follow Mongo logs
mongo-logs:
	$(COMPOSE) logs -f $(MONGO_SVC)

## Stop only Mongo
mongo-stop:
	$(COMPOSE) stop $(MONGO_SVC)

## Remove only the Mongo container (keeps data volume)
mongo-rm:
	$(COMPOSE) rm -f $(MONGO_SVC)

## Open a shell to Mongo (mongosh)
mongo-sh:
	$(COMPOSE) exec $(MONGO_SVC) mongosh

## Fully wipe Mongo (container + **data volume**)
# ⚠️ This deletes your DB data stored in the 'mongo_data' volume.
mongo-wipe:
	-$(COMPOSE) stop $(MONGO_SVC)
	-$(COMPOSE) rm -f $(MONGO_SVC)
	-@docker volume rm $(MONGO_VOL) || true


install:
	npm ci

dev:
	npm run start:dev

build:
	npm run build

start:
	npm run start:prod

lint:
	npm run lint

test:
	npm run test

dc-up:
	$(COMPOSE) --env-file .env.docker up -d --build

logs:
	$(COMPOSE) logs -f api

dc-down:
	$(COMPOSE) down -v

remote-setup:
	ssh $(VPS_USER)@$(VPS_HOST) "mkdir -p $(VPS_PATH)"

deploy: build
	rsync -av --delete --exclude node_modules --exclude .git --exclude coverage --exclude .vscode ./ $(VPS_USER)@$(VPS_HOST):$(VPS_PATH)/
	ssh $(VPS_USER)@$(VPS_HOST) "cd $(VPS_PATH) && $(COMPOSE) --env-file .env.docker up -d --build && $(COMPOSE) ps"
