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

# PHP Static Analysis
phpstan: ## Run PHPStan static analysis
	@if [ -f composer.json ]; then \
		composer install --no-interaction --prefer-dist; \
		composer run phpstan; \
	else \
		echo "composer.json not found. Run 'composer init' first."; \
	fi

psalm: ## Run Psalm type checking
	@if [ -f composer.json ]; then \
		composer install --no-interaction --prefer-dist; \
		composer run psalm; \
	else \
		echo "composer.json not found. Run 'composer init' first."; \
	fi

static-analysis: phpstan psalm ## Run all static analysis tools

# Secrets Management
decrypt-secrets: ## Decrypt secrets using sops
	@./scripts/decrypt-secrets.sh

encrypt-secret: ## Encrypt a secret file (usage: make encrypt-secret FILE=path/to/file)
	@if [ -z "$(FILE)" ]; then \
		echo "Usage: make encrypt-secret FILE=path/to/file"; \
		exit 1; \
	fi
	@sops -e $(FILE) > $(FILE).enc
	@echo "Encrypted: $(FILE).enc"

# Frontend Development (Vite/React)
frontend-install: ## Install frontend dependencies
	@echo "Installing frontend dependencies..."
	@cd frontend/modern && npm install

frontend-dev: ## Start frontend development server
	@echo "Starting Vite dev server..."
	@cd frontend/modern && npm run dev

frontend-build: ## Build frontend for production
	@echo "Building frontend..."
	@cd frontend/modern && npm run build

frontend-type-check: ## Run TypeScript type checking
	@echo "Type checking frontend..."
	@cd frontend/modern && npm run type-check

frontend-lint: ## Lint frontend code
	@echo "Linting frontend..."
	@cd frontend/modern && npm run lint

frontend-clean: ## Clean frontend build artifacts
	@echo "Cleaning frontend build artifacts..."
	@rm -rf frontend/modern/node_modules
	@rm -rf frontend/modern/dist
	@rm -rf php/dist

# Development with both classic and modern frontends
dev-full: install docker-up frontend-install ## Setup full development environment
	@echo "Full development environment is ready!"
	@echo "Classic frontend: http://localhost:8080"
	@echo "Modern frontend: http://localhost:3000"
	@echo ""
	@echo "To start Vite dev server, run: make frontend-dev"

# Local CI checks (matches GitHub Actions)
check-backend: lint-shell lint-php static-analysis ## Run all backend checks locally
	@echo "All backend checks passed!"

check-frontend: frontend-type-check frontend-lint frontend-build ## Run all frontend checks locally
	@echo "All frontend checks passed!"

check-all: check-backend check-frontend ## Run all CI checks locally
	@echo "All checks passed! Ready to push."

# Docker-based checks (useful when Composer/Node not installed locally)
docker-phpstan: ## Run PHPStan via Docker
	@docker-compose run --rm php-fpm sh -c 'composer install --no-progress && composer run phpstan'

docker-psalm: ## Run Psalm via Docker
	@docker-compose run --rm php-fpm sh -c 'composer install --no-progress && composer run psalm'

docker-check-backend: ## Run all backend checks via Docker
	@echo "Running ShellCheck..."
	@docker run --rm -v "$$(pwd):/mnt" koalaman/shellcheck:stable sh/*.sh
	@echo "Running PHP Lint..."
	@docker run --rm -v "$$(pwd):/app" -w /app php:8.2-cli sh -c 'find php -name "*.php" -print0 | xargs -0 -n1 php -l'
	@echo "Running PHPStan..."
	@$(MAKE) docker-phpstan
	@echo "Running Psalm..."
	@$(MAKE) docker-psalm
	@echo "All backend checks passed!"
