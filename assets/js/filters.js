function isSatToken(t){
  return /^sat\.?$/.test(t) || t === "saturday";
}
function isSunToken(t){
  return /^sun\.?$/.test(t) || t === "sunday";
}
function isOpenMatToken(t){
  const normalized = t.replace(/\s+/g, " ").trim();
  return normalized === "open mat" || t === "openmat" || t === "open-mat";
}

export function applyFilters(rows, state){
  const raw = (state?.search ?? "").trim().toLowerCase();
  const stateSet = state?.states ?? new Set();
  const omMode = (state?.openMatMode ?? "").toLowerCase();

  // Split by commas → AND across terms
  const terms = raw
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  const wantsSat = terms.some(isSatToken);
  const wantsSun = terms.some(isSunToken);
  const wantsOpenMat = terms.some(isOpenMatToken);

  const textTerms = terms.filter(t => !isSatToken(t) && !isSunToken(t) && !isOpenMatToken(t));

  return rows.filter(r => {
    // --- STATES pill ---
    if (stateSet.size > 0) {
      const rowState = String(r.STATE ?? "").toUpperCase().trim();
      if (!stateSet.has(rowState)) return false;
    }

    // Normalize open mat presence from SAT/SUN columns (NOT OTA)
    const hasSat = String(r.SAT ?? "").trim() !== "";
    const hasSun = String(r.SUN ?? "").trim() !== "";

    // --- OpenMat pill modes ---
    if (omMode === "all" && !(hasSat || hasSun)) return false;
    if (omMode === "sat" && !hasSat) return false;
    if (omMode === "sun" && !hasSun) return false;

    // --- Special keyword rules via search bar ---
    if (wantsSat && !hasSat) return false;
    if (wantsSun && !hasSun) return false;
    if (wantsOpenMat && !(hasSat || hasSun)) return false;

    // --- Text search terms ---
    if (textTerms.length > 0) {
      const haystack = String(
        r.searchText ??
        `${r.STATE ?? ""} ${r.CITY ?? ""} ${r.NAME ?? ""} ${r.IG ?? ""} ${r.SAT ?? ""} ${r.SUN ?? ""} ${r.OTA ?? ""}`
      ).toLowerCase();

      for (const t of textTerms) {
        if (!haystack.includes(t)) return false;
      }
    }

    return true;
  });
}
