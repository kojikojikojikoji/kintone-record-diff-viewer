# kintone Record Diff Viewer

Documentation in Japanese: [README.ja.md](./README.ja.md)

Compare two records in the same kintone app side by side and see what differs. A
button on the detail and list screens opens a picker to choose the records, then
a modal shows a three-column table (field name, record A, record B) with changed
rows highlighted.

All processing runs in the browser and through the kintone REST API. The plugin
sends nothing to any external server and stores no API token; every request uses
the signed-in user's session.

## What it does

- Adds a launch button to the record detail screen ("他のレコードと比較") and the
  list screen ("レコードを比較").
- Searches records by up to three display fields, or by record number, with a
  300 ms debounce and a 20-candidate cap.
- Highlights each row by difference type: changed (yellow), value only on A
  (red), value only on B (green). Equal rows are left plain.
- Shows a character/word-level inline diff for rich-text fields. Runs of ASCII
  alphanumerics are treated as words and Japanese text as characters. When less
  than 10% of tokens match, the values are shown as a full replacement.
- Matches subtable rows by row order or by a key column you choose, and marks
  added, deleted, and changed rows.
- Copies the visible differences to the clipboard as a Markdown table.
- Remembers the "diff only" and "show system fields" toggles per app and user.

## Screens and scope

- Supported: record detail screen and record list screen (desktop browsers:
  Chrome, Edge, Firefox, Safari).
- Not supported: mobile (the three-column layout does not fit a phone width),
  comparing three or more records, comparing across apps, and comparing against
  a past revision.

## Field comparison rules

| Field type | Rule |
| --- | --- |
| Single/multi line text, link | Exact string match. Surrounding spaces count. |
| Rich text | Compared as plain text (markup dropped, `<img>` becomes `[画像]`). Displayed with an inline diff. |
| Number, calculated | Compared as numbers. `1000` and `1000.0` are equal. Empty and `0` differ. |
| Date, time, datetime | Compared by API value. Datetime is displayed in the user's time zone. |
| Radio, dropdown | Single-value match. |
| Checkbox, multi-select | Compared as an unordered set. |
| User, organization, group | Compared by code; names are ignored. |
| Attachment | Compared by file name and size only, as a multiset. |
| Lookup | Compared by the underlying field's rule. |
| Subtable | Matched row by row (by index or key), then compared per column. |

## Install

1. Install dependencies and build:
   ```
   npm install
   npm run build
   ```
2. Package the plugin into a zip:
   ```
   npm run pack
   ```
   The first run creates `private.ppk` and prints the plugin id. Keep this key
   private (it is git-ignored) so future versions upload as an update to the
   same plugin. The signed zip is written to `dist/plugin.zip`.
3. In kintone, open the system or app plugin settings and upload
   `dist/plugin.zip`, then add the plugin to the app.

## Configure

Open the plugin settings from the app.

1. Under "検索対象フィールド", choose one to three display fields. Only single-line
   text and link fields (and lookups based on them) can be chosen, because the
   picker searches them with a `like` query.
2. Under "サブテーブルの行マッチング", pick, for each subtable, whether to match rows
   by order (default) or by a key column. When you choose a key column, rows with
   the same key value are compared to each other.
3. Save.

## Local storage

The plugin stores the two display toggles under a key of the form
`kp-rdv-<host>-<appId>-<userCode>` with the value
`{"diffOnly":true,"showSystem":false}`. This holds display preferences only. To
reset it, clear that key in the browser's developer tools (Application, Local
Storage) or clear site data.

## Develop

```
npm install
npm run typecheck   # tsc --noEmit
npm test            # Vitest unit tests for src/core
npm run build       # emits dist/desktop.js and dist/config.js as IIFE bundles
npm run pack        # builds then signs dist/plugin.zip
npm run lint        # ESLint
```

End-to-end specs live in `test/e2e` (Playwright). They read the connection
target from `KINTONE_BASE_URL`, `KINTONE_USERNAME`, `KINTONE_PASSWORD`, and
`KINTONE_APP_ID`, and skip themselves when those are not set.

## Limitations and TODO

- Attachments are compared by name and size only. A same-name, same-size file
  with different content reads as equal.
- Rich-text differences in styling only (bold, color) are not detected, because
  comparison uses the plain-text form.
- The manual browser matrix in `docs/release-checklist.md` and screenshots have
  not been captured yet.

## License

MIT. See [LICENSE](./LICENSE).
