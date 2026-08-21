# ERP Bridge
## Entity Relationship Diagram

Version: 1.0

---

# Mermaid ER Diagram

```mermaid
erDiagram

USERS ||--o{ PROJECTS : creates

PROJECTS ||--o{ CONNECTOR_CONFIGS : has

PROJECTS ||--o{ MAPPING_RULES : contains

PROJECTS ||--o{ MIGRATION_JOBS : executes

PROJECTS ||--o{ SOURCE_METADATA : reads

MIGRATION_JOBS ||--o{ MIGRATION_LOGS : generates

MIGRATION_JOBS ||--o{ VALIDATION_ERRORS : contains

MIGRATION_JOBS ||--o{ EXPORTED_FILES : creates

USERS ||--o{ AUDIT_LOGS : performs
```

---

# Relationship Summary

One User

↓

Many Projects

One Project

↓

Many Migration Jobs

One Migration Job

↓

Many Logs

One Project

↓

Many Mapping Rules

One Project

↓

Many Connector Configurations

One Migration Job

↓

Many Validation Errors

One Migration Job

↓

Many Exported Files