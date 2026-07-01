import { describe, it, expect } from "vitest";
import { buildPickerQuery, escapeQueryValue } from "../../src/core/query";

describe("buildPickerQuery (spec FR-4)", () => {
  it("TC-16: two fields and a keyword", () => {
    expect(buildPickerQuery({ fields: ["f1", "f2"], input: "abc" })).toBe(
      '(f1 like "abc" or f2 like "abc") order by $id desc limit 20',
    );
  });

  it("TC-17: numeric input adds a $id equality clause", () => {
    const q = buildPickerQuery({ fields: ["f1", "f2"], input: "123" });
    expect(q).toContain("$id = 123 or (");
    expect(q).toContain('f1 like "123"');
  });

  it("TC-34: escapes double quote and backslash", () => {
    expect(escapeQueryValue('a"b\\c')).toBe('a\\"b\\\\c');
    const q = buildPickerQuery({ fields: ["f1"], input: 'a"b\\c' });
    expect(q).toContain('f1 like "a\\"b\\\\c"');
  });

  it("excludes the shown record when launched from a detail screen", () => {
    const q = buildPickerQuery({ fields: ["f1"], input: "abc", excludeId: 99 });
    expect(q).toBe('(f1 like "abc") and $id != 99 order by $id desc limit 20');
  });

  it("EC-5: numeric input works with no display fields", () => {
    expect(buildPickerQuery({ fields: [], input: "123" })).toBe(
      "$id = 123 order by $id desc limit 20",
    );
  });

  it("EC-5: non-numeric input with no display fields has nothing to search", () => {
    expect(buildPickerQuery({ fields: [], input: "abc" })).toBeNull();
  });
});
