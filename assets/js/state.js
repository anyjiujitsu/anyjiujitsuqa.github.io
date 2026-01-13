export const state = {
  // shared
  search: "",

  // INDEX view filters
  states: new Set(),
  openMat: "", // "", "all", "sat", "sun"
  guests: new Set(), // placeholder (future multi-select)

  // EVENTS view filters (placeholders for now)
  eventsDate: "",   // e.g. "2026-01" or range key
  eventsType: "",   // e.g. "Seminar"
  eventsWhere: "",  // e.g. "MA" or gym handle
};

export function setSearch(v){ state.search = v; }
export function setOpenMat(v){ state.openMat = v; }

export function toggleState(code){
  if(state.states.has(code)) state.states.delete(code);
  else state.states.add(code);
}

export function clearStates(){ state.states.clear(); }
export function clearGuests(){ state.guests.clear(); }

export function clearEventsFilters(){
  state.eventsDate = "";
  state.eventsType = "";
  state.eventsWhere = "";
}

export function hasAnySelection(){
  return (
    state.search.trim().length > 0 ||
    state.states.size > 0 ||
    state.openMat !== "" ||
    state.guests.size > 0 ||
    state.eventsDate !== "" ||
    state.eventsType !== "" ||
    state.eventsWhere !== ""
  );
}
