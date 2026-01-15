// STEP 0 — Skeleton Reset
// Render only. No state mutation.

export function renderDirectoryGroups(root, rows){
  root.innerHTML = "";
  const grouped = groupBy(rows, r => r.STATE || "—");

  for(const [stateCode, list] of grouped){
    const group = document.createElement("section");
    group.className = "group";

    const label = document.createElement("div");
    label.className = "group__label";
    label.textContent = stateCode;

    const table = document.createElement("div");
    table.className = "table";

    for(const r of list){
      table.appendChild(renderDirectoryRow(r));
    }

    group.appendChild(label);
    group.appendChild(table);
    root.appendChild(group);
  }
}

function renderDirectoryRow(r){
  const row = document.createElement("div");
  row.className = "row";

  const a = document.createElement("div");
  a.innerHTML = `
    <div class="cell__name">${escapeHtml(r.NAME)}</div>
    <div class="cell__ig">${escapeHtml(r.IG)}</div>
  `;

  const b = document.createElement("div");
  b.innerHTML = `
    <div class="cell__city">${escapeHtml(r.CITY)}</div>
    <div class="cell__state">${escapeHtml(r.STATE)}</div>
  `;

  const c = document.createElement("div");
  c.innerHTML = `
    <div class="cell__days">${escapeHtml(composeDays(r))}</div>
    <div class="cell__ota">OTA: ${escapeHtml(r.OTA || "—")}</div>
  `;

  row.appendChild(a);
  row.appendChild(b);
  row.appendChild(c);
  return row;
}

function composeDays(r){
  const parts = [];
  if(r.SAT) parts.push(`Sat. ${r.SAT}`);
  else parts.push("Sat.");
  if(r.SUN) parts.push(`Sun. ${r.SUN}`);
  else parts.push("Sun.");
  return parts.join("  ");
}

export function renderEventsGroups(root, rows){
  // In STEP 0, Events are grouped by STATE like your spec.
  root.innerHTML = "";
  const grouped = groupBy(rows, r => (r.STATE || "UNKNOWN").toString().trim() || "UNKNOWN");

  for(const [stateName, list] of grouped){
    const group = document.createElement("section");
    group.className = "group";

    const label = document.createElement("div");
    label.className = "group__label";
    label.textContent = stateName;

    const table = document.createElement("div");
    table.className = "table";

    // Minimal “2-line” event row in STEP 0, matching the compact look from your screenshot.
    for(const r of list){
      table.appendChild(renderEventRow(r));
    }

    group.appendChild(label);
    group.appendChild(table);
    root.appendChild(group);
  }
}

function renderEventRow(r){
  const row = document.createElement("div");
  row.className = "row";

  // Use same 3-column structure; keep conservative so CSS keeps it stable.
  const a = document.createElement("div");
  a.innerHTML = `
    <div class="cell__name">${escapeHtml(r.TITLE || r.NAME || "Event")}</div>
    <div class="cell__ig">${escapeHtml(r.WHERE || "")}</div>
  `;

  const b = document.createElement("div");
  b.innerHTML = `
    <div class="cell__city">${escapeHtml(r.CITY || "")}</div>
    <div class="cell__state">${escapeHtml(r.STATE || "")}</div>
  `;

  const c = document.createElement("div");
  c.innerHTML = `
    <div class="cell__days">${escapeHtml(r.TYPE || "")}</div>
    <div class="cell__ota">${escapeHtml(r.DATE || "")}</div>
  `;

  row.appendChild(a);
  row.appendChild(b);
  row.appendChild(c);
  return row;
}

function groupBy(rows, keyFn){
  const m = new Map();
  for(const r of rows){
    const k = String(keyFn(r) ?? "—");
    if(!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return [...m.entries()].sort((a,b)=> a[0].localeCompare(b[0]));
}

function escapeHtml(s){
  return String(s ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
