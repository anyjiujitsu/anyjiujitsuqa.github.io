import { loadCSV, normalizeDirectoryRow, normalizeEventRow } from "./data.js";
import { state, setView, setIndexQuery, setEventsQuery } from "./state.js";
import { filterDirectory, filterEvents } from "./filters.js";
import { renderDirectoryGroups, renderEventsGroups } from "./render.js";

let directoryRows = [];
let eventRows = [];

function $(id){ return document.getElementById(id); }

function parseYearFromEventRow(r){
  const y = String(r?.YEAR ?? "").trim();
  if(y) return y;
  const d = String(r?.DATE ?? "").trim();
  const m = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(m) return m[3];
  const tmp = new Date(d);
  if(!isNaN(tmp)) return String(tmp.getFullYear());
  return "";
}

function uniqYearsFromEvents(rows){
  const set = new Set();
  rows.forEach(r=>{
    const y = parseYearFromEventRow(r);
    if(y) set.add(y);
  });
  // Desc sort numeric
  return Array.from(set).sort((a,b)=>Number(b)-Number(a));
}


function positionMenu(btnEl, panelEl){
  if(!btnEl || !panelEl) return;
  const r = btnEl.getBoundingClientRect();
  const pad = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // First show to measure
  panelEl.hidden = false;

  // Default: below-left of button
  let left = r.left;
  let top  = r.bottom + pad;

  // Measure panel
  const pr = panelEl.getBoundingClientRect();
  const w = pr.width;
  const h = pr.height;

  // Clamp horizontally
  if(left + w + pad > vw) left = Math.max(pad, vw - w - pad);
  if(left < pad) left = pad;

  // If bottom overflow, try above
  if(top + h + pad > vh){
    const above = r.top - h - pad;
    if(above >= pad) top = above;
    else top = Math.max(pad, vh - h - pad);
  }

  panelEl.style.left = Math.round(left) + "px";
  panelEl.style.top  = Math.round(top) + "px";
}

function closeAllMenus(){
  document.querySelectorAll('.menu[data-pill-panel]').forEach(panel=>{
    panel.hidden = true;
  });
    panel.style.left = '';
    panel.style.top = '';

  document.querySelectorAll('.pill.filter-pill[aria-expanded="true"]').forEach(btn=>{
    btn.setAttribute('aria-expanded','false');
  });
}

function setPillHasSelection(btnEl, has){
  if(!btnEl) return;
  btnEl.setAttribute('data-has-selection', has ? 'true' : 'false');
}

function wireMenuDismiss(){
  // One-time global handlers
  if(wireMenuDismiss._did) return;
  wireMenuDismiss._did = true;

  document.addEventListener('click', (e)=>{
    const t = e.target;
    if(t && (t.closest('.pillSelect') || t.closest('.menu'))) return;
    closeAllMenus();
  });

  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape'){
      closeAllMenus();
    }
  });
}

function buildMenuList(panelEl, items, selectedSet, onToggle){
  // Replace menu__empty with an interactive list
  panelEl.querySelectorAll('.menu__empty').forEach(n=>n.remove());

  const list = document.createElement('div');
  list.className = 'menu__list';
  items.forEach(val=>{
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'menu__item';
    b.setAttribute('role','menuitemcheckbox');
    const checked = selectedSet.has(val);
    b.setAttribute('aria-checked', checked ? 'true' : 'false');
    b.dataset.value = val;
    b.textContent = val;
    b.addEventListener('click', ()=>{
      onToggle(val);
      const now = selectedSet.has(val);
      b.setAttribute('aria-checked', now ? 'true' : 'false');
    });
    list.appendChild(b);
  });

  panelEl.appendChild(list);
}

function wireEventsYearPill(getEventRows, onChange){
  wireMenuDismiss();

  const btn = $('eventsPill1Btn');
  const panel = $('eventsPill1Menu');
  const clearBtn = $('eventsPill1Clear');

  if(!btn || !panel) return;

  const years = uniqYearsFromEvents(getEventRows());
  // Ensure default requested behavior: only years present in data
  buildMenuList(panel, years, state.events.year, (val)=>{
    if(state.events.year.has(val)) state.events.year.delete(val);
    else state.events.year.add(val);
    setPillHasSelection(btn, state.events.year.size>0);
    onChange();
  });

  // initial dot state
  setPillHasSelection(btn, state.events.year.size>0);

  btn.addEventListener('click', ()=>{
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    closeAllMenus();
    btn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
    panel.hidden = expanded;
    if(!expanded){
      positionMenu(btn, panel);
    }
  });

  clearBtn?.addEventListener('click', ()=>{
    state.events.year.clear();
    setPillHasSelection(btn, false);
    // update aria-checked in menu
    panel.querySelectorAll('.menu__item[role="menuitemcheckbox"]').forEach(b=>b.setAttribute('aria-checked','false'));
    onChange();
  });
}

function setTransition(ms){
  document.body.style.setProperty("--viewTransition", ms + "ms");
}

function applyProgress(p){
  const clamped = Math.max(0, Math.min(1, p));
  document.body.style.setProperty("--viewProgress", String(clamped));
  const viewTitle = $("viewTitle");
  if(viewTitle){
    viewTitle.textContent = (clamped >= 0.5) ? "INDEX" : "EVENTS";
  }
  return clamped;
}

