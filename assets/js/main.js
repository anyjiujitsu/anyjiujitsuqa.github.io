// main102.js — Step 1A Search Fix + restores stable slider behavior

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
  const tabEvents = $("tabEvents");
  const tabIndex = $("tabIndex");
  const viewToggle = $("viewToggle");
  const viewShell = $("viewShell");

  tabEvents?.addEventListener("click", () => setViewUI("events"));
  tabIndex?.addEventListener("click", () => setViewUI("index"));

  // Pointer drag (continuous)
  if(viewToggle){
    let dragging=false, pointerId=null;

    viewToggle.addEventListener("pointerdown",(e)=>{
      dragging=true; pointerId=e.pointerId;
      viewToggle.setPointerCapture(pointerId);
      setTransition(0);

      const rect=viewToggle.getBoundingClientRect();
      const padding=4;
      const trackW=rect.width - padding*2;
      const thumbW=trackW/2;
      const travel=trackW-thumbW;

      const x=e.clientX - rect.left - padding;
      applyProgress((x - thumbW/2)/travel);
    });

    viewToggle.addEventListener("pointermove",(e)=>{
      if(!dragging || e.pointerId!==pointerId) return;
      const rect=viewToggle.getBoundingClientRect();
      const padding=4;
      const trackW=rect.width - padding*2;
      const thumbW=trackW/2;
      const travel=trackW-thumbW;
      const x=e.clientX - rect.left - padding;
      applyProgress((x - thumbW/2)/travel);
    });

    const endDrag=(e)=>{
      if(!dragging) return;
      if(e && pointerId!=null && e.pointerId!==pointerId) return;
      dragging=false; pointerId=null;
      setTransition(260);
      const p = Number(getComputedStyle(document.body).getPropertyValue("--viewProgress")) || 0;
      setViewUI(p>=0.5 ? "index" : "events");
    };
    viewToggle.addEventListener("pointerup", endDrag);
    viewToggle.addEventListener("pointercancel", endDrag);
    viewToggle.addEventListener("lostpointercapture", endDrag);
  }

  // Swipe (continuous)
  if(viewShell){
    let startX=0, startY=0, startP=0;
    viewShell.addEventListener("touchstart",(e)=>{
      if(e.touches.length!==1) return;
      startX=e.touches[0].clientX;
      startY=e.touches[0].clientY;
      startP=Number(getComputedStyle(document.body).getPropertyValue("--viewProgress")) || 0;
      setTransition(0);
    }, {passive:true});

    viewShell.addEventListener("touchmove",(e)=>{
      if(e.touches.length!==1) return;
      const x=e.touches[0].clientX, y=e.touches[0].clientY;
      const dx=x-startX, dy=y-startY;
      if(Math.abs(dy)>Math.abs(dx)) return;
      const delta = -dx / window.innerWidth;
      applyProgress(startP + delta);
    }, {passive:true});

    viewShell.addEventListener("touchend",()=>{
      setTransition(260);
      const p = Number(getComputedStyle(document.body).getPropertyValue("--viewProgress")) || 0;
      setViewUI(p>=0.5 ? "index" : "events");
    }, {passive:true});
  }
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

init().catch((err)=>{
  console.error(err);
  $("status").textContent = "Failed to load data";
  $("eventsStatus").textContent = "Failed to load data";
});
