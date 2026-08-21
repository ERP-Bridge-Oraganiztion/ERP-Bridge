# ERP Bridge
## Enterprise REST API Specification (OpenAPI 3.1 Compliant)

**Version:** 1.0.0  
**API Version:** `v1`  
**Protocol:** HTTPS  
**Default Content Type:** `application/json; charset=UTF-8`  
**Authentication:** Stateless JWT Bearer Token  

---

# 1. Base URL & Environments

All API endpoints are prefixed with the base environment URLs detailed below:

* **Sandbox/Local Development:** `http://localhost:8080/api/v1`
* **Staging Server:** `https://staging-api.erpbridge.com/api/v1`
* **Production Cluster:** `https://api.erpbridge.com/api/v1`

---

# 2. HTTP Status Response Codes

ERP Bridge utilizes standardized RESTful HTTP response codes to denote request success, user errors, or system-level exceptions:

| Code | Status Name | Description |
| :--- | :--- | :--- |
| **200** | `OK` | The request completed successfully, and the response body contains the payload. |
| **201** | `Created` | Resource created successfully (e.g., project, mapping rule). Returned with `Location` header. |
| **204** | `No Content` | The request completed successfully, but there is no response payload (e.g., DELETE actions). |
| **400** | `Bad Request` | The request parameters or body are malformed or invalid. |
| **401** | `Unauthorized` | Missing or expired JWT credentials. Authentication is required. |
| **403** | `Forbidden` | Authenticated user lacks sufficient RBAC privileges (e.g., viewer trying to delete a project). |
| **404** | `Not Found` | The requested resource (e.g., project, rule, job) does not exist. |
| **409** | `Conflict` | The resource already exists or violates uniqueness constraints (e.g., duplicate mapping rule). |
| **422** | `Unprocessable` | Syntactically correct request containing semantic validation failures (e.g., invalid port number). |
| **500** | `Internal Error` | An unexpected exception occurred on the backend. |

---

# 3. Global Request Headers

The following headers must be provided for all secured endpoints:

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBlcnBicmlkZ2UuY29tIiwicm9sZSI6IkFETUlOIn0...
```

---

# 4. API Endpoint Specifications

---

## 4.1 Authentication Module (`/auth`)

### 4.1.1 POST /auth/login
* **Description:** Authenticates user credentials and generates a secure, stateless JWT.
* **Request Payload:**
```json
{
  "email": "admin@erpbridge.com",
  "password": "Password123"
}
```
* **Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbkBlcnBicmlkZ2UuY29tIiwicm9sZSI6IkFETUlOIn0...",
  "tokenType": "Bearer",
  "expiresInSeconds": 86400,
  "user": {
    "id": 1,
    "name": "Enterprise Administrator",
    "email": "admin@erpbridge.com",
    "role": "ADMIN",
    "status": "ACTIVE"
  }
}
```

