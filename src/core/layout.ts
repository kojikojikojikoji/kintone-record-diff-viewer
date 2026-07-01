// Flattens a kintone form layout into the ordered field list used for the
// comparison table (spec FR-6). Groups are expanded in place with no heading
// row (spec 3). Value-less elements (label, spacer, hr, reference table) carry
// no field code and are dropped.
import type { FieldInfo, SubColumn } from "./diff-model";

export interface LayoutFieldElement {
  type: string;
  code?: string;
}

export interface LayoutRowInput {
  type: string;
  fields?: LayoutFieldElement[];
  layout?: LayoutRowInput[];
  code?: string;
}

export interface FormFieldInput {
  type: string;
  code: string;
  label: string;
  fields?: Record<string, { type: string; code: string; label: string }>;
}

function subColumnsOf(field: FormFieldInput | undefined): SubColumn[] {
  if (!field?.fields) return [];
  return Object.keys(field.fields)
    .map((code) => field.fields![code])
    .filter((c) => !!c.code)
    .map((c) => ({ code: c.code, type: c.type, label: c.label }));
}

export function flattenLayout(
  layout: LayoutRowInput[],
  fields: Record<string, FormFieldInput>,
): FieldInfo[] {
  const out: FieldInfo[] = [];

  const walkRows = (rows: LayoutRowInput[]): void => {
    for (const row of rows) {
      if (row.type === "GROUP") {
        if (row.layout) walkRows(row.layout);
        continue;
      }
      if (row.type === "SUBTABLE" && row.code) {
        const def = fields[row.code];
        out.push({
          code: row.code,
          type: "SUBTABLE",
          label: def?.label ?? row.code,
          subColumns: subColumnsOf(def),
        });
        continue;
      }
      // Ordinary ROW: emit each element that maps to a value field.
      for (const el of row.fields ?? []) {
        if (!el.code) continue;
        const def = fields[el.code];
        if (!def) continue;
        out.push({ code: def.code, type: def.type, label: def.label });
      }
    }
  };

  walkRows(layout);
  return out;
}
