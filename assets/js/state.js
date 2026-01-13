export const state = {
  search: "",

  // INDEX view
  states: new Set(),
  openMat: "", // "", "all", "sat", "sun"
  guests: new Set(),

  // EVENTS view (placeholders)
  eventsDate: "",
  eventsType: "",
  eventsWhere: "",
};

export function setSearch(v){ state.search = v; }
export function toggleState(code){
  if (state.states.has(code)) state.states.delete(code);
  else state.states.add(code);
}
export function clearStates(){ state.states.clear(); }
