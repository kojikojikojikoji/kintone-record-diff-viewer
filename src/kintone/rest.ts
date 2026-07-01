// REST wrappers over @kintone/rest-api-client. The client builds guest-space
// URLs itself (common spec 5), so no path is assembled by hand here. Every call
// runs with the logged-in user's session; no API token is used.
import { KintoneRestAPIClient } from "@kintone/rest-api-client";
import type { KintoneRecord } from "../core/types";

let client: KintoneRestAPIClient | null = null;

function getClient(): KintoneRestAPIClient {
  if (!client) client = new KintoneRestAPIClient();
  return client;
}

export interface FormField {
  type: string;
  code: string;
  label: string;
  // Present on subtables: the inner fields keyed by field code.
  fields?: Record<string, { type: string; code: string; label: string }>;
}

export type FormFields = Record<string, FormField>;

export async function fetchFormFields(app: number, preview = false): Promise<FormFields> {
  const res = (await getClient().app.getFormFields({ app, preview })) as { properties: FormFields };
  return res.properties;
}

export interface LayoutRow {
  type: string;
  fields?: { type: string; code?: string }[];
  code?: string;
}

export async function fetchFormLayout(app: number): Promise<LayoutRow[]> {
  const res = (await getClient().app.getFormLayout({ app })) as { layout: LayoutRow[] };
  return res.layout;
}

export async function fetchRecords(app: number, query: string): Promise<KintoneRecord[]> {
  const res = await getClient().record.getRecords({ app, query });
  return res.records as unknown as KintoneRecord[];
}

export async function fetchRecord(app: number, id: number | string): Promise<KintoneRecord> {
  const res = await getClient().record.getRecord({ app, id });
  return res.record as unknown as KintoneRecord;
}

// Distinguish "record was deleted" (spec EC-2) from other failures.
export function isRecordNotFound(error: unknown): boolean {
  const e = error as { code?: string; status?: number };
  return e?.code === "GAIA_RE01" || e?.status === 404;
}
