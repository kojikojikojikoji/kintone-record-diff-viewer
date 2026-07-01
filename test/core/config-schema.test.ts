import { describe, it, expect } from "vitest";
import {
  parseConfig,
  serializeConfig,
  parseToggles,
  DEFAULT_TOGGLES,
} from "../../src/core/config-schema";

describe("parseConfig (spec 5.2)", () => {
  it("TC-18: parses a valid config", () => {
    const raw = JSON.stringify({
      version: 1,
      settings: {
        pickerFields: ["company_name", "quote_title"],
        tableMatching: [{ tableCode: "items", mode: "key", keyField: "product_code" }],
      },
    });
    const result = parseConfig(raw);
    expect(result.configured).toBe(true);
    if (result.configured) {
      expect(result.settings.pickerFields).toEqual(["company_name", "quote_title"]);
      expect(result.settings.tableMatching[0].keyField).toBe("product_code");
    }
  });

  it("TC-35: version 2 falls back to not configured", () => {
    const raw = JSON.stringify({ version: 2, settings: { pickerFields: ["a"] } });
    expect(parseConfig(raw).configured).toBe(false);
  });

  it("TC-35: broken JSON falls back without throwing", () => {
    expect(parseConfig("{not json").configured).toBe(false);
    expect(parseConfig(undefined).configured).toBe(false);
    expect(parseConfig("").configured).toBe(false);
  });

  it("rejects key mode without a keyField", () => {
    const raw = JSON.stringify({
      version: 1,
      settings: { pickerFields: ["a"], tableMatching: [{ tableCode: "t", mode: "key" }] },
    });
    expect(parseConfig(raw).configured).toBe(false);
  });

  it("rejects duplicate picker fields", () => {
    const raw = JSON.stringify({ version: 1, settings: { pickerFields: ["a", "a"] } });
    expect(parseConfig(raw).configured).toBe(false);
  });

  it("rejects more than three picker fields", () => {
    const raw = JSON.stringify({ version: 1, settings: { pickerFields: ["a", "b", "c", "d"] } });
    expect(parseConfig(raw).configured).toBe(false);
  });

  it("round-trips through serializeConfig", () => {
    const settings = { pickerFields: ["a"], tableMatching: [] };
    const parsed = parseConfig(serializeConfig(settings));
    expect(parsed.configured).toBe(true);
  });
});

describe("parseToggles (spec 7.4)", () => {
  it("defaults to diffOnly on, showSystem off", () => {
    expect(parseToggles(null)).toEqual(DEFAULT_TOGGLES);
    expect(parseToggles("garbage")).toEqual(DEFAULT_TOGGLES);
  });

  it("reads stored values", () => {
    expect(parseToggles(JSON.stringify({ diffOnly: false, showSystem: true }))).toEqual({
      diffOnly: false,
      showSystem: true,
    });
  });
});
