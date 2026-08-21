# ERP Bridge Backend

Next.js 14 App Router API for ERP Bridge. The active runtime is Node.js with Prisma and MySQL; the earlier Java/Spring implementation is not part of this repository's runtime.

## Responsibilities

- Organization-aware JWT authentication
- Admin-only organization member creation, password reset, and deletion
- Project and connector configuration
- File parsing and schema discovery
- MySQL/PostgreSQL live ingestion
- AI-assisted mapping through OpenRouter
- Validation, migration, and SAP-ready exports

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

The API runs on `http://localhost:8080`.

## Environment

- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: JWT signing secret
- `CONNECTOR_ENCRYPTION_KEY`: encryption key for source credentials
- `GEMINI_API_KEY`: optional OpenRouter key for AI Auto Map
- `FRONTEND_ORIGIN`: allowed frontend origin for CORS

## Docker

The root `docker-compose.yml` starts MySQL and the production backend. The
container applies the Prisma schema and seeds the default organization on startup.

```bash
docker compose up --build -d
```

## Important Runtime Notes

- Uploaded source data and generated exports are stored in MySQL, not local disk.
- Migration execution is synchronous in the current Next.js implementation.
- File uploads are limited to 50MB in the application route.
- Vercel request-body and function-duration limits may require object storage or a worker for large production migrations.

## Demo Organization

Seeded organization: `ERP Bridge`

- Admin: `admin@erpbridge.com`
- Project manager: `pm@erpbridge.com`
- Password: `Password123`

Change demo credentials outside local development.
