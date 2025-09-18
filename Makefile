SHELL := /bin/bash
APP_NAME := nest-graphql-mongo-starter
COMPOSE := docker compose

VPS_USER ?= root
VPS_HOST ?= your.vps.ip
VPS_PATH ?= /opt/$(APP_NAME)

.PHONY: install dev build start lint test dc-up dc-down logs deploy remote-setup

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
