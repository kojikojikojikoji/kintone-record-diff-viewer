// DOM helpers, modal manager, and toast. All nodes are built with
// createElement and textContent; no HTML string is ever concatenated into the
// DOM, so record values cannot inject markup (common spec 6).

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function clear(node: HTMLElement): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export interface Modal {
  overlay: HTMLElement;
  content: HTMLElement;
  close(): void;
}

// Opens a modal with a backdrop, Esc-to-close, and a focus trap. aria-hidden is
// applied to the app root while open (common spec 7).
export function openModal(content: HTMLElement, onClose?: () => void): Modal {
  const overlay = el("div", "kp-rdv-overlay");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.appendChild(content);

  const previouslyFocused = document.activeElement as HTMLElement | null;

  const close = (): void => {
    document.removeEventListener("keydown", onKeydown, true);
    overlay.remove();
    if (previouslyFocused && typeof previouslyFocused.focus === "function")
      previouslyFocused.focus();
    if (onClose) onClose();
  };

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === "Tab") {
      const focusable = Array.from(content.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (n) => n.offsetParent !== null || n === document.activeElement,
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  overlay.addEventListener("mousedown", (event) => {
    if (event.target === overlay) close();
  });
  document.addEventListener("keydown", onKeydown, true);
  document.body.appendChild(overlay);

  const firstField = content.querySelector<HTMLElement>(FOCUSABLE);
  if (firstField) firstField.focus();

  return { overlay, content, close };
}

const TOAST_STACK_ID = "kp-rdv-toast-stack";

export function showToast(message: string, kind: "success" | "error" = "success"): void {
  let stack = document.getElementById(TOAST_STACK_ID);
  if (!stack) {
    stack = el("div", "kp-rdv-toast-stack");
    stack.id = TOAST_STACK_ID;
    document.body.appendChild(stack);
  }
  // Keep at most 3 toasts (common spec 7).
  while (stack.children.length >= 3) stack.removeChild(stack.firstChild as ChildNode);
  const toast = el("div", `kp-rdv-toast${kind === "error" ? " kp-rdv-toast--error" : ""}`, message);
  toast.setAttribute("role", "status");
  stack.appendChild(toast);
  window.setTimeout(() => toast.remove(), 4000);
}
