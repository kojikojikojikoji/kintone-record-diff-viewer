// The picker modal: search for and choose the record(s) to compare (spec 4.2 /
// 6.2). Detail launch chooses record B only (A is fixed). Index launch chooses
// both A and B. Search is debounced 300ms and capped at 20 candidates.
import { buildPickerQuery } from "../core/query";
import { fetchRecords } from "../kintone/rest";
import type { KintoneRecord } from "../core/types";
import { el, clear, openModal, type Modal } from "./ui";

const DEBOUNCE_MS = 300;
const RESULT_LIMIT = 20;

export interface PickerConfig {
  appId: number;
  pickerFields: string[];
  excludeId?: number;
}

interface Candidate {
  id: number;
  label: string;
}

function recordId(record: KintoneRecord): number {
  return Number((record["$id"]?.value ?? record["レコード番号"]?.value) as string);
}

function candidateLabel(record: KintoneRecord, pickerFields: string[]): string {
  const id = recordId(record);
  const values = pickerFields
    .map((code) => String(record[code]?.value ?? "").trim())
    .filter((v) => v.length > 0);
  // Full-width space (U+3000) between the record number and the field values.
  return values.length > 0 ? `${id}　${values.join(" / ")}` : String(id);
}

// One search box + candidate list + selection, reused for A and B.
class RecordSelector {
  readonly element: HTMLElement;
  private input: HTMLInputElement;
  private results: HTMLUListElement;
  private status: HTMLElement;
  private selectedBox: HTMLElement;
  private selected: Candidate | null = null;
  private candidates: Candidate[] = [];
  private activeIndex = -1;
  private timer: number | null = null;
  private requestSeq = 0;

  constructor(
    label: string,
    private config: PickerConfig,
    private onChange: () => void,
  ) {
    this.element = el("div", "kp-rdv-selector");
    const labelEl = el("label", "kp-rdv-picker__label", label);
    this.input = el("input", "kp-rdv-input");
    this.input.type = "text";
    this.input.placeholder =
      config.pickerFields.length > 0 ? "レコード番号またはキーワードを入力" : "レコード番号を入力";
    labelEl.htmlFor = `kp-rdv-input-${label}`;
    this.input.id = `kp-rdv-input-${label}`;
    this.results = el("ul", "kp-rdv-results");
    this.status = el("div", "kp-rdv-note");
    this.status.style.display = "none";
    this.selectedBox = el("div", "kp-rdv-selected");
    this.selectedBox.style.display = "none";

    this.input.addEventListener("input", () => this.scheduleSearch());
    this.input.addEventListener("keydown", (e) => this.onKeydown(e));

    this.element.append(labelEl, this.input, this.selectedBox, this.results, this.status);
  }

  getSelectedId(): number | null {
    return this.selected ? this.selected.id : null;
  }

  focus(): void {
    this.input.focus();
  }

  private scheduleSearch(): void {
    if (this.timer !== null) window.clearTimeout(this.timer);
    this.timer = window.setTimeout(() => void this.search(), DEBOUNCE_MS);
  }

  private setStatus(message: string, kind: "note" | "error" = "note"): void {
    if (!message) {
      this.status.style.display = "none";
      return;
    }
    this.status.className = kind === "error" ? "kp-rdv-error" : "kp-rdv-note";
    this.status.textContent = message;
    this.status.style.display = "block";
  }

  private async search(): Promise<void> {
    const input = this.input.value;
    if (input.length === 0) {
      this.candidates = [];
      this.renderResults();
      this.setStatus("");
      return;
    }
    const query = buildPickerQuery({
      fields: this.config.pickerFields,
      input,
      excludeId: this.config.excludeId,
    });
    if (!query) {
      this.candidates = [];
      this.renderResults();
      this.setStatus("");
      return;
    }
    const seq = ++this.requestSeq;
    clear(this.results);
    this.results.appendChild(el("li", "kp-rdv-spinner", "検索中…"));
    try {
      const records = await fetchRecords(this.config.appId, query);
      if (seq !== this.requestSeq) return;
      this.candidates = records
        .filter((r) => Number.isFinite(recordId(r)))
        .map((r) => ({ id: recordId(r), label: candidateLabel(r, this.config.pickerFields) }));
      this.activeIndex = -1;
      this.renderResults();
      if (this.candidates.length === 0) {
        this.setStatus("該当するレコードがありません。");
      } else if (this.candidates.length >= RESULT_LIMIT) {
        this.setStatus("上位20件を表示しています。キーワードを絞り込んでください。");
      } else {
        this.setStatus("");
      }
    } catch {
      if (seq !== this.requestSeq) return;
      clear(this.results);
      this.setStatus("検索に失敗しました。時間をおいて再度お試しください。", "error");
    }
  }

