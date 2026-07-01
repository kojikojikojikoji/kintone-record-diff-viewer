// Builds the picker search query (spec FR-4). The raw input is treated as a
// single term (spaces are not split). Double quote and backslash are escaped
// before being embedded so a value cannot break the query (spec EC-14).

const NUMERIC = /^[0-9]+$/;

export function escapeQueryValue(input: string): string {
  return input.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export interface QueryOptions {
  // Display field codes to search with `like` (may be empty; see spec EC-5).
  fields: string[];
  input: string;
  // When launched from a detail screen, exclude the shown record (spec FR-4).
  excludeId?: string | number;
}

// Returns the query string, or null when there is nothing to search
// (no display fields configured and the input is not a record number).
export function buildPickerQuery(opts: QueryOptions): string | null {
  const { fields, input, excludeId } = opts;
  const trimmedInput = input;
  const escaped = escapeQueryValue(trimmedInput);
  const likeGroup =
    fields.length > 0 ? `(${fields.map((code) => `${code} like "${escaped}"`).join(" or ")})` : "";
  const numeric = NUMERIC.test(trimmedInput);

  let base: string;
  if (numeric && likeGroup) {
    base = `($id = ${trimmedInput} or ${likeGroup})`;
  } else if (numeric) {
    base = `$id = ${trimmedInput}`;
  } else if (likeGroup) {
    base = likeGroup;
  } else {
    // No display fields and a non-numeric input: nothing to match on.
    return null;
  }

  const withExclude = excludeId !== undefined ? `${base} and $id != ${excludeId}` : base;
  return `${withExclude} order by $id desc limit 20`;
}
