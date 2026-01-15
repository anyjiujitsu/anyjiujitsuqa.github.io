export const state = {
  view: "events",
  index: { q: "", states: new Set(), openMat: "", guests: new Set() },
  events: { q: "", year: new Set(), state: new Set(), type: new Set() },
};

export function setView(v){ state.view = (v === "index") ? "index" : "events"; }
export function setIndexQuery(q){ state.index.q = String(q ?? ""); }
export function setEventsQuery(q){ state.events.q = String(q ?? ""); }
