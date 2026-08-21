export type Role = 'ADMIN' | 'PROJECT_MANAGER' | 'CONSULTANT' | 'VIEWER'
export type ProjectStatus = 'CREATED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'FAILED'
export type ConnectorType =
  | 'CSV' | 'EXCEL' | 'ODOO' | 'ERPNEXT' | 'ORACLE_SQL' | 'MS_SQL_SERVER' | 'MYSQL_POSTGRES' | 'MYSQL' | 'POSTGRES'
export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'STOPPED' | 'FAILED'
export type Severity = 'WARNING' | 'ERROR' | 'CRITICAL'

export interface User {
  id: number
  name: string
  email: string
  organizationId?: number
  organizationName?: string | null
  role: Role
  status: string
  createdAt?: string
}

export interface LoginResponse {
  token: string
  tokenType: string
  expiresInSeconds: number
  user: User
}

export interface Project {
  id: number
  name: string
  description?: string
  sourceErp: string
  targetErp: string
  status: ProjectStatus
  createdBy?: number
  createdAt: string
  updatedAt: string
}

export interface SourceSystem {
  name: string
  category: string
  liveConnect: ConnectorType | null
}

export interface PageResponse<T> {
  content: T[]
  pageable?: { pageNumber: number; pageSize: number; totalElements: number; totalPages: number }
  number?: number
  size?: number
  totalElements?: number
  totalPages?: number
}

export interface ConnectorInfo {
  type: ConnectorType
  displayName: string
  stable: boolean
}

export interface ConnectorStatus {
  configured: boolean
  connectorType: string | null
  hasSourceFile: boolean
  sourceFileName: string | null
  host: string | null
  port: number | null
  databaseName: string | null
  username: string | null
}

export interface ColumnMetadata {
  name: string
  dataType: string
  nullable: boolean
  primaryKey: boolean
}

export interface TableMetadata {
  tableName: string
  columnCount: number
  columns: ColumnMetadata[]
}

export interface MetadataResponse {
  projectId: number
  sourceErp: string
  discoveredTables: TableMetadata[]
}

export interface MappingRule {
  id: number
  sourceTable: string
  sourceField: string
  targetTable: string
  targetField: string
  dataType: string
  required: boolean
  customTransformationLogic?: string
}

export interface ValidationRunResponse {
  projectId: number
  jobId: number
  status: string
  validationMetrics: {
    totalCheckedRecords: number
    validRecords: number
    errorCount: number
    warningCount: number
  }
}

export interface ValidationErrorItem {
  id: number
  tableName: string
  recordId: string
  fieldName: string
  severity: Severity
  errorType: string
  description: string
}

export interface ValidationReport {
  projectId: number
  jobId: number
  errors: ValidationErrorItem[]
  pageInfo: { page: number; size: number; totalElements: number; totalPages: number }
}

export interface MigrationStatus {
  jobId: number
  status: JobStatus
  progressPercent: number
  recordsProcessed: number
  recordsSucceeded: number
  recordsFailed: number
  executionTimeMs: number
}

export interface ExportResponse {
  fileId: number
  jobId: number
  fileName: string
  fileType: string
  fileSizeBytes: number
  downloadUrl: string
}
