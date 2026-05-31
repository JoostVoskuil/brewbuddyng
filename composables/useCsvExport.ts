/**
 * Generic CSV export helper. Mirrors the "Exporteren naar CSV" actions of the
 * original BrewBuddy (TRecipes.ExportToCSV and the brews overview export),
 * letting the user export a list of recipes or brews as a spreadsheet file.
 */

export interface CsvColumn<T> {
  /** Column header shown in the first CSV row. */
  header: string
  /** Cell value for a given row. */
  value: (row: T) => string | number | null | undefined
}

/** Escape a single CSV field per RFC 4180 (quote when needed, double quotes). */
function escapeCsvField(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function useCsvExport() {
  /** Build a CSV string from rows and column definitions. */
  function buildCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
    const header = columns.map((c) => escapeCsvField(c.header)).join(',')
    const body = rows.map((row) =>
      columns.map((c) => escapeCsvField(c.value(row))).join(','),
    )
    return [header, ...body].join('\r\n')
  }

  /** Trigger a browser download of CSV text. A UTF-8 BOM is added for Excel. */
  function downloadCsv(filename: string, csv: string) {
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  /** Build and download a CSV in one call. */
  function exportCsv<T>(filename: string, rows: T[], columns: CsvColumn<T>[]) {
    downloadCsv(filename, buildCsv(rows, columns))
  }

  return { buildCsv, downloadCsv, exportCsv }
}
