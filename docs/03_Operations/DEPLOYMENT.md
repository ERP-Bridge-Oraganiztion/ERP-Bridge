# ERP Bridge
## Deployment Guide

Version: 2.0 (Next.js backend)

---

# 1. Architectural Topology Overview

ERP Bridge has two deployable pieces:

- **Frontend** — a static Vite/React build (`frontend/`). Deployable to
  any static host (Vercel, Netlify, Nginx, S3+CloudFront).
- **Backend** — a Next.js API (`backend-nextjs/`), backed by MySQL via
  Prisma. Deployable either as a long-running Docker container, or as
  stateless Vercel serverless functions.

Two supported deployment modes:

| Mode | Frontend | Backend | Database |
| :--- | :--- | :--- | :--- |
| **Docker Compose (self-hosted)** | `npm run dev`/static build served separately | Long-running Node container | MySQL container |
| **Vercel (serverless)** | Vercel static site | Vercel serverless functions | Any managed MySQL (PlanetScale, Railway, etc.) |

Pick Docker Compose for on-prem/VPC deployments where data can't leave your
network. Pick Vercel for the fastest path to a public URL with no server to
manage.

---

# 2. Docker Compose Deployment (self-hosted)

## 2.1 `docker-compose.yml` (repo root)

The root `docker-compose.yml` runs MySQL and the backend. The frontend is
run separately (`npm run dev` for local use, or built and served by any
static host/Nginx for production).

```yaml
services:
  mysql:
    image: mysql:8.4
    environment:
      MYSQL_DATABASE: ${DB_NAME:-erp_bridge}
      MYSQL_USER: ${DB_USERNAME:-erp_bridge_user}
      MYSQL_PASSWORD: ${DB_PASSWORD:-change_me}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD:-change_me_root}
    ports:
      - "3306:3306"
    volumes:
      - erp_bridge_mysql_data:/var/lib/mysql

  backend:
    build:
      context: ./backend-nextjs
    depends_on:
      - mysql
    environment:
      DATABASE_URL: mysql://${DB_USERNAME:-erp_bridge_user}:${DB_PASSWORD:-change_me}@mysql:3306/${DB_NAME:-erp_bridge}
      JWT_SECRET: ${JWT_SECRET}
      CONNECTOR_ENCRYPTION_KEY: ${CONNECTOR_ENCRYPTION_KEY}
      GEMINI_API_KEY: ${GEMINI_API_KEY:-}
      FRONTEND_ORIGIN: ${FRONTEND_ORIGIN:-*}
    ports:
      - "8080:8080"

volumes:
  erp_bridge_mysql_data:
```

(The real file also has healthchecks and default values — see the actual
`docker-compose.yml` in the repo root; this is the shape, not a literal
copy.)

## 2.2 Backend Dockerfile (`backend-nextjs/Dockerfile`)

Multi-stage build: installs deps and runs `next build` in a build stage,
then copies only `node_modules`, `.next`, and `prisma` into a slim runtime
image. On container start it runs `prisma db push` (creates tables if
missing — safe to re-run), seeds the two demo users, then starts the
server on port 8080.

## 2.3 Frontend (production)

For a real deployment, build the static frontend and serve it with any
static file server or CDN:

```bash
cd frontend
npm install
npm run build      # outputs to frontend/dist
```

Serve `frontend/dist` with Nginx, Caddy, or any static host, with
`VITE_API_BASE_URL` (baked in at build time) pointing at your backend's
public URL.

## 2.4 Commands

```bash
cp .env.example .env      # fill in real secrets before deploying
docker compose up --build -d
```

---

# 3. Vercel Deployment (serverless)

This is the deployment mode `backend-nextjs/` was specifically designed
for. Full details, including known platform limits, are in
[`backend-nextjs/README.md`](../../backend-nextjs/README.md) — summary:

1. **Provision MySQL** — any MySQL-compatible host (PlanetScale, Railway,
   plain MySQL on a VM). Copy the connection string.
2. **Import `backend-nextjs/` as a Vercel project** (root directory =
   `backend-nextjs`). Set env vars: `DATABASE_URL`, `JWT_SECRET`,
   `CONNECTOR_ENCRYPTION_KEY`, `GEMINI_API_KEY` (optional),
   `FRONTEND_ORIGIN` (the frontend's deployed URL, or `*` while testing).
3. **Import `frontend/` as a second Vercel project** (root directory =
   `frontend`). Set `VITE_API_BASE_URL` to
   `https://<backend-project>.vercel.app/api/v1`.
4. **Push the schema** once, from your machine: `cd backend-nextjs && npm run db:push && npm run db:seed`.

### Known limits on Vercel

- **Function execution time:** Hobby plan caps functions at 10s;
  `vercel.json` requests 60s for the heavier routes (migration, validation,
  export) but that only takes effect on the **Pro** plan or higher.
- **Request body size:** Vercel caps serverless function request bodies
  at 4.5MB regardless of plan — large CSV uploads (>~4MB) will need to be
  split, or the upload flow switched to direct-to-blob-storage uploads.

---

# 4. CI/CD

A minimal GitHub Actions workflow for the backend should, on every push to
`main`:

1. `npm install` in `backend-nextjs/`
2. `npx prisma generate`
3. `npm run build` (fails the build on any Next.js/type error)
4. Deploy — either `vercel deploy --prod` (Vercel mode) or build+push the
   Docker image and redeploy the container (self-hosted mode).

Adapt `.github/workflows/` in this repo to your chosen path; the exact
workflow depends on which of the two deployment modes above you use.
