# =============================================================================
# FAPI Order Service - Makefile
# =============================================================================
#
# This Makefile provides shortcuts for common development tasks.
#
# Usage: make <target>
#
# =============================================================================

.PHONY: help install dev dev-local dev-web dev-api build test clean \
        up down logs ps \
        db-up db-down db-reset db-migrate db-seed db-studio db-generate \
        setup

# Default target
help:
	@echo ""
	@echo "╔═══════════════════════════════════════════════════════════════════╗"
	@echo "║          FAPI Order Service - Development Commands                ║"
	@echo "╚═══════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "  Docker (Full Stack):"
	@echo "  ─────────────────────────────────────────────────────────────────"
	@echo "    make dev         Start all services with Docker (attached)"
	@echo "    make up          Start all services with Docker (detached)"
	@echo "    make down        Stop all Docker services"
	@echo "    make logs        View logs from all services"
	@echo "    make ps          Show running containers"
	@echo ""
	@echo "  Local Development (without Docker for apps):"
	@echo "  ─────────────────────────────────────────────────────────────────"
	@echo "    make dev-local   Start DB + local API + Web (npm run dev)"
	@echo "    make dev-api     Start database + API only"
	@echo "    make dev-web     Start frontend only"
	@echo ""
	@echo "  Testing:"
	@echo "  ─────────────────────────────────────────────────────────────────"
	@echo "    make test        Run all tests (requires local npm install)"
	@echo ""
	@echo "  Database (Prisma):"
	@echo "  ─────────────────────────────────────────────────────────────────"
	@echo "    make db-up       Start PostgreSQL container only"
	@echo "    make db-down     Stop PostgreSQL container"
	@echo "    make db-reset    Reset database (drop all data)"
	@echo "    make db-migrate  Run Prisma migrations"
	@echo "    make db-seed     Seed database with sample data"
	@echo "    make db-studio   Open Prisma Studio (database browser)"
	@echo ""
	@echo "  Setup:"
	@echo "  ─────────────────────────────────────────────────────────────────"
	@echo "    make install     Install npm dependencies"
	@echo "    make setup       Full setup (install + db + migrate + seed)"
	@echo "    make build       Build all packages"
	@echo "    make clean       Remove node_modules and build artifacts"
	@echo ""

# =============================================================================
# Docker Commands (Full Stack)
# =============================================================================

# Start all services with Docker Compose (attached mode - see logs)
# This is the main "dev" command for running everything in Docker
dev:
	@echo "🚀 Starting all services with Docker Compose..."
	@echo "   Frontend: http://localhost:3000"
	@echo "   API:      http://localhost:3001"
	@echo "   Database: localhost:5432"
	@echo ""
	@echo "   Press Ctrl+C to stop all services"
	@echo ""
	docker-compose up --build

# Start all services in detached mode (background)
up:
	@echo "🚀 Starting all services in background..."
	docker-compose up -d --build
	@echo ""
	@echo "✅ Services started!"
	@echo "   Frontend: http://localhost:3000"
	@echo "   API:      http://localhost:3001"
	@echo "   Database: localhost:5432"
	@echo ""
	@echo "   Run 'make logs' to view logs"
	@echo "   Run 'make down' to stop services"

# Stop all Docker services
down:
	@echo "🛑 Stopping all services..."
	docker-compose down
	@echo "✅ All services stopped"

# View logs from all services
logs:
	docker-compose logs -f

# Show status of running containers
ps:
	docker-compose ps

# =============================================================================
# Local Development (without Docker for apps)
# =============================================================================

# Start database + run apps locally with npm
dev-local: db-up
	@echo "🚀 Starting local development servers..."
	@echo "   (Database running in Docker, apps running locally)"
	npm run dev

# Start database + API only (local)
dev-api: db-up
	@echo "🚀 Starting API server..."
	npm run dev:api

# Start frontend only (local)
dev-web:
	@echo "🚀 Starting frontend server..."
	npm run dev:web

# =============================================================================
# Testing
# =============================================================================

# Run all tests
# Note: Tests run on the host machine using npm, not in Docker.
# Requires: npm install, database running
test:
	@echo "🧪 Running tests..."
	npm test

# Run tests with coverage
test-coverage:
	@echo "🧪 Running tests with coverage..."
	npm run test:coverage

# =============================================================================
# Database Commands
# =============================================================================

# Start only the database container
db-up:
	@echo "📦 Starting PostgreSQL..."
	docker-compose up -d db
	@echo "⏳ Waiting for database to be ready..."
	@sleep 3
	@echo "✅ Database is ready!"

# Stop the database container
db-down:
	docker-compose stop db

# Reset database (drop all data and recreate)
db-reset:
	@echo "🗑️  Resetting database..."
	docker-compose down -v db
	docker-compose up -d db
	@sleep 3
	cd apps/api && npm run db:migrate
	@echo "✅ Database reset complete!"

# Run Prisma migrations
db-migrate:
	@echo "📝 Running database migrations..."
	cd apps/api && npm run db:migrate

# Seed database with sample data
db-seed:
	@echo "🌱 Seeding database..."
	cd apps/api && npm run db:seed

# Open Prisma Studio
db-studio:
	@echo "🔍 Opening Prisma Studio..."
	cd apps/api && npm run db:studio

# Generate Prisma Client
db-generate:
	cd apps/api && npm run db:generate

# =============================================================================
# Setup & Build
# =============================================================================

# Install all npm dependencies
install:
	@echo "📦 Installing dependencies..."
	npm install
	npm run build:shared
	cd apps/api && npm run db:generate
	@echo "✅ Dependencies installed!"

# Full setup for new developers
setup: install db-up
	@sleep 2
	@$(MAKE) db-migrate
	@$(MAKE) db-seed
	@echo ""
	@echo "╔═══════════════════════════════════════════════════════════════════╗"
	@echo "║                    ✅ Setup Complete!                             ║"
	@echo "╠═══════════════════════════════════════════════════════════════════╣"
	@echo "║  Run one of the following to start development:                   ║"
	@echo "║                                                                   ║"
	@echo "║    make dev        - Full stack in Docker                         ║"
	@echo "║    make dev-local  - Database in Docker, apps locally             ║"
	@echo "║                                                                   ║"
	@echo "╚═══════════════════════════════════════════════════════════════════╝"

# Build all packages
build:
	@echo "🔨 Building all packages..."
	npm run build

# Clean all build artifacts and dependencies
clean:
	@echo "🧹 Cleaning up..."
	npm run clean
	docker-compose down -v 2>/dev/null || true
	@echo "✅ Cleanup complete!"
