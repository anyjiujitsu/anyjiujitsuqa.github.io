// assets/js/pills_bootstrap.js
// This file is the ONLY thing you need to import from your existing assets/js/main.js.
// It attaches unified BasePillController instances to your *existing* pill markup,
// without changing any of your current filter/open/close behavior.

import { registerPill, refreshAllPillIndicators } from "./filters.js";
import { createGenericMenuPill } from "./state.js";

function initUnifiedPills() {
  const map = [
    ["states", document.getElementById("stateBtn")],
    ["openMat", document.getElementById("openMatBtn")],
    ["guests", document.getElementById("guestsBtn")],

    // events view pills
    ["eventsPill1", document.getElementById("eventsPill1Btn")],
    ["eventsPill2", document.getElementById("eventsPill2Btn")],
    ["eventsPill3", document.getElementById("eventsPill3Btn")]
  ];

  for (const [key, el] of map) {
    if (!el) continue;
    registerPill(key, createGenericMenuPill(el, key));
  }

  // Make sure dots reflect any default-checked inputs on load
  refreshAllPillIndicators();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initUnifiedPills);
} else {
  initUnifiedPills();
}
