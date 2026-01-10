export function renderStateMenu(stateListEl, allStates, selectedSet){
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

export function renderGroups(root, rows){
  const grouped = groupByState(rows);

  root.innerHTML = "";

  for(const [stateCode, list] of grouped){
    const group = document.createElement("section");
    group.className = "group";

    const label = document.createElement("div");
    label.className = "group__label";
    label.textContent = stateCode;

    const table = document.createElement("div");
    table.className = "table";

    for(const r of list){
      table.appendChild(renderRow(r));
    }

    group.appendChild(label);
    group.appendChild(table);
    root.appendChild(group);
  }
}

function renderRow(r){
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

function groupByState(rows){
  const m = new Map();
  for(const r of rows){
    if(!m.has(r.STATE)) m.set(r.STATE, []);
    m.get(r.STATE).push(r);
  }
  // stable order
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

