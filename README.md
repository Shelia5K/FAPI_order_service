# FAPI Order Service

A simple product ordering system built as a TypeScript monorepo with React/Next.js frontend, Node/Express backend, and PostgreSQL database.

## Assignment Overview

This project implements a Czech e-commerce ordering system with:

- **Product catalog** - Browse products with prices in CZK
- **Order form** - Single-page checkout with customer information
- **VAT calculation** - Automatic 21% VAT
- **Currency conversion** - Show totals in EUR, USD, PLN using Czech National Bank exchange rates
- **Order confirmation** - Thank-you page with order details and converted prices

## Quick Start

### Option 1: Docker (Recommended)

```bash
# Start everything with one command
make dev

# Or without Make
docker-compose up --build
```

**First time only** - initialize the database:
```bash
docker exec fapi-api sh -c "cd apps/api && npx prisma db push && npx tsx prisma/seed.ts"
```

Then open:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001

### Option 2: Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL (Docker)
make db-up

# 3. Set up database
npm run build:shared
cd apps/api && npm run db:migrate && npm run db:seed && cd ../..

# 4. Start development servers
npm run dev
```

## Project Structure

```
FAPI_order_service/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   └── src/app/            # Pages (App Router)
│   │       ├── page.tsx        # Home - product list & order form
│   │       ├── components/     # Reusable UI (product card, inputs, summaries)
│   │       ├── lib/            # Form validation & API config helpers
│   │       └── thank-you/      # Order confirmation page (+ nested components)
│   │
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── controllers/    # HTTP handlers
│       │   ├── services/       # Business logic
│       │   └── db/             # Prisma client
│       └── prisma/
│           ├── schema.prisma   # Database schema
│           └── seed.ts         # Sample data
│
├── packages/
│   └── shared/                 # Shared TypeScript code
│       └── src/
│           ├── types/          # Shared types (Product, Order, etc.)
│           ├── utils/          # VAT calculations, formatting
│           └── constants.ts    # Business constants (VAT rate)
│
├── docker-compose.yml          # Full-stack Docker setup
├── Makefile                    # Developer commands
└── README.md
```

## Architecture

### Responsibilities

| Layer | Location | Responsibility |
|-------|----------|----------------|
| **Frontend** | `apps/web` | UI, user interaction, data fetching, client validation |
| **Backend** | `apps/api` | REST API, validation, business logic, database |
| **Shared** | `packages/shared` | Types, VAT calculations, formatting |

### Key Technical Decisions

1. **Monorepo with npm workspaces** - Simple setup without extra tooling. Shared code lives in `packages/shared`.

2. **Shared VAT calculation** - Same function used in frontend (preview) and backend (order creation). Ensures consistency.

3. **Prisma ORM** - Type-safe database access. Schema defines both DB structure and TypeScript types.

4. **CNB exchange rates** - Fetched from Czech National Bank's public API. Cached for 1 hour. Graceful degradation if unavailable.

5. **Prices stored without VAT** - Products have base price. VAT calculated at checkout and stored with order.

6. **Componentized frontend** - Shared UI pieces (`ProductCard`, `PriceSummary`, `PhoneInput`, etc.) live in `apps/web/src/app/components`, and business helpers (`orderForm.ts`, `config.ts`) live in `apps/web/src/lib` to keep pages focused on orchestration.

### Shared Package & Build Output

- `packages/shared` contains the TypeScript source that both the API and frontend import.
- Running `npm run build:shared` (or any workspace build) emits compiled JavaScript and type declarations into `packages/shared/dist/`.
- When running in Docker or production, packages resolve imports to the `dist/` folder so the code executes without a TypeScript toolchain.
- During local development, Next.js and the API import directly from the source thanks to the workspace path configuration.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, Next.js 14 (App Router), TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL 16, Prisma ORM |
| Validation | Zod |
| Testing | Vitest |
| Containers | Docker, Docker Compose |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/products` | List all products |
| GET | `/api/products/:id` | Get product details |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id` | Get order with FX conversions |

### Create Order Request

```json
POST /api/orders
{
  "productId": 1,
  "quantity": 2,
  "customer": {
    "name": "Jan Novák",
    "email": "jan@example.com",
    "phone": "+420123456789",
    "addressLine1": "Václavské náměstí 1",
    "city": "Praha",
    "country": "Česká republika",
    "zipCode": "11000"
  }
}
```

## Business Logic

### VAT Calculation

All products are priced **without VAT**. VAT (21%) is added at checkout:

```typescript
// From packages/shared/src/utils/vat.ts
subtotal = unitPrice × quantity      // e.g., 1990 × 2 = 3980 CZK
vatAmount = subtotal × 0.21          // e.g., 3980 × 0.21 = 835.80 CZK
total = subtotal + vatAmount         // e.g., 3980 + 835.80 = 4815.80 CZK
```

### Currency Conversion (CNB)

The thank-you page shows prices converted to EUR, USD, and PLN:

- **Source**: [Czech National Bank API](https://www.cnb.cz/cs/financni-trhy/devizovy-trh/kurzy-devizoveho-trhu/)
- **Format**: Daily rates in CZK (e.g., "1 EUR = 24.725 CZK")
- **Conversion**: `foreignAmount = czkAmount / rate`
- **Caching**: Rates cached for 1 hour
- **Fallback**: If CNB unavailable, shows "N/A" for foreign currencies

## Testing

```bash
# Run all tests
npm test

