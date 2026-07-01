import { describe, it, expect } from "vitest";
import { tokenize } from "../../src/core/tokenize";

describe("tokenize (spec FR-13)", () => {
  it("TC-9: splits 単価1,000円 into char and number-run tokens", () => {
    expect(tokenize("単価1,000円")).toEqual(["単", "価", "1", ",", "000", "円"]);
  });

  it("keeps a run of alphanumerics as one token", () => {
    expect(tokenize("abc123")).toEqual(["abc123"]);
  });

  it("keeps a run of whitespace as one token", () => {
    expect(tokenize("a  b")).toEqual(["a", "  ", "b"]);
  });

  it("keeps surrogate-pair characters intact", () => {
    expect(tokenize("𩸽A")).toEqual(["𩸽", "A"]);
  });
});
