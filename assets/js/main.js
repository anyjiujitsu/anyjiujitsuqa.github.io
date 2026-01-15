// STEP 0 — Skeleton Reset (Iteration 100)
// Goal: load both CSVs, render both views, and keep the view slider working.
// Spec alignment: EVENTS is View A (left/first), INDEX is View B (right/second).
// No filtering, no menus, no indicators yet.

import { loadCSV, normalizeDirectoryRow, normalizeEventRow } from "./data.js";
import { state, setView } from "./state.js";
import { filterDirectory, filterEvents } from "./filters.js";
import { renderDirectoryGroups, renderEventsGroups } from "./render.js";

let directoryRows = [];
let eventRows = [];

function $(id){ return document.getElementById(id); }

function setTransition(ms){
  document.body.style.setProperty("--viewTransition", ms + "ms");
}

function applyProgress(p){
  const clamped = Math.max(0, Math.min(1, p));
  document.body.style.setProperty("--viewProgress", String(clamped));

  // Live title while dragging: LEFT = EVENTS, RIGHT = INDEX
  const viewTitle = $("viewTitle");
  if(viewTitle){
    viewTitle.textContent = (clamped >= 0.5) ? "INDEX" : "EVENTS";
  }
  return clamped;
}

function setViewUI(view){
  // view: "events" (left) | "index" (right)
  setView(view);

  const tabEvents = $("tabEvents");
  const tabIndex = $("tabIndex");
  const viewTitle = $("viewTitle");

  if(tabEvents) tabEvents.setAttribute("aria-selected", view === "events" ? "true" : "false");
  if(tabIndex) tabIndex.setAttribute("aria-selected", view === "index" ? "true" : "false");
  if(viewTitle) viewTitle.textContent = (view === "events") ? "EVENTS" : "INDEX";
  document.title = (view === "events") ? "ANY N.E. – EVENTS" : "ANY N.E. – GYM INDEX";

  setTransition(260);
  applyProgress(view === "index" ? 1 : 0);
}

function wireViewToggle(){
  const tabEvents = $("tabEvents");
  const tabIndex = $("tabIndex");
  const viewToggle = $("viewToggle");
  const viewShell = $("viewShell");

  if(tabEvents) tabEvents.addEventListener("click", () => setViewUI("events"));
  if(tabIndex) tabIndex.addEventListener("click", () => setViewUI("index"));

  // Pointer drag on toggle track (continuous)
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

  // Swipe across view shell (continuous)
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

      const delta = -dx / window.innerWidth; // left swipe increases progress
      applyProgress(startP + delta);
    }, { passive: true });

    viewShell.addEventListener("touchend", () => {
      setTransition(260);
      const p = Number(getComputedStyle(document.body).getPropertyValue("--viewProgress")) || 0;
      setViewUI(p >= 0.5 ? "index" : "events");
    }, { passive: true });
  }
}

function render(){
  // Events (View A, left)
  const eventsRoot = $("eventsRoot");
  const eventsStatus = $("eventsStatus");
  if(eventsRoot && eventsStatus){
    const filtered = filterEvents(eventRows, state);
    renderEventsGroups(eventsRoot, filtered);
    eventsStatus.textContent = `${filtered.length} events`;
  }

  // Index (View B, right)
  const groupsRoot = $("groupsRoot");
  const status = $("status");
  if(groupsRoot && status){
    const filtered = filterDirectory(directoryRows, state);
    renderDirectoryGroups(groupsRoot, filtered);
    status.textContent = `${filtered.length} gyms`;
  }
}

async function init(){
  wireViewToggle();

  // default view
  if(!state.view) state.view = "events";
  setViewUI(state.view);

  // Load data
  const status = $("status");
  const eventsStatus = $("eventsStatus");
  if(status) status.textContent = "Loading…";
  if(eventsStatus) eventsStatus.textContent = "Loading…";

  const [dirRaw, evRaw] = await Promise.all([
    loadCSV("data/directory.csv"),
    loadCSV("data/events.csv").catch(() => []) // allow events to be missing during dev
  ]);

  directoryRows = dirRaw.map(normalizeDirectoryRow);
  eventRows = evRaw.map(normalizeEventRow);

  render();
}

init().catch((err) => {
  console.error(err);
  const status = $("status");
  const eventsStatus = $("eventsStatus");
  if(status) status.textContent = "Failed to load data";
  if(eventsStatus) eventsStatus.textContent = "Failed to load data";
});
