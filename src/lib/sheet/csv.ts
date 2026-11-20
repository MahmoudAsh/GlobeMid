/** Minimal RFC-4180 CSV parser (quotes, escaped quotes, commas/newlines inside quotes, BOM). */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const endCell = () => {
    row.push(cell)
    cell = ''
  }
  const endRow = () => {
    endCell()
    rows.push(row)
    row = []
  }
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') endCell()
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++
      endRow()
    } else cell += ch
  }
  if (cell || row.length) endRow()
  return rows
}

/** Header-mapped objects. Headers are matched case-insensitively, ignoring whitespace/newlines. */
export function csvToObjects<K extends string>(text: string, columns: Record<K, string[]>) {
  const [header = [], ...body] = parseCsv(text)
  const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase()
  const index = {} as Record<K, number>
  for (const key of Object.keys(columns) as K[]) {
    index[key] = header.findIndex((h) => columns[key].some((name) => norm(h) === norm(name)))
  }
  return body
    .filter((cells) => cells.some((c) => c.trim() !== ''))
    .map((cells, i) => {
      const o = { __index: i } as Record<K, string> & { __index: number }
      for (const key of Object.keys(columns) as K[]) (o as Record<K, string>)[key] = index[key] >= 0 ? (cells[index[key]] ?? '') : ''
      return o
    })
}
