# 🐳 Docker Setup — DevOps Implementation

This document explains **every change** made to dockerize this application, written in simple words so anyone can follow along.

---

## 📌 What Was Done (Summary of All Changes)

We added Docker support so the app can run in **two modes**:

1. **Development** — Uses a local Neon database proxy (no need to touch your real database)
2. **Production** — Connects directly to your real Neon cloud database

Here's a list of every file that was created or changed:

---

## 🆕 New Files Created

### 1. `Dockerfile`

**What it is:** A recipe that tells Docker how to build your app into a container image.

**What it does:**
- Uses Node.js 22 on Alpine Linux (a tiny, secure Linux version)
- Installs only the packages your app needs (keeps the image small)
- Copies your source code and database migration files into the image
- Runs the app as a non-root user (more secure — if someone hacks the container, they don't get admin access)
- Has a built-in health check that pings `http://localhost:3000/health` every 30 seconds to make sure the app is alive
- Uses a **multi-stage build** (3 stages) to keep the final image as small as possible:
  - Stage 1: Install production dependencies
  - Stage 2: Copy source code
  - Stage 3: Combine everything into a minimal final image

---

### 2. `docker-compose.dev.yml`

**What it is:** A file that tells Docker to run **two containers together** for local development.

**What it does:**
- Starts a **Neon Local proxy** container (`neon-local`) — this creates a temporary copy (called an "ephemeral branch") of your real database. You can break things here without worrying.
- Starts your **app** container — connects to the Neon Local proxy instead of your real database
- The app waits for the proxy to be ready before starting
- Your source code is mounted as a volume, so changes you make on your machine are reflected inside the container instantly
- When you run `docker compose down`, the temporary database branch is **automatically deleted**

**The two services:**

| Service | What it does |
|---------|-------------|
| `neon-local` | Neon's local proxy — creates a throwaway copy of your database |
| `app` | Your Express.js API — talks to `neon-local` instead of the real DB |

---

### 3. `docker-compose.prod.yml`

**What it is:** A file that runs **only your app** for production.

**What it does:**
- Runs just the app container — **no Neon Local proxy** (you don't need a proxy in production)
- The app connects directly to your real Neon cloud database using the `DATABASE_URL` from `.env.production`
- Has memory and CPU limits set (512MB RAM, 1 CPU) so the container can't hog all server resources
- Auto-restarts if it crashes (`restart: unless-stopped`)

---

### 4. `.env.development`

**What it is:** Environment variables for local development.

**What it does:**
- Sets `DATABASE_URL` to point to the Neon Local proxy (`neon-local:5432`) instead of the real cloud database
- Sets `NEON_LOCAL=true` — this tells the app to use special settings for the local proxy
- Contains placeholders for your Neon API key, project ID, and parent branch ID (you fill these in)
- Uses a dummy JWT secret (safe for local dev, never use in production)

---

### 5. `.env.production`

**What it is:** Environment variables for production deployment.

**What it does:**
- Sets `DATABASE_URL` to point to your real Neon cloud database (you replace the placeholder with your actual URL)
- Sets `NEON_LOCAL=false` — the app connects directly to Neon, no proxy
- Uses production log level (`warn` — only logs warnings and errors, not noisy debug info)
- Contains placeholders for real secrets (you fill these in before deploying)

---

### 6. `.dockerignore`

**What it is:** Like `.gitignore`, but for Docker. Tells Docker what files to **skip** when building the image.

**Why it matters:**
- Without this, Docker would copy `node_modules` (huge!), `.env` files (secrets!), and `.git` (unnecessary) into the image
- Makes your Docker builds faster and your images smaller
- Prevents accidentally baking secrets into your Docker image

---

### 7. `scripts/docker-entrypoint.sh`

**What it is:** A startup script that runs every time the container starts.

**What it does (in order):**
1. If running in dev mode (`NEON_LOCAL=true`), waits for the Neon Local proxy to be ready (retries up to 30 times)
2. Runs Drizzle database migrations (`npx drizzle-kit migrate`) — so your database tables are always up to date
3. Starts the app (`node src/index.js`)

---

### 8. `scripts/healthcheck.sh`

**What it is:** A tiny script that checks if the app is alive.

**What it does:**
- Sends a request to `http://localhost:3000/health`
- If it gets a response → the app is healthy ✅
- If it doesn't → Docker marks the container as unhealthy ❌
- Docker uses this to know when to restart the container

---

### 9. `DOCKER.md` (this file)

You're reading it! Documentation for the whole Docker setup.

---

## ✏️ Files That Were Modified

### 1. `src/config/database.js`

**What changed:** Added automatic detection for Neon Local proxy.

**Before:**
```javascript
import "dotenv/config"
import { neon, neonConfig } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql)

export {db,sql}
```

**After:**
```javascript
import "dotenv/config"
import { neon, neonConfig } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

// When NEON_LOCAL=true, configure the driver for local proxy
if (process.env.NEON_LOCAL === 'true') {
  const dbHost = process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL).hostname
    : 'neon-local';
  neonConfig.fetchEndpoint = `http://${dbHost}:5432/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql)

export {db,sql}
```

**Why:** The Neon serverless driver normally talks to Neon's cloud servers over HTTPS. But when running locally through the Neon Local proxy, it needs to use plain HTTP instead. This `if` block detects the local environment and switches the driver to HTTP mode. **In production, nothing changes** — the `if` block is skipped entirely.

---

### 2. `.gitignore`

**What changed:** Fixed a security gap and added new entries.

**Before:**
```
node_modules
.env.*
```

**After:**
```
# Dependencies
node_modules

# Environment files (contain secrets)
.env
.env.development
.env.production

# Neon Local metadata
.neon_local/

# Logs
logs/

# OS files
.DS_Store
Thumbs.db
```

**Why:** The old `.gitignore` had `.env.*` which ignores `.env.development` and `.env.production`, but it did **not** ignore the main `.env` file! That file had your real database password and JWT secret in it. Now all `.env` files are properly ignored.

---

### 3. `.env.example`

**What changed:** Added new environment variables and fixed a typo.

- Fixed `NODE_ENV=deveploment` → `NODE_ENV=development` (typo fix)
- Added `NEON_LOCAL` variable
- Added `NEON_API_KEY`, `NEON_PROJECT_ID`, `PARENT_BRANCH_ID` placeholders
- Reorganized into clear sections

---

## 🔄 How the Environment Switch Works

The key idea: **one codebase, two configurations.**

```
┌─────────────────────────────────────────────────┐
│              DEVELOPMENT                         │
│                                                  │
│  .env.development says:                          │
│    DATABASE_URL = neon-local:5432  (local proxy) │
│    NEON_LOCAL   = true                           │
│                                                  │
│  App ──▶ Neon Local Proxy ──▶ Ephemeral Branch   │
│          (Docker container)    (temporary copy)   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│              PRODUCTION                          │
│                                                  │
│  .env.production says:                           │
│    DATABASE_URL = ep-xxx.neon.tech (real cloud)  │
│    NEON_LOCAL   = false                          │
│                                                  │
│  App ──────────────────────▶ Neon Cloud Database │
│          Direct connection    (real database)     │
└─────────────────────────────────────────────────┘
```

The `NEON_LOCAL` flag is what makes the switch:
- `true` → app configures the Neon driver for local HTTP proxy
- `false` → app uses default Neon driver settings (HTTPS to cloud)

---

## 🚀 How to Start (Step by Step)

### Development

```bash
# 1. Fill in your Neon credentials in .env.development
#    (NEON_API_KEY, NEON_PROJECT_ID, PARENT_BRANCH_ID)

# 2. Start everything
docker compose -f docker-compose.dev.yml up --build

# 3. Test it
curl http://localhost:3000/health

# 4. Stop everything (ephemeral branch gets deleted automatically)
docker compose -f docker-compose.dev.yml down
```

### Production

```bash
# 1. Fill in your real credentials in .env.production
#    (DATABASE_URL, JWT_SECRET, ARCJET_KEY)

# 2. Start in background
docker compose -f docker-compose.prod.yml up --build -d

# 3. Test it
curl http://localhost:3000/health

# 4. Stop
docker compose -f docker-compose.prod.yml down
```

---

## 📁 Final Project Structure

```
devops-implementation/
├── .dockerignore              ← NEW: keeps Docker builds clean
├── .env.development           ← NEW: dev environment config
├── .env.production            ← NEW: prod environment config
├── .env.example               ← MODIFIED: updated with new variables
├── .gitignore                 ← MODIFIED: fixed security gap
├── Dockerfile                 ← NEW: multi-stage container build
├── DOCKER.md                  ← NEW: this documentation
├── docker-compose.dev.yml     ← NEW: dev setup (app + Neon Local)
├── docker-compose.prod.yml    ← NEW: prod setup (app only)
├── drizzle/                   ← existing migrations
├── drizzle.config.js          ← existing config
├── package.json               ← unchanged
├── scripts/
│   ├── docker-entrypoint.sh   ← NEW: startup script
│   └── healthcheck.sh         ← NEW: health check script
└── src/
    ├── config/
    │   ├── database.js        ← MODIFIED: Neon Local auto-detection
    │   ├── logger.js          ← unchanged
    │   └── arcjet.js          ← unchanged
    ├── app.js                 ← unchanged
    ├── server.js              ← unchanged
    └── index.js               ← unchanged
```

---

## ❓ Common Questions

**Q: What is an ephemeral branch?**
A: A temporary copy of your database. It's created when you start Docker and deleted when you stop. You can experiment freely without affecting your real data.

**Q: Do I need a Neon account for development?**
A: Yes. Neon Local is a *proxy* to your Neon cloud database — it still needs your cloud account to create branches. But all your dev work happens on throwaway branches, so your real data stays safe.

**Q: Will this change how the app works in production?**
A: No. The code change in `database.js` only activates when `NEON_LOCAL=true`. In production (`NEON_LOCAL=false`), the app behaves exactly as before.

**Q: What if port 3000 or 5432 is already in use?**
A: Change the left side of the port mapping in the compose file. For example, `"3001:3000"` maps your machine's port 3001 to the container's port 3000.

**Q: How do I see logs?**
A: Run `docker compose -f docker-compose.dev.yml logs -f app` to follow the app logs in real time.
