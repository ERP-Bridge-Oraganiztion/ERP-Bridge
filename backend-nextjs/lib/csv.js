import { parse } from 'csv-parse/sync'
import { stringify } from 'csv-stringify/sync'

/** Parses CSV text into { headers, rows } where rows is an array of plain objects. */
export function parseCsv(text, delimiter = ',') {
  if (!text || !text.trim()) return { headers: [], rows: [] }
  const records = parse(text, {
    columns: true,
    delimiter,
    skip_empty_lines: true,
    relax_column_count: true,
    bom: true,
  })
  const headers = records.length > 0 ? Object.keys(records[0]) : []
  return { headers, rows: records }
}

/** Serializes an array of header names + array of row objects/arrays back to CSV text. */
export function stringifyCsv(headers, rows) {
  return stringify(rows, { header: true, columns: headers })
}
