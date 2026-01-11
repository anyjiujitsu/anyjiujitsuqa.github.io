import { loadCSV } from "./data.js";
import { state } from "./state.js";
import { applyFilters } from "./filters.js";
import { renderGroups } from "./render.js";

let allRows = [];

async function init(){
  const status = document.getElementById("status");
  const root = document.getElementById("groupsRoot");

  // Search elements
  const searchInput = document.getElementById("searchInput");
  const searchClear = document.getElementById("searchClear");

  // States pill elements
  const stateBtn   = document.getElementById("stateBtn");
  const stateMenu  = document.getElementById("stateMenu");
  const stateList  = document.getElementById("stateList");
  const stateClear = document.getElementById("stateClear");
  const stateDot   = document.getElementById("stateDot");

  function setStatesSelectedUI(){
    const has = state.states && state.states.size > 0;
    if (stateBtn) stateBtn.classList.toggle("pill--selected", has);
    if (stateDot) stateDot.style.display = has ? "inline-block" : "none";
  }

  function closeStateMenu(){
    if (!stateMenu) return;
    stateMenu.hidden = true;
    if (stateBtn) stateBtn.setAttribute("aria-expanded", "false");
  }

  function positionStateMenu(){
    if (!stateMenu || !stateBtn) return;

    // Ensure it can overlay even if pills row is scroll-clipped
    stateMenu.style.position = "fixed";
    stateMenu.style.zIndex = "1000";

    const btnRect = stateBtn.getBoundingClientRect();

    // Use computed width after un-hiding (so offsetWidth is valid)
    const menuW = stateMenu.offsetWidth || 240;
    const gutter = 8;

    let left = btnRect.left;
    const maxLeft = window.innerWidth - menuW - gutter;
    if (left > maxLeft) left = maxLeft;
    if (left < gutter) left = gutter;

    const top = btnRect.bottom + 8;

    stateMenu.style.left = `${left}px`;
    stateMenu.style.top = `${top}px`;
  }

  function openStateMenu(){
    if (!stateMenu) return;
    stateMenu.hidden = false;
    if (stateBtn) stateBtn.setAttribute("aria-expanded", "true");
    // Position after it becomes measurable
    requestAnimationFrame(positionStateMenu);
  }

  function render(){
    const filtered = applyFilters(allRows, state);
    renderGroups(root, filtered);
    status.textContent = `${filtered.length} gyms`;
    setStatesSelectedUI();
  }

  function buildStatesMenu(){
    if (!stateList) return;

    const uniqueStates = Array.from(
      new Set(
        allRows
          .map(r => String(r.STATE ?? "").trim())
          .filter(Boolean)
      )
    ).sort((a,b) => a.localeCompare(b));

    stateList.innerHTML = "";

    for (const code of uniqueStates){
      const label = document.createElement("label");
      label.className = "menu__item";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = code;
      cb.checked = state.states.has(code);

      const span = document.createElement("span");
      span.textContent = code;

      label.appendChild(cb);
      label.appendChild(span);
      stateList.appendChild(label);
    }
  }

  try{
    status.textContent = "Loading…";
    allRows = await loadCSV("data/directory.csv");

    // ---- Search wiring ----
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        state.search = searchInput.value || "";
        render();
      });
    }

    if (searchClear) {
      searchClear.addEventListener("click", () => {
        if (!searchInput) return;
        searchInput.value = "";
        state.search = "";
        searchInput.focus();
        render();
      });
    }

    // ---- States pill wiring ----
    buildStatesMenu();
    setStatesSelectedUI();

    if (stateBtn && stateMenu) {
      stateBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = !stateMenu.hidden;
        if (isOpen) closeStateMenu();
        else openStateMenu();
      });
    }

    if (stateList) {
      stateList.addEventListener("change", (e) => {
        const el = e.target;
        if (!(el instanceof HTMLInputElement)) return;
        if (el.type !== "checkbox") return;

        if (el.checked) state.states.add(el.value);
        else state.states.delete(el.value);

        render();
      });
    }

    if (stateClear) {
      stateClear.addEventListener("click", (e) => {
        e.preventDefault();
        state.states.clear();

        if (stateList) {
          stateList.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
            cb.checked = false;
          });
        }

        render();
      });
    }

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!stateMenu || stateMenu.hidden) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("#stateMenu") || target.closest("#stateBtn")) return;
      closeStateMenu();
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeStateMenu();
    });

    // Keep menu positioned on resize/scroll while open
    window.addEventListener("resize", () => {
      if (stateMenu && !stateMenu.hidden) positionStateMenu();
    });
    window.addEventListener("scroll", () => {
      if (stateMenu && !stateMenu.hidden) positionStateMenu();
    }, { passive: true });

    render();

  } catch(err){
    console.error(err);
    status.textContent = "Failed to load data";
  }
}

init();
