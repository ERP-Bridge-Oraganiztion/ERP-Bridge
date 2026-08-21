# ERP Bridge
## Coding Standards

Version: 1.0

Status: Official

---

# Purpose

This document defines the coding standards for ERP Bridge to ensure
that the codebase remains clean, maintainable, scalable, and
consistent across all contributors.

---

# General Principles

Every contributor must follow:

- SOLID Principles
- DRY (Don't Repeat Yourself)
- KISS (Keep It Simple, Stupid)
- Clean Code
- Clean Architecture
- Separation of Concerns
- High Readability

---

# Project Structure

backend/
frontend/
database/
docker/
docs/
scripts/

Do not place unrelated files outside their designated folders.

---

# JavaScript Standards

Node.js Version

Node.js 20

Naming Convention

Class Names

PascalCase

Example

MigrationService

ConnectorManager

SAPExportController

Method Names

camelCase

Example

createProject()

validateData()

exportToSAP()

Variable Names

camelCase

Example

projectId

customerName

migrationStatus

Constants

UPPER_SNAKE_CASE

Example

MAX_FILE_SIZE

DEFAULT_PAGE_SIZE

JWT_EXPIRATION

Packages

lowercase

Example

controller

service

repository

security

connector

validation

---

# Next.js API Standards

Route Handlers (`app/api/v1/**/route.js`)

Only handle HTTP request/response parsing and calling `lib/` helpers.

Business logic must never exist inside a route handler beyond orchestration.

Route handlers call `lib/` helper functions.

`lib/` helper functions call Prisma (the database).

---

# Response Shape Rules

Never expose Prisma model objects directly from a route handler.

Always shape the response explicitly.

Example

projectRequestBody

projectResponse

migrationResponse

---

# Error Handling

Use the shared `withErrorHandling` wrapper (`lib/errors.js`) around every route handler.

Avoid try-catch scattered across every route.

Throw `ApiError.badRequest()` / `.unauthorized()` / `.notFound()` / `.conflict()` / `.unprocessable()` for expected failures.

Example

ProjectNotFoundException

ConnectorException

ValidationException

---

# Logging

Use SLF4J Logger.

Do

logger.info()

logger.warn()

logger.error()

Do Not

System.out.println()

---

# Database Standards

Use Spring Data JPA.

Avoid native SQL unless required.

Primary Keys

UUID preferred

Indexes

Create indexes on searchable fields.

Never store plain text passwords.

---

# React Standards

Use

React Functional Components

Avoid Class Components.

Folder Structure

components/

pages/

hooks/

services/

types/

layouts/

utils/

---

# Component Naming

PascalCase

Example

DashboardCard

MigrationWizard

LoginForm

---

# Hooks

Use

useState()

useEffect()

useMemo()

useCallback()

Create custom hooks when logic is reusable.

---

# TypeScript

Never use

any

Use proper interfaces.

Example

interface Project

interface MigrationJob

interface Connector

Enable Strict Mode.

---

# API Standards

REST Naming

GET /projects

POST /projects

PUT /projects/{id}

DELETE /projects/{id}

Use JSON only.

Always return proper HTTP status codes.

---

# Error Messages

Good

Project not found.

Bad

Something went wrong.

Errors should be meaningful.

---

# Comments

Write comments only when necessary.

Avoid obvious comments.

Bad

// increment i

Good

// Retry connection after timeout

---

# Formatting

Indentation

4 Spaces (Java)

2 Spaces (Frontend if using Prettier)

Maximum Line Length

120 Characters

---

# Git Rules

Never commit

node_modules

target/

.env

.idea

.vscode

*.log

Use .gitignore properly.

---

# Security Rules

Never hardcode

Passwords

API Keys

Database Credentials

JWT Secrets

Always use Environment Variables.

---

# Testing Standards

Every feature should include

Unit Tests

Integration Tests (if applicable)

No feature should be merged without passing tests.

---

# Documentation

Every major feature must update

README

API_SPEC

TECHSPEC

if required.

---

# Code Review Checklist

✔ Naming is correct

✔ No duplicate code

✔ No unused imports

✔ Tests pass

✔ Documentation updated

✔ Security considered

✔ Performance acceptable

✔ Code follows project standards

---

# Definition of Done

A feature is complete only if

✔ Code Implemented

✔ Code Reviewed

✔ Tests Passed

✔ Documentation Updated

✔ No Critical Bugs

✔ Ready for Production

---

End of Document