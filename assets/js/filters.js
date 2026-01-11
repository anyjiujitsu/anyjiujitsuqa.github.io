export function applyFilters(rows, state){
  const raw = (state?.search ?? "").trim().toLowerCase();
  const stateSet = state?.states ?? new Set();
  const om = state?.openMat ?? "";

  // Split by commas → AND across terms (i.e., must match each term)
  const terms = raw
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  const wantsSat = terms.some(t => isSatToken(t));
  const wantsSun = terms.some(t => isSunToken(t));
  const wantsOpenMat = terms.some(t => isOpenMatToken(t));

  // Remove special tokens so they don't also try to match text
  const textTerms = terms.filter(t =>
    !isSatToken(t) && !isSunToken(t) && !isOpenMatToken(t)
  );

  return rows.filter(r => {
    // --- STATES pill (leave as-is) ---
    if (stateSet.size > 0 && !stateSet.has(r.STATE)) return false;

    // --- OpenMat pill (leave as-is) ---
    if (om === "Y" && r.OTA !== "Y") return false;
    if (om === "N" && r.OTA === "Y") return false;

    // Normalize for checks
    const hasSat = String(r.SAT ?? "").trim() !== "";
    const hasSun = String(r.SUN ?? "").trim() !== "";

    // --- Special keyword rules ---
    // 2) sat/saturday => SAT not blank
    if (wantsSat && !hasSat) return false;

    // 3) sun/sunday => SUN not blank
    if (wantsSun && !hasSun) return false;

    // 4) "open mat" => SAT or SUN not blank
    if (wantsOpenMat && !(hasSat || hasSun)) return false;

    // --- Text search terms (comma-separated AND) ---
    if (textTerms.length > 0) {
      const haystack = String(
        r.searchText ??
        `${r.STATE ?? ""} ${r.CITY ?? ""} ${r.NAME ?? ""} ${r.IG ?? ""} ${r.SAT ?? ""} ${r.SUN ?? ""} ${r.OTA ?? ""}`
      ).toLowerCase();

      // Must match ALL comma-separated text terms
      for (const t of textTerms) {
        if (!haystack.includes(t)) return false;
      }
    }

    return true;
  });
}

function isSatToken(t){
  // Matches: "sat", "saturday", "sat."
  return /^sat\.?$/.test(t) || t === "saturday";
}

function isSunToken(t){
  // Matches: "sun", "sunday", "sun."
  return /^sun\.?$/.test(t) || t === "sunday";
}

function isOpenMatToken(t){
  // Matches: "open mat", "openmat", "open-mat", "open  mat"
  const normalized = t.replace(/\s+/g, " ").trim();
  return normalized === "open mat" || t === "openmat" || t === "open-mat";
}
