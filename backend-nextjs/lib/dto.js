export function toUserResponse(u) {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    email: u.email,
    organizationId: u.organizationId,
    organizationName: u.organization?.name || null,
    role: u.role,
    status: u.status,
    createdAt: u.createdAt,
  }
}

export function toProjectResponse(p) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    sourceErp: p.sourceErp,
    targetErp: p.targetErp,
    status: p.status,
    createdBy: p.createdById,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

export function toMappingRuleResponse(r) {
  return {
    id: r.id,
    sourceTable: r.sourceTable,
    sourceField: r.sourceField,
    targetTable: r.targetTable,
    targetField: r.targetField,
    dataType: r.dataType,
    required: !!r.required,
    customTransformationLogic: r.customTransformationLogic,
  }
}

export function toValidationErrorDto(e) {
  return {
    id: e.id,
    tableName: e.tableName,
    recordId: e.recordId,
    fieldName: e.fieldName,
    severity: e.severity,
    errorType: e.errorType,
    description: e.description,
  }
}

export function progressPercent(job) {
  if (!job.totalRecords) return 0.0
  const processed = (job.successRecords || 0) + (job.failedRecords || 0)
  return Math.min(100, (processed * 100) / job.totalRecords)
}

export function toMigrationStatusResponse(job) {
  const processed = job.successRecords + job.failedRecords
  return {
    jobId: job.id,
    status: job.status,
    progressPercent: progressPercent(job),
    recordsProcessed: processed,
    recordsSucceeded: job.successRecords,
    recordsFailed: job.failedRecords,
    executionTimeMs: job.executionTimeMs,
  }
}
