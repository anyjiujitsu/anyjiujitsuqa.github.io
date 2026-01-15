// filters102.js — natural language search only (no pills yet)

function norm(s){
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s,]+/gu, " ") // keep comma as term separator
    .replace(/\s+/g, " ")
    .trim();
}

function terms(q){
  return norm(q).split(",").map(t=>t.trim()).filter(Boolean);
}

function hasText(hay, t){
  return norm(hay).includes(t);
}

export function filterDirectory(rows, state){
  const ts = terms(state.index.q);
  if(!ts.length) return rows;

  return rows.filter(r=>{
    return ts.some(t=>{
      if(t === "sat" || t === "saturday") return !!(r.SAT && String(r.SAT).trim());
      if(t === "sun" || t === "sunday") return !!(r.SUN && String(r.SUN).trim());
      if(t === "open mat") return !!((r.SAT && String(r.SAT).trim()) || (r.SUN && String(r.SUN).trim()));

      // text search across row
      const hay = r.searchText ?? `${r.STATE} ${r.CITY} ${r.NAME} ${r.IG} ${r.SAT} ${r.SUN} ${r.OTA}`;
      return hasText(hay, t);
    });
  });
}

export function filterEvents(rows, state){
  const ts = terms(state.events.q);
  if(!ts.length) return rows;

  return rows.filter(r=>{
    const hay = r.searchText ?? `${r.YEAR} ${r.STATE} ${r.CITY} ${r.GYM} ${r.TYPE} ${r.DATE}`;
    return ts.some(t=> hasText(hay, t));
  });
}
