// assets/js/pillSelect.js
// Shared base pill controller.
// In this patch, we run in *indicatorOnly* mode so we do NOT interfere with your existing open/close logic.
// It still guarantees: one shared controller, hasSelection-driven dot, dot auto-creation.

export class BasePillController {
  /**
   * @param {HTMLElement} root
   * @param {object} opts
   * @param {string} opts.key
   * @param {()=>boolean} opts.computeHasSelection
   * @param {HTMLElement=} opts.panelEl
   * @param {HTMLElement=} opts.clearEl
   * @param {boolean=} opts.indicatorOnly   // when true, controller does not bind toggle/close logic.
   */
  constructor(root, opts) {
    this.root = root;
    this.key = opts.key;
    this.computeHasSelection = opts.computeHasSelection;
    this.panelEl = opts.panelEl || root.querySelector("[data-pill-panel]") || null;
    this.clearEl = opts.clearEl || root.querySelector("[data-pill-clear]") || null;
    this.indicatorOnly = !!opts.indicatorOnly;

    // label area (where indicator should live)
    this.labelEl =
      root.querySelector("[data-pill-title]") ||
      root.querySelector("[data-pill-label]") ||
      root;

    // Auto-create indicator if missing
    this.indicatorEl = root.querySelector("[data-pill-indicator]");
    if (!this.indicatorEl) {
      this.indicatorEl = document.createElement("span");
      this.indicatorEl.setAttribute("data-pill-indicator", "");
      this.indicatorEl.setAttribute("aria-hidden", "true");
      this.indicatorEl.style.cssText = `
        width: 7px; height: 7px; border-radius: 999px;
        display: none; margin-left: 8px; flex: 0 0 auto;
        background: var(--accent, #25d366);
        box-shadow: 0 0 0 2px rgba(37,211,102,.18);
      `;
      this.labelEl.appendChild(this.indicatorEl);
    }

    // If you already have a dot span styled by CSS, we respect it and only toggle visibility.
    this.renderIndicator();

    if (!this.indicatorOnly) {
      // Full mode (not used in this patch): would wire open/close/clear here.
    }
  }

  setHasSelection(val) {
    this.root.toggleAttribute("data-has-selection", !!val);
    this.indicatorEl.style.display = val ? "" : "none";
  }

  renderIndicator() {
    this.setHasSelection(!!this.computeHasSelection());
  }
}
