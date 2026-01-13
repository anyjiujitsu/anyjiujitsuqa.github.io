export const state = {
  search: "",
  states: new Set(),
  openMat: "", // "", "all", "sat", "sun"
  guests: new Set(), // placeholder
  view: "index",
};

export function setSearch(v){ state.search = v; }
export function setOpenMat(v){ state.openMat = v; }

export function toggleState(code){
  if(state.states.has(code)) state.states.delete(code);
  else state.states.add(code);
}

export function clearStates(){ state.states.clear(); }
export function clearGuests(){ state.guests.clear(); }

export function hasAnySelection(){
  return (
    state.search.trim().length > 0 ||
    state.states.size > 0 ||
    state.openMat !== "" ||
    state.guests.size > 0
  );
}
