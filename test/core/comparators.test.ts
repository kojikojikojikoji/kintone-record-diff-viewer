import { describe, it, expect } from "vitest";
import { compareField } from "../../src/core/comparators";

describe("compareField (spec 4.4)", () => {
  it("TC-1: identical single-line text is same", () => {
    expect(compareField("SINGLE_LINE_TEXT", "ABC", "ABC")).toBe("same");
  });

  it("TC-2: 1000 and 1000.0 are same as numbers", () => {
    expect(compareField("NUMBER", "1000", "1000.0")).toBe("same");
  });

  it("TC-3: two empty numbers are same", () => {
    expect(compareField("NUMBER", "", "")).toBe("same");
  });

  it("TC-28: empty and 0 differ", () => {
    expect(compareField("NUMBER", "", "0")).toBe("changed");
  });

  it("TC-29: trailing space makes text changed", () => {
    expect(compareField("SINGLE_LINE_TEXT", "ABC", "ABC ")).toBe("changed");
  });

  it("TC-4: checkbox sets ignore order", () => {
    expect(compareField("CHECK_BOX", ["A", "B"], ["B", "A"])).toBe("same");
    expect(compareField("MULTI_SELECT", ["A"], ["A", "B"])).toBe("changed");
  });

  it("TC-5: user select compares code, ignores name", () => {
    const a = [{ code: "u1", name: "Old Name" }];
    const b = [{ code: "u1", name: "New Name" }];
    expect(compareField("USER_SELECT", a, b)).toBe("same");
    expect(compareField("USER_SELECT", a, [{ code: "u2", name: "New Name" }])).toBe("changed");
  });

  it("TC-6: attachments compare as a multiset by name and size", () => {
    const a = [
      { name: "a.pdf", size: "100" },
      { name: "b.pdf", size: "200" },
    ];
    const b = [
      { name: "b.pdf", size: "200" },
      { name: "a.pdf", size: "100" },
    ];
    expect(compareField("FILE", a, b)).toBe("same");
  });

  it("TC-30: attachment size change and count change are changed", () => {
    expect(
      compareField("FILE", [{ name: "a.pdf", size: "100" }], [{ name: "a.pdf", size: "200" }]),
    ).toBe("changed");
    expect(
      compareField(
        "FILE",
        [{ name: "a.pdf", size: "100" }],
        [
          { name: "a.pdf", size: "100" },
          { name: "a.pdf", size: "100" },
        ],
      ),
    ).toBe("changed");
  });

  it("TC-7: same UTC datetime is same", () => {
    expect(compareField("DATETIME", "2026-01-01T00:00:00Z", "2026-01-01T00:00:00Z")).toBe("same");
  });

  it("TC-8: rich text differing only in markup is same", () => {
    expect(compareField("RICH_TEXT", "<b>A</b>", "A")).toBe("same");
  });

  it("presence: value only on one side yields onlyA / onlyB", () => {
    expect(compareField("SINGLE_LINE_TEXT", "value", "")).toBe("onlyA");
    expect(compareField("SINGLE_LINE_TEXT", "", "value")).toBe("onlyB");
  });

  it("radio unselected on one side is onlyA / onlyB", () => {
    expect(compareField("DROP_DOWN", "X", "")).toBe("onlyA");
  });
});
