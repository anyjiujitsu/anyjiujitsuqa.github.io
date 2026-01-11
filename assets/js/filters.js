export function applyFilters(rows, state){
  const raw = (state?.search ?? "").trim().toLowerCase();
  const stateSet = state?.states ?? new Set();
  const om = state?.openMat ?? ""; // "", "all", "sat", "sun"

  const terms = raw
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  const wantsSat = terms.some(isSatToken);
  const wantsSun = terms.some(isSunToken);
  const wantsOpenMat = terms.some(isOpenMatToken);

  const textTerms = terms.filter(t =>
    !isSatToken(t) && !isSunToken(t) && !isOpenMatToken(t)
  );

  return rows.filter(r => {
    // States pill
    if (stateSet.size > 0 && !stateSet.has(getField(r, ["STATE"]))) return false;

    // SAT/SUN presence
    const satVal = getField(r, ["SAT", "Sat", "SATURDAY", "Saturday"]);
    const sunVal = getField(r, ["SUN", "Sun", "SUNDAY", "Sunday"]);
    const hasSat = satVal.trim() !== "";
    const hasSun = sunVal.trim() !== "";

    // OpenMat pill modes
    if (om === "all" && !(hasSat || hasSun)) return false;
    if (om === "sat" && !hasSat) return false;
    if (om === "sun" && !hasSun) return false;

    // Search bar special tokens
    if (wantsSat && !hasSat) return false;
    if (wantsSun && !hasSun) return false;
    if (wantsOpenMat && !(hasSat || hasSun)) return false;

    // Text terms: OR match (keep the behavior you wanted for comma tokens)
    if (textTerms.length > 0) {
      const haystack = buildHaystack(r);
      let matched = false;
      for (const t of textTerms) {
        if (haystack.includes(t)) { matched = true; break; }
      }
      if (!matched) return false;
    }

    return true;
  });
}

function getField(row, keys){
  for (const k of keys) {
    if (row && row[k] != null) return String(row[k]);
  }
  const lowerWanted = new Set(keys.map(k => k.toLowerCase()));
  for (const actualKey of Object.keys(row || {})) {
    if (lowerWanted.has(actualKey.toLowerCase())) {
      return String(row[actualKey] ?? "");
    }
  }
  return "";
}

function buildHaystack(r){
  const searchText = r?.searchText;
  if (typeof searchText === "string" && searchText.trim() !== "") {
    return searchText.toLowerCase();
  }
  const parts = [
    getField(r, ["STATE"]),
    getField(r, ["CITY"]),
    getField(r, ["NAME"]),
    getField(r, ["IG"]),
    getField(r, ["SAT", "Sat", "SATURDAY", "Saturday"]),
    getField(r, ["SUN", "Sun", "SUNDAY", "Sunday"]),
    getField(r, ["OTA", "ota"]),
  ];
  return parts.join(" ").toLowerCase();
}

function isSatToken(t){
  return /^sat\.?$/.test(t) || t === "saturday";
}

function isSunToken(t){
  return /^sun\.?$/.test(t) || t === "sunday";
}

function isOpenMatToken(t){
  const normalized = t.replace(/\s+/g, " ").trim();
  return normalized === "open mat" || normalized === "open-mat" || normalized === "openmat";
}
