import { describe, it, expect } from "vitest";
import { buildRecordUrl, appBasePath } from "../../src/kintone/url";

describe("buildRecordUrl (spec 7.3)", () => {
  it("builds a standard record URL", () => {
    expect(buildRecordUrl("/k/12/", 12, 345)).toBe("/k/12/show#record=345");
  });

  it("keeps a guest-space prefix", () => {
    expect(appBasePath("/k/guest/7/12/show")).toBe("/k/guest/7/");
    expect(buildRecordUrl("/k/guest/7/12/show", 12, 345)).toBe("/k/guest/7/12/show#record=345");
  });
});
