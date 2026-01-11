export function applyFilters(rows, state){
  const q = (state?.search ?? "").trim().toLowerCase();
  const stateSet = state?.states ?? new Set();
  const om = state?.openMat ?? "";

  return rows.filter(r => {
    // --- SEARCH (robust) ---
    if (q) {
      const haystack = String(
        r.searchText ??
        `${r.STATE ?? ""} ${r.CITY ?? ""} ${r.NAME ?? ""} ${r.IG ?? ""} ${r.SAT ?? ""} ${r.SUN ?? ""} ${r.OTA ?? ""}`
      ).toLowerCase();

      if (!haystack.includes(q)) return false;
    }

    // --- STATES ---
    if (stateSet.size > 0 && !stateSet.has(r.STATE)) return false;

    // --- OPEN MAT ---
    if (om === "Y" && r.OTA !== "Y") return false;
    if (om === "N" && r.OTA === "Y") return false;

    return true;
  });
}
