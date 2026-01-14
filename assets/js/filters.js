export function applyFilters(rows, state){
  const raw = (state?.search ?? "").trim().toLowerCase();
  const stateSet = state?.states ?? new Set();
  const om = state?.openMat ?? "";

  const terms = raw
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);

  const wantsSat = terms.some(isSatToken);
  const wantsSun = terms.some(isSunToken);
  const wantsOpenMat = terms.some(isOpenMatToken);

  // Remove special tokens so they don't also act as plain text matches
  const textTerms = terms.filter(t =>
    !isSatToken(t) && !isSunToken(t) && !isOpenMatToken(t)
  );

  return rows.filter(r => {
    // --- Existing pill filters (unchanged) ---
    if (stateSet.size > 0 && !stateSet.has(getField(r, ["STATE"]))) return false;

    const OTA = getField(r, ["OTA"]).toUpperCase();
    if (om === "Y" && OTA !== "Y") return false;
    if (om === "N" && OTA === "Y") return false;

    // --- Robust SAT/SUN detection (header-name tolerant) ---
    const satVal = getField(r, ["SAT", "Sat", "SATURDAY", "Saturday"]);
    const sunVal = getField(r, ["SUN", "Sun", "SUNDAY", "Sunday"]);
    const hasSat = satVal.trim() !== "";
    const hasSun = sunVal.trim() !== "";

    // 2) sat/saturday => SAT not blank
    if (wantsSat && !hasSat) return false;

    // 3) sun/sunday => SUN not blank
    if (wantsSun && !hasSun) return false;

    // 4) open mat => SAT or SUN not blank
    if (wantsOpenMat && !(hasSat || hasSun)) return false;

    // --- Text terms: comma = OR (either term can match) ---
    if (textTerms.length > 0) {
      const haystack = buildHaystack(r);

      // OR logic: any term matches
      let matched = false;
      for (const t of textTerms) {
        if (haystack.includes(t)) { matched = true; break; }
      }
      if (!matched) return false;
    }

    return true;
  });
}

/** Case-insensitive field getter + common key variants */
function getField(row, keys){
  // direct keys first
  for (const k of keys) {
    if (row && row[k] != null) return String(row[k]);
  }
  // fall back to case-insensitive match against actual object keys
  const lowerWanted = new Set(keys.map(k => k.toLowerCase()));
  for (const actualKey of Object.keys(row || {})) {
    if (lowerWanted.has(actualKey.toLowerCase())) {
      return String(row[actualKey] ?? "");
    }
  }
  return "";
}

function buildHaystack(r){
  // If you have r.searchText it will work; otherwise build from fields robustly
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
    getField(r, ["OTA"]),
  ];

  return parts.join(" ").toLowerCase();
}

function isSatToken(t){
  // sat / sat. / saturday
  return /^sat\.?$/.test(t) || t === "saturday";
}

function isSunToken(t){
  // sun / sun. / sunday
  return /^sun\.?$/.test(t) || t === "sunday";
}

function isOpenMatToken(t){
  // open mat / openmat / open-mat (allow extra spaces)
  const normalized = t.replace(/\s+/g, " ").trim();
  return normalized === "open mat" || normalized === "open-mat" || normalized === "openmat";
}
