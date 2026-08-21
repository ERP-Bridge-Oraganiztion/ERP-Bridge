# ERP Bridge
## Database Schema Specification

**Database System:** MySQL 8
**ORM:** Prisma 5
**Schema Version:** 2.0.0 (Next.js backend)
**Status:** Production Ready

---

# 1. Architectural Guidelines

1. **Prisma as the single source of truth.** The schema below is a copy of
   [`backend-nextjs/prisma/schema.prisma`](../../backend-nextjs/prisma/schema.prisma) —
   that file is authoritative; if the two ever disagree, the `.prisma` file
   is correct and this doc is stale. Run `npm run db:push` in
   `backend-nextjs/` to apply it to your database.
2. **Auditability.** Every table has `createdAt`; most also have
   `updatedAt` maintained automatically by Prisma.
3. **Performance indexing.** Foreign keys and common filter columns
   (`projectId`, `status`, `jobId`) are indexed.
4. **Credential encryption.** `ConnectorConfig.encryptedPassword` is
   AES-256-GCM encrypted (see `backend-nextjs/lib/crypto.js`) — plaintext
   passwords are never stored.
5. **Stateless-hosting adaptation.** Because the backend can run on
   Vercel (no persistent local disk between requests), data that used to
   live in local files now lives in MySQL text columns instead:
   `ConnectorConfig.sourceData`, `MigrationJob.udmData`, and
   `ExportedFile.fileData`. This is the main structural difference from
   the schema used by the retired Spring Boot backend.

---

# 2. Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider     = "mysql"
  url          = env("DATABASE_URL")
  relationMode = "prisma"
}

enum UserRole {
  ADMIN
  PROJECT_MANAGER
  CONSULTANT
  VIEWER
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

enum ConnectorType {
  CSV
  EXCEL
  ODOO
  ERPNEXT
  ORACLE_SQL
  MS_SQL_SERVER
  MYSQL_POSTGRES
  MYSQL
  POSTGRES
}

enum ProjectStatus {
  CREATED
  ACTIVE
  COMPLETED
  ARCHIVED
  FAILED
}

enum JobStatus {
  PENDING
  RUNNING
  COMPLETED
  STOPPED
  FAILED
}

enum ValidationSeverity {
  WARNING
  ERROR
  CRITICAL
}

model User {
  id           Int        @id @default(autoincrement())
  name         String
  email        String     @unique
  passwordHash String
  role         UserRole   @default(VIEWER)
  status       UserStatus @default(ACTIVE)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  projects      Project[]      @relation("ProjectCreator")
  migrationJobs MigrationJob[]
  auditLogs     AuditLog[]

  @@map("users")
}

model Project {
  id          Int           @id @default(autoincrement())
  name        String
  description String?       @db.Text
  sourceErp   ConnectorType
  targetErp   String        @default("SAP_S4HANA")
  status      ProjectStatus @default(CREATED)
  createdById Int
  createdBy   User          @relation("ProjectCreator", fields: [createdById], references: [id])
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  connectorConfig ConnectorConfig?
  sourceMetadata  SourceMetadata[]
  mappingRules    MappingRule[]
  migrationJobs   MigrationJob[]

  @@index([createdById])
  @@index([status])
  @@map("projects")
}

model ConnectorConfig {
  id                Int           @id @default(autoincrement())
  projectId         Int           @unique
  project           Project       @relation(fields: [projectId], references: [id])
  connectorType     ConnectorType
  host              String?
  port              Int?
  databaseName      String?
  username          String?
  encryptedPassword String        @db.Text
  sourceFileName    String?
  // Staged source data lives in the DB instead of local disk so it survives
  // Vercel's stateless/ephemeral filesystem across serverless invocations.
  sourceData        String?       @db.LongText
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@map("connector_configs")
}

model SourceMetadata {
  id           Int      @id @default(autoincrement())
  projectId    Int
  project      Project  @relation(fields: [projectId], references: [id])
  tableName    String
  columnName   String
  dataType     String
  nullable     Boolean  @default(true)
  isPrimaryKey Boolean  @default(false)
  createdAt    DateTime @default(now())

  @@unique([projectId, tableName, columnName])
  @@index([projectId])
  @@map("source_metadata")
}

model MappingRule {
  id                        Int      @id @default(autoincrement())
  projectId                 Int
  project                   Project  @relation(fields: [projectId], references: [id])
  sourceTable               String
  sourceField               String
  targetTable               String
  targetField               String
  dataType                  String
  required                  Boolean  @default(false)
  customTransformationLogic String?  @db.Text
  createdAt                 DateTime @default(now())
  updatedAt                 DateTime @updatedAt

  @@unique([projectId, sourceTable, sourceField, targetTable, targetField])
  @@index([projectId])
  @@map("mapping_rules")
}

model MigrationJob {
  id              Int       @id @default(autoincrement())
  projectId       Int
  project         Project   @relation(fields: [projectId], references: [id])
  status          JobStatus @default(PENDING)
  jobType         String    @default("MIGRATION")
  startedAt       DateTime?
  completedAt     DateTime?
  totalRecords    Int       @default(0)
  successRecords  Int       @default(0)
  failedRecords   Int       @default(0)
  executionTimeMs Int       @default(0)
  triggeredById   Int?
  triggeredBy     User?     @relation(fields: [triggeredById], references: [id])
  createdAt       DateTime  @default(now())
  // Transformed UDM staging output (replaces the local "udm_job_{id}.csv" file).
  udmData         String?   @db.LongText

  logs         MigrationLog[]
  errors       ValidationError[]
  exportedFile ExportedFile?

  @@index([projectId])
  @@map("migration_jobs")
}

model MigrationLog {
  id         Int          @id @default(autoincrement())
  jobId      Int
  job        MigrationJob @relation(fields: [jobId], references: [id])
  recordType String
  status     JobStatus
  message    String       @db.Text
  createdAt  DateTime     @default(now())

  @@index([jobId])
  @@map("migration_logs")
}

model ValidationError {
  id          Int                @id @default(autoincrement())
  jobId       Int
  job         MigrationJob       @relation(fields: [jobId], references: [id])
  tableName   String
  recordId    String?
  fieldName   String
  severity    ValidationSeverity @default(ERROR)
  errorType   String
  description String             @db.Text
  createdAt   DateTime           @default(now())

  @@index([jobId])
  @@index([jobId, severity])
  @@map("validation_errors")
}

model ExportedFile {
  id            Int          @id @default(autoincrement())
  jobId         Int          @unique
  job           MigrationJob @relation(fields: [jobId], references: [id])
  fileName      String
  fileType      String       @default("CSV")
  fileSizeBytes Int
  downloadUrl   String
  // Exported bundle content (replaces the local "exports/" file). Text formats
  // (CSV/JSON) are stored as UTF-8 text; XLSX is stored as base64.
  fileData      String       @db.LongText
  expiresAt     DateTime?
  createdAt     DateTime     @default(now())

  @@map("exported_files")
}

model AuditLog {
  id        Int      @id @default(autoincrement())
  userId    Int?
  user      User?    @relation(fields: [userId], references: [id])
  action    String
  module    String
  ipAddress String
  createdAt DateTime @default(now())

  @@index([userId])
  @@map("audit_logs")
}
```

---

# 3. Applying the schema

```bash
cd backend-nextjs
cp .env.example .env      # fill in DATABASE_URL first
npm install
npm run db:push           # creates all tables from schema.prisma
npm run db:seed           # creates the two demo users
```

`db:push` is safe to re-run — it only adds what's missing, it won't drop
data. For a true migration history (recommended once you have real data to
protect), switch to `npx prisma migrate dev` instead.
