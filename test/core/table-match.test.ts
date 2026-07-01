import { describe, it, expect } from "vitest";
import { matchRows, type ColumnSpec } from "../../src/core/table-match";
import type { SubtableRow } from "../../src/core/types";

function row(code: string, qty: string): SubtableRow {
  return {
    value: { code: { type: "SINGLE_LINE_TEXT", value: code }, qty: { type: "NUMBER", value: qty } },
  };
}

const columns: ColumnSpec[] = [
  { code: "code", type: "SINGLE_LINE_TEXT" },
  { code: "qty", type: "NUMBER" },
];

describe("matchRows (spec 4.6)", () => {
  it("TC-13: index match with 3 A rows and 5 B rows -> 3 changed + 2 added", () => {
    const a = [row("P1", "1"), row("P2", "2"), row("P3", "3")];
    const b = [row("P1", "10"), row("P2", "20"), row("P3", "30"), row("P4", "40"), row("P5", "50")];
    const result = matchRows(a, b, { mode: "index", columns });
    expect(result).toHaveLength(5);
    expect(result.slice(0, 3).map((r) => r.status)).toEqual(["changed", "changed", "changed"]);
    expect(result.slice(3).map((r) => r.status)).toEqual(["onlyB", "onlyB"]);
  });

  it("TC-14: key match ignores row order -> all same", () => {
    const a = [row("P1", "1"), row("P2", "2")];
    const b = [row("P2", "2"), row("P1", "1")];
    const result = matchRows(a, b, { mode: "key", keyField: "code", columns });
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.status === "same")).toBe(true);
  });

  it("TC-33: duplicate keys match in appearance order without throwing", () => {
    const a = [row("P1", "1"), row("P1", "2")];
    const b = [row("P1", "1"), row("P1", "2")];
    const result = matchRows(a, b, { mode: "key", keyField: "code", columns });
    expect(result).toHaveLength(2);
    expect(result.map((r) => r.status)).toEqual(["same", "same"]);
  });

  it("EC-6: key match falls back to index when the key column is gone", () => {
    const a = [row("P1", "1")];
    const b = [row("P1", "1")];
    const result = matchRows(a, b, { mode: "key", keyField: "missing", columns });
    expect(result).toHaveLength(1);
    expect(result[0].index).toBe(1);
  });

  it("key match marks A-only as deletion and B-only as addition", () => {
    const a = [row("P1", "1")];
    const b = [row("P2", "2")];
    const result = matchRows(a, b, { mode: "key", keyField: "code", columns });
    expect(result.map((r) => r.status)).toEqual(["onlyA", "onlyB"]);
  });
});
