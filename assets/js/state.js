// state102.js — single source of truth (both views)

export const state = {
  view: "events", // View A first (Events)
  index: {
    q: "",
    states: new Set(),
    openMat: "", // "all"|"sat"|"sun"|""
    guests: new Set(), // "welcomed"
  },
  events: {
    q: "",
    year: new Set(),
    state: new Set(),
    type: new Set(),
  }
};

export function setView(v){ state.view = (v === "index") ? "index" : "events"; }
export function setIndexQuery(q){ state.index.q = String(q ?? ""); }
export function setEventsQuery(q){ state.events.q = String(q ?? ""); }
