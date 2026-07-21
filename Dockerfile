# =============================================================================
# Multi-stage Dockerfile for DevOps Implementation App
# =============================================================================

# ---------------------
# Stage 1: Dependencies
# ---------------------
FROM node:22-alpine AS deps

WORKDIR /app

# Copy only package files to leverage Docker layer caching
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# ---------------------
# Stage 2: Build
# ---------------------
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files and install ALL dependencies (including devDependencies)
# drizzle-kit is a devDependency needed for migrations
COPY package.json package-lock.json ./
RUN npm ci

# Copy application source code and drizzle migrations
COPY src/ ./src/
COPY drizzle/ ./drizzle/
COPY drizzle.config.js ./

# ---------------------
# Stage 3: Production
# ---------------------
FROM node:22-alpine AS production

# Install netcat for DB readiness checks and wget for healthchecks
RUN apk add --no-cache netcat-openbsd wget

WORKDIR /app

# Copy production node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source from build stage
COPY --from=build /app/src ./src
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.js ./
COPY --from=build /app/package.json ./

# We also need drizzle-kit for migrations at runtime
# Copy it from the build stage which has all dependencies
COPY --from=build /app/node_modules/drizzle-kit ./node_modules/drizzle-kit
COPY --from=build /app/node_modules/@drizzle-team ./node_modules/@drizzle-team

# Copy entrypoint and healthcheck scripts
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
COPY scripts/healthcheck.sh /usr/local/bin/healthcheck.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh /usr/local/bin/healthcheck.sh

# Create logs directory and set ownership
RUN mkdir -p /app/logs && chown -R node:node /app

# Switch to non-root user for security
USER node

# Expose the application port
EXPOSE 3000

# Health check — polls /health every 30s
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD /usr/local/bin/healthcheck.sh

# Entrypoint: wait for DB, run migrations, start app
ENTRYPOINT ["docker-entrypoint.sh"]
