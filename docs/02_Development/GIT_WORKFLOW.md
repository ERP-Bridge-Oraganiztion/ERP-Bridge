# ERP Bridge
## Git Workflow

Version: 1.0

Status: Official

---

# Purpose

This document defines the Git workflow for ERP Bridge.

The objective is to keep the repository organized, maintainable,
and production-ready while allowing multiple developers to work
simultaneously.

---

# Git Strategy

ERP Bridge follows a simplified Git Flow model.

```
main
 │
 ├── develop
 │     ├── feature/login
 │     ├── feature/dashboard
 │     ├── feature/csv-connector
 │     ├── feature/migration-engine
 │     └── feature/sap-export
 │
 ├── release/v1.0.0
 │
 └── hotfix/security-patch
```

---

# Branches

## main

Purpose

Production-ready code only.

Rules

- Always stable
- Protected branch
- Direct commits are not allowed
- Merge only through Pull Requests

---

## develop

Purpose

Integration branch for ongoing development.

Rules

- All completed features merge here first.
- Must pass CI before merge.

---

## feature Branches

Purpose

Develop a single feature.

Naming Convention

feature/<feature-name>

Examples

feature/login

feature/dashboard

feature/csv-import

feature/mapping-engine

feature/report-module

---

## bugfix Branches

Purpose

Fix bugs found during development.

Naming Convention

bugfix/<bug-name>

Examples

bugfix/login-error

bugfix/export-failure

---

## hotfix Branches

Purpose

Fix urgent production issues.

Naming Convention

hotfix/<issue>

Examples

hotfix/jwt-expiry

hotfix/sql-injection

---

## release Branches

Purpose

Prepare a production release.

Naming Convention

release/v1.0.0

release/v1.1.0

release/v2.0.0

---

# Development Workflow

Step 1

Update local repository

```bash
git checkout develop
git pull origin develop
```

---

Step 2

Create a feature branch

```bash
git checkout -b feature/login
```

---

Step 3

Develop the feature

Commit regularly using meaningful commit messages.

---

Step 4

Push branch

```bash
git push origin feature/login
```

---

Step 5

Create Pull Request

Target Branch

develop

---

Step 6

Code Review

Requirements

- Code reviewed
- Tests passed
- Documentation updated
- No merge conflicts

---

Step 7

Merge

After approval, merge into `develop`.

---

# Commit Message Convention

Format

```
type: short description
```

Examples

```
feat: add JWT authentication

fix: resolve CSV parsing issue

docs: update API specification

refactor: simplify migration engine

test: add validation tests

style: format frontend code

chore: update dependencies
```

---

# Commit Types

| Type | Purpose |
|------|---------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation |
| refactor | Improve existing code |
| test | Add or update tests |
| style | Formatting only |
| chore | Maintenance |

---

# Pull Request Checklist

Before creating a Pull Request

- [ ] Code compiles successfully
- [ ] Tests pass
- [ ] No secrets committed
- [ ] Documentation updated
- [ ] Code reviewed locally
- [ ] No unnecessary files

---

# Merge Rules

A Pull Request can be merged only if

- At least one approval received
- CI pipeline passes
- No merge conflicts
- Documentation updated
- No critical bugs

---

# Versioning

ERP Bridge follows Semantic Versioning.

Format

```
MAJOR.MINOR.PATCH
```

Examples

```
0.1.0

0.5.0

1.0.0

1.1.0

2.0.0
```

Meaning

MAJOR

Breaking changes

MINOR

New features

PATCH

Bug fixes

---

# Tags

Examples

```
v0.1.0

v1.0.0

v2.0.0
```

---

# Git Ignore

Do not commit

```
node_modules/

target/

build/

dist/

.env

.idea/

.vscode/

*.log

*.class

*.jar

coverage/

```

---

# CI/CD Integration

Every push to

develop

Triggers

- Build
- Unit Tests
- Integration Tests
- Code Quality Checks

Every merge to

main

Triggers

- Production Build
- Docker Image Build
- Deployment Pipeline

---

# Release Process

Feature Complete

↓

Merge into develop

↓

QA Testing

↓

Create Release Branch

↓

Final Testing

↓

Merge into main

↓

Create Git Tag

↓

Deploy

↓

Publish Release Notes

---

# Best Practices

✔ Commit small changes frequently

✔ Write meaningful commit messages

✔ Keep branches focused on one feature

✔ Pull latest changes before starting work

✔ Resolve conflicts before creating PR

✔ Never commit secrets or credentials

✔ Update documentation with feature changes

---

# Workflow Summary

Developer

↓

Create Feature Branch

↓

Write Code

↓

Commit Changes

↓

Push Branch

↓

Create Pull Request

↓

Code Review

↓

CI Pipeline

↓

Merge to develop

↓

Release Branch

↓

Merge to main

↓

Production

---

End of Document