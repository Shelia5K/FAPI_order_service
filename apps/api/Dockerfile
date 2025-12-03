# =============================================================================
# FAPI Order Service - API Dockerfile
# =============================================================================
#
# This Dockerfile builds the Express backend API.
# It's designed for simplicity in development/testing.
#
# Build context: project root (not apps/api)
# Example: docker build -f apps/api/Dockerfile .
#
# =============================================================================

FROM node:20-alpine

WORKDIR /app

# Install dependencies for native modules and Prisma
RUN apk add --no-cache python3 make g++ openssl openssl-dev

# Copy workspace package files
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies
RUN npm ci

# Copy Prisma schema (needed for generate)
COPY apps/api/prisma ./apps/api/prisma

# Generate Prisma Client
RUN cd apps/api && npx prisma generate

# Copy source files
COPY tsconfig.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared package
RUN npm run build --workspace=packages/shared

# Build API
RUN npm run build --workspace=apps/api

# Expose port (default: 3001)
EXPOSE 3001

# Environment
ENV NODE_ENV=production
ENV PORT=3001

# Start the server
# Note: For fresh databases, run migrations separately: 
# docker exec fapi-api npx prisma migrate deploy
# or
# docker exec fapi-api sh -c "cd apps/api && npx prisma db push && npx tsx prisma/seed.ts"
CMD ["node", "apps/api/dist/index.js"]