  private renderResults(): void {
    clear(this.results);
    this.candidates.forEach((candidate, index) => {
      const item = el("li", "kp-rdv-results__item", candidate.label);
      item.tabIndex = 0;
      item.setAttribute("role", "option");
      if (this.selected && this.selected.id === candidate.id) {
        item.classList.add("kp-rdv-results__item--selected");
      }
      if (index === this.activeIndex) item.classList.add("kp-rdv-results__item--active");
      item.addEventListener("click", () => this.select(candidate));
      this.results.appendChild(item);
    });
  }

  private onKeydown(event: KeyboardEvent): void {
    if (event.isComposing) return;
    if (this.candidates.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.activeIndex = Math.min(this.activeIndex + 1, this.candidates.length - 1);
      this.renderResults();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      this.activeIndex = Math.max(this.activeIndex - 1, 0);
      this.renderResults();
    } else if (event.key === "Enter" && this.activeIndex >= 0) {
      event.preventDefault();
      this.select(this.candidates[this.activeIndex]);
    }
  }

  private select(candidate: Candidate): void {
    this.selected = candidate;
    clear(this.selectedBox);
    this.selectedBox.append(document.createTextNode(`選択中: ${candidate.label}`));
    const clearLink = el("span", "kp-rdv-selected__clear", "解除");
    clearLink.setAttribute("role", "button");
    clearLink.tabIndex = 0;
    clearLink.addEventListener("click", () => this.deselect());
    this.selectedBox.appendChild(clearLink);
    this.selectedBox.style.display = "block";
    this.renderResults();
    this.onChange();
  }

  private deselect(): void {
    this.selected = null;
    this.selectedBox.style.display = "none";
    this.renderResults();
    this.onChange();
  }
}

export interface PickerResult {
  aId: number;
  bId: number;
}

export interface OpenPickerOptions {
  appId: number;
  pickerFields: string[];
  // Detail launch: A is fixed to this id and only B is chosen.
  fixedAId?: number;
  onConfirm: (result: PickerResult) => void;
}

export function openPicker(options: OpenPickerOptions): Modal {
  const isDual = options.fixedAId === undefined;
  const config: PickerConfig = {
    appId: options.appId,
    pickerFields: options.pickerFields,
    excludeId: options.fixedAId,
  };

  const content = el("div", "kp-rdv-modal kp-rdv-modal--picker");
  const header = el("div", "kp-rdv-modal__header");
  header.appendChild(el("h2", "kp-rdv-modal__title", "比較するレコードを選択"));
  const closeBtn = el("button", "kp-rdv-modal__close", "×");
  closeBtn.setAttribute("aria-label", "閉じる");
  header.appendChild(closeBtn);

  const body = el("div", "kp-rdv-modal__body");
  const errorLine = el("div", "kp-rdv-error");
  errorLine.style.display = "none";

  const selectorA = isDual ? new RecordSelector("レコードA", config, () => update()) : null;
  const selectorB = new RecordSelector("レコードB", config, () => update());
  if (selectorA) body.appendChild(selectorA.element);
  body.appendChild(selectorB.element);
  body.appendChild(errorLine);

  const footer = el("div", "kp-rdv-modal__footer");
  const cancelBtn = el("button", "kp-rdv-btn kp-rdv-btn--text", "キャンセル");
  const confirmBtn = el(
    "button",
    "kp-rdv-btn kp-rdv-btn--primary",
    "比較する",
  ) as HTMLButtonElement;
  confirmBtn.disabled = true;
  footer.append(cancelBtn, confirmBtn);

  content.append(header, body, footer);

  const modal = openModal(content);
  closeBtn.addEventListener("click", () => modal.close());
  cancelBtn.addEventListener("click", () => modal.close());

  function currentIds(): { aId: number | null; bId: number | null } {
    const aId = selectorA ? selectorA.getSelectedId() : (options.fixedAId as number);
    const bId = selectorB.getSelectedId();
    return { aId, bId };
  }

  function update(): void {
    const { aId, bId } = currentIds();
    confirmBtn.disabled = aId === null || bId === null;
    errorLine.style.display = "none";
  }

  confirmBtn.addEventListener("click", () => {
    const { aId, bId } = currentIds();
    if (aId === null || bId === null) return;
    if (aId === bId) {
      errorLine.textContent = "同じレコードが選択されています。別のレコードを選択してください。";
      errorLine.style.display = "block";
      return;
    }
    modal.close();
    options.onConfirm({ aId, bId });
  });

  (selectorA ?? selectorB).focus();
  update();
  return modal;
}
