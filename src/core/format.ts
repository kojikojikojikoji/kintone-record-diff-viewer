// Converts an API field value to the string shown in a comparison cell and in
// the Markdown export. Pure: date/time formatting takes an explicit time zone
// so it does not read kintone globals.
import type { Entity, FileEntry } from "./types";
import { htmlToText } from "./richtext";

export interface FormatOptions {
  // IANA time zone for DATETIME display (spec 4.4). Defaults to UTC.
  timeZone?: string;
}

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function joinStrings(value: unknown): string {
  return Array.isArray(value) ? value.map(asString).join(", ") : "";
}

function joinNames(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .filter((v): v is Entity => !!v && typeof v === "object")
    .map((v) => asString(v.name) || asString(v.code))
    .join(", ");
}

function joinFiles(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .filter((v): v is FileEntry => !!v && typeof v === "object")
    .map((v) => asString(v.name))
    .join(", ");
}

function formatDateTime(value: string, timeZone: string | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      timeZone: timeZone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return value;
  }
}

export function formatValue(type: string, value: unknown, opts: FormatOptions = {}): string {
  switch (type) {
    case "RICH_TEXT":
      return htmlToText(asString(value));
    case "CHECK_BOX":
    case "MULTI_SELECT":
      return joinStrings(value);
    case "USER_SELECT":
    case "ORGANIZATION_SELECT":
    case "GROUP_SELECT":
      return joinNames(value);
    case "FILE":
      return joinFiles(value);
    case "CREATOR":
    case "MODIFIER":
      return value && typeof value === "object" ? asString((value as Entity).name) : "";
    case "DATETIME":
    case "CREATED_TIME":
    case "UPDATED_TIME":
      return formatDateTime(asString(value), opts.timeZone);
    default:
      return asString(value);
  }
}
