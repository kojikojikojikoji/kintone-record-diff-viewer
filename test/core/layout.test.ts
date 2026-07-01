import { describe, it, expect } from "vitest";
import { flattenLayout, type LayoutRowInput, type FormFieldInput } from "../../src/core/layout";

const fields: Record<string, FormFieldInput> = {
  company: { type: "SINGLE_LINE_TEXT", code: "company", label: "会社名" },
  amount: { type: "NUMBER", code: "amount", label: "金額" },
  memo: { type: "MULTI_LINE_TEXT", code: "memo", label: "メモ" },
  items: {
    type: "SUBTABLE",
    code: "items",
    label: "明細",
    fields: {
      product: { type: "SINGLE_LINE_TEXT", code: "product", label: "品名" },
      qty: { type: "NUMBER", code: "qty", label: "数量" },
    },
  },
};

describe("flattenLayout (spec FR-6)", () => {
  it("keeps form order, expands groups, drops value-less elements", () => {
    const layout: LayoutRowInput[] = [
      { type: "ROW", fields: [{ type: "SINGLE_LINE_TEXT", code: "company" }, { type: "LABEL" }] },
      {
        type: "GROUP",
        code: "grp",
        layout: [{ type: "ROW", fields: [{ type: "NUMBER", code: "amount" }] }],
      },
      { type: "SUBTABLE", code: "items" },
      { type: "ROW", fields: [{ type: "MULTI_LINE_TEXT", code: "memo" }, { type: "SPACER" }] },
    ];
    const result = flattenLayout(layout, fields);
    expect(result.map((f) => f.code)).toEqual(["company", "amount", "items", "memo"]);
    const sub = result.find((f) => f.code === "items");
    expect(sub?.subColumns?.map((c) => c.code)).toEqual(["product", "qty"]);
  });
});
