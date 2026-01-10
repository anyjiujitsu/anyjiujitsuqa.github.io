export async function loadCSV(url){
  const res = await fetch(url, { cache: "no-store" });
  if(!res.ok) throw new Error(`Failed to load CSV: ${res.status}`);
  const text = await res.text();
  return parseCSV(text);
}

/**
 * Simple CSV parser good for your dataset.
 * If you have commas inside quoted fields, we can upgrade this later.
 */
export function parseCSV(text){
  const lines = text.split(/\r?\n/).filter(Boolean);
  const headers = splitLine(lines[0]).map(h => h.trim());
  const rows = [];

  for(let i=1;i<lines.length;i++){
    const cols = splitLine(lines[i]);
    if(cols.length === 0) continue;

    const row = {};
    headers.forEach((h, idx) => row[h] = (cols[idx] ?? "").trim());
    rows.push(normalizeRow(row));
  }
  return rows;
}

function splitLine(line){
  // minimal: handles basic quotes
  const out = [];
  let cur = "";
  let inQ = false;
  for(let i=0;i<line.length;i++){
    const ch = line[i];
    if(ch === '"' ){
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

function normalizeRow(r){
  const STATE = (r.STATE || "").trim().toUpperCase();
  const CITY  = (r.CITY || "").trim();
  const NAME  = (r.NAME || "").trim();
  const IG    = (r.IG || "").trim();
  const SAT   = (r.SAT || "").trim();
  const SUN   = (r.SUN || "").trim();
  const OTA   = (r.OTA || "").trim().toUpperCase(); // Y / N / blank per your rule

  const searchText = `${STATE} ${CITY} ${NAME} ${IG} ${SAT} ${SUN} ${OTA}`.toLowerCase();

  return { STATE, CITY, NAME, IG, SAT, SUN, OTA, searchText };
}