### 4.1.2 POST /auth/logout
* **Description:** Invalidates the current JWT session on the client-side and registers the token in the temporary Redis blacklist.
* **Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "message": "User session invalidated successfully."
}
```

### 4.1.3 GET /auth/me
* **Description:** Recovers the profile metadata of the currently authenticated user session.
* **Response (200 OK):**
```json
{
  "id": 1,
  "name": "Enterprise Administrator",
  "email": "admin@erpbridge.com",
  "role": "ADMIN",
  "status": "ACTIVE",
  "createdAt": "2026-08-04T12:00:00Z"
}
```

---

## 4.2 Projects Module (`/projects`)

### 4.2.1 GET /projects
* **Description:** Retrieves a paginated list of active migration projects.
* **Query Parameters:**
  * `page` (default: 0): Page index.
  * `size` (default: 10): Page size.
  * `sort` (default: `id,desc`): Sorting vectors.
  * `status` (optional): Filter by project state (`CREATED`, `ACTIVE`, `COMPLETED`, `ARCHIVED`, `FAILED`).
* **Response (200 OK):**
```json
{
  "content": [
    {
      "id": 1,
      "name": "Odoo to SAP ERP Migration",
      "description": "Enterprise migration project consolidating 5 country divisions.",
      "sourceErp": "ODOO",
      "targetErp": "SAP_S4HANA",
      "status": "ACTIVE",
      "createdBy": 1,
      "createdAt": "2026-08-04T12:00:00Z",
      "updatedAt": "2026-08-04T12:00:00Z"
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

### 4.2.2 POST /projects
* **Description:** Creates a new data migration project profile.
* **Request Payload:**
```json
{
  "name": "Odoo to SAP ERP Migration",
  "description": "Enterprise migration project consolidating 5 country divisions.",
  "sourceErp": "ODOO",
  "targetErp": "SAP_S4HANA"
}
```
* **Response (201 Created):**
```json
{
  "id": 1,
  "name": "Odoo to SAP ERP Migration",
  "status": "CREATED",
  "message": "Project space initialized successfully."
}
```

### 4.2.3 GET /projects/{id}
* **Description:** Recovers detailed parameters of a specific project by ID.
* **Response (200 OK):**
```json
{
  "id": 1,
  "name": "Odoo to SAP ERP Migration",
  "description": "Enterprise migration project consolidating 5 country divisions.",
  "sourceErp": "ODOO",
  "targetErp": "SAP_S4HANA",
  "status": "ACTIVE",
  "createdBy": {
    "id": 1,
    "name": "Enterprise Administrator",
    "email": "admin@erpbridge.com"
  },
  "createdAt": "2026-08-04T12:00:00Z",
  "updatedAt": "2026-08-04T12:00:00Z"
}
```

### 4.2.4 PUT /projects/{id}
* **Description:** Modifies project specifications.
* **Request Payload:**
```json
{
  "name": "Updated Odoo ERP Migration",
  "description": "Consolidation project for 6 country divisions.",
  "status": "ACTIVE"
}
```
* **Response (200 OK):**
```json
{
  "id": 1,
  "name": "Updated Odoo ERP Migration",
  "status": "ACTIVE",
  "updatedAt": "2026-08-04T13:15:00Z"
}
```

### 4.2.5 DELETE /projects/{id}
* **Description:** Purges a project profile and all cascading configurations, rules, and job logs.
* **Response (204 No Content):** (No body returned)

---

## 4.3 Connectors Module (`/connectors`)

### 4.3.1 GET /connectors
* **Description:** Retrieves listing of supported ingestion ERP connectors.
* **Response (200 OK):**
```json
{
  "connectors": [
    {
      "type": "CSV",
      "displayName": "Structured CSV Import",
      "stable": true
    },
    {
      "type": "EXCEL",
      "displayName": "Microsoft Excel Sheets",
      "stable": true
    },
    {
      "type": "ODOO",
      "displayName": "Odoo ERP (v15-v17)",
      "stable": true
    },
    {
      "type": "ERPNEXT",
      "displayName": "ERPNext Framework",
      "stable": true
    },
    {
      "type": "ORACLE_SQL",
      "displayName": "Oracle Database Engine",
      "stable": false
    }
  ]
}
```

### 4.3.2 POST /connectors/test
* **Description:** Initiates a mock connection to the specified target host to validate database or API connectivity parameters.
* **Request Payload:**
```json
{
  "connectorType": "ODOO",
  "host": "odoo-prod.internal.corp",
  "port": 5432,
  "databaseName": "odoo_master",
  "username": "erp_bridge_connector",
  "password": "PlaintextPasswordPassedSecurelyOverHTTPS"
}
```
* **Response (200 OK):**
```json
{
  "status": "SUCCESS",
  "latencyMs": 15,
  "message": "Connection established and verified with Odoo PostgreSQL engine successfully."
}
```

---

## 4.4 Schema Discovery Module (`/metadata`)

### 4.4.1 GET /projects/{id}/metadata
* **Description:** Pulls schema structures, table names, columns, and data types cached from the legacy ERP source.
* **Response (200 OK):**
```json
{
  "projectId": 1,
  "sourceErp": "ODOO",
  "discoveredTables": [
    {
      "tableName": "res_partner",
      "columnCount": 4,
      "columns": [
        { "name": "id", "dataType": "integer", "nullable": false, "primaryKey": true },
        { "name": "name", "dataType": "varchar(128)", "nullable": false, "primaryKey": false },
        { "name": "email", "dataType": "varchar(64)", "nullable": true, "primaryKey": false },
        { "name": "street", "dataType": "varchar(255)", "nullable": true, "primaryKey": false }
      ]
    }
  ]
}
```

---

## 4.5 Visual Field Mapping Module (`/mapping`)

### 4.5.1 GET /projects/{id}/mapping
* **Description:** Retrieves all active mapping rules configured for legacy fields to SAP destination tables.
* **Response (200 OK):**
```json
[
  {
    "id": 101,
    "sourceTable": "res_partner",
    "sourceField": "name",
    "targetTable": "business_partner",
    "targetField": "bp_name",
    "dataType": "VARCHAR",
    "required": true,
    "customTransformationLogic": "UPPERCASE"
  }
]
```

### 4.5.2 POST /projects/{id}/mapping
* **Description:** Defines a schema translation mapping rule.
* **Request Payload:**
```json
{
  "sourceTable": "res_partner",
  "sourceField": "name",
  "targetTable": "business_partner",
  "targetField": "bp_name",
  "dataType": "VARCHAR",
  "required": true,
  "customTransformationLogic": "UPPERCASE"
}
```
* **Response (201 Created):**
```json
{
  "id": 101,
  "projectId": 1,
  "status": "CREATED",
  "message": "Field mapping schema compiled and cached."
}
```

---

## 4.6 Validation Engine (`/validate`)

### 4.6.1 POST /projects/{id}/validate
* **Description:** Runs the data validation engine on the legacy source datasets.
* **Response (200 OK):**
```json
{
  "projectId": 1,
  "jobId": 450,
  "status": "COMPLETED",
  "validationMetrics": {
    "totalCheckedRecords": 1889,
    "validRecords": 1850,
    "errorCount": 25,
    "warningCount": 14
  }
}
```

### 4.6.2 GET /projects/{id}/validation-report
* **Description:** Recovers detailed trace of all validation warnings or errors generated during the last validation job.
* **Response (200 OK):**
```json
{
  "projectId": 1,
  "jobId": 450,
  "errors": [
    {
      "id": 12,
      "tableName": "res_partner",
      "recordId": "412",
      "fieldName": "email",
      "severity": "ERROR",
      "errorType": "INVALID_FORMAT",
      "description": "Email value 'invalid-email-at-domain' fails standard RFC 5322 regex validation."
    }
  ]
}
```

---

## 4.7 Migration Execution Engine (`/migration`)

### 4.7.1 POST /projects/{id}/migration/start
* **Description:** Launches the asynchronous data transformation and migration pipeline.
* **Response (202 Accepted):**
```json
{
  "jobId": 501,
  "status": "RUNNING",
  "message": "Migration pipeline processing initiated in backend worker threads.",
  "startedAt": "2026-08-04T14:30:00Z"
}
```

### 4.7.2 GET /projects/{id}/migration/status
* **Description:** Returns real-time execution status of the running migration task.
* **Response (200 OK):**
```json
{
  "jobId": 501,
  "status": "RUNNING",
  "progressPercent": 62.5,
  "recordsProcessed": 62500,
  "recordsSucceeded": 61900,
  "recordsFailed": 600,
  "executionTimeMs": 22500
}
```

### 4.7.3 POST /projects/{id}/migration/stop
* **Description:** Sends cancellation signal to halt execution of the active thread pool.
* **Response (200 OK):**
```json
{
  "jobId": 501,
  "status": "STOPPED",
  "message": "Migration thread execution suspended by administrative command."
}
```

---

## 4.8 Export Module (`/export`)

### 4.8.1 POST /projects/{id}/export
* **Description:** Builds and compiles the validated target UDM data into selected file types.
* **Request Payload:**
```json
{
  "jobId": 501,
  "format": "CSV"
}
```
* **Response (200 OK):**
```json
{
  "fileId": 98,
  "jobId": 501,
  "fileName": "sap_bp_export_job_501.csv",
  "fileType": "CSV",
  "fileSizeBytes": 12450882,
  "downloadUrl": "https://storage.erpbridge.com/exports/sap_bp_export_job_501.csv"
}
```

---

# 5. Standard Error payload

When requests trigger validation errors or generic exceptions, the response payload adheres strictly to this structure:

```json
{
  "timestamp": "2026-08-04T12:00:00Z",
  "status": 422,
  "error": "Unprocessable Entity",
  "message": "Field mapping target_field must not exceed 100 characters.",
  "path": "/api/v1/projects/1/mapping"
}
```

---

# 6. Global Rate Limits

API access is throttled to preserve system stability:

* **Authentication API (`/auth/login`):** Max 20 attempts per minute per IP address.
* **Secured Client API Endpoints:** Max 100 requests per minute per authenticated user token.
* Excessive traffic returns a standard **429 Too Many Requests** HTTP code.

---
**End of Document**
