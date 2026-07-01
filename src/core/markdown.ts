// Builds the "copy diff" Markdown table (spec FR-15). Only rows passed in are
// rendered, so toggle filtering happens before this function is called. Pipes
// are escaped to \| and line breaks to <br> (spec EC-19).

export interface MarkdownRow {
  field: string;
  a: string;
  b: string;
}

export interface MarkdownOptions {
  recordAId: string | number;
  recordBId: string | number;
  rows: MarkdownRow[];
}

export function escapeCell(value: string): string {
  return value.replace(/\r\n|\r|\n/g, "<br>").replace(/\|/g, "\\|");
}

export function buildMarkdownTable(opts: MarkdownOptions): string {
  const header = `| フィールド | レコードA (${opts.recordAId}) | レコードB (${opts.recordBId}) |`;
  const divider = "| --- | --- | --- |";
  const lines = opts.rows.map(
    (row) => `| ${escapeCell(row.field)} | ${escapeCell(row.a)} | ${escapeCell(row.b)} |`,
  );
  return [header, divider, ...lines].join("\n");
}
