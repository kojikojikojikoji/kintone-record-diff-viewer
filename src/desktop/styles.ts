// Styles injected once into the record screen. Class names are prefixed with
// kp-rdv- so they cannot collide with kintone or the other plugins in the
// series (common spec 4 / 6). Row highlight colors follow spec FR-9 / FR-14.
export const STYLE_ID = "kp-rdv-styles";

export const CSS = `
.kp-rdv-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}
.kp-rdv-modal {
  background: #fff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  max-width: 100vw;
  font-family: -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Yu Gothic", Meiryo, sans-serif;
  color: #1f2933;
}
.kp-rdv-modal--picker { width: 560px; max-height: 70vh; }
.kp-rdv-modal--compare { width: 90vw; height: 90vh; }
.kp-rdv-modal__header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid #d5dbe1;
}
.kp-rdv-modal__title { font-size: 16px; font-weight: 600; margin: 0; flex: 1; }
.kp-rdv-modal__close {
  border: none;
  background: transparent;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  color: #5f6b7a;
  padding: 4px 8px;
}
.kp-rdv-modal__body { padding: 16px; overflow: auto; flex: 1; }
.kp-rdv-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #d5dbe1;
}
.kp-rdv-btn {
  height: 40px;
  padding: 0 16px;
  border-radius: 6px;
  border: 1px solid #d5dbe1;
  background: #fff;
  color: #1f2933;
  cursor: pointer;
  font-size: 14px;
}
.kp-rdv-btn--primary { background: #0f6db3; border-color: #0f6db3; color: #fff; }
.kp-rdv-btn--primary:disabled { background: #9bbdd6; border-color: #9bbdd6; cursor: not-allowed; }
.kp-rdv-btn--text { border-color: transparent; background: transparent; color: #0f6db3; }
.kp-rdv-launch { height: 48px; }
.kp-rdv-picker__label { display: block; font-size: 13px; font-weight: 600; margin: 12px 0 4px; }
.kp-rdv-input {
  width: 100%;
  box-sizing: border-box;
  height: 40px;
  padding: 0 10px;
  border: 1px solid #d5dbe1;
  border-radius: 6px;
  font-size: 14px;
}
.kp-rdv-input:focus { outline: 2px solid #0f6db3; outline-offset: 2px; }
.kp-rdv-results { list-style: none; margin: 8px 0 0; padding: 0; max-height: 260px; overflow: auto; }
.kp-rdv-results__item {
  padding: 8px 10px;
  cursor: pointer;
  border-left: 3px solid transparent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.kp-rdv-results__item:hover, .kp-rdv-results__item--active { background: #f7f8fa; }
.kp-rdv-results__item--selected { border-left-color: #0f6db3; }
.kp-rdv-selected { margin-top: 8px; font-size: 13px; color: #5f6b7a; }
.kp-rdv-selected__clear { margin-left: 8px; color: #0f6db3; cursor: pointer; }
.kp-rdv-note { font-size: 12px; color: #5f6b7a; margin-top: 8px; }
.kp-rdv-error { font-size: 12px; color: #b3261e; margin-top: 8px; }
.kp-rdv-toolbar { display: flex; align-items: center; gap: 16px; padding: 8px 16px; border-bottom: 1px solid #d5dbe1; flex-wrap: wrap; }
.kp-rdv-toolbar__toggle { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; cursor: pointer; }
.kp-rdv-links { font-size: 13px; color: #5f6b7a; display: flex; gap: 16px; }
.kp-rdv-links a { color: #0f6db3; }
.kp-rdv-table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 13px; }
.kp-rdv-table th, .kp-rdv-table td {
  border: 1px solid #e3e7eb;
  padding: 6px 10px;
  text-align: left;
  vertical-align: top;
  word-break: break-word;
}
.kp-rdv-table thead th { position: sticky; top: 0; background: #f7f8fa; z-index: 1; }
.kp-rdv-table col.kp-rdv-col-name { width: 20%; }
.kp-rdv-table col.kp-rdv-col-value { width: 40%; }
.kp-rdv-row--changed { background: #fff8e1; }
.kp-rdv-row--onlyA { background: #fdecea; }
.kp-rdv-row--onlyB { background: #e6f4ea; }
.kp-rdv-sub-line--changed { background: #ffe082; }
.kp-rdv-del { background: #ffcdd2; text-decoration: line-through; }
.kp-rdv-ins { background: #c8e6c9; }
.kp-rdv-cell { line-height: 1.5; }
.kp-rdv-cell--collapsed { max-height: 7.5em; overflow: hidden; }
.kp-rdv-cell__toggle { display: block; text-align: right; font-size: 12px; color: #0f6db3; cursor: pointer; margin-top: 2px; }
.kp-rdv-empty { padding: 24px; text-align: center; color: #5f6b7a; }
.kp-rdv-spinner { padding: 24px; text-align: center; color: #5f6b7a; }
.kp-rdv-toast-stack { position: fixed; top: 16px; right: 16px; display: flex; flex-direction: column; gap: 8px; z-index: 10001; }
.kp-rdv-toast {
  background: #fff;
  border-left: 4px solid #0f6db3;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 10px 14px;
  font-size: 13px;
  border-radius: 4px;
  min-width: 200px;
}
.kp-rdv-toast--error { border-left-color: #b3261e; }
`;

export function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}
