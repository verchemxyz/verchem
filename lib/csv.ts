/** Values accepted by the shared CSV serializer. */
export type CsvValue = string | number | boolean | null | undefined

/** Escape one field according to RFC 4180 section 2. */
export function escapeCsvField(value: CsvValue): string {
  const text = value === null || value === undefined ? '' : String(value)
  if (!/[",\r\n]/.test(text)) return text
  return `"${text.replace(/"/g, '""')}"`
}

/** Serialize rows with RFC 4180 commas, quoting, and CRLF record separators. */
export function serializeCsv(rows: readonly (readonly CsvValue[])[]): string {
  return rows.map(row => row.map(escapeCsvField).join(',')).join('\r\n')
}
