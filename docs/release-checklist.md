# Release checklist

Run before publishing a new version. The automated checks (typecheck, unit
tests, build) run in CI; the matrix below is manual.

## Automated (must pass)

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build` produces `dist/desktop.js` and `dist/config.js`
- [ ] `npm run pack` produces `dist/plugin.zip`

## Manual browser and screen matrix

Install the plugin on a demo app configured with two display fields and a
subtable key column, then run the basic compare flow (TC-19) in each cell.

| Screen | Chrome | Edge | Firefox | Safari |
| --- | --- | --- | --- | --- |
| List launch -> picker -> compare | | | | |
| Detail launch -> picker -> compare | | | | |
| Toggle "diff only" off and reopen (persists) | | | | |
| Toggle "show system fields" (six rows appear) | | | | |
| Copy diff to clipboard (Markdown) | | | | |
| Expand/collapse a long cell | | | | |
| Rich-text inline diff renders | | | | |
| Subtable added/deleted/changed rows render | | | | |

## Focused manual checks

- [ ] Safari: "差分をコピー" succeeds and shows the success toast (spec TC-26).
- [ ] 500-field app: compare modal opens within 3 seconds (spec TC-41).
- [ ] Field-level access control: restricted rows are hidden, no console error
      (spec TC-42).
- [ ] Display fields removed from the app: picker still searches by record
      number and the admin notice appears once (spec TC-43).
- [ ] Select the same record for A and B on list launch: blocked with the
      message, modal does not open (spec TC-37).
- [ ] Delete a chosen record before pressing compare: the deleted-record message
      and a single "閉じる" button appear (spec TC-39).

## Regression watch

- [ ] Fast navigation list -> detail -> edit -> list does not double-insert the
      launch button or stack listeners.
- [ ] Another plugin from the series installed on the same app: no CSS or DOM id
      collision.
- [ ] IME composition: pressing Enter mid-conversion in the picker does not
      select a candidate.
