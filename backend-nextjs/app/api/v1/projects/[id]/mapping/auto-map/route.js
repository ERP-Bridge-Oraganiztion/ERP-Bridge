import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiError, withErrorHandling } from '@/lib/errors'
import { requireUser } from '@/lib/auth'
import { findProjectOrThrow } from '@/lib/projects'

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'
const SAP_TARGET_SCHEMA = {
  business_partner: [
    { field: 'BP', meaning: 'Business partner or customer identifier', type: 'string', required: true },
    { field: 'NAME1', meaning: 'Primary customer or business partner name', type: 'string', required: true },
    { field: 'ADDR1', meaning: 'Street address', type: 'string', required: false },
    { field: 'ORT01', meaning: 'City', type: 'string', required: false },
    { field: 'LAND1', meaning: 'ISO country code', type: 'string', required: false },
    { field: 'E_MAIL', meaning: 'Email address', type: 'string', required: false },
    { field: 'TELF1', meaning: 'Telephone number', type: 'string', required: false },
    { field: 'BPSTATUS', meaning: 'Business partner status', type: 'string', required: false },
  ],
  material: [
    { field: 'MATNR', meaning: 'Material identifier', type: 'string', required: true },
    { field: 'MAKTX', meaning: 'Material description', type: 'string', required: true },
    { field: 'MTART', meaning: 'Material type', type: 'string', required: true },
    { field: 'MEINS', meaning: 'Base unit of measure', type: 'string', required: true },
  ],
}
function getMessageText(content) {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .join('')
  }
  return ''
}

