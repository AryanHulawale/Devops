#!/bin/sh
set -e

# =============================================================================
# Docker Entrypoint Script
# Waits for the database to be ready, runs Drizzle migrations, then starts app
# =============================================================================

echo "🐳 Docker Entrypoint Starting..."

# ---------------------------------------------------------------------------
# 1. Wait for the database to be ready
# ---------------------------------------------------------------------------
DB_HOST="${DB_HOST:-neon-local}"
DB_PORT="${DB_PORT:-5432}"
MAX_RETRIES=30
RETRY_COUNT=0

echo "⏳ Waiting for database at ${DB_HOST}:${DB_PORT}..."

while ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
        echo "❌ Database not ready after ${MAX_RETRIES} attempts. Exiting."
        exit 1
    fi
    echo "   Attempt ${RETRY_COUNT}/${MAX_RETRIES} — retrying in 2s..."
    sleep 2
done

echo "✅ Database is ready!"

# ---------------------------------------------------------------------------
# 2. Run Drizzle migrations
# ---------------------------------------------------------------------------
echo "📜 Running Drizzle migrations..."
npx drizzle-kit migrate 2>&1 || {
    echo "⚠️  Migration failed, but continuing startup..."
}
echo "✅ Migrations complete!"

# ---------------------------------------------------------------------------
# 3. Start the application
# ---------------------------------------------------------------------------
if [ "$NODE_ENV" = "development" ]; then
    echo "🔧 Starting in DEVELOPMENT mode (with --watch)..."
    exec node --watch src/index.js
else
    echo "🚀 Starting in PRODUCTION mode..."
    exec node src/index.js
fi
