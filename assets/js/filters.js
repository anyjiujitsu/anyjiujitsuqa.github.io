export function applyFilters(rows, state){
  const q = state.search.trim().toLowerCase();
  const stateSet = state.states;
  const om = state.openMat;

  return rows.filter(r => {
    if(q && !r.searchText.includes(q)) return false;

    if(stateSet.size > 0 && !stateSet.has(r.STATE)) return false;

    if(om === "Y" && r.OTA !== "Y") return false;
    if(om === "N" && r.OTA === "Y") return false;

    return true;
  });
}

