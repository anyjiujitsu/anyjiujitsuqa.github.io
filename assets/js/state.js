// STEP 0 — Skeleton Reset
// State is plain data. No DOM access in this file.

export const state = {
  view: "index", // "index" | "events"

  // View B (Index)
  index: {
    q: "",
    // pills intentionally inactive in STEP 0
    states: new Set(),
    openMat: "", // "all" | "sat" | "sun" | ""
    guests: new Set(), // "welcomed" etc.
  },

  // View A (Events)
  events: {
    q: "",
    year: new Set(),
    state: new Set(),
    type: new Set(),
  },
};

export function setView(v){
  state.view = (v === "events") ? "events" : "index";
}

export function setIndexQuery(q){ state.index.q = String(q ?? ""); }
export function setEventsQuery(q){ state.events.q = String(q ?? ""); }

// Helper used later for indicator dots
export function hasIndexSelections(){
  return state.index.q.trim().length > 0 ||
    state.index.states.size > 0 ||
    state.index.openMat !== "" ||
    state.index.guests.size > 0;
}

export function hasEventsSelections(){
  return state.events.q.trim().length > 0 ||
    state.events.year.size > 0 ||
    state.events.state.size > 0 ||
    state.events.type.size > 0;
}