function setViewUI(view){
  setView(view);

  $("tabEvents")?.setAttribute("aria-selected", view === "events" ? "true" : "false");
  $("tabIndex")?.setAttribute("aria-selected", view === "index" ? "true" : "false");

  // Sticky filter bars (now outside the slider)
  const evFilters = document.getElementById("eventsFilters");
  const idxFilters = document.getElementById("filters");
  if(evFilters) evFilters.hidden = (view !== "events");
  if(idxFilters) idxFilters.hidden = (view !== "index");

  const title = $("viewTitle");
  if(title) title.textContent = (view === "events") ? "EVENTS" : "INDEX";

  // Header counts: show the relevant total next to the header title
  const evStatus = $("eventsStatus");
  const idxStatus = $("status");
  if(evStatus) evStatus.hidden = (view !== "events");
  if(idxStatus) idxStatus.hidden = (view !== "index");

  document.title = (view === "events") ? "ANY N.E. – EVENTS" : "ANY N.E. – GYM INDEX";

  setTransition(260);
  applyProgress(view === "index" ? 1 : 0);
}

function wireViewToggle(){
  const tabEvents = $("tabEvents");
  const tabIndex  = $("tabIndex");
  const viewToggle = $("viewToggle");
  const viewShell  = $("viewShell");

  tabEvents?.addEventListener("click", () => setViewUI("events"));
  tabIndex?.addEventListener("click", () => setViewUI("index"));

  if(viewToggle){
    let dragging = false;
    let pointerId = null;

    viewToggle.addEventListener("pointerdown", (e) => {
      dragging = true;
      pointerId = e.pointerId;
      viewToggle.setPointerCapture(pointerId);
      setTransition(0);

      const rect = viewToggle.getBoundingClientRect();
      const padding = 4;
      const trackW = rect.width - padding * 2;
      const thumbW = trackW / 2;
      const travel = trackW - thumbW;

      const x = e.clientX - rect.left - padding;
      const p = (x - thumbW / 2) / travel;
      applyProgress(p);
    });

    viewToggle.addEventListener("pointermove", (e) => {
      if(!dragging || e.pointerId !== pointerId) return;

      const rect = viewToggle.getBoundingClientRect();
      const padding = 4;
      const trackW = rect.width - padding * 2;
      const thumbW = trackW / 2;
      const travel = trackW - thumbW;

      const x = e.clientX - rect.left - padding;
      const p = (x - thumbW / 2) / travel;
      applyProgress(p);
    });

    const endDrag = (e) => {
      if(!dragging) return;
      if(e && pointerId != null && e.pointerId !== pointerId) return;

      dragging = false;
      pointerId = null;

      setTransition(260);
      const p = Number(getComputedStyle(document.body).getPropertyValue("--viewProgress")) || 0;
      setViewUI(p >= 0.5 ? "index" : "events");
    };

    viewToggle.addEventListener("pointerup", endDrag);
    viewToggle.addEventListener("pointercancel", endDrag);
    viewToggle.addEventListener("lostpointercapture", endDrag);
  }

  if(viewShell){
    let startX = 0, startY = 0, startP = 0;

    viewShell.addEventListener("touchstart", (e) => {
      if(e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startP = Number(getComputedStyle(document.body).getPropertyValue("--viewProgress")) || 0;
      setTransition(0);
    }, { passive: true });

    viewShell.addEventListener("touchmove", (e) => {
      if(e.touches.length !== 1) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;

      const dx = x - startX;
      const dy = y - startY;

      if(Math.abs(dy) > Math.abs(dx)) return;

      const delta = -dx / window.innerWidth;
      applyProgress(startP + delta);
    }, { passive: true });

    viewShell.addEventListener("touchend", () => {
      setTransition(260);
      const p = Number(getComputedStyle(document.body).getPropertyValue("--viewProgress")) || 0;
      setViewUI(p >= 0.5 ? "index" : "events");
    }, { passive: true });
  }
}

function wireSearch(){
  const idxIn = $("searchInput");
  const evIn  = $("eventsSearchInput");

  idxIn?.addEventListener("input",(e)=>{
    setIndexQuery(e.target.value);
    render();
  });
  evIn?.addEventListener("input",(e)=>{
    setEventsQuery(e.target.value);
    render();
  });

  $("searchClear")?.addEventListener("click", ()=>{
    setIndexQuery("");
    if(idxIn) idxIn.value = "";
    render();
  });

  $("eventsSearchClear")?.addEventListener("click", ()=>{
    setEventsQuery("");
    if(evIn) evIn.value = "";
    render();
  });
}

function render(){
  const evFiltered = filterEvents(eventRows, state);
  renderEventsGroups($("eventsRoot"), evFiltered);
  $("eventsStatus").textContent = `${evFiltered.length} events`;

  const idxFiltered = filterDirectory(directoryRows, state);
  renderDirectoryGroups($("groupsRoot"), idxFiltered);
  $("status").textContent = `${idxFiltered.length} gyms`;
}

async function init(){
  wireViewToggle();
  wireSearch();

  if(!state.view) state.view = "events";
  setViewUI(state.view);

  $("status").textContent = "Loading…";
  $("eventsStatus").textContent = "Loading…";

  const [dirRaw, evRaw] = await Promise.all([
    loadCSV("data/directory.csv"),
    loadCSV("data/events.csv").catch(()=>[])
  ]);

  directoryRows = dirRaw.map(normalizeDirectoryRow);
  eventRows = evRaw.map(normalizeEventRow);

  // Wire YEAR filter pill (Events view)
  wireEventsYearPill(()=>eventRows, render);

  render();
}

init().catch((err)=>{
  console.error(err);
  $("status").textContent = "Failed to load data";
  $("eventsStatus").textContent = "Failed to load data";
});
