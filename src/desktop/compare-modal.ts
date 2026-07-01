// The comparison modal (spec 4.3 / 6.3). Fetches the form definition and both
// records, builds the diff model once, then renders a three-column table.
// Toggles filter the precomputed model without recomputing (spec 7.3).
import { fetchFormFields, fetchFormLayout, fetchRecord, isRecordNotFound } from "../kintone/rest";
import { buildRecordUrl } from "../kintone/url";
import { flattenLayout, type FormFieldInput, type LayoutRowInput } from "../core/layout";
import {
  buildDiffModel,
  selectVisibleRows,
  selectExportRows,
  type DiffModel,
  type DiffRow,
} from "../core/diff-model";
import { buildMarkdownTable } from "../core/markdown";
import type { InlineDiff } from "../core/lcs";
import type { TogglePrefs } from "../core/config-schema";
import type { Settings } from "../core/config-schema";
import { el, clear, openModal, showToast, type Modal } from "./ui";
import { loadToggles, saveToggles, toggleStorageKey } from "./storage";

export interface CompareOptions {
  appId: number;
  aId: number;
  bId: number;
  settings: Settings;
  userCode: string;
  timeZone: string;
}

export function openCompareModal(options: CompareOptions): Modal {
  const content = el("div", "kp-rdv-modal kp-rdv-modal--compare");
  const header = el("div", "kp-rdv-modal__header");
  header.appendChild(el("h2", "kp-rdv-modal__title", "レコード比較"));
  const closeBtn = el("button", "kp-rdv-modal__close", "×");
  closeBtn.setAttribute("aria-label", "閉じる");
  header.appendChild(closeBtn);

  const body = el("div", "kp-rdv-modal__body");
  body.appendChild(el("div", "kp-rdv-spinner", "レコードを取得しています…"));
  content.append(header, body);

  const modal = openModal(content);
  closeBtn.addEventListener("click", () => modal.close());

  void load(options, body);
  return modal;
}

async function load(options: CompareOptions, body: HTMLElement): Promise<void> {
  try {
    const [fields, layout, recordA, recordB] = await Promise.all([
      fetchFormFields(options.appId),
      fetchFormLayout(options.appId),
      fetchRecord(options.appId, options.aId),
      fetchRecord(options.appId, options.bId),
    ]);
    const ordered = flattenLayout(
      layout as LayoutRowInput[],
      fields as unknown as Record<string, FormFieldInput>,
    );
    const model = buildDiffModel(ordered, recordA, recordB, options.settings.tableMatching, {
      timeZone: options.timeZone,
    });
    renderComparison(options, body, model);
  } catch (error) {
    const deletedId = findDeletedId(error, options);
    clear(body);
    const message =
      deletedId !== null
        ? `レコード番号 ${deletedId} のレコードは削除されたため比較できません。`
        : "レコードを取得できませんでした。時間をおいて再度お試しください。";
    body.appendChild(el("div", "kp-rdv-empty", message));
  }
}

function findDeletedId(error: unknown, options: CompareOptions): number | null {
  if (!isRecordNotFound(error)) return null;
  // The API does not always name which id failed; report both attempted ids.
  return options.bId;
}

function renderComparison(options: CompareOptions, body: HTMLElement, model: DiffModel): void {
  const storageKey = toggleStorageKey(options.appId, options.userCode);
  const prefs = loadToggles(storageKey);

  clear(body);
  body.appendChild(buildToolbar(options, model, prefs, () => renderTable()));
  const tableHost = el("div", "kp-rdv-table-host");
  body.appendChild(tableHost);

  function renderTable(): void {
    clear(tableHost);
    const rows = selectVisibleRows(model, prefs.diffOnly, prefs.showSystem);
    if (rows.length === 0 && prefs.diffOnly) {
      tableHost.appendChild(el("div", "kp-rdv-empty", "差分はありません。"));
      return;
    }
    tableHost.appendChild(buildTable(rows, options));
  }

  renderTable();
}

function buildToolbar(
  options: CompareOptions,
  model: DiffModel,
  prefs: TogglePrefs,
  onToggle: () => void,
): HTMLElement {
  const storageKey = toggleStorageKey(options.appId, options.userCode);
  const toolbar = el("div", "kp-rdv-toolbar");

  const links = el("div", "kp-rdv-links");
  links.append(
    recordLink("A", options.aId, options.appId),
    recordLink("B", options.bId, options.appId),
  );
  toolbar.appendChild(links);

  toolbar.appendChild(
    buildToggle("差分のみ表示", prefs.diffOnly, (checked) => {
      prefs.diffOnly = checked;
      saveToggles(storageKey, prefs);
      onToggle();
    }),
  );
  toolbar.appendChild(
    buildToggle("システムフィールドを表示", prefs.showSystem, (checked) => {
      prefs.showSystem = checked;
      saveToggles(storageKey, prefs);
      onToggle();
    }),
  );

  const copyBtn = el("button", "kp-rdv-btn kp-rdv-btn--primary", "差分をコピー");
  copyBtn.addEventListener("click", () => copyDiff(model, prefs, options));
  toolbar.appendChild(copyBtn);
  return toolbar;
}

