// render104.js — Restore original DOM/CSS contract + Events grouped by Month-Year
// Exports MUST match main.js imports: renderDirectoryGroups, renderEventsGroups

export function renderStateMenu(stateListEl, allStates, selectedSet){
  if(!stateListEl) return;
  stateListEl.innerHTML = "";
  for(const code of allStates){
    const label = document.createElement("label");
    label.className = "menu__item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = code;
    input.checked = selectedSet.has(code);

    const span = document.createElement("span");
    span.textContent = code;

    label.appendChild(input);
    label.appendChild(span);
    stateListEl.appendChild(label);
  }
}

// -------------------- INDEX (group by STATE) --------------------
export function renderDirectoryGroups(root, rows){
  if(!root) return;
  const grouped = groupByKey(rows, (r)=> (r.STATE || "—").toUpperCase());
  root.innerHTML = "";

  for(const [labelText, list] of grouped){
    const group = document.createElement("section");
    group.className = "group";

    const label = document.createElement("div");
    label.className = "group__label";
    label.textContent = labelText;

    const table = document.createElement("div");
    table.className = "table";

    for(const r of list){
      table.appendChild(renderIndexRow(r));
    }

    group.appendChild(label);
    group.appendChild(table);
    root.appendChild(group);
  }
}

function renderIndexRow(r){
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

// -------------------- EVENTS (group by MONTH YEAR) --------------------
export function renderEventsGroups(root, rows){
  if(!root) return;

  const grouped = groupEventsByMonth(rows);
  root.innerHTML = "";

  for(const [labelText, list] of grouped){
    const group = document.createElement("section");
    group.className = "group";

    const label = document.createElement("div");
    label.className = "group__label";
    label.textContent = labelText;

    const table = document.createElement("div");
    table.className = "table";

    // sort within group by date ascending (unknowns last)
    const sorted = [...list].sort((a,b)=>{
      const da = parseEventDate(a.DATE)?.getTime() ?? Number.POSITIVE_INFINITY;
      const db = parseEventDate(b.DATE)?.getTime() ?? Number.POSITIVE_INFINITY;
      return da - db;
    });

    for(const r of sorted){
      table.appendChild(renderEventRow(r));
    }

    group.appendChild(label);
    group.appendChild(table);
    root.appendChild(group);
  }
}

function renderEventRow(r){
  const row = document.createElement("div");
  row.className = "row row--events";

  // DATE displayed as MM/DD/YY (fallback to original if parse fails)
  const rawDate = String(r.DATE ?? "").trim();
  const parsed = rawDate ? parseEventDate(rawDate) : null;
  const dateText = parsed
    ? `${String(parsed.getMonth() + 1).padStart(2,'0')}/${String(parsed.getDate()).padStart(2,'0')}/${String(parsed.getFullYear()).slice(-2)}`
    : (rawDate || "—");

  // 1) EVENT + (placeholder) NEW field
  const c1 = document.createElement("div");
  c1.className = "cell cell--event";
  c1.innerHTML = `
    <div class="cell__top cell__event">${escapeHtml(r.EVENT || r.TYPE || "—")}</div>
    <div class="cell__sub cell__new">—</div>
  `;

  // 2) FOR + WHERE
  const c2 = document.createElement("div");
  c2.className = "cell cell--forwhere";
  c2.innerHTML = `
    <div class="cell__top cell__for">${escapeHtml(r.FOR || "—")}</div>
    <div class="cell__sub cell__where">${escapeHtml(r.WHERE || r.GYM || "—")}</div>
  `;

  // 3) CITY + STATE
  const c3 = document.createElement("div");
  c3.className = "cell cell--citystate";
  c3.innerHTML = `
    <div class="cell__top cell__city">${escapeHtml(r.CITY || "—")}</div>
    <div class="cell__sub cell__state">${escapeHtml(r.STATE || "—")}</div>
  `;

  // 4) DAY + DATE
  const c4 = document.createElement("div");
  c4.className = "cell cell--daydate";
  c4.innerHTML = `
    <div class="cell__top cell__day">${escapeHtml(r.DAY || "—")}</div>
    <div class="cell__sub cell__date">${escapeHtml(dateText)}</div>
  `;

  row.appendChild(c1);
  row.appendChild(c2);
  row.appendChild(c3);
  row.appendChild(c4);

  return row;
}


function groupEventsByMonth(rows){
  const m = new Map();

  for(const r of rows){
    const d = parseEventDate(r.DATE);
    const key = d ? formatMonthYear(d) : "Unknown Date";
    if(!m.has(key)) m.set(key, []);
    m.get(key).push(r);
  }

  // sort groups by their earliest valid date (descending). Unknown last.
  const entries = [...m.entries()].sort((a,b)=>{
    if(a[0] === "Unknown Date") return 1;
    if(b[0] === "Unknown Date") return -1;

    const da = minDateIn(a[1]);
    const db = minDateIn(b[1]);
    const ta = da ? da.getTime() : -Infinity;
    const tb = db ? db.getTime() : -Infinity;
    return tb - ta;
  });

  return entries;
}

function minDateIn(list){
  let best = null;
  for(const r of list){
    const d = parseEventDate(r.DATE);
    if(!d) continue;
    if(!best || d < best) best = d;
  }
  return best;
}

function parseEventDate(s){
  const str = String(s ?? "").trim();
  if(!str) return null;

  // Accept MM/DD/YYYY (or M/D/YYYY)
  const m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(m){
    const mm = Number(m[1]);
    const dd = Number(m[2]);
    const yy = Number(m[3]);
    const d = new Date(yy, mm-1, dd);
    return isNaN(d) ? null : d;
  }

  const d = new Date(str);
  return isNaN(d) ? null : d;
}

function formatMonthYear(d){
  return d.toLocaleString("en-US", { month: "long", year: "numeric" });
}

// -------------------- shared helpers --------------------
function groupByKey(rows, keyFn){
  const m = new Map();
  for(const r of rows){
    const k = keyFn(r);
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
