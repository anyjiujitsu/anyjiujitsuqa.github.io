// Shared filter state for INDEX view

export const state = {
  search: "",
  states: new Set(),       // e.g. "CONNECTICUT"
  openMatMode: "",         // "", "all" | "sat" | "sun"
  guestsWelcomed: false,   // Guests pill: Welcomed (OTA == Y)
};

export function setSearch(value){
  state.search = (value ?? "").toString();
}

export function toggleState(value){
  const v = (value ?? "").toString();
  if (!v) return;
  if (state.states.has(v)) state.states.delete(v);
  else state.states.add(v);
}

export function clearStates(){
  state.states.clear();
}

export function setOpenMatMode(mode){
  state.openMatMode = (mode ?? "").toString();
}

export function clearOpenMat(){
  state.openMatMode = "";
}

export function setGuestsWelcomed(val){
  state.guestsWelcomed = !!val;
}

export function clearGuests(){
  state.guestsWelcomed = false;
}
