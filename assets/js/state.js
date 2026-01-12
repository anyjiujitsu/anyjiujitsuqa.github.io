export const state = {
  // Search bar raw string (can include comma-separated tokens)
  search: "",
  // Multi-select states
  states: new Set(),

  // OpenMat mode: "", "all", "sat", "sun"
  openMatMode: "",

  // Guests filter (Welcomed)
  guestsWelcomed: false
};

export function setSearch(v){
  state.search = String(v ?? "");
}

export function toggleState(st){
  const key = String(st ?? "").toUpperCase().trim();
  if(!key) return;
  if(state.states.has(key)) state.states.delete(key);
  else state.states.add(key);
}

export function clearStates(){
  state.states.clear();
}

export function setOpenMatMode(mode){
  const m = String(mode ?? "").toLowerCase().trim();
  state.openMatMode = (m === "all" || m === "sat" || m === "sun") ? m : "";
}

export function clearOpenMat(){
  state.openMatMode = "";
}


export function setGuestsWelcomed(on){
  state.guestsWelcomed = Boolean(on);
}

export function toggleGuestsWelcomed(){
  state.guestsWelcomed = !state.guestsWelcomed;
}

export function clearGuests(){
  state.guestsWelcomed = false;
}
