import { loadCSV } from "./data.js";
import { state, setSearch, setOpenMat, toggleState, clearStates } from "./state.js";
import { applyFilters } from "./filters.js";
import { renderStateMenu, renderGroups } from "./render.js";

const els = {};
let allRows = [];
let allStates = [];

init().catch(err => {
  console.error(err);
  const status = document.getElementById("status");
  status.textContent = `Error: ${err.message}`;
});

async function init(){
  cacheEls();
  wireUI();

  els.status.textContent = "Loading…";
  allRows = await loadCSV("data/directory.csv");
  allStates = uniqueStates(allRows);

  // Build state menu list
  renderStateMenu(els.stateList, allStates, state.states);

  els.status.textContent = `${allRows.length} gyms loaded`;
  render();
}

function cacheEls(){
  els.status = document.getElementById("status");
  els.groupsRoot = document.getElementById("groupsRoot");

  els.searchInput = document.getElementById("searchInput");
  els.searchClear = document.getElementById("searchClear");

  els.stateBtn = document.getElementById("stateBtn");
  els.stateMenu = document.getElementById("stateMenu");
  els.stateList = document.getElementById("stateList");
  els.stateClear = document.getElementById("stateClear");
  els.stateDot = document.getElementById("stateDot");

  els.openMatBtn = document.getElementById("openMatBtn");
  els.openMatMenu = document.getElementById("openMatMenu");
  els.openMatClear = document.getElementById("openMatClear");
  els.openMatDot = document.getElementById("openMatDot");

  els.guestsBtn = document.getElementById("guestsBtn");
  els.guestsMenu = document.getElementById("guestsMenu");
  els.guestsClear = document.getElementById("guestsClear");
  els.guestsDot = document.getElementById("guestsDot");
}

function wireUI(){
  // Search
  els.searchInput.addEventListener("input", () => {
    setSearch(els.searchInput.value);
    render();
  });
  els.searchClear.addEventListener("click", () => {
    els.searchInput.value = "";
    setSearch("");
    els.searchInput.focus();
    render();
  });

  // Menus
  wireMenu(els.stateBtn, els.stateMenu);
  wireMenu(els.openMatBtn, els.openMatMenu);
  wireMenu(els.guestsBtn, els.guestsMenu);

  // State menu change
  els.stateList.addEventListener("change", (e) => {
    const input = e.target;
    if(input && input.type === "checkbox"){
      toggleState(input.value);
      updateDots();
      render();
    }
  });
  els.stateClear.addEventListener("click", () => {
    clearStates();
    // re-check list UI
    renderStateMenu(els.stateList, allStates, state.states);
    updateDots();
    render();
  });

  // OpenMat radio
  els.openMatMenu.addEventListener("change", (e) => {
    const input = e.target;
    if(input && input.name === "openMat"){
      setOpenMat(input.value);
      updateDots();
      render();
    }
  });
  els.openMatClear.addEventListener("click", () => {
    setOpenMat("");
    // reset radios
    const all = els.openMatMenu.querySelector('input[name="openMat"][value=""]');
    if(all) all.checked = true;
    updateDots();
    render();
  });

  // Close menus on outside click / ESC
  document.addEventListener("click", (e) => {
    if(!e.target.closest(".pillSelect")) closeAllMenus();
  });
  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape") closeAllMenus();
  });
}

function wireMenu(btn, menu){
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = !menu.hidden;
    closeAllMenus();
    if(!isOpen){
      menu.hidden = false;
      btn.setAttribute("aria-expanded", "true");
    }
  });
}

function closeAllMenus(){
  for(const [btn, menu] of [
    [els.stateBtn, els.stateMenu],
    [els.openMatBtn, els.openMatMenu],
    [els.guestsBtn, els.guestsMenu],
  ]){
    if(!menu.hidden){
      menu.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    }
  }
}

function render(){
  updateDots();
  const filtered = applyFilters(allRows, state);
  els.status.textContent = `${filtered.length} results`;
  renderGroups(els.groupsRoot, filtered);
}

function updateDots(){
  setDot(els.stateBtn, els.stateDot, state.states.size > 0);
  setDot(els.openMatBtn, els.openMatDot, state.openMat !== "");
  // guests placeholder:
  setDot(els.guestsBtn, els.guestsDot, false);
}

function setDot(btn, dotEl, on){
  if(on){
    btn.classList.add("pill--selected");
    dotEl.style.display = "inline-block";
  } else {
    btn.classList.remove("pill--selected");
    dotEl.style.display = "none";
  }
}

function uniqueStates(rows){
  return [...new Set(rows.map(r => r.STATE).filter(Boolean))].sort();
}

