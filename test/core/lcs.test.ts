import { describe, it, expect } from "vitest";
import { diffSegments, inlineDiff, type Segment } from "../../src/core/lcs";
import { tokenize } from "../../src/core/tokenize";

function seg(a: string, b: string): Segment[] {
  return diffSegments(tokenize(a), tokenize(b));
}

describe("inline diff LCS (spec 4.5)", () => {
  it("TC-10: example 1 replacement 30 -> 60", () => {
    expect(seg("有効期限は30日とする。", "有効期限は60日とする。")).toEqual([
      { type: "same", text: "有効期限は" },
      { type: "del", text: "30" },
      { type: "ins", text: "60" },
      { type: "same", text: "日とする。" },
    ]);
  });

  it("TC-11: example 2 insertion only", () => {
    expect(seg("送料は当社負担。", "送料は原則当社負担。")).toEqual([
      { type: "same", text: "送料は" },
      { type: "ins", text: "原則" },
      { type: "same", text: "当社負担。" },
    ]);
  });

  it("TC-12: example 3 numeric and character mix", () => {
    expect(seg("単価1,000円(税別)", "単価1,200円(税込)")).toEqual([
      { type: "same", text: "単価1," },
      { type: "del", text: "000" },
      { type: "ins", text: "200" },
      { type: "same", text: "円(税" },
      { type: "del", text: "別" },
      { type: "ins", text: "込" },
      { type: "same", text: ")" },
    ]);
  });

  it("TC-31: example 4 under-10% match becomes full replacement", () => {
    const result = inlineDiff("検収後30日以内に支払う。", "月末締め翌月末払い。");
    expect(result.mode).toBe("full");
    expect(result.segments).toEqual([
      { type: "del", text: "検収後30日以内に支払う。" },
      { type: "ins", text: "月末締め翌月末払い。" },
    ]);
  });

  it("TC-32: over 3000 tokens falls back to plain (no inline diff)", () => {
    const result = inlineDiff("あ".repeat(3001), "い");
    expect(result.mode).toBe("plain");
    expect(result.segments).toEqual([]);
  });

  it("segments mode for a normal change", () => {
    const result = inlineDiff("有効期限は30日とする。", "有効期限は60日とする。");
    expect(result.mode).toBe("segments");
  });
});