function recordLink(side: string, id: number, appId: number): HTMLElement {
  const wrap = el("span");
  wrap.appendChild(document.createTextNode(`${side}: レコード ${id}（`));
  const link = el("a", undefined, "詳細を開く");
  link.href = buildRecordUrl(location.pathname, appId, id);
  link.target = "_blank";
  link.rel = "noopener";
  wrap.appendChild(link);
  wrap.appendChild(document.createTextNode("）"));
  return wrap;
}

function buildToggle(
  label: string,
  checked: boolean,
  onChange: (checked: boolean) => void,
): HTMLElement {
  const wrap = el("label", "kp-rdv-toolbar__toggle");
  const input = el("input") as HTMLInputElement;
  input.type = "checkbox";
  input.checked = checked;
  input.addEventListener("change", () => onChange(input.checked));
  wrap.append(input, document.createTextNode(label));
  return wrap;
}

function buildTable(rows: DiffRow[], options: CompareOptions): HTMLElement {
  const table = el("table", "kp-rdv-table");
  const colgroup = el("colgroup");
  const c1 = el("col", "kp-rdv-col-name");
  const c2 = el("col", "kp-rdv-col-value");
  const c3 = el("col", "kp-rdv-col-value");
  colgroup.append(c1, c2, c3);
  table.appendChild(colgroup);

  const thead = el("thead");
  const headRow = el("tr");
  headRow.append(
    el("th", undefined, "フィールド名"),
    el("th", undefined, "レコードA"),
    el("th", undefined, "レコードB"),
  );
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = el("tbody");
  for (const row of rows) {
    const tr = el("tr");
    if (row.status !== "same") tr.classList.add(`kp-rdv-row--${row.status}`);
    tr.appendChild(el("td", undefined, row.label));
    tr.appendChild(buildCell(row, "a"));
    tr.appendChild(buildCell(row, "b"));
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  void options;
  return table;
}

function buildCell(row: DiffRow, side: "a" | "b"): HTMLTableCellElement {
  const td = el("td");
  const cell = el("div", "kp-rdv-cell kp-rdv-cell--collapsed");
  if (row.subColumns) {
    renderSubColumns(cell, row, side);
  } else if (row.type === "RICH_TEXT" && row.inline) {
    renderInline(cell, row.inline, side);
  } else {
    cell.appendChild(document.createTextNode(side === "a" ? row.aText : row.bText));
  }
  td.appendChild(cell);
  attachCollapse(td, cell);
  return td;
}

function renderSubColumns(cell: HTMLElement, row: DiffRow, side: "a" | "b"): void {
  for (const line of row.subColumns ?? []) {
    const lineEl = el("div");
    if (line.status !== "same" && row.status === "changed") {
      lineEl.classList.add("kp-rdv-sub-line--changed");
    }
    lineEl.textContent = `${line.label}: ${side === "a" ? line.aText : line.bText}`;
    cell.appendChild(lineEl);
  }
}

function renderInline(cell: HTMLElement, inline: InlineDiff, side: "a" | "b"): void {
  const skip = side === "a" ? "ins" : "del";
  const emphasis = side === "a" ? "del" : "ins";
  for (const seg of inline.segments) {
    if (seg.type === skip) continue;
    if (seg.type === emphasis) {
      const span = el("span", side === "a" ? "kp-rdv-del" : "kp-rdv-ins", seg.text);
      cell.appendChild(span);
    } else {
      cell.appendChild(document.createTextNode(seg.text));
    }
  }
}

// Adds a "すべて表示 / 折りたたむ" toggle when the value is taller than 5 lines
// (spec FR-11). Independent per cell.
function attachCollapse(td: HTMLElement, cell: HTMLElement): void {
  window.setTimeout(() => {
    if (cell.scrollHeight <= cell.clientHeight + 1) return;
    const toggle = el("span", "kp-rdv-cell__toggle", "すべて表示");
    toggle.setAttribute("role", "button");
    toggle.tabIndex = 0;
    let expanded = false;
    const apply = (): void => {
      expanded = !expanded;
      cell.classList.toggle("kp-rdv-cell--collapsed", !expanded);
      toggle.textContent = expanded ? "折りたたむ" : "すべて表示";
    };
    toggle.addEventListener("click", apply);
    toggle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        apply();
      }
    });
    td.appendChild(toggle);
  }, 0);
}

function copyDiff(model: DiffModel, prefs: TogglePrefs, options: CompareOptions): void {
  // Build the string synchronously before touching the clipboard so Safari
  // keeps the user-gesture permission (spec 7.5).
  const rows = selectExportRows(model, prefs.showSystem).map((row) => ({
    field: row.label,
    a: row.aText,
    b: row.bText,
  }));
  const markdown = buildMarkdownTable({ recordAId: options.aId, recordBId: options.bId, rows });
  try {
    navigator.clipboard.writeText(markdown).then(
      () => showToast("差分をコピーしました"),
      () => showToast("コピーできませんでした。ブラウザの権限設定を確認してください。", "error"),
    );
  } catch {
    showToast("コピーできませんでした。ブラウザの権限設定を確認してください。", "error");
  }
}
