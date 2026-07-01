// Every selector-based DOM dependency lives here so a kintone UI change has a
// single place to fix. Official element getters are preferred over selectors
// (see rest.ts / desktop). CSS class and id prefixes keep this plugin from
// colliding with the rest of the series (spec 6 / common spec 4).
export const PREFIX = "kp-rdv";

export function detailHeaderMenu(): HTMLElement | null {
  return kintone.app.record.getHeaderMenuSpaceElement();
}

export function indexHeaderMenu(): HTMLElement | null {
  return kintone.app.getHeaderMenuSpaceElement();
}
