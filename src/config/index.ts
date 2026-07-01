// Settings screen (spec 5). Reads the preview form fields, lets the admin pick
// up to three display fields and per-subtable row matching, then stores the
// config as a single JSON string. Field references are kept by field code so a
// rename does not break them (common spec).
import themeCss from "./theme.css?inline";
import { fetchFormFields, type FormFields } from "../kintone/rest";
import {
  parseConfig,
  serializeConfig,
  type Settings,
  type TableMatching,
} from "../core/config-schema";

const DISPLAY_FIELD_TYPES = new Set(["SINGLE_LINE_TEXT", "LINK"]);
const MAX_DISPLAY_FIELDS = 3;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function injectTheme(): void {
  if (document.getElementById("kp-rdv-config-theme")) return;
  const style = document.createElement("style");
  style.id = "kp-rdv-config-theme";
  style.textContent = themeCss;
  document.head.appendChild(style);
}

function option(value: string, label: string, selected: boolean): HTMLOptionElement {
  const opt = el("option", undefined, label);
  opt.value = value;
  opt.selected = selected;
  return opt;
}

function displayFieldOptions(fields: FormFields): { code: string; label: string }[] {
  return Object.keys(fields)
    .map((code) => fields[code])
    .filter((f) => DISPLAY_FIELD_TYPES.has(f.type))
    .map((f) => ({ code: f.code, label: f.label }));
}

function subtables(
  fields: FormFields,
): { code: string; label: string; columns: { code: string; label: string }[] }[] {
  return Object.keys(fields)
    .map((code) => fields[code])
    .filter((f) => f.type === "SUBTABLE" && f.fields)
    .map((f) => ({
      code: f.code,
      label: f.label,
      columns: Object.keys(f.fields!).map((c) => ({
        code: f.fields![c].code,
        label: f.fields![c].label,
      })),
    }));
}

