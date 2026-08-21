import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { findProjectOrThrow } from '@/lib/projects'
import { toMappingRuleResponse } from '@/lib/dto'
import { validateTransformDirective } from '@/lib/transform'

// Always execute fresh on every request — never statically cache or serve
// stale data for this dynamic, per-project API.
export const dynamic = 'force-dynamic'

export const GET = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const project = await findProjectOrThrow(params.id)
  const rules = await prisma.mappingRule.findMany({
    where: { projectId: project.id },
    orderBy: { id: 'asc' },
  })
  return NextResponse.json(rules.map(toMappingRuleResponse))
})

export const POST = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const project = await findProjectOrThrow(params.id)
  const body = await request.json().catch(() => ({}))
  const { sourceTable, sourceField, targetTable, targetField, dataType, required, customTransformationLogic } = body

  for (const [key, val] of Object.entries({ sourceTable, sourceField, targetTable, targetField, dataType })) {
    if (!val || !String(val).trim()) throw ApiError.badRequest(`${key} is required.`)
  }

  const discovered = await prisma.sourceMetadata.findMany({ where: { projectId: project.id } })
  const sourceExists =
    discovered.length === 0 ||
    discovered.some(
      (m) => m.tableName.toLowerCase() === sourceTable.toLowerCase() && m.columnName.toLowerCase() === sourceField.toLowerCase()
    )
  if (!sourceExists) {
    throw ApiError.unprocessable(
      `Source field '${sourceTable}.${sourceField}' was not found in discovered schema metadata for this project.`
    )
  }

  const conflict = await prisma.mappingRule.findFirst({
    where: { projectId: project.id, sourceTable, sourceField },
  })
  if (conflict) {
    throw ApiError.conflict(
      `Source field '${sourceTable}.${sourceField}' is already mapped to '${conflict.targetTable}.${conflict.targetField}'.`
    )
  }

  validateTransformDirective(customTransformationLogic)

  const rule = await prisma.mappingRule.create({
    data: {
      projectId: project.id,
      sourceTable,
      sourceField,
      targetTable,
      targetField,
      dataType,
      required: !!required,
      customTransformationLogic: customTransformationLogic || null,
    },
  })

  return NextResponse.json(toMappingRuleResponse(rule), { status: 201 })
})