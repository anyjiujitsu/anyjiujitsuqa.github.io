function normalize(str){
  return String(str || "")
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
    .trim();
}
function splitTerms(q){
  return normalize(q).split(",").map(t=>t.trim()).filter(Boolean);
}

export function filterDirectory(rows, state){
  const terms = splitTerms(state.index.q);
  return rows.filter(r=>{
    if(!terms.length) return true;
    return terms.some(t=>{
      if(t === "sat" || t === "saturday") return r.SAT;
      if(t === "sun" || t === "sunday") return r.SUN;
      if(t === "open mat") return r.SAT || r.SUN;
      return normalize(r.NAME).includes(t) ||
             normalize(r.CITY).includes(t) ||
             normalize(r.STATE).includes(t);
    });
  });
}

export function filterEvents(rows, state){
  const terms = splitTerms(state.events.q);
  return rows.filter(r=>{
    if(!terms.length) return true;
    return terms.some(t=>{
      return normalize(r.TYPE).includes(t) ||
             normalize(r.GYM).includes(t) ||
             normalize(r.CITY).includes(t) ||
             normalize(r.STATE).includes(t);
    });
  });
}
