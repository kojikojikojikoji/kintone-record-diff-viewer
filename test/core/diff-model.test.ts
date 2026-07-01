import { describe, it, expect } from "vitest";
import {
  buildDiffModel,
  selectVisibleRows,
  selectExportRows,
  hasAnyDiff,
  type FieldInfo,
} from "../../src/core/diff-model";
import type { KintoneRecord } from "../../src/core/types";

const fields: FieldInfo[] = [
  { code: "company", type: "SINGLE_LINE_TEXT", label: "会社名" },
  { code: "amount", type: "NUMBER", label: "金額" },
  { code: "note", type: "MULTI_LINE_TEXT", label: "備考" },
  {
    code: "items",
    type: "SUBTABLE",
    label: "明細",
    subColumns: [
      { code: "product", type: "SINGLE_LINE_TEXT", label: "品名" },
      { code: "qty", type: "NUMBER", label: "数量" },
    ],
  },
];

function subRow(product: string, qty: string) {
  return {
    value: {
      product: { type: "SINGLE_LINE_TEXT", value: product },
      qty: { type: "NUMBER", value: qty },
    },
  };
}

const recordA: KintoneRecord = {
  company: { type: "SINGLE_LINE_TEXT", value: "株式会社サンプル" },
  amount: { type: "NUMBER", value: "1000" },
  note: { type: "MULTI_LINE_TEXT", value: "至急対応" },
  items: { type: "SUBTABLE", value: [subRow("A", "10"), subRow("B", "20")] as never },
  作成者: { type: "CREATOR", value: { code: "u1", name: "User One" } as never },
  作成日時: { type: "CREATED_TIME", value: "2026-01-01T00:00:00Z" },
  更新者: { type: "MODIFIER", value: { code: "u1", name: "User One" } as never },
  更新日時: { type: "UPDATED_TIME", value: "2026-01-02T00:00:00Z" },
  レコード番号: { type: "RECORD_NUMBER", value: "123" },
  リビジョン: { type: "__REVISION__", value: "3" },
};

const recordB: KintoneRecord = {
  company: { type: "SINGLE_LINE_TEXT", value: "サンプル株式会社" },
  amount: { type: "NUMBER", value: "1000.0" },
  note: { type: "MULTI_LINE_TEXT", value: "" },
  items: { type: "SUBTABLE", value: [subRow("A", "10"), subRow("B", "25")] as never },
  作成者: { type: "CREATOR", value: { code: "u1", name: "User One" } as never },
  作成日時: { type: "CREATED_TIME", value: "2026-01-01T00:00:00Z" },
  更新者: { type: "MODIFIER", value: { code: "u2", name: "User Two" } as never },
  更新日時: { type: "UPDATED_TIME", value: "2026-01-03T00:00:00Z" },
  レコード番号: { type: "RECORD_NUMBER", value: "456" },
  リビジョン: { type: "__REVISION__", value: "5" },
};

describe("buildDiffModel", () => {
  const model = buildDiffModel(fields, recordA, recordB);

  it("classifies scalar rows", () => {
    const company = model.contentRows.find((r) => r.label === "会社名");
    const amount = model.contentRows.find((r) => r.label === "金額");
    const note = model.contentRows.find((r) => r.label === "備考");
    expect(company?.status).toBe("changed");
    expect(amount?.status).toBe("same"); // 1000 vs 1000.0
    expect(note?.status).toBe("onlyA"); // value only on A
  });

  it("expands subtable rows by index", () => {
    const subRows = model.contentRows.filter((r) => r.type === "SUBTABLE");
    expect(subRows.map((r) => r.status)).toEqual(["same", "changed"]);
    expect(subRows[1].label).toBe("明細 #2");
  });

  it("builds the six system rows", () => {
    expect(model.systemRows).toHaveLength(6);
    const recordNumber = model.systemRows.find((r) => r.label === "レコード番号");
    expect(recordNumber?.status).toBe("changed");
  });

  it("selectVisibleRows hides same rows when diffOnly is on", () => {
    const visible = selectVisibleRows(model, true, false);
    expect(visible.every((r) => r.status !== "same")).toBe(true);
    expect(visible.some((r) => r.label === "金額")).toBe(false);
  });

  it("selectVisibleRows appends system rows when showSystem is on", () => {
    const visible = selectVisibleRows(model, true, true);
    expect(visible.some((r) => r.isSystem)).toBe(true);
  });

  it("selectExportRows returns only diff rows", () => {
    const rows = selectExportRows(model, false);
    expect(rows.every((r) => r.status !== "same")).toBe(true);
    expect(hasAnyDiff(model, false)).toBe(true);
  });
});
