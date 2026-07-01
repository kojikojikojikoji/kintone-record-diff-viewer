// Builds a detail-screen URL for a record while keeping any guest-space prefix
// from the current path (spec 7.3). Pure so it can be unit tested.

// Extract the app base path ("/k/" or "/k/guest/<spaceId>/") from a pathname.
export function appBasePath(pathname: string): string {
  const guest = pathname.match(/^(\/k\/guest\/\d+\/)/);
  if (guest) return guest[1];
  return "/k/";
}

export function buildRecordUrl(
  pathname: string,
  appId: number | string,
  recordId: number | string,
): string {
  const base = appBasePath(pathname);
  return `${base}${appId}/show#record=${recordId}`;
}
