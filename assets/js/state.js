// assets/js/state.js
// "States" pill controller built on BasePillController.
// In indicatorOnly mode we simply compute hasSelection from the existing menu inputs.

import { BasePillController } from "./pillSelect.js";

export function createGenericMenuPill(rootEl, key) {
  const panel =
    rootEl.querySelector("[data-pill-panel]") ||
    document.getElementById(rootEl.getAttribute("aria-controls") || "") ||
    null;

  const clearBtn = rootEl.querySelector("[data-pill-clear]");

  const computeHasSelection = () => {
    if (!panel) return false;
    const inputs = panel.querySelectorAll('input[type="checkbox"], input[type="radio"]');
    for (const input of inputs) {
      if (input.checked) {
        const v = (input.value || "").toLowerCase();
        // treat "all" as no-selection
        if (v && v !== "all") return true;
      }
    }
    return false;
  };

  const ctrl = new BasePillController(rootEl, {
    key,
    panelEl: panel,
    clearEl: clearBtn || null,
    computeHasSelection,
    indicatorOnly: true
  });

  // Keep indicator in sync with existing UI
  if (panel) {
    panel.addEventListener("change", () => ctrl.renderIndicator());
    panel.addEventListener("input", () => ctrl.renderIndicator());
  }
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      // allow your existing clear logic to run first, then refresh dot
      queueMicrotask(() => ctrl.renderIndicator());
      setTimeout(() => ctrl.renderIndicator(), 0);
    });
  }

  return ctrl;
}
