// render102.js — DOM rendering only (no state mutation)

function el(tag, cls){
  const n=document.createElement(tag);
  if(cls) n.className=cls;
  return n;
}

function groupByState(rows){
  const m=new Map();
  for(const r of rows){
    const k=(r.STATE || "—").toUpperCase();
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

export function renderEventsGroups(root, rows){
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
          <div class="row__name">${escapeHtml(r.TYPE || "—")}</div>
          <div class="row__meta">${escapeHtml(r.GYM || "—")} • ${escapeHtml(r.CITY || "—")}</div>
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

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
