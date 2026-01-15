// render103.js — Events grouped by Month-Year, Index grouped by State

function el(tag, cls){
  const n = document.createElement(tag);
  if(cls) n.className = cls;
  return n;
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

// ---------- INDEX (by STATE) ----------
function groupByState(rows){
  const m = new Map();
  for(const r of rows){
    const k = (r.STATE || "—").toUpperCase();
    if(!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
}

export function renderDirectoryGroups(root, rows){
  if(!root) return;
  root.innerHTML = "";
  const groups = groupByState(rows);

  for(const [stateCode, items] of groups){
    const g = el("section","group");
    const h = el("div","group__header");
    const t = el("div","group__title");
    t.textContent = stateCode;
    h.appendChild(t);
    g.appendChild(h);

    const list = el("div","rows");
    for(const r of items){
      const row = el("div","row");
      row.innerHTML = `
        <div class="row__main">
          <div class="row__name">${escapeHtml(r.NAME)}</div>
          <div class="row__meta">${escapeHtml(r.CITY)} • ${escapeHtml(r.IG)}</div>
        </div>
        <div class="row__cols">
          <div class="row__col">${escapeHtml(r.SAT)}</div>
          <div class="row__col">${escapeHtml(r.SUN)}</div>
          <div class="row__col">${escapeHtml(r.OTA)}</div>
        </div>
      `;
      list.appendChild(row);
    }
    g.appendChild(list);
    root.appendChild(g);
  }
}

// ---------- EVENTS (by MONTH YEAR) ----------
function parseDate(d){
  const dt = new Date(d);
  return isNaN(dt) ? null : dt;
}

function monthKey(d){
  return d.toLocaleString("en-US",{month:"long", year:"numeric"});
}

function groupByMonth(rows){
  const m = new Map();
  for(const r of rows){
    const dt = parseDate(r.DATE);
    const key = dt ? monthKey(dt) : "Unknown Date";
    if(!m.has(key)) m.set(key, []);
    m.get(key).push(r);
  }

  // sort by actual date descending
  return [...m.entries()].sort((a,b)=>{
    if(a[0]==="Unknown Date") return 1;
    if(b[0]==="Unknown Date") return -1;
    const da = parseDate(a[1][0].DATE);
    const db = parseDate(b[1][0].DATE);
    return db - da;
  });
}

export function renderEventsGroups(root, rows){
  if(!root) return;
  root.innerHTML = "";

  const groups = groupByMonth(rows);

  for(const [label, items] of groups){
    const g = el("section","group");
    const h = el("div","group__header");
    const t = el("div","group__title");
    t.textContent = label;
    h.appendChild(t);
    g.appendChild(h);

    const list = el("div","rows");
    for(const r of items){
      const row = el("div","row");
      row.innerHTML = `
        <div class="row__main">
          <div class="row__name">${escapeHtml(r.TYPE || "—")}</div>
          <div class="row__meta">${escapeHtml(r.GYM || "—")} • ${escapeHtml(r.CITY || "—")} • ${escapeHtml(r.STATE || "")}</div>
        </div>
        <div class="row__cols">
          <div class="row__col">${escapeHtml(r.DATE || "")}</div>
          <div class="row__col">${escapeHtml(r.YEAR || "")}</div>
        </div>
      `;
      list.appendChild(row);
    }
    g.appendChild(list);
    root.appendChild(g);
  }
}
