import * as XLSX from 'xlsx'
import { XMLParser } from 'fast-xml-parser'
import MDBReader from 'mdb-reader'
import { parseCsv } from './csv'
import { stringifyCsv } from './csv'

function extensionOf(file) {
  const name = (file.name || '').toLowerCase()
  return name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : ''
}

function isExcelExtension(extension) {
  return extension === 'xlsx' || extension === 'xls'
}

function recordsToCsv(records) {
  if (!Array.isArray(records) || records.length === 0) return { headers: [], rows: [], sourceData: '' }
  const headers = [...new Set(records.flatMap((record) => (record && typeof record === 'object' ? Object.keys(record) : [])))]
  const rows = records.map((record) => {
    const row = {}
    for (const header of headers) {
      const value = record?.[header]
      row[header] = value != null && typeof value === 'object' ? JSON.stringify(value) : value ?? ''
    }
    return row
  })
  const sourceData = stringifyCsv(headers, rows)
  return { headers, rows, sourceData }
}

function findXmlRecords(value) {
  if (Array.isArray(value) && value.every((item) => item && typeof item === 'object')) return value
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) {
      const records = findXmlRecords(child)
      if (records) return records
    }
    return [value]
  }
  return null
}

async function detectExcelFile(file, bytes) {
  const name = (file.name || '').toLowerCase()
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.mdb') || name.endsWith('.accdb')) return true

  const isZip = bytes[0] === 0x50 && bytes[1] === 0x4b
  const isOle = bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0
  return isZip || isOle
}

export async function parseSourceFile(file) {
  const extension = extensionOf(file)
  const bytes = new Uint8Array(await file.arrayBuffer())

  if (extension === 'mdb' || extension === 'accdb') {
    const reader = new MDBReader(Buffer.from(bytes))
    const tableName = reader.getTableNames()[0]
    if (!tableName) return { connectorType: 'EXCEL', headers: [], rows: [], sourceData: '' }
    return { ...recordsToCsv(reader.getTable(tableName).getData()), connectorType: 'EXCEL' }
  }

  if (await detectExcelFile(file, bytes)) {
    const workbook = XLSX.read(Buffer.from(bytes), { type: 'buffer' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    if (!firstSheet) return { connectorType: 'EXCEL', headers: [], rows: [], sourceData: '' }

    const csvText = XLSX.utils.sheet_to_csv(firstSheet)
    const parsed = parseCsv(csvText)
    return { ...parsed, connectorType: 'EXCEL', sourceData: csvText }
  }

  const sourceData = Buffer.from(bytes).toString('utf8')
  if (extension === 'json') {
    let value
    try {
      value = JSON.parse(sourceData)
    } catch {
      throw new Error('Invalid JSON file. Check the file syntax and try again.')
    }
    const records = Array.isArray(value)
      ? value
      : Array.isArray(value?.data)
        ? value.data
        : Array.isArray(value?.rows)
          ? value.rows
          : [value]
    return { ...recordsToCsv(records), connectorType: 'CSV' }
  }

  if (extension === 'xml') {
    const parsed = new XMLParser({ ignoreAttributes: false }).parse(sourceData)
    const records = findXmlRecords(parsed) || []
    return { ...recordsToCsv(records), connectorType: 'CSV' }
  }

  if (extension === 'txt' || extension === 'tsv') {
    const delimiter = extension === 'tsv' || sourceData.split(/\r?\n/, 1)[0].includes('\t') ? '\t' : ','
    const parsed = parseCsv(sourceData, delimiter)
    return { ...parsed, connectorType: 'CSV', sourceData: stringifyCsv(parsed.headers, parsed.rows) }
  }

  return { ...parseCsv(sourceData), connectorType: 'CSV', sourceData }
}