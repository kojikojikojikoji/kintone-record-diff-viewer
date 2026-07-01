// Assembles the full comparison model from two records and the flattened form
// layout (spec 4.3 / 4.4 / 4.6). The model is computed once after both records
// load; toggles then filter it without recomputation (spec 7.3).
import type { DiffStatus, KintoneRecord, SubtableRow } from "./types";
import { compareField } from "./comparators";
import { formatValue, type FormatOptions } from "./format";
import { inlineDiff, type InlineDiff } from "./lcs";
import { matchRows, type ColumnSpec } from "./table-match";
import type { TableMatching } from "./config-schema";

export interface SubColumn {
  code: string;
  type: string;
  label: string;
}

// A field in form order. Subtables carry their column list.
export interface FieldInfo {
  code: string;
  type: string;
  label: string;
  subColumns?: SubColumn[];
}

export interface SubColumnLine {
  label: string;
  status: DiffStatus;
  aText: string;
  bText: string;
}

export interface DiffRow {
  key: string;
  label: string;
  type: string;
  status: DiffStatus;
  isSystem: boolean;
  aText: string;
  bText: string;
  // Present only for RICH_TEXT change rows.
  inline: InlineDiff | null;
  // Present only for subtable-derived rows.
  subColumns: SubColumnLine[] | null;
}

export interface DiffModel {
  contentRows: DiffRow[];
  systemRows: DiffRow[];
}

const SYSTEM_TYPES = new Set([
  "CREATOR",
  "MODIFIER",
  "CREATED_TIME",
  "UPDATED_TIME",
  "RECORD_NUMBER",
  "__ID__",
  "__REVISION__",
]);

const UNSUPPORTED_TYPES = new Set(["CATEGORY", "STATUS", "STATUS_ASSIGNEE"]);

function firstOfType(record: KintoneRecord, type: string): unknown {
  for (const code of Object.keys(record)) {
    if (record[code]?.type === type) return record[code].value;
  }
  return undefined;
}

function scalarRow(
  key: string,
  label: string,
  type: string,
  a: KintoneRecord,
  b: KintoneRecord,
  code: string,
  opts: FormatOptions,
  isSystem: boolean,
): DiffRow {
  const av = a[code]?.value;
  const bv = b[code]?.value;
  const status = compareField(type, av, bv);
  const aText = formatValue(type, av, opts);
  const bText = formatValue(type, bv, opts);
  const inline = type === "RICH_TEXT" && status === "changed" ? inlineDiff(aText, bText) : null;
  return { key, label, type, status, isSystem, aText, bText, inline, subColumns: null };
}

function subtableRows(
  field: FieldInfo,
  a: KintoneRecord,
  b: KintoneRecord,
  matching: TableMatching | undefined,
  opts: FormatOptions,
): DiffRow[] {
  const aRows = (a[field.code]?.value as SubtableRow[] | undefined) ?? [];
  const bRows = (b[field.code]?.value as SubtableRow[] | undefined) ?? [];
  const columns: ColumnSpec[] = (field.subColumns ?? []).map((c) => ({
    code: c.code,
    type: c.type,
  }));
  const labelByCode = new Map((field.subColumns ?? []).map((c) => [c.code, c.label]));
  const matched = matchRows(aRows, bRows, {
    mode: matching?.mode ?? "index",
    keyField: matching?.keyField,
    columns,
  });

  return matched.map((row, i) => {
    const rowLabel =
      row.keyValue !== undefined
        ? `${field.label} [${row.keyValue}]`
        : `${field.label} #${row.index}`;
    const lines: SubColumnLine[] = row.columns.map((col) => ({
      label: labelByCode.get(col.code) ?? col.code,
      status: col.status,
      aText: formatValue(col.type, col.a, opts),
      bText: formatValue(col.type, col.b, opts),
    }));
    const aText = lines.map((l) => `${l.label}: ${l.aText}`).join("\n");
    const bText = lines.map((l) => `${l.label}: ${l.bText}`).join("\n");
    return {
      key: `${field.code}#${i}`,
      label: rowLabel,
      type: "SUBTABLE",
      status: row.status,
      isSystem: false,
      aText,
      bText,
      inline: null,
      subColumns: lines,
    };
  });
}

function buildSystemRows(a: KintoneRecord, b: KintoneRecord, opts: FormatOptions): DiffRow[] {
  const defs: { label: string; type: string }[] = [
    { label: "作成者", type: "CREATOR" },
    { label: "作成日時", type: "CREATED_TIME" },
    { label: "更新者", type: "MODIFIER" },
    { label: "更新日時", type: "UPDATED_TIME" },
    { label: "レコード番号", type: "RECORD_NUMBER" },
    { label: "リビジョン", type: "__REVISION__" },
  ];
  const rows: DiffRow[] = [];
  for (const def of defs) {
    const av = firstOfType(a, def.type);
    const bv = firstOfType(b, def.type);
    if (av === undefined && bv === undefined) continue;
    const status = compareField(def.type, av, bv);
    rows.push({
      key: `system:${def.type}`,
      label: def.label,
      type: def.type,
      status,
      isSystem: true,
      aText: formatValue(def.type, av, opts),
      bText: formatValue(def.type, bv, opts),
      inline: null,
      subColumns: null,
    });
  }
  return rows;
}

export function buildDiffModel(
  fields: FieldInfo[],
  recordA: KintoneRecord,
  recordB: KintoneRecord,
  tableMatching: TableMatching[] = [],
  opts: FormatOptions = {},
): DiffModel {
  const matchingByTable = new Map(tableMatching.map((t) => [t.tableCode, t]));
  const contentRows: DiffRow[] = [];

  for (const field of fields) {
    if (SYSTEM_TYPES.has(field.type) || UNSUPPORTED_TYPES.has(field.type)) continue;
    // Skip fields neither record can read (access control; spec FR-12).
    if (!(field.code in recordA) && !(field.code in recordB) && field.type !== "SUBTABLE") continue;

    if (field.type === "SUBTABLE") {
      contentRows.push(
        ...subtableRows(field, recordA, recordB, matchingByTable.get(field.code), opts),
      );
    } else {
      contentRows.push(
        scalarRow(field.code, field.label, field.type, recordA, recordB, field.code, opts, false),
      );
    }
  }

  return { contentRows, systemRows: buildSystemRows(recordA, recordB, opts) };
}

// Rows shown on screen for the current toggles (spec FR-10).
export function selectVisibleRows(
  model: DiffModel,
  diffOnly: boolean,
  showSystem: boolean,
): DiffRow[] {
  const rows = showSystem ? [...model.contentRows, ...model.systemRows] : [...model.contentRows];
  return diffOnly ? rows.filter((r) => r.status !== "same") : rows;
}

// Rows for the Markdown export: only diff rows, following the system toggle
// (spec FR-15). diffOnly does not matter because same rows are never exported.
export function selectExportRows(model: DiffModel, showSystem: boolean): DiffRow[] {
  const rows = showSystem ? [...model.contentRows, ...model.systemRows] : [...model.contentRows];
  return rows.filter((r) => r.status !== "same");
}

// True when there are no diff rows at all (spec FR-10 empty state).
export function hasAnyDiff(model: DiffModel, showSystem: boolean): boolean {
  return selectExportRows(model, showSystem).length > 0;
}
