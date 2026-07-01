// Shared types for the comparison core. Nothing here touches kintone globals
// or the DOM, so every function in core/ can be unit tested in isolation.

// Result of comparing a single field (or a subtable row) between record A and B.
// - same: values are equal (both empty counts as same)
// - changed: both sides hold a value and the values differ
// - onlyA: only record A holds a value
// - onlyB: only record B holds a value
export type DiffStatus = "same" | "changed" | "onlyA" | "onlyB";

// kintone field type strings used by the comparison rules. Values that this
// plugin does not compare (CATEGORY, STATUS, STATUS_ASSIGNEE, GROUP layout,
// SPACER, LABEL, HR, REFERENCE_TABLE) are intentionally omitted.
export type FieldType =
  | "SINGLE_LINE_TEXT"
  | "MULTI_LINE_TEXT"
  | "RICH_TEXT"
  | "NUMBER"
  | "CALC"
  | "DATE"
  | "TIME"
  | "DATETIME"
  | "RADIO_BUTTON"
  | "DROP_DOWN"
  | "CHECK_BOX"
  | "MULTI_SELECT"
  | "USER_SELECT"
  | "ORGANIZATION_SELECT"
  | "GROUP_SELECT"
  | "FILE"
  | "LINK"
  | "SUBTABLE"
  | "CREATOR"
  | "MODIFIER"
  | "CREATED_TIME"
  | "UPDATED_TIME"
  | "RECORD_NUMBER"
  | "__ID__"
  | "__REVISION__";

// A single field entry as returned inside a kintone record. The value shape
// depends on the type; comparators narrow it as needed.
export interface FieldValue {
  type: string;
  value: unknown;
}

// A kintone record: a map of field code to field value.
export type KintoneRecord = Record<string, FieldValue>;

// A subtable row as returned by the REST API.
export interface SubtableRow {
  id?: string;
  value: KintoneRecord;
}

// An entry from a user/organization/group select field.
export interface Entity {
  code: string;
  name: string;
}

// An attachment entry. Only name and size are compared (see spec 10).
export interface FileEntry {
  name: string;
  size: string;
  contentType?: string;
  fileKey?: string;
}