function render(root: HTMLElement, fields: FormFields, current: Settings | null): void {
  const options = displayFieldOptions(fields);
  const tables = subtables(fields);
  const configured = current?.pickerFields ?? [];
  const matchingByTable = new Map((current?.tableMatching ?? []).map((t) => [t.tableCode, t]));

  const container = el("div", "kp-rdv-config");
  container.appendChild(el("h1", undefined, "レコード比較ビューア"));
  container.appendChild(
    el("p", "kp-rdv-config__lead", "2つのレコードを横並びで比較し、差分を表示します。"),
  );

  // --- Display fields card ---
  const displayCard = el("div", "kp-rdv-card");
  displayCard.appendChild(el("div", "kp-rdv-card__title", "検索対象フィールド"));
  const displayField = el("div", "kp-rdv-field");
  displayField.appendChild(el("div", "kp-rdv-field__label", "表示用フィールド（必須・最大3つ）"));
  displayField.appendChild(
    el(
      "div",
      "kp-rdv-field__help",
      "比較相手を検索するときの検索対象と、候補一覧の表示に使います。",
    ),
  );
  const selects = el("div", "kp-rdv-selects");
  const displaySelects: HTMLSelectElement[] = [];
  for (let i = 0; i < MAX_DISPLAY_FIELDS; i += 1) {
    const select = el("select", "kp-rdv-select") as HTMLSelectElement;
    select.appendChild(option("", "（未選択）", !configured[i]));
    for (const opt of options) {
      select.appendChild(option(opt.code, opt.label, configured[i] === opt.code));
    }
    displaySelects.push(select);
    selects.appendChild(select);
  }
  displayField.appendChild(selects);
  const displayError = el("div", "kp-rdv-error");
  displayError.style.display = "none";
  displayField.appendChild(displayError);
  displayCard.appendChild(displayField);
  container.appendChild(displayCard);

  // --- Subtable matching card ---
  const tableSelects = new Map<
    string,
    { mode: () => "index" | "key"; keyField: HTMLSelectElement }
  >();
  if (tables.length > 0) {
    const tableCard = el("div", "kp-rdv-card");
    tableCard.appendChild(el("div", "kp-rdv-card__title", "サブテーブルの行マッチング"));
    for (const table of tables) {
      const block = el("div", "kp-rdv-table-match");
      block.appendChild(el("div", "kp-rdv-field__label", `テーブル: ${table.label}`));
      const existing = matchingByTable.get(table.code);
      const isKey = existing?.mode === "key";
      const name = `kp-rdv-mode-${table.code}`;

      const indexRadio = el("label", "kp-rdv-radio");
      const indexInput = el("input") as HTMLInputElement;
      indexInput.type = "radio";
      indexInput.name = name;
      indexInput.value = "index";
      indexInput.checked = !isKey;
      indexRadio.append(indexInput, document.createTextNode("行の順序で突合（既定）"));

      const keyRadio = el("label", "kp-rdv-radio");
      const keyInput = el("input") as HTMLInputElement;
      keyInput.type = "radio";
      keyInput.name = name;
      keyInput.value = "key";
      keyInput.checked = isKey;
      const keySelect = el("select", "kp-rdv-select") as HTMLSelectElement;
      keySelect.appendChild(option("", "（キー列を選択）", !existing?.keyField));
      for (const col of table.columns) {
        keySelect.appendChild(option(col.code, col.label, existing?.keyField === col.code));
      }
      keySelect.disabled = !isKey;
      keyRadio.append(keyInput, document.createTextNode("キー列で突合  キー列: "), keySelect);

      indexInput.addEventListener("change", () => (keySelect.disabled = true));
      keyInput.addEventListener("change", () => (keySelect.disabled = false));

      block.append(indexRadio, keyRadio);
      tableCard.appendChild(block);
      tableSelects.set(table.code, {
        mode: () => (keyInput.checked ? "key" : "index"),
        keyField: keySelect,
      });
    }
    container.appendChild(tableCard);
  }

  // --- Save bar ---
  const bar = el("div", "kp-rdv-bar");
  const cancel = el("button", "kp-rdv-btn kp-rdv-btn--text", "キャンセル");
  cancel.addEventListener("click", () => history.back());
  const save = el("button", "kp-rdv-btn kp-rdv-btn--primary", "保存する");
  bar.append(cancel, save);
  container.appendChild(bar);

  save.addEventListener("click", () => {
    displayError.style.display = "none";
    const picked = displaySelects.map((s) => s.value).filter((v) => v.length > 0);
    if (picked.length === 0) {
      displayError.textContent = "表示用フィールドを1つ以上選択してください。";
      displayError.style.display = "block";
      return;
    }
    if (new Set(picked).size !== picked.length) {
      displayError.textContent =
        "同じフィールドが選択されています。別のフィールドを選択してください。";
      displayError.style.display = "block";
      return;
    }
    const tableMatching: TableMatching[] = [];
    for (const [tableCode, ctl] of tableSelects) {
      if (ctl.mode() !== "key") continue;
      const keyField = ctl.keyField.value;
      if (!keyField) {
        displayError.textContent = `テーブルのキー列を選択してください。`;
        displayError.style.display = "block";
        return;
      }
      tableMatching.push({ tableCode, mode: "key", keyField });
    }
    const settings: Settings = { pickerFields: picked, tableMatching };
    kintone.plugin.app.setConfig({ config: serializeConfig(settings) }, () => {
      history.back();
    });
  });

  root.appendChild(container);
}

async function boot(): Promise<void> {
  injectTheme();
  const root = document.getElementById("kp-rdv-config-root");
  if (!root) return;
  const appId = kintone.app.getId();
  if (appId === null) return;
  const config = kintone.plugin.app.getConfig(kintone.$PLUGIN_ID);
  const parsed = parseConfig(config?.config);
  const current = parsed.configured ? parsed.settings : null;
  try {
    const fields = await fetchFormFields(appId, true);
    render(root, fields, current);
  } catch {
    root.appendChild(
      el(
        "p",
        "kp-rdv-error",
        "フォーム情報を取得できませんでした。時間をおいて再度お試しください。",
      ),
    );
  }
}

void boot();
