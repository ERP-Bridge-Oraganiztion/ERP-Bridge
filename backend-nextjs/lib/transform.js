export const ALLOWED_TRANSFORMS = new Set(['UPPERCASE', 'LOWERCASE', 'TRIM', 'REGEX_REPLACE'])

export function validateTransformDirective(transform) {
  if (!transform || !transform.trim()) return
  const directive = transform.split(':')[0].trim().toUpperCase()
  if (!ALLOWED_TRANSFORMS.has(directive)) {
    const list = Array.from(ALLOWED_TRANSFORMS).join(', ')
    const err = new Error(`Unsupported transformation '${directive}'. Allowed: [${list}]`)
    err.status = 422
    throw err
  }
}

/** Applies a configured string transformation to a raw source value. */
export function applyTransform(value, transformDirective) {
  if (value == null || !transformDirective || !transformDirective.trim()) return value
  const parts = transformDirective.split(':')
  const directive = parts[0].trim().toUpperCase()
  switch (directive) {
    case 'UPPERCASE':
      return value.toUpperCase()
    case 'LOWERCASE':
      return value.toLowerCase()
    case 'TRIM':
      return value.trim()
    case 'REGEX_REPLACE': {
      const rest = transformDirective.substring(directive.length + 1)
      const pattern = rest.split('=>')
      if (pattern.length < 2) return value
      try {
        return value.replace(new RegExp(pattern[0].trim(), 'g'), pattern[1].trim())
      } catch {
        return value
      }
    }
    default:
      return value
  }
}
