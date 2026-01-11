import { loadCSV } from "./data.js";
import { state } from "./state.js";
import { applyFilters } from "./filters.js";
import { renderGroups } from "./render.js";

let allRows = [];

async function init(){
  const status = document.getElementById("status");
  const root = document.getElementById("groupsRoot");

  // View toggle + slider
  const viewTitle = document.getElementById("viewTitle");
  const tabIndex = document.getElementById("tabIndex");
  const tabEvents = document.getElementById("tabEvents");
  const viewShell = document.getElementById("viewShell");

  function setView(view){
    state.view = view;

    document.body.dataset.view = view;

    if (tabIndex) tabIndex.setAttribute("aria-selected", view === "index" ? "true" : "false");
    if (tabEvents) tabEvents.setAttribute("aria-selected", view === "events" ? "true" : "false");

    if (viewTitle) viewTitle.textContent = view === "events" ? "EVENTS" : "INDEX";
    document.title = view === "events" ? "ANY N.E. – EVENTS" : "ANY N.E. – GYM INDEX";
  }

  if (tabIndex) tabIndex.addEventListener("click", () => setView("index"));
  if (tabEvents) tabEvents.addEventListener("click", () => setView("events"));

  // Swipe between views (mobile-friendly)
  if (viewShell) {
    let startX = 0;
    let startY = 0;
    let dragging = false;

    viewShell.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      dragging = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    viewShell.addEventListener("touchend", (e) => {
      if (!dragging) return;
      dragging = false;

      const endX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : startX;
      const endY = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientY : startY;

      const dx = endX - startX;
      const dy = endY - startY;

      // Ignore mostly-vertical gestures
      if (Math.abs(dy) > Math.abs(dx)) return;

      const threshold = 60;
      if (dx <= -threshold) setView("events");
      if (dx >= threshold) setView("index");
    }, { passive: true });
  }

  // default view
  if (!state.view) state.view = "index";
  setView(state.view);

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

    // ---- OpenMat pill wiring ----
    const openMatBtn   = document.getElementById("openMatBtn");
    const openMatMenu  = document.getElementById("openMatMenu");
    const openMatClear = document.getElementById("openMatClear");
    const openMatDot   = document.getElementById("openMatDot");

    function setOpenMatUI(){
      const on = state.openMat === "all" || state.openMat === "sat" || state.openMat === "sun";
      if (openMatBtn) openMatBtn.classList.toggle("pill--selected", on);
      if (openMatDot) openMatDot.style.display = on ? "inline-block" : "none";
    }

    function closeOpenMatMenu(){
      if (!openMatMenu) return;
      openMatMenu.hidden = true;
      if (openMatBtn) openMatBtn.setAttribute("aria-expanded", "false");
    }

    function positionOpenMatMenu(){
      if (!openMatMenu || !openMatBtn) return;

      openMatMenu.style.position = "fixed";
      openMatMenu.style.zIndex = "1000";

      const btnRect = openMatBtn.getBoundingClientRect();
      const menuW = openMatMenu.offsetWidth || 240;
      const gutter = 8;

      let left = btnRect.left;
      const maxLeft = window.innerWidth - menuW - gutter;
      if (left > maxLeft) left = maxLeft;
      if (left < gutter) left = gutter;

      const top = btnRect.bottom + 8;

      openMatMenu.style.left = `${left}px`;
      openMatMenu.style.top = `${top}px`;
    }

    function openOpenMatMenu(){
      if (!openMatMenu) return;
      openMatMenu.hidden = false;
      if (openMatBtn) openMatBtn.setAttribute("aria-expanded", "true");

      // Sync checked state from current filter value
      openMatMenu.querySelectorAll('input[type="radio"][name="openMat"]').forEach(r => {
        r.checked = (r.value === state.openMat);
      });

      requestAnimationFrame(positionOpenMatMenu);
    }

    if (openMatBtn && openMatMenu) {
      openMatBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = !openMatMenu.hidden;
        if (isOpen) closeOpenMatMenu();
        else openOpenMatMenu();
      });
    }

    if (openMatMenu) {
      openMatMenu.addEventListener("change", (e) => {
        const el = e.target;
        if (!(el instanceof HTMLInputElement)) return;
        if (el.type !== "radio") return;

        state.openMat = el.value;
        setOpenMatUI();
        render();
      });
    }

    if (openMatClear) {
      openMatClear.addEventListener("click", (e) => {
        e.preventDefault();
        state.openMat = "";
        if (openMatMenu) {
          openMatMenu.querySelectorAll('input[type="radio"][name="openMat"]').forEach(r => r.checked = false);
        }
        setOpenMatUI();
        render();
      });
    }

    document.addEventListener("click", (e) => {
      if (!openMatMenu || openMatMenu.hidden) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("#openMatMenu") || target.closest("#openMatBtn")) return;
      closeOpenMatMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeOpenMatMenu();
    });

    window.addEventListener("resize", () => {
      if (openMatMenu && !openMatMenu.hidden) positionOpenMatMenu();
    });
    window.addEventListener("scroll", () => {
      if (openMatMenu && !openMatMenu.hidden) positionOpenMatMenu();
    }, { passive: true });

    setOpenMatUI();

    render();

  } catch(err){
    console.error(err);
    status.textContent = "Failed to load data";
  }
}

init();
