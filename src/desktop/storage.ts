// Reads and writes the display-toggle state in localStorage (spec 7.4). The key
// is scoped by domain, app, and user so it never collides with other apps,
// users, or the other plugins in the series (common spec 6). Only low-risk
// display preferences are stored here.
import { parseToggles, type TogglePrefs } from "../core/config-schema";

export function toggleStorageKey(appId: number | string, userCode: string): string {
  return `kp-rdv-${location.host}-${appId}-${userCode}`;
}

export function loadToggles(key: string): TogglePrefs {
  try {
    return parseToggles(localStorage.getItem(key));
  } catch {
    return parseToggles(null);
  }
}

export function saveToggles(key: string, prefs: TogglePrefs): void {
  try {
    localStorage.setItem(key, JSON.stringify(prefs));
  } catch {
    // Storage may be unavailable (private mode); toggles still work in-session.
  }
}