# Run specific tests
npm run test:shared     # Unit tests for VAT calculations
npm run test:api        # Integration tests for API
```

### Test Coverage

| Package | Tests | What's Covered |
|---------|-------|----------------|
| `packages/shared` | Unit tests | VAT calculations, edge cases (0, negative, NaN) |
| `apps/api` | Integration tests | POST /orders - success, 404, 409, 400 errors |

## Running with Docker

### Commands

```bash
make dev        # Start all services (see logs)
make up         # Start in background
make down       # Stop services
make logs       # View logs
make ps         # Show status
```

### First-Time Setup

After starting Docker for the first time, initialize the database:

```bash
# Create tables and seed sample data
docker exec fapi-api sh -c "cd apps/api && npx prisma db push && npx tsx prisma/seed.ts"
```

This creates the `products` and `orders` tables and adds 3 sample products.

### Services

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐    ┌─────────┐    ┌─────────────────────────┐  │
│  │   web   │───▶│   api   │───▶│          db             │  │
│  │ :3000   │    │ :3001   │    │ PostgreSQL :5432        │  │
│  └─────────┘    └─────────┘    └─────────────────────────┘  │
│     Next.js       Express         postgres:16-alpine        │
└─────────────────────────────────────────────────────────────┘
```

### Environment Variables

| Service | Variable | Value |
|---------|----------|-------|
| api | `DATABASE_URL` | `postgresql://postgres:postgres@db:5432/fapi_orders` |
| api | `PORT` | `3001` |
| web | `NEXT_PUBLIC_API_URL` | `http://localhost:3001` |

## Local Development (Without Docker)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker for just the database)

### Setup

```bash
# Install dependencies
npm install

# Build shared package
npm run build:shared

# Start only the database in Docker
make db-up

# Configure database connection
echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fapi_orders" > apps/api/.env

# Run migrations and seed
cd apps/api
npm run db:generate
npm run db:migrate
npm run db:seed
cd ../..

# Start development servers
npm run dev
```

### Useful Commands

```bash
make dev-local   # DB in Docker + apps locally
make dev-api     # Start API only
make dev-web     # Start frontend only
make db-studio   # Open Prisma Studio (DB browser)
make setup       # Full initial setup
```

## Database Schema

### Products

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| title | VARCHAR(255) | Product name |
| description | TEXT | Description (optional) |
| price_czk | DECIMAL(10,2) | Price in CZK **without VAT** |
| quantity | INTEGER | Available stock |

### Orders

| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| product_id | INTEGER | FK to products |
| customer_* | VARCHAR | Customer info |
| quantity | INTEGER | Ordered quantity |
| unit_price_czk | DECIMAL | Price at order time |
| subtotal_czk | DECIMAL | quantity × unit_price |
| vat_rate | DECIMAL | VAT rate (0.2100) |
| vat_amount_czk | DECIMAL | VAT amount |
| total_price_czk | DECIMAL | Final price with VAT |

## Code Quality

### Error Handling

- **Validation errors** (400) - Zod validation with detailed field errors
- **Not found** (404) - Clear messages for missing resources
- **Conflict** (409) - Insufficient stock handling
- **Server errors** (500) - Logged, generic message to client

### Key Files to Review

| File | Purpose |
|------|---------|
| `packages/shared/src/utils/vat.ts` | VAT calculation with edge case handling |
| `apps/api/src/services/orders.service.ts` | Order creation transaction |
| `apps/api/src/services/cnbRates.service.ts` | CNB integration with caching |
| `apps/api/prisma/schema.prisma` | Database schema |
| `apps/web/src/app/page.tsx` | Main order form UI |

## License

MIT
