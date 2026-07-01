// Subtable row matching (spec FR-14 / 4.6). Rows are matched by index or by a
// key column, then each matched pair is compared column by column. Key matching
// is O(n) via a Map (spec EC-9) and keeps duplicate keys in appearance order
// (spec EC-7).
import type { DiffStatus, SubtableRow } from "./types";
import { compareField } from "./comparators";

export interface ColumnSpec {
  code: string;
  type: string;
}

export type MatchMode = "index" | "key";

export interface MatchOptions {
  mode: MatchMode;
  keyField?: string;
  columns: ColumnSpec[];
}

export interface ColumnDiff {
  code: string;
  type: string;
  status: DiffStatus;
  a: unknown;
  b: unknown;
}

export interface MatchedRow {
  status: DiffStatus;
  // For index mode: 1-based row number. For key mode: the key value.
  index?: number;
  keyValue?: string;
  a: SubtableRow | null;
  b: SubtableRow | null;
  columns: ColumnDiff[];
}

function cellValue(row: SubtableRow | null, code: string): unknown {
  return row ? row.value[code]?.value : undefined;
}

function compareColumns(a: SubtableRow, b: SubtableRow, columns: ColumnSpec[]): ColumnDiff[] {
  return columns.map((col) => {
    const av = cellValue(a, col.code);
    const bv = cellValue(b, col.code);
    return { code: col.code, type: col.type, status: compareField(col.type, av, bv), a: av, b: bv };
  });
}

function pairStatus(columns: ColumnDiff[]): DiffStatus {
  return columns.every((c) => c.status === "same") ? "same" : "changed";
}

function sideColumns(row: SubtableRow, columns: ColumnSpec[], side: "a" | "b"): ColumnDiff[] {
  return columns.map((col) => {
    const value = cellValue(row, col.code);
    return {
      code: col.code,
      type: col.type,
      status: side === "a" ? "onlyA" : "onlyB",
      a: side === "a" ? value : undefined,
      b: side === "b" ? value : undefined,
    };
  });
}

function keyOf(row: SubtableRow, keyField: string): string {
  const v = row.value[keyField]?.value;
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return "";
  return String(v);
}

function matchByIndex(a: SubtableRow[], b: SubtableRow[], columns: ColumnSpec[]): MatchedRow[] {
  const rows: MatchedRow[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    const ra = a[i] ?? null;
    const rb = b[i] ?? null;
    if (ra && rb) {
      const cols = compareColumns(ra, rb, columns);
      rows.push({ status: pairStatus(cols), index: i + 1, a: ra, b: rb, columns: cols });
    } else if (ra) {
      rows.push({
        status: "onlyA",
        index: i + 1,
        a: ra,
        b: null,
        columns: sideColumns(ra, columns, "a"),
      });
    } else if (rb) {
      rows.push({
        status: "onlyB",
        index: i + 1,
        a: null,
        b: rb,
        columns: sideColumns(rb, columns, "b"),
      });
    }
  }
  return rows;
}

function matchByKey(
  a: SubtableRow[],
  b: SubtableRow[],
  keyField: string,
  columns: ColumnSpec[],
): MatchedRow[] {
  // Queue B rows per key, preserving appearance order for duplicate keys.
  const bByKey = new Map<string, SubtableRow[]>();
  for (const row of b) {
    const key = keyOf(row, keyField);
    const queue = bByKey.get(key);
    if (queue) queue.push(row);
    else bByKey.set(key, [row]);
  }
  const consumed = new Set<SubtableRow>();
  const rows: MatchedRow[] = [];

  for (const ra of a) {
    const key = keyOf(ra, keyField);
    const queue = bByKey.get(key);
    const rb = queue && queue.length > 0 ? queue.shift()! : null;
    if (rb) {
      consumed.add(rb);
      const cols = compareColumns(ra, rb, columns);
      rows.push({ status: pairStatus(cols), keyValue: key, a: ra, b: rb, columns: cols });
    } else {
      rows.push({
        status: "onlyA",
        keyValue: key,
        a: ra,
        b: null,
        columns: sideColumns(ra, columns, "a"),
      });
    }
  }
  // Remaining B rows (unmatched) in their original order become additions.
  for (const rb of b) {
    if (consumed.has(rb)) continue;
    const key = keyOf(rb, keyField);
    rows.push({
      status: "onlyB",
      keyValue: key,
      a: null,
      b: rb,
      columns: sideColumns(rb, columns, "b"),
    });
  }
  return rows;
}

export function matchRows(a: SubtableRow[], b: SubtableRow[], opts: MatchOptions): MatchedRow[] {
  const keyUsable =
    opts.mode === "key" && !!opts.keyField && opts.columns.some((c) => c.code === opts.keyField);
  if (keyUsable) {
    return matchByKey(a, b, opts.keyField as string, opts.columns);
  }
  // Falls back to index order when the key column was removed (spec EC-6).
  return matchByIndex(a, b, opts.columns);
}
