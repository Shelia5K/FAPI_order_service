# =============================================================================
# FAPI Order Service - Web Dockerfile
# =============================================================================
#
# This Dockerfile builds the Next.js frontend.
# It's designed for simplicity in development/testing.
#
# Build context: project root (not apps/web)
# Example: docker build -f apps/web/Dockerfile .
#
# IMPORTANT: NEXT_PUBLIC_API_URL
# This environment variable must be set at BUILD time for Next.js.
# It's baked into the client-side JavaScript bundle.
# Default: http://localhost:3001
#
# =============================================================================

FROM node:20-alpine

WORKDIR /app

# Copy workspace package files
COPY package.json package-lock.json* ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies
RUN npm ci

# Copy source files
COPY tsconfig.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Build shared package first
RUN npm run build --workspace=packages/shared

# Set API URL for the build (can be overridden with --build-arg)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace=apps/web

# Expose port (default: 3000)
EXPOSE 3000

# Environment
ENV NODE_ENV=production
ENV PORT=3000

# Start Next.js in production mode
CMD ["npm", "run", "start", "--workspace=apps/web"]
