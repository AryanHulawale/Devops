# 🚀 DevOps Implementation — Production-Ready Express.js API

A full-stack backend API built with **Express.js**, demonstrating real-world DevOps practices including **Docker containerization**, **multi-stage builds**, **database migrations**, **structured logging**, **application security**, **code quality tooling**, and **automated testing**.

> **Built as a learning project** to understand how modern backend applications are structured, secured, containerized, and shipped to production.

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Docker & Containerization](#-docker--containerization)
- [Database — Neon & Drizzle ORM](#-database--neon--drizzle-orm)
- [Security](#-security)
- [Logging — Winston & Morgan](#-logging--winston--morgan)
- [Code Quality — ESLint & Prettier](#-code-quality--eslint--prettier)
- [Testing — Jest & Supertest](#-testing--jest--supertest)
- [API Reference](#-api-reference)
- [Shell Scripts](#-shell-scripts)
- [Environment Variables](#-environment-variables)
- [Key Learnings](#-key-learnings)

---

## 🛠 Tech Stack

| Category | Technology | Purpose |
|---|---|---|
| **Runtime** | Node.js 22 | JavaScript runtime |
| **Framework** | Express.js 5 | HTTP server & routing |
| **Database** | Neon (Serverless PostgreSQL) | Cloud-native Postgres |
| **ORM** | Drizzle ORM | Type-safe SQL queries & migrations |
| **Auth** | JWT + bcrypt | Stateless authentication & password hashing |
| **Security** | Helmet, Arcjet, CORS | HTTP hardening, bot detection, rate limiting |
| **Logging** | Winston + Morgan | Structured logs (file + console) and HTTP request logging |
| **Validation** | Zod | Runtime schema validation |
| **Containerization** | Docker + Docker Compose | Multi-stage builds, dev & prod environments |
| **Code Quality** | ESLint + Prettier | Linting & formatting |
| **Testing** | Jest + Supertest | Unit & integration tests with coverage |

---

## 📁 Project Structure

```
devops-implementation/
├── src/
│   ├── index.js                 # Entry point
│   ├── server.js                # Server bootstrap (listen on PORT)
│   ├── app.js                   # Express app setup & middleware chain
│   ├── config/
│   │   ├── database.js          # Neon + Drizzle DB connection
│   │   ├── logger.js            # Winston logger configuration
│   │   └── arcjet.js            # Arcjet security rules
│   ├── controllers/
│   │   ├── auth.controller.js   # Sign-up, Sign-in, Sign-out
│   │   └── users.controller.js  # CRUD operations for users
│   ├── services/
│   │   ├── auth.service.js      # Auth business logic (hash, compare, create, authenticate)
│   │   └── users.service.js     # User CRUD business logic
│   ├── middlewares/
│   │   ├── security.middleware.js  # Arcjet: rate limiting, bot detection, shield
│   │   └── auth.middleware.js      # JWT verification from cookies
│   ├── models/
│   │   └── user.model.js        # Drizzle schema definition
│   ├── routes/
│   │   ├── auth.routes.js       # POST /api/auth/sign-up, sign-in, sign-out
│   │   └── users.routes.js      # GET/PUT/DELETE /api/users (protected)
│   ├── validations/
│   │   ├── auth.validations.js  # Zod schemas for auth
│   │   └── users.validation.js  # Zod schemas for user CRUD
│   └── utils/
│       ├── jwt.js               # JWT sign & verify helpers
│       ├── cookies.js           # Secure cookie helpers
│       └── format.js            # Validation error formatter
├── drizzle/                     # SQL migration files (auto-generated)
├── scripts/
│   ├── dev.sh                   # Development startup script
│   ├── prod.sh                  # Production deployment script
│   ├── docker-entrypoint.sh     # Container entrypoint (wait DB → migrate → start)
│   └── healthcheck.sh           # Docker HEALTHCHECK probe
├── tests/
│   ├── app.test.js              # API integration tests
│   └── __mocks__/
│       └── arcjet.js            # Arcjet mock for Jest (WASM workaround)
├── Dockerfile                   # Multi-stage production image
├── docker-compose.dev.yml       # Dev: app + Neon Local proxy
├── docker-compose.prod.yml      # Prod: app only (Neon Cloud)
├── jest.config.mjs              # Jest configuration
├── eslint.config.js             # ESLint flat config
├── .prettierrc                  # Prettier formatting rules
├── drizzle.config.js            # Drizzle Kit configuration
├── .dockerignore                # Files excluded from Docker build context
└── .env.example                 # Environment variable template
```

---

## 🏁 Getting Started

### Prerequisites

- **Node.js** ≥ 22
- **Docker Desktop** (for containerized development)
- A **[Neon](https://neon.tech)** account (free tier works)
- An **[Arcjet](https://arcjet.com)** account (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/AryanHulawale/Devops.git
cd Devops
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.development
```

Fill in your credentials:

```env
DATABASE_URL=postgres://user:pass@ep-xxxx.region.aws.neon.tech/neondb?sslmode=require
NEON_API_KEY=napi_xxxxxxxx
NEON_PROJECT_ID=your-project-id
PARENT_BRANCH_ID=br-xxxx
JWT_SECRET=your-secret-key
ARCJET_KEY=ajkey_xxxx
```

### 3. Run Locally (without Docker)

```bash
npm run dev          # Starts with --watch for hot reload
```

### 4. Run with Docker

```bash
npm run dev:docker   # Development (with Neon Local proxy)
npm run prod:docker  # Production (with Neon Cloud)
```

---

## 🐳 Docker & Containerization

### What I Learned

Docker packages the application and all its dependencies into an **isolated, reproducible container** — so it runs the same way on every machine, every time.

### Multi-Stage Dockerfile

The Dockerfile uses **3 stages** to minimize the final image size:

```
┌─────────────────────┐
│  Stage 1: deps       │  npm ci --omit=dev → production-only node_modules
├─────────────────────┤
│  Stage 2: build      │  npm ci (all deps) → copies src, drizzle, config
├─────────────────────┤
│  Stage 3: production │  Alpine Linux + only what's needed to run
└─────────────────────┘
```

**Key techniques:**
- **Layer caching** — `COPY package*.json` before `COPY src/` so dependency installs are cached unless `package.json` changes
- **Non-root user** — `USER node` for security; the container doesn't run as root
- **Health checks** — `HEALTHCHECK` instruction polls `/health` every 30s so Docker knows if the app is alive
- **`.dockerignore`** — Excludes `node_modules`, `.env`, `.git`, logs from the build context to keep builds fast and secure

### Docker Compose

Two compose files for different environments:

| File | Services | Database | Use Case |
|---|---|---|---|
| `docker-compose.dev.yml` | `app` + `neon-local` | Neon Local proxy (ephemeral branch) | Local development with hot reload |
| `docker-compose.prod.yml` | `app` only | Neon Cloud (direct connection) | Production deployment |

**Dev features:**
- Bind mounts (`./src:/app/src:ro`) for live code reload with `node --watch`
- `depends_on` with `service_healthy` to wait for the database
- Isolated `dev-network` bridge network

**Prod features:**
- Resource limits (512MB RAM, 1 CPU)
- `restart: unless-stopped` for auto-recovery
- Detached mode (`-d`) for background running

### Docker Entrypoint Script

The `docker-entrypoint.sh` handles the container startup sequence:

```
1. Check NEON_LOCAL env var
   ├── true  → Wait for DB on port 5432 (dev with local proxy)
   └── false → Skip wait (prod uses Neon Cloud over HTTP)
2. Run Drizzle migrations
3. Start the app (--watch in dev, plain node in prod)
```

---

## 🗄 Database — Neon & Drizzle ORM

### What I Learned

**[Neon](https://neon.tech)** is a serverless PostgreSQL provider — the database scales to zero when idle and branches like Git for development.

**[Drizzle ORM](https://orm.drizzle.team)** is a lightweight, type-safe SQL ORM for Node.js — it generates SQL migrations from your schema definitions.

### Schema Definition (Drizzle)

```javascript
// src/models/user.model.js
export const users = pgTable('users', {
  id:         serial('id').primaryKey(),
  name:       varchar('name', { length: 255 }).notNull(),
  email:      varchar('email', { length: 255 }).notNull().unique(),
  password:   varchar('password', { length: 255 }).notNull(),
  role:       varchar('role', { length: 50 }).notNull().default('user'),
  created_at: timestamp().defaultNow().notNull(),
  updated_at: timestamp().defaultNow().notNull(),
});
```

### Migration Workflow

```bash
npm run db:generate   # Generate SQL from schema changes
npm run db:migrate    # Apply migrations to the database
npm run db:studio     # Open Drizzle Studio (visual DB browser)
```

Migrations are stored in `drizzle/` as versioned `.sql` files.

### Database Connection

```javascript
// Neon Local (dev): HTTP-based connection through local proxy
if (process.env.NEON_LOCAL === 'true') {
  neonConfig.fetchEndpoint = `http://${dbHost}:5432/sql`;
  neonConfig.useSecureWebSocket = false;
}

// Neon Cloud (prod): Secure serverless connection
const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);
```

---

## 🔒 Security

### What I Learned

Security is **layered** — no single tool solves everything. This project uses multiple layers:

### 1. Helmet — HTTP Security Headers

```javascript
app.use(helmet());
```

Helmet sets secure HTTP headers automatically:
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `X-Frame-Options: DENY` — prevents clickjacking
- `Strict-Transport-Security` — enforces HTTPS
- `Content-Security-Policy` — controls resource loading
- Removes `X-Powered-By` header (hides Express)

### 2. Arcjet — Bot Detection, Rate Limiting & Shield

```javascript
const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({ mode: "LIVE" }),                    // WAF-like protection
    detectBot({
      mode: "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW", "CATEGORY:TOOL"],
    }),
  ],
});
```

**Security middleware** applies role-based rate limiting:

| Role | Rate Limit |
|---|---|
| Admin | 20 req/min |
| User | 10 req/min |
| Guest | 5 req/min |

> **Lesson learned:** The `/health` endpoint must be placed **before** the security middleware — otherwise Docker's healthcheck (`wget`) gets blocked as a "bot" and the container is marked unhealthy.

### 3. CORS — Cross-Origin Resource Sharing

```javascript
app.use(cors());
```

Controls which domains can make requests to the API.

### 4. JWT Authentication

- Tokens are signed with `jsonwebtoken` and stored in **HTTP-only, secure cookies**
- Cookies use `sameSite: 'strict'` and `httpOnly: true` to prevent XSS and CSRF
- Auth middleware verifies the token and attaches `req.user` for downstream handlers

### 5. Password Hashing — bcrypt

```javascript
const hash = await bcrypt.hash(password, 10);  // 10 salt rounds
const isValid = await bcrypt.compare(password, hash);
```

Passwords are **never stored in plaintext** — bcrypt adds a random salt and hashes with a configurable cost factor.

### 6. Input Validation — Zod

Every request body is validated with Zod schemas before touching the database:

```javascript
const signupSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  email: z.email().max(255).toLowerCase().trim(),
  password: z.string().min(6).max(128),
  role: z.enum(['user', 'admin']).default('user'),
});
```

---

## 📝 Logging — Winston & Morgan

### What I Learned

Good logging is **essential** for debugging production issues. Two loggers serve different purposes:

### Winston — Application Logger

```javascript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

- **Structured JSON format** — machine-parseable for log aggregation tools
- **Multiple transports** — errors go to `error.log`, everything goes to `combined.log`
- **Console output in dev** — colorized, human-readable format
- **Log levels** — `error`, `warn`, `info`, `debug` (configurable via `LOG_LEVEL`)

### Morgan — HTTP Request Logger

```javascript
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));
```

Morgan logs every HTTP request (method, URL, status, response time) and **pipes the output into Winston** so all logs go through one system.

**Example log output:**
```json
{
  "level": "info",
  "message": "::1 - - [22/Jul/2026:15:34:28 +0000] \"GET /health HTTP/1.1\" 200 76",
  "service": "acquisitions-api",
  "timestamp": "2026-07-22T15:34:28.078Z"
}
```

---

## ✨ Code Quality — ESLint & Prettier

### What I Learned

**ESLint** catches bugs and enforces coding standards. **Prettier** handles formatting. Together, they keep code consistent across the team.

### ESLint (Flat Config)

```javascript
// eslint.config.js — key rules
{
  'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  'prefer-const': 'error',
  'no-var': 'error',
  'object-shorthand': 'error',
  'prefer-arrow-callback': 'error',
  semi: ['error', 'always'],
  quotes: ['error', 'single'],
  indent: ['error', 2, { SwitchCase: 1 }],
}
```

- Uses the **flat config format** (`eslint.config.js`) — the modern ESLint standard
- Separate config block for `tests/` files to allow Jest globals (`describe`, `it`, `expect`)
- Ignores `node_modules`, `coverage`, `logs`, `drizzle`

### Prettier

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 80,
  "tabWidth": 2,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### Commands

```bash
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
npm run format        # Format all files with Prettier
npm run format:check  # Check if files are formatted
```

---

## 🧪 Testing — Jest & Supertest

### What I Learned

**Jest** is the test runner with built-in assertions and coverage. **Supertest** makes HTTP requests to the Express app without starting a real server.

### Test Structure

```javascript
// tests/app.test.js
import app from "../src/app.js";
import request from 'supertest';

describe('GET /health', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health').expect(200);
    expect(response.body).toHaveProperty('status', 'OK');
  });
});
```

### Arcjet WASM Mock

Arcjet uses WASM modules internally which Jest can't resolve. The fix is a **module name mapper** in `jest.config.mjs`:

```javascript
moduleNameMapper: {
  "^@arcjet/node$": "<rootDir>/tests/__mocks__/arcjet.js",
}
```

The mock (`tests/__mocks__/arcjet.js`) provides a no-op implementation where all requests are allowed.

### Running Tests

```bash
npm run test          # Run tests with coverage
```

**Coverage output:**
```
-------------------------|---------|----------|---------|---------|
File                     | % Stmts | % Branch | % Funcs | % Lines |
-------------------------|---------|----------|---------|---------|
 src/app.js              |   93.75 |      100 |     100 |   93.75 |
 src/config/arcjet.js    |     100 |      100 |     100 |     100 |
 src/models/user.model   |     100 |      100 |     100 |     100 |
 ...                     |         |          |         |         |
-------------------------|---------|----------|---------|---------|
```

---

## 📡 API Reference

### Auth Routes (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/sign-up` | ❌ | Register a new user |
| `POST` | `/api/auth/sign-in` | ❌ | Login and receive JWT cookie |
| `POST` | `/api/auth/sign-out` | ❌ | Clear JWT cookie |

### User Routes (`/api/users`) — Protected

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/users` | ✅ | Get all users |
| `GET` | `/api/users/:id` | ✅ | Get user by ID |
| `PUT` | `/api/users/:id` | ✅ | Update user (own info; admin can change roles) |
| `DELETE` | `/api/users/:id` | ✅ | Delete user (own account; admin can delete any) |

### Other Routes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check (used by Docker) |
| `GET` | `/api` | API status message |

---

## 📜 Shell Scripts

| Script | Command | Purpose |
|---|---|---|
| `scripts/dev.sh` | `npm run dev:docker` | Validates env, starts Docker Compose dev environment |
| `scripts/prod.sh` | `npm run prod:docker` | Validates env, starts Docker Compose prod environment |
| `scripts/docker-entrypoint.sh` | Auto (container start) | Waits for DB (dev only) → runs migrations → starts app |
| `scripts/healthcheck.sh` | Auto (Docker HEALTHCHECK) | Probes `/health` endpoint with wget |

---

## 🔐 Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `3000`) |
| `NODE_ENV` | No | `development` or `production` |
| `LOG_LEVEL` | No | Winston log level (default: `info`) |
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `NEON_LOCAL` | No | `true` for local proxy, `false` for cloud |
| `NEON_API_KEY` | Dev only | Neon API key for local proxy |
| `NEON_PROJECT_ID` | Dev only | Neon project ID for branch creation |
| `PARENT_BRANCH_ID` | Dev only | Branch to fork from in local dev |
| `JWT_SECRET` | ✅ | Secret key for JWT signing |
| `ARCJET_KEY` | ✅ | Arcjet API key for security rules |
| `ARCJET_ENV` | No | `development` or `production` |

---

## 💡 Key Learnings

### Docker
- **Multi-stage builds** dramatically reduce image size by separating build dependencies from runtime
- **Layer caching** — ordering `COPY` instructions strategically avoids reinstalling dependencies on every code change
- **Non-root containers** (`USER node`) are a security best practice
- **Health checks** let Docker auto-restart unhealthy containers
- **`.dockerignore`** keeps secrets and unnecessary files out of the image

### Database
- **Neon Local** provides ephemeral database branches for development — each `docker compose up` gets a fresh, isolated branch
- **Drizzle migrations** should run inside the container (not on the host) to ensure they target the correct database
- The Neon serverless driver uses **HTTP**, not TCP — production containers shouldn't wait on port 5432

### Security
- Security is **layered**: Helmet (headers) → Arcjet (bot/rate/shield) → JWT (auth) → Zod (validation) → bcrypt (passwords)
- Health endpoints must bypass security middleware or Docker marks the container as unhealthy
- Rate limiting should be **role-based**, not one-size-fits-all
- API testing tools (Postman, curl) need to be **allowlisted** in bot detection (`CATEGORY:TOOL`)

### Logging
- **Structured JSON logs** are essential for production debugging and log aggregation
- **Morgan + Winston** integration pipes HTTP request logs through a single logging system
- Separate log files for errors vs. all events speeds up debugging

### Code Quality
- **ESLint flat config** is the modern standard — cleaner than `.eslintrc` files
- **Prettier + ESLint** together eliminate formatting debates; `eslint-config-prettier` prevents conflicts
- Running lint/format in CI ensures consistency across the team

### Testing
- **Supertest** tests Express routes without starting a real HTTP server
- External services with WASM (like Arcjet) need **mocks** in the test environment
- Jest's `moduleNameMapper` redirects imports to mock implementations

---

## 📄 License

ISC

---

**Built by [Aryan Hulawale](https://github.com/AryanHulawale)** as a DevOps learning project.
