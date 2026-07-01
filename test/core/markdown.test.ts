import { describe, it, expect } from "vitest";
import { buildMarkdownTable, escapeCell } from "../../src/core/markdown";

describe("buildMarkdownTable (spec FR-15)", () => {
  it("TC-15: renders a header plus one row per diff", () => {
    const md = buildMarkdownTable({
      recordAId: 123,
      recordBId: 456,
      rows: [
        { field: "会社名", a: "株式会社サンプル", b: "サンプル株式会社" },
        { field: "明細 #2", a: "数量: 10", b: "数量: 20" },
      ],
    });
    expect(md).toBe(
      [
        "| フィールド | レコードA (123) | レコードB (456) |",
        "| --- | --- | --- |",
        "| 会社名 | 株式会社サンプル | サンプル株式会社 |",
        "| 明細 #2 | 数量: 10 | 数量: 20 |",
      ].join("\n"),
    );
  });

  it("TC-36: escapes pipe to \\| and newline to <br>", () => {
    expect(escapeCell("a|b")).toBe("a\\|b");
    expect(escapeCell("line1\nline2")).toBe("line1<br>line2");
    // A value that already contains \| becomes \\|
    expect(escapeCell("\\|")).toBe("\\\\|");
  });
});