function parseSuggestions(content) {
  const text = getMessageText(content)
    .replace(/```(?:json)?/gi, '')
    .trim()

  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) {
    throw ApiError.unprocessable(
      'The AI provider did not return mapping suggestions. Check the configured AI model/API key and try again.'
    )
  }

  let parsed
  try {
    parsed = JSON.parse(text.slice(start, end + 1))
  } catch {
    throw ApiError.unprocessable('The AI provider returned invalid mapping JSON. Please try again.')
  }

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.suggestions)) {
    throw ApiError.unprocessable('The AI provider returned an invalid mapping analysis format. Please try again.')
  }
  return parsed
}

async function callOpenRouter(columns, targetObject = 'business_partner') {
  const apiKey = process.env.GEMINI_API_KEY
  const columnList = columns
    .map((c) => `- ${c.tableName}.${c.columnName} (${c.dataType}, nullable=${c.nullable}, primaryKey=${c.isPrimaryKey})`)
    .join('\n')

  const targetSchema = SAP_TARGET_SCHEMA[targetObject] || SAP_TARGET_SCHEMA.business_partner
  const prompt = `You are an SAP Data Migration Expert.

Before creating any mapping, first analyze the selected SAP target format/schema.

Understand its fields, field meanings, data types, required fields, allowed values, and relationships.

Then analyze the source data and map it to the SAP structure based on actual business meaning, not just matching column names.

Return:

- SAP target fields
- Suggested source mapping
- Transformation required
- Confidence score
- Missing/invalid fields

If the mapping is uncertain, mark it REVIEW_REQUIRED instead of guessing.

Never create a mapping until the SAP target structure has been analyzed first.

Selected SAP target object: ${targetObject}
SAP target schema:
${JSON.stringify(targetSchema, null, 2)}

Return ONLY one valid JSON object. Do not write markdown or any text before or after it.

The object must contain:

targetFields (the analyzed SAP fields),
missingFields (required SAP fields with no reliable source),
invalidFields (source fields that cannot be mapped reliably),
suggestions (one object per source field).

Each suggestion must contain:

sourceTable
sourceField
targetTable
targetField
dataType
required
reasoning
transformation
confidence (HIGH, MEDIUM, LOW, or REVIEW_REQUIRED)

Source Columns:

${columnList}`

  const response = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost',
      'X-Title': 'ERP Bridge',
    },
    body: JSON.stringify({
      model: 'openrouter/free',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const bodyText = await response.text()
  if (!response.ok) {
    throw ApiError.unprocessable(`OpenRouter API Error (HTTP ${response.status}) : ${bodyText}`)
  }

  let root
  try {
    root = JSON.parse(bodyText)
  } catch {
    throw ApiError.unprocessable('Could not parse OpenRouter response as JSON.')
  }

  const analysis = parseSuggestions(root?.choices?.[0]?.message?.content)

  return {
    targetFields: analysis.targetFields || targetSchema,
    missingFields: analysis.missingFields || [],
    invalidFields: analysis.invalidFields || [],
    suggestions: analysis.suggestions.map((n) => ({
    sourceTable: n.sourceTable,
    sourceField: n.sourceField,
    targetTable: n.targetTable || 'business_partner',
    targetField: n.targetField,
    dataType: n.dataType || 'VARCHAR',
    required: !!n.required,
    reasoning: n.reasoning || '',
    transformation: n.transformation || 'NONE',
    confidence: n.confidence || 'REVIEW_REQUIRED',
    })),
  }
}

export const POST = withErrorHandling(async (request, { params }) => {
  await requireUser(request)
  const project = await findProjectOrThrow(params.id)

  if (!process.env.GEMINI_API_KEY) {
    throw ApiError.badRequest('OpenRouter API key not configured.')
  }

  const columns = await prisma.sourceMetadata.findMany({ where: { projectId: project.id } })
  if (columns.length === 0) {
    throw ApiError.badRequest('No schema discovered yet. Upload a source file first.')
  }

  const existingRules = await prisma.mappingRule.findMany({ where: { projectId: project.id } })
  const alreadyMapped = new Set(existingRules.map((r) => `${r.sourceTable}.${r.sourceField}`))

  const body = await request.json().catch(() => ({}))
  const targetObject = body.targetObject === 'material' ? 'material' : 'business_partner'
  const analysis = await callOpenRouter(columns, targetObject)
  const suggestions = analysis.suggestions

  let created = 0
  const skipped = []
  for (const s of suggestions) {
    const key = `${s.sourceTable}.${s.sourceField}`
    if (!s.targetField || s.confidence === 'REVIEW_REQUIRED') {
      skipped.push({ key, reason: 'Review Required: SAP target field or business meaning is uncertain.' })
      continue
    }
    if (alreadyMapped.has(key)) {
      skipped.push({ key, reason: 'This source field is already mapped to a target field.' })
      continue
    }

    try {
      const discovered = columns
      const sourceExists =
        discovered.length === 0 ||
        discovered.some(
          (m) => m.tableName.toLowerCase() === (s.sourceTable || '').toLowerCase() && m.columnName.toLowerCase() === (s.sourceField || '').toLowerCase()
        )
      if (!sourceExists) {
        skipped.push({
          key,
          reason: `AI suggested source '${s.sourceTable}.${s.sourceField}', but that column was not found in the discovered schema.`,
        })
        continue
      }

      const conflict = await prisma.mappingRule.findFirst({
        where: { projectId: project.id, sourceTable: s.sourceTable, sourceField: s.sourceField },
      })
      if (conflict) {
        skipped.push({ key, reason: 'A mapping rule for this source field already exists (conflict).' })
        continue
      }

      await prisma.mappingRule.create({
        data: {
          projectId: project.id,
          sourceTable: s.sourceTable,
          sourceField: s.sourceField,
          targetTable: s.targetTable,
          targetField: s.targetField,
          dataType: s.dataType,
          required: !!s.required,
          customTransformationLogic: null,
        },
      })
      created++
    } catch (e) {
      skipped.push({ key, reason: `Could not save this rule: ${e.message}` })
    }
  }

  return NextResponse.json({
    projectId: project.id,
    suggestedCount: suggestions.length,
    createdCount: created,
    suggestions,
    targetObject,
    targetFields: analysis.targetFields,
    missingFields: analysis.missingFields,
    invalidFields: analysis.invalidFields,
    skipped,
  })
})