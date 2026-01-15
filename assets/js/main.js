// main103.js — Event grouping fix (Month-Year)

import { loadCSV, normalizeDirectoryRow, normalizeEventRow } from "./data.js";
import { state, setView, setIndexQuery, setEventsQuery } from "./state.js";
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
  $("viewTitle").textContent = (view === "events") ? "EVENTS" : "INDEX";
  document.title = (view === "events") ? "ANY N.E. – EVENTS" : "ANY N.E. – GYM INDEX";
  setTransition(260);
  applyProgress(view === "index" ? 1 : 0);
}

function wireViewToggle(){
  $("tabEvents")?.addEventListener("click", () => setViewUI("events"));
  $("tabIndex")?.addEventListener("click", () => setViewUI("index"));
}

function wireSearch(){
  const idxIn = $("searchInput");
  const evIn  = $("eventsSearchInput");

  idxIn?.addEventListener("input",(e)=>{ setIndexQuery(e.target.value); render(); });
  evIn?.addEventListener("input",(e)=>{ setEventsQuery(e.target.value); render(); });

  $("searchClear")?.addEventListener("click",()=>{
    setIndexQuery(""); if(idxIn) idxIn.value=""; render();
  });
  $("eventsSearchClear")?.addEventListener("click",()=>{
    setEventsQuery(""); if(evIn) evIn.value=""; render();
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
  setViewUI(state.view || "events");

  $("status").textContent = "Loading…";
  $("eventsStatus").textContent = "Loading…";

  const [dirRaw, evRaw] = await Promise.all([
    loadCSV("data/directory.csv"),
    loadCSV("data/events.csv").catch(()=>[])
  ]);

  directoryRows = dirRaw.map(normalizeDirectoryRow);
  eventRows = evRaw.map(normalizeEventRow);

  render();
}

init();
