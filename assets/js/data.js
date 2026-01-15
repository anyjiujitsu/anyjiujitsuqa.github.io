// STEP 0 — Skeleton Reset
// Data loading + normalization only. No DOM access.

export async function loadCSV(url){
  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok) throw new Error(`Failed to load CSV: ${res.status} (${url})`);
  const text = await res.text();
  return parseCSV(text);
}

/**
 * Lightweight CSV parser with basic quoted-field support.
 * Upgrade later if you introduce complex CSV.
 */
export function parseCSV(text){
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if(lines.length === 0) return [];
  const headers = splitLine(lines[0]).map(h => h.trim());
  const rows = [];

  for(let i=1;i<lines.length;i++){
    const cols = splitLine(lines[i]);
    if(cols.length === 0) continue;
    const row = {};
    headers.forEach((h, idx) => row[h] = (cols[idx] ?? "").trim());
    rows.push(row);
  }
  return rows;
}

function splitLine(line){
  const out = [];
  let cur = "";
  let inQ = false;

  for(let i=0;i<line.length;i++){
    const ch = line[i];
    if(ch === '"'){
      // handle escaped quotes ""
      if(inQ && line[i+1] === '"'){ cur += '"'; i++; continue; }
      inQ = !inQ;
      continue;
    }
    if(ch === "," && !inQ){
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

/**
 * Directory normalization (View B)
 * Expected headers: STATE, CITY, NAME, IG, SAT, SUN, OTA
 * OTA is Y/N/blank.
 */
export function normalizeDirectoryRow(r){
  const STATE = String(r.STATE ?? "").trim().toUpperCase();
  const CITY  = String(r.CITY ?? "").trim();
  const NAME  = String(r.NAME ?? "").trim();
  const IG    = String(r.IG ?? "").trim();
  const SAT   = String(r.SAT ?? "").trim();
  const SUN   = String(r.SUN ?? "").trim();
  const OTA   = String(r.OTA ?? "").trim().toUpperCase();

  const searchText = `${STATE} ${CITY} ${NAME} ${IG} ${SAT} ${SUN} ${OTA}`.toLowerCase();

  return { STATE, CITY, NAME, IG, SAT, SUN, OTA, searchText };
}

/**
 * Events normalization (View A)
 * We keep flexible schema, but compute a searchText and a best-effort STATE key for grouping.
 * We also keep CREATED if present to support NEW indicator later.
 */
export function normalizeEventRow(r){
  // Normalize keys to uppercase for robust access
  const norm = {};
  for(const k of Object.keys(r)){
    norm[String(k).trim().toUpperCase()] = r[k];
  }

  const STATE = String(
    norm.STATE ?? norm.ST ?? norm["EVENT STATE"] ?? norm["STATE/PROV"] ?? ""
  ).trim().toUpperCase();

  const CITY = String(norm.CITY ?? norm.TOWN ?? norm["EVENT CITY"] ?? "").trim();

  const TITLE = String(
    norm.TITLE ?? norm.EVENT ?? norm.NAME ?? norm.SUMMARY ?? norm["SEMINAR BY"] ?? ""
  ).trim();

  const TYPE = String(norm.TYPE ?? norm["EVENT TYPE"] ?? norm.CATEGORY ?? "").trim();
  const DATE = String(norm.DATE ?? norm.DAY ?? norm.START ?? norm["START DATE"] ?? "").trim();
  const WHERE = String(norm.WHERE ?? norm.LOCATION ?? norm.VENUE ?? norm.GYM ?? norm.HOST ?? norm.IG ?? "").trim();
  const CREATED = String(norm.CREATED ?? norm["CREATED AT"] ?? norm["DATE CREATED"] ?? "").trim();

  const searchText = Object.values(norm).join(" ").toLowerCase();

  return { ...norm, STATE, CITY, TITLE, TYPE, DATE, WHERE, CREATED, searchText };
}
