<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=32&pause=1000&color=2E86FF&center=true&vCenter=true&width=760&lines=ERP+Bridge;Universal+ERP+to+SAP+Migration;Upload+%E2%86%92+Map+%E2%86%92+Validate+%E2%86%92+Export;Next.js+%2B+React+%2B+Prisma" alt="ERP Bridge animated title" />

<p><strong>A practical workspace for moving ERP data into SAP-ready structures.</strong></p>

<p>
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Node.js-20-339933?style=for-the-badge&logo=node.js" alt="Node.js 20" />
  <img src="https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql" alt="MySQL 8" />
  <img src="https://img.shields.io/badge/Prisma-5-2D3748?style=for-the-badge&logo=prisma" alt="Prisma 5" />
  <img src="https://img.shields.io/badge/Docker-ready-2496ED?style=for-the-badge&logo=docker" alt="Docker" />
</p>

</div>

---

## What It Does

ERP Bridge turns source ERP data into a controlled SAP migration workflow:

```text
Source file or live database
          |
          v
Schema discovery and normalization
          |
          v
Manual or AI-assisted field mapping
          |
          v
Validation and transformation
          |
          v
Migration job and SAP-ready export
```

It is built for teams: an organization administrator can create member accounts,
members sign in to the same organization, and project work stays in the shared
workspace.

## Current Features

### Project workflow

- Create projects from `Projects -> New Project`.
- Choose `Manual Upload` or `Live Connection`.
- Keep the selected source format tied to the project.
- Discover columns and inferred data types.
- Create, edit, and delete mapping rules.
- Run validation, migration, and export steps from project tabs.

### Manual inputs

- Excel: `.xlsx`, `.xls`
- Microsoft Access: `.mdb`, `.accdb`
- CSV: `.csv`
- Text: `.txt`
- Tab-separated text: `.tsv`
- XML: `.xml`
- JSON: `.json`

The Connector tab accepts only the format selected when the project was created.
For example, a CSV project shows `Upload CSV` and accepts only `.csv` files.

### Live connections

- MySQL
- PostgreSQL
- Odoo through PostgreSQL
- ERPNext through MySQL

Connector credentials are encrypted at rest. Database ingestion is read-only in
the current workflow and supports table discovery plus row ingestion.

### AI mapping

Auto Map sends discovered source metadata to the configured OpenRouter model and
returns mapping suggestions. Existing rules are preserved and duplicate source
fields are skipped. AI output is parsed defensively before it can affect rules.

### Organization workspaces

- Organization name is required at sign-in.
- Users are isolated by organization membership.
- Admins can create team member accounts from Settings.
- Admins can view member ID, email, role, and status.
- Admins can reset a member password or delete a member account.
- Plaintext passwords are never displayed or stored.

## Architecture

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind | Authenticated migration dashboard |
| API | Next.js 14 App Router | Auth, projects, connectors, mapping, validation, export |
| Persistence | MySQL 8, Prisma 5 | Users, organizations, source data, mappings, jobs, exports, audit logs |
| Source parsing | `xlsx`, `mdb-reader`, `fast-xml-parser`, CSV parsers | Normalize supported file formats |
| Authentication | JWT, bcryptjs | Organization-aware login and role checks |
| Deployment | Docker Compose | MySQL and production Next.js backend |

## Repository Layout

```text
ERP-Bridge/
├── backend-nextjs/       # Next.js API, Prisma schema, parsers, auth, migrations
├── frontend/             # React/Vite dashboard
├── docs/                 # Product, architecture, development, operations docs
├── docker-compose.yml    # MySQL and backend services
├── .env.example          # Environment variable template
└── README.md
```

## Run Locally

### Prerequisites

- Docker Desktop
- Node.js 20+
- npm

### Start the backend and database

```powershell
Copy-Item .env.example .env
docker compose up --build -d
```

The backend runs at `http://localhost:8080`; the API base is
`http://localhost:8080/api/v1`.

### Start the frontend

```powershell
Set-Location frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

The seed creates the default organization and demo accounts:

```text
Organization: ERP Bridge
Admin:        admin@erpbridge.com
Project mgr:  pm@erpbridge.com
Password:     Password123
```

Change demo credentials before using the application outside local development.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | MySQL connection string |
| `JWT_SECRET` | Yes | JWT signing secret |
| `CONNECTOR_ENCRYPTION_KEY` | Yes | Connector credential encryption key |
| `GEMINI_API_KEY` | Optional | OpenRouter key used by AI Auto Map |
| `FRONTEND_ORIGIN` | Production | Allowed frontend origin for CORS |

Never commit `.env` or real credentials. Use `.env.example` as the shareable
configuration template.

## Quality Checks

```powershell
Set-Location frontend
npm run build

Set-Location ../backend-nextjs
npm run build
```

## Documentation

- [Product requirements](docs/00_Project/PRD.md)
- [Roadmap](docs/00_Project/ROADMAP.md)
- [System architecture](docs/01_Architecture/SYSTEM_ARCHITECTURE.md)
- [Database schema](docs/01_Architecture/DATABASE_SCHEMA.md)
- [API specification](docs/02_Development/API_SPEC.md)
- [Deployment guide](docs/03_Operations/DEPLOYMENT.md)
- [Security guide](docs/03_Operations/SECURITY.md)
- [Backend setup](backend-nextjs/README.md)
- [Frontend setup](frontend/README.md)

## Scope Notes

ERP Bridge is currently a working migration MVP. Native OAuth/API connectors for
TallyPrime, QuickBooks, Zoho Books, Dynamics 365, Sage, Oracle, and direct SAP
OData/IDoc delivery are future connector work, not claimed as live integrations.
The current SAP delivery path produces SAP-ready export bundles and includes the
existing optional push workflow.

## License

This project is released under the [MIT License](LICENSE).

<div align="center"><em>Connect the source. Clarify the mapping. Move the data.</em></div>
