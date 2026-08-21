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

async function findRuleOrThrow(projectId, ruleId) {
  const rule = await prisma.mappingRule.findFirst({ where: { id: Number(ruleId), projectId: Number(projectId) } })
  if (!rule) throw ApiError.notFound(`Mapping rule ${ruleId} not found for this project.`)
  return rule
}

export const PUT = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const project = await findProjectOrThrow(params.id)
  const rule = await findRuleOrThrow(project.id, params.ruleId)
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
    where: { projectId: project.id, sourceTable, sourceField, NOT: { id: rule.id } },
  })
  if (conflict) {
    throw ApiError.conflict(
      `Source field '${sourceTable}.${sourceField}' is already mapped to '${conflict.targetTable}.${conflict.targetField}'.`
    )
  }

  validateTransformDirective(customTransformationLogic)

  const updated = await prisma.mappingRule.update({
    where: { id: rule.id },
    data: {
      sourceTable,
      sourceField,
      targetTable,
      targetField,
      dataType,
      required: !!required,
      customTransformationLogic: customTransformationLogic || null,
    },
  })

  return NextResponse.json(toMappingRuleResponse(updated))
})

export const DELETE = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const project = await findProjectOrThrow(params.id)
  const rule = await findRuleOrThrow(project.id, params.ruleId)
  await prisma.mappingRule.delete({ where: { id: rule.id } })
  return new NextResponse(null, { status: 204 })
})
