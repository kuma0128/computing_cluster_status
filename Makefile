.PHONY: help install test lint clean docker-up docker-down docker-logs

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

install: ## Install dependencies
	@echo "Installing dependencies..."
	@command -v jq >/dev/null 2>&1 || { echo "jq is required but not installed. Install it with: brew install jq (macOS) or apt-get install jq (Linux)"; exit 1; }
	@command -v shellcheck >/dev/null 2>&1 || { echo "shellcheck is recommended. Install it with: brew install shellcheck (macOS) or apt-get install shellcheck (Linux)"; }
	@command -v docker >/dev/null 2>&1 || { echo "docker is required but not installed."; exit 1; }
	@command -v docker-compose >/dev/null 2>&1 || { echo "docker-compose is required but not installed."; exit 1; }
	@echo "All dependencies are installed!"

test: lint ## Run all tests
	@echo "Running tests..."
	@$(MAKE) test-json

test-json: ## Validate JSON files
	@echo "Validating JSON files..."
	@mkdir -p data
	@find data -name "*.json" -type f -exec sh -c 'echo "Validating {}"; jq empty {} || exit 1' \;
	@echo "All JSON files are valid!"

lint: lint-shell lint-php ## Run all linters

lint-shell: ## Lint shell scripts
	@echo "Linting shell scripts..."
	@if command -v shellcheck >/dev/null 2>&1; then \
		find sh -name "*.sh" -type f ! -name "hoge.sh" -exec shellcheck {} +; \
	else \
		echo "shellcheck not installed, skipping..."; \
	fi

lint-php: ## Lint PHP files
	@echo "Linting PHP files..."
	@find php -name "*.php" -exec php -l {} \; | grep -v "No syntax errors"

clean: ## Clean temporary files
	@echo "Cleaning temporary files..."
	@find . -name "*.tmp*" -delete
	@find . -name ".DS_Store" -delete
	@rm -f data/*.log

docker-up: ## Start Docker containers
	docker-compose up -d
	@echo "Containers started. Access the app at http://localhost:8080"

docker-down: ## Stop Docker containers
	docker-compose down

docker-logs: ## Show Docker logs
	docker-compose logs -f

docker-rebuild: ## Rebuild and restart Docker containers
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

collect-metrics: ## Run metrics collection script
	@sh/collect_metrics.sh

dev-setup: install docker-up ## Setup development environment
	@echo "Development environment is ready!"
	@echo "Access the app at http://localhost:8080"
