# ERP Bridge Implementation Guide

## Active Stack

- Frontend: React 19, TypeScript, Vite, Tailwind CSS
- Backend: Next.js 14 App Router on Node.js 20
- Database: MySQL 8 with Prisma 5
- Authentication: JWT and bcryptjs
- Deployment: Docker Compose

## Module Boundaries

```text
frontend/
  api, hooks, store, components, pages

backend-nextjs/
  app/api/v1/       route handlers
  lib/              auth, parsing, transformation, DTOs
  prisma/           schema and seed
```

## Data Flow

1. User creates a project and chooses Manual Upload or Live Connection.
2. The selected file parser or live adapter discovers source metadata.
3. Source rows are normalized into the common CSV-backed data shape.
4. Mapping rules are created manually or suggested by AI.
5. Validation checks required fields, types, dates, email values, and duplicates.
6. Migration transforms records into the staged UDM output.
7. Export generates CSV, XLSX, or JSON output for SAP delivery.

## Supported Manual Formats

`.xlsx`, `.xls`, `.mdb`, `.accdb`, `.csv`, `.txt`, `.tsv`, `.xml`, `.json`.

## Organization Model

Each user belongs to an organization. Login requires organization name, email,
and password. Admin-only member APIs create accounts in the current organization;
member password hashes are never returned by DTOs.

## Development Checks

```powershell
Set-Location frontend
npm run build

Set-Location ../backend-nextjs
npm run build
```
