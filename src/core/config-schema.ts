// Plugin settings schema and safe parsing (spec 5.2). Stored as a JSON string
// under the single config key `config`. Any invalid or older-version value
// falls back to "not configured" so a bad config never breaks a screen.
import { z } from "zod";

export const CONFIG_VERSION = 1;

const TableMatchingSchema = z
  .object({
    tableCode: z.string().min(1),
    mode: z.enum(["index", "key"]),
    keyField: z.string().min(1).optional(),
  })
  .strict()
  .refine((m) => m.mode !== "key" || !!m.keyField, {
    message: "keyField is required when mode is key",
  });

const SettingsSchema = z
  .object({
    pickerFields: z
      .array(z.string().min(1))
      .min(1)
      .max(3)
      .refine((arr) => new Set(arr).size === arr.length, {
        message: "pickerFields must be unique",
      }),
    tableMatching: z.array(TableMatchingSchema).default([]),
  })
  .strict();

const ConfigSchema = z
  .object({
    version: z.literal(CONFIG_VERSION),
    settings: SettingsSchema,
  })
  .strict();

export type Settings = z.infer<typeof SettingsSchema>;
export type TableMatching = z.infer<typeof TableMatchingSchema>;

export type ParsedConfig = { configured: true; settings: Settings } | { configured: false };

// Parse a stored config string. Never throws.
export function parseConfig(raw: string | null | undefined): ParsedConfig {
  if (!raw) return { configured: false };
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return { configured: false };
  }
  const result = ConfigSchema.safeParse(json);
  if (!result.success) return { configured: false };
  return { configured: true, settings: result.data.settings };
}

// Serialize settings back to the stored JSON string.
export function serializeConfig(settings: Settings): string {
  return JSON.stringify({ version: CONFIG_VERSION, settings });
}

export interface TogglePrefs {
  diffOnly: boolean;
  showSystem: boolean;
}

export const DEFAULT_TOGGLES: TogglePrefs = { diffOnly: true, showSystem: false };

// Parse the localStorage toggle state (spec 7.4). Falls back to defaults.
export function parseToggles(raw: string | null | undefined): TogglePrefs {
  if (!raw) return { ...DEFAULT_TOGGLES };
  try {
    const json = JSON.parse(raw) as Partial<TogglePrefs>;
    return {
      diffOnly: typeof json.diffOnly === "boolean" ? json.diffOnly : DEFAULT_TOGGLES.diffOnly,
      showSystem:
        typeof json.showSystem === "boolean" ? json.showSystem : DEFAULT_TOGGLES.showSystem,
    };
  } catch {
    return { ...DEFAULT_TOGGLES };
  }
}
