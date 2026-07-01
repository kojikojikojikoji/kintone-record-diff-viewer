// Desktop entry point. Registers the detail and list handlers, inserts the
// launch button, and wires the picker to the comparison modal. No mobile events
// are registered (spec 3 / 7.1).
import { parseConfig, type Settings } from "../core/config-schema";
import { fetchFormFields, type FormFields } from "../kintone/rest";
import { detailHeaderMenu, indexHeaderMenu } from "../kintone/dom-map";
import { injectStyles } from "./styles";
import { el, showToast } from "./ui";
import { openPicker } from "./picker";
import { openCompareModal } from "./compare-modal";

const DETAIL_BUTTON_ID = "kp-rdv-launch-detail";
const INDEX_BUTTON_ID = "kp-rdv-launch-index";

// Field types allowed as display fields (spec CF-1). Lookups appear as their
// base type, so text and link cover the like-searchable set.
const DISPLAY_FIELD_TYPES = new Set(["SINGLE_LINE_TEXT", "LINK"]);

function loadSettings(): Settings | null {
  const config = kintone.plugin.app.getConfig(kintone.$PLUGIN_ID);
  const parsed = parseConfig(config?.config);
  return parsed.configured ? parsed.settings : null;
}

function loginContext(): { userCode: string; timeZone: string } {
  const user = kintone.getLoginUser();
  return { userCode: user.code, timeZone: user.timeZone };
}

// Keep only the display fields that still exist with a searchable type. Warns
// the admin once when some are missing (spec EC-5 / common spec).
function usableDisplayFields(configured: string[], fields: FormFields): string[] {
  const usable = configured.filter((code) => {
    const def = fields[code];
    return !!def && DISPLAY_FIELD_TYPES.has(def.type);
  });
  if (usable.length < configured.length) {
    const missing = configured.filter((code) => !usable.includes(code));
    console.warn(`[record-diff-viewer] Display fields unavailable: ${missing.join(", ")}`);
    if (usable.length === 0) {
      showToast("表示用フィールドが見つかりません。設定を確認してください。", "error");
    }
  }
  return usable;
}

async function launch(appId: number, settings: Settings, fixedAId?: number): Promise<void> {
  let pickerFields = settings.pickerFields;
  try {
    const fields = await fetchFormFields(appId);
    pickerFields = usableDisplayFields(settings.pickerFields, fields);
  } catch {
    // If the form cannot be read, fall back to the configured codes.
  }
  const ctx = loginContext();
  openPicker({
    appId,
    pickerFields,
    fixedAId,
    onConfirm: ({ aId, bId }) => {
      openCompareModal({
        appId,
        aId,
        bId,
        settings,
        userCode: ctx.userCode,
        timeZone: ctx.timeZone,
      });
    },
  });
}

function insertButton(host: HTMLElement, id: string, label: string, onClick: () => void): void {
  if (document.getElementById(id)) return; // idempotent across SPA re-renders
  const button = el("button", "kp-rdv-btn kp-rdv-launch", label);
  button.id = id;
  button.type = "button";
  button.addEventListener("click", onClick);
  host.appendChild(button);
}

kintone.events.on("app.record.detail.show", (event) => {
  injectStyles();
  const settings = loadSettings();
  const host = detailHeaderMenu();
  if (!settings || !host || event.recordId === undefined) return event;
  insertButton(host, DETAIL_BUTTON_ID, "他のレコードと比較", () => {
    void launch(event.appId, settings, event.recordId);
  });
  return event;
});

kintone.events.on("app.record.index.show", (event) => {
  injectStyles();
  const settings = loadSettings();
  const host = indexHeaderMenu();
  if (!settings || !host) return event;
  insertButton(host, INDEX_BUTTON_ID, "レコードを比較", () => {
    void launch(event.appId, settings);
  });
  return event;
});
