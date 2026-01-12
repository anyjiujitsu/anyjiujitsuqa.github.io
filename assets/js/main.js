import { loadCSV } from "./data.js";
import { state, setSearch, toggleState, clearStates, setOpenMatMode, clearOpenMat } from "./state.js";
import { applyFilters } from "./filters.js";
import { renderGroups } from "./render.js";

let allRows = [];

async function init(){
  const status = document.getElementById("status");
  const root = document.getElementById("groupsRoot");

  // View toggle + slider (true continuous drag)
  const viewTitle = document.getElementById("viewTitle");
  const tabIndex = document.getElementById("tabIndex");
  const tabEvents = document.getElementById("tabEvents");
  const viewShell = document.getElementById("viewShell");
  const viewToggle = document.getElementById("viewToggle");

  let viewProgress = 0; // 0 = Index, 1 = Events
  let dragging = false;
  let dragPointerId = null;

  function setTransition(ms){
    document.body.style.setProperty("--viewTransition", ms + "ms");
  }

  function applyProgress(p){
    const clamped = Math.max(0, Math.min(1, p));
    viewProgress = clamped;
    document.body.style.setProperty("--viewProgress", String(clamped));

    // Live header label while dragging (feels iOS-like)
    if (viewTitle){
      if (clamped >= 0.5) viewTitle.textContent = "EVENTS";
      else viewTitle.textContent = "INDEX";
    }
  }

  function commitViewFromProgress(){
    const next = (viewProgress >= 0.5) ? "events" : "index";
    setView(next);
  }

  function setView(view){
    state.view = view;

    setTransition(260);
    applyProgress(view === "events" ? 1 : 0);

    if (tabIndex) tabIndex.setAttribute("aria-selected", view === "index" ? "true" : "false");
    if (tabEvents) tabEvents.setAttribute("aria-selected", view === "events" ? "true" : "false");

    if (viewTitle) viewTitle.textContent = view === "events" ? "EVENTS" : "INDEX";
    document.title = view === "events" ? "ANY N.E. â€“ EVENTS" : "ANY N.E. â€“ GYM INDEX";
  }

  if (tabIndex) tabIndex.addEventListener("click", () => setView("index"));
  if (tabEvents) tabEvents.addEventListener("click", () => setView("events"));

  // Pointer drag on the toggle track: thumb + view move together in real time
  if (viewToggle) {
    viewToggle.addEventListener("pointerdown", (e) => {
      dragging = true;
      dragPointerId = e.pointerId;
      viewToggle.setPointerCapture(dragPointerId);

      setTransition(0);

      const rect = viewToggle.getBoundingClientRect();
      const padding = 4; // matches CSS
      const trackW = rect.width - padding * 2;
      const thumbW = trackW / 2;
      const travel = trackW - thumbW; // thumb travel distance

      const x = e.clientX - rect.left - padding;
      const p = (x - thumbW / 2) / travel; // center-based
      applyProgress(p);
    });

    viewToggle.addEventListener("pointermove", (e) => {
      if (!dragging || e.pointerId !== dragPointerId) return;

      const rect = viewToggle.getBoundingClientRect();
      const padding = 4;
      const trackW = rect.width - padding * 2;
      const thumbW = trackW / 2;
      const travel = trackW - thumbW;

      const x = e.clientX - rect.left - padding;
      const p = (x - thumbW / 2) / travel;
      applyProgress(p);
    });

    const endDrag = (e) => {
      if (!dragging) return;
      if (e && dragPointerId != null && e.pointerId !== dragPointerId) return;

      dragging = false;
      dragPointerId = null;

      setTransition(260);
      commitViewFromProgress();
    };

    viewToggle.addEventListener("pointerup", endDrag);
    viewToggle.addEventListener("pointercancel", endDrag);
    viewToggle.addEventListener("lostpointercapture", endDrag);
  }

  // Swipe the whole view area (same continuous behavior)
  if (viewShell) {
    let startX = 0, startY = 0, startP = 0;

    viewShell.addEventListener("touchstart", (e) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startP = viewProgress;
      setTransition(0);
    }, { passive: true });

    viewShell.addEventListener("touchmove", (e) => {
      if (e.touches.length !== 1) return;
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;

      const dx = x - startX;
      const dy = y - startY;

      if (Math.abs(dy) > Math.abs(dx)) return;

      const delta = -dx / window.innerWidth; // left swipe increases progress
      applyProgress(startP + delta);
    }, { passive: true });

    viewShell.addEventListener("touchend", () => {
      setTransition(260);
      commitViewFromProgress();
    }, { passive: true });
  }

  // default view
  if (!state.view) state.view = "index";
  setView(state.view);



  // Search elements
  const searchInput = document.getElementById("searchInput");
  const searchClear = document.getElementById("searchClear");

  // States pill elements
  const stateBtn   = document.getElementById("stateBtn");
  const stateMenu  = document.getElementById("stateMenu");
  const stateList  = document.getElementById("stateList");
  const stateClear = document.getElementById("stateClear");
  const stateDot   = document.getElementById("stateDot");

  // -----------------------------
  // DROPDOWN PORTALING (GLOBAL)
  // -----------------------------
  // The view slider/panels can create clipping/stacking contexts (overflow/transform)
  // which makes dropdown menus appear "under" other content. To keep the UX consistent
  // and avoid CSS z-index whack-a-mole, we portal dropdown menus to <body> and position
  // them using `position: fixed`.
  function portalMenuOpen(menuEl, anchorEl){
    if (!menuEl || !anchorEl) return;
    if (menuEl.dataset.portalized === "1") {
      // Already portalized; just reposition.
      positionPortalMenu(menuEl, anchorEl);
      return;
    }

    // Save original DOM location so we can restore on close.
    menuEl.dataset.portalized = "1";
    menuEl.dataset.portalParentId = menuEl.parentElement?.id || "";
    menuEl._portalParent = menuEl.parentElement;
    menuEl._portalNextSibling = menuEl.nextSibling;

    document.body.appendChild(menuEl);
    menuEl.style.position = "fixed";
    menuEl.style.zIndex = "9999";
    menuEl.style.left = "0px";
    menuEl.style.top = "0px";

    positionPortalMenu(menuEl, anchorEl);
  }

  function positionPortalMenu(menuEl, anchorEl){
    const rect = anchorEl.getBoundingClientRect();
    const gap = 8;

    // Ensure we can measure width.
    const prevDisplay = menuEl.style.display;
    const wasHidden = menuEl.hasAttribute("hidden") || getComputedStyle(menuEl).display === "none";
    if (wasHidden) {
      menuEl.removeAttribute("hidden");
      menuEl.style.display = "block";
    }

    const menuW = menuEl.offsetWidth || 240;
    let left = rect.left;
    const maxLeft = Math.max(8, window.innerWidth - menuW - 8);
    if (left > maxLeft) left = maxLeft;

    menuEl.style.left = `${Math.round(left)}px`;
    menuEl.style.top  = `${Math.round(rect.bottom + gap)}px`;

    // Restore display control (hidden attribute will be set by open/close functions).
    if (wasHidden) {
      menuEl.style.display = prevDisplay;
      menuEl.setAttribute("hidden", "");
    }
  }

  function portalMenuClose(menuEl){
    if (!menuEl) return;
    if (menuEl.dataset.portalized !== "1") return;

    // Restore to original DOM location.
    const parent = menuEl._portalParent;
    const next = menuEl._portalNextSibling;
    if (parent) {
      if (next) parent.insertBefore(menuEl, next);
      else parent.appendChild(menuEl);
    }

    delete menuEl._portalParent;
    delete menuEl._portalNextSibling;
    delete menuEl.dataset.portalized;
    delete menuEl.dataset.portalParentId;

    // Reset positioning so CSS can take over if needed.
    menuEl.style.position = "";
    menuEl.style.left = "";
    menuEl.style.top = "";
    menuEl.style.zIndex = "";
  }

  function setStatesSelectedUI(){
    const has = state.states && state.states.size > 0;
    if (stateBtn) stateBtn.classList.toggle("pill--selected", has);
    if (stateDot) stateDot.style.display = has ? "inline-block" : "none";
  }

  function closeStateMenu(){
    if (!stateMenu) return;
    portalMenuClose(stateMenu);
    stateMenu.hidden = true;
    if (stateBtn) stateBtn.setAttribute("aria-expanded", "false");
  }

  function positionStateMenu(){
  // If the menu is open, keep it anchored to the trigger.
  if (!stateMenu || stateMenu.hidden) return;
  portalMenuOpen(stateMenu, stateBtn);
}

  function openStateMenu(){
    if (!stateMenu) return;
    stateMenu.hidden = false;
    if (stateBtn) stateBtn.setAttribute("aria-expanded", "true");
    // Portal & position after it becomes measurable
    requestAnimationFrame(() => portalMenuOpen(stateMenu, stateBtn));
  }

  function render(){
    const filtered = applyFilters(allRows, state);
    renderGroups(root, filtered);
    status.textContent = `${filtered.length} gyms`;
    setStatesSelectedUI();
  }

  // -----------------------------
  // EVENTS: render in INDEX style
  // -----------------------------
  function renderEvents(rows){
    const root = document.getElementById("eventsRoot");
    if (!root) return;
    root.innerHTML = "";

    // Normalize keys once so we can match headers regardless of case/spacing
    const normRows = rows.map(r => normalizeRowKeys(r));

    const grouped = groupEventsByMonth(normRows);

    for (const g of grouped) {
      const groupEl = document.createElement("section");
      groupEl.className = "group";

      const label = document.createElement("h2");
      label.className = "group__label";
      label.textContent = g.label;

      const table = document.createElement("div");
      table.className = "table";

      for (const r of g.rows) {
        const rowEl = document.createElement("div");
        rowEl.className = "row";
        // Match Index 3-column layout exactly
        rowEl.style.gridTemplateColumns = "1.4fr 1fr 0.8fr";

        // Heuristic field mapping (works with many CSV schemas)
        const title =
          getField(r, ["NAME","EVENT","TITLE","SEMINAR BY","TOURNAMENT","CLASS","SUMMARY"]) ||
          getFirstNonEmptyValue(r) ||
          "Event";

        const where =
          getField(r, ["WHERE","LOCATION","GYM","HOST","VENUE","CITY","STATE","IG"]) ||
          "";

        const dateRaw = getField(r, ["DATE","DAY","START DATE","START"]);
        const time =
          getField(r, ["TIME","START TIME","HOURS"]) ||
          "";

        const type =
          getField(r, ["TYPE","EVENT TYPE","KIND","CATEGORY"]) ||
          "";

        const price =
          getField(r, ["PRICE","COST","FEE"]) ||
          "";

        // Column 1: Title + Where
        const c1 = document.createElement("div");
        c1.innerHTML = `
          <div class="cell__name">${escapeHTML(title)}</div>
          <div class="cell__ig">${escapeHTML(where)}</div>
        `;

        // Column 2: Date + Time
        const c2 = document.createElement("div");
        c2.innerHTML = `
          <div class="cell__city">${escapeHTML(formatDate(dateRaw) || "")}</div>
          <div class="cell__state">${escapeHTML(time)}</div>
        `;

        // Column 3: Type + Price
        const c3 = document.createElement("div");
        c3.innerHTML = `
          <div class="cell__days">${escapeHTML(type)}</div>
          <div class="cell__ota">${escapeHTML(price)}</div>
        `;

        rowEl.appendChild(c1);
        rowEl.appendChild(c2);
        rowEl.appendChild(c3);
        table.appendChild(rowEl);
      }

      groupEl.appendChild(label);
      groupEl.appendChild(table);
      root.appendChild(groupEl);
    }
  }

  function groupEventsByMonth(rows){
    const buckets = new Map();

    for (const r of rows) {
      const dRaw = getField(r, ["DATE","DAY","START DATE","START"]);
      const d = parseAnyDate(dRaw);
      const key = d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}` : "unknown";
      if (!buckets.has(key)) buckets.set(key, { key, date: d, rows: [] });
      buckets.get(key).rows.push(r);
    }

    const arr = Array.from(buckets.values());
    arr.sort((a,b) => {
      if (a.key === "unknown") return 1;
      if (b.key === "unknown") return -1;
      return (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0);
    });

    return arr.map(b => ({
      label: b.key === "unknown" ? "UNKNOWN DATE" : formatMonthLabel(b.date),
      rows: b.rows
    }));
  }

  function formatMonthLabel(d){
    if (!d) return "UNKNOWN DATE";
    return d.toLocaleString(undefined, { month: "long", year: "numeric" }).toUpperCase();
  }

  function formatDate(raw){
    const d = parseAnyDate(raw);
    if (!d) return String(raw ?? "").trim();
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function parseAnyDate(s){
    const str0 = String(s ?? "").trim();
    if (!str0) return null;

    // Many CSVs contain ranges or extra text; extract the first date-like token.
    const str = extractFirstDateToken(str0) || str0;

    // ISO / built-in parse
    const iso = Date.parse(str);
    if (!Number.isNaN(iso)) return new Date(iso);

    // MM/DD/YYYY or M/D/YY
    const m1 = str.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
    if (m1){
      let mm = parseInt(m1[1],10);
      let dd = parseInt(m1[2],10);
      let yy = m1[3] ? parseInt(m1[3],10) : null;
      if (yy == null) return null;
      if (yy < 100) yy += 2000;
      const d = new Date(yy, mm-1, dd);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    // Month DD, YYYY
    const m2 = str.match(/^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/);
    if (m2){
      const d = new Date(`${m2[1]} ${m2[2]}, ${m2[3]}`);
      return Number.isNaN(d.getTime()) ? null : d;
    }

    return null;
  }

  function extractFirstDateToken(s){
    const t = String(s ?? "");

    // Prefer YYYY-MM-DD
    const iso = t.match(/\b\d{4}-\d{2}-\d{2}\b/);
    if (iso) return iso[0];

    // Prefer MM/DD/YYYY
    const us = t.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/);
    if (us) return us[0];

    // Month DD, YYYY
    const mdY = t.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\s+\d{1,2},\s*\d{4}\b/i);
    if (mdY) return mdY[0];

    return "";
  }

  function normalizeRowKeys(row){
    const out = {};
    for (const k in row){
      const nk = String(k).trim().toUpperCase();
      out[nk] = row[k];
    }
    return out;
  }

  function getField(row, keys){
    for (const k of keys){
      const nk = String(k).trim().toUpperCase();
      if (row && row[nk] != null){
        const v = String(row[nk]).trim();
        if (v !== "") return v;
      }
    }
    return "";
  }

  function getFirstNonEmptyValue(row){
    if (!row) return "";
    for (const k of Object.keys(row)){
      const v = String(row[k] ?? "").trim();
      if (v) return v;
    }
    return "";
  }

  function escapeHTML(str){
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }



  function buildStatesMenu(){
    if (!stateList) return;

    const uniqueStates = Array.from(
      new Set(
        allRows
          .map(r => String(r.STATE ?? "").trim())
          .filter(Boolean)
      )
    ).sort((a,b) => a.localeCompare(b));

    stateList.innerHTML = "";

    for (const code of uniqueStates){
      const label = document.createElement("label");
      label.className = "menu__item";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = code;
      cb.checked = state.states.has(code);

      const span = document.createElement("span");
      span.textContent = code;

      label.appendChild(cb);
      label.appendChild(span);
      stateList.appendChild(label);
    }
  }

  try{
    status.textContent = "Loadingâ€¦";
    allRows = await loadCSV("data/directory.csv");

    // Load Events data (Events view)
    let allEvents = [];
    async function loadFirstAvailable(paths){
      let lastErr = null;
      for (const p of paths){
        try{
          return await loadCSV(p);
        }catch(e){
          lastErr = e;
        }
      }
      throw lastErr || new Error("No paths tried");
    }

    try{
      // Try multiple likely repo paths (keeps QA/dev repos flexible)
      allEvents = await loadFirstAvailable(["data/events.csv","directory/events.csv","events.csv"]);

      const es = document.getElementById("eventsStatus");
      if (es) es.textContent = `${allEvents.length} events`;
      renderEvents(allEvents);
    }catch(err){
      console.warn(err);
      const es = document.getElementById("eventsStatus");
      // Show the actual error so debugging is instant
      if (es) es.textContent = `Failed to load events (${err?.message || err})`;
    }

    // ---- Search wiring ----
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        state.search = searchInput.value || "";
        render();
      });
    }

    if (searchClear) {
      searchClear.addEventListener("click", () => {
        if (!searchInput) return;
        searchInput.value = "";
        state.search = "";
        searchInput.focus();
        render();
      });
    }

    // ---- Events search wiring ----
    const eventsSearchInput = document.getElementById("eventsSearchInput");
    const eventsSearchClear = document.getElementById("eventsSearchClear");
    let eventsSearch = "";
    function applyEventsSearch(rows){
      const q = (eventsSearch || "").trim().toLowerCase();
      if (!q) return rows;
      return rows.filter(r => JSON.stringify(r).toLowerCase().includes(q));
    }
    if (eventsSearchInput) {
      eventsSearchInput.addEventListener("input", () => {
        eventsSearch = eventsSearchInput.value || "";
        // re-render using last loaded events if present
        if (typeof allEvents !== "undefined") renderEvents(applyEventsSearch(allEvents));
      });
    }
    if (eventsSearchClear) {
      eventsSearchClear.addEventListener("click", () => {
        if (!eventsSearchInput) return;
        eventsSearchInput.value = "";
        eventsSearch = "";
        eventsSearchInput.focus();
        if (typeof allEvents !== "undefined") renderEvents(allEvents);
      });
    }

    // ---- States pill wiring ----
    buildStatesMenu();
    setStatesSelectedUI();

    if (stateBtn && stateMenu) {
      stateBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = !stateMenu.hidden;
        if (isOpen) closeStateMenu();
        else openStateMenu();
      });
    }

    if (stateList) {
      stateList.addEventListener("change", (e) => {
        const el = e.target;
        if (!(el instanceof HTMLInputElement)) return;
        if (el.type !== "checkbox") return;

        if (el.checked) state.states.add(el.value);
        else state.states.delete(el.value);

        render();
      });
    }

    if (stateClear) {
      stateClear.addEventListener("click", (e) => {
        e.preventDefault();
        state.states.clear();

        if (stateList) {
          stateList.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
            cb.checked = false;
          });
        }

        render();
      });
    }

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!stateMenu || stateMenu.hidden) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("#stateMenu") || target.closest("#stateBtn")) return;
      closeStateMenu();
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeStateMenu();
    });

    // Keep menu positioned on resize/scroll while open
    window.addEventListener("resize", () => {
      if (stateMenu && !stateMenu.hidden) positionStateMenu();
    });
    window.addEventListener("scroll", () => {
      if (stateMenu && !stateMenu.hidden) positionStateMenu();
    }, { passive: true });

    // ---- OpenMat pill wiring ----
    const openMatBtn   = document.getElementById("openMatBtn");
    const openMatMenu  = document.getElementById("openMatMenu");
    const openMatClear = document.getElementById("openMatClear");
    const openMatDot   = document.getElementById("openMatDot");

    function setOpenMatUI(){
      const on = state.openMatMode === "all" || state.openMatMode === "sat" || state.openMatMode === "sun";
      if (openMatBtn) openMatBtn.classList.toggle("pill--selected", on);
      if (openMatDot) openMatDot.style.display = on ? "inline-block" : "none";
    }

    function closeOpenMatMenu(){
      if (!openMatMenu) return;
      portalMenuClose(openMatMenu);
      openMatMenu.hidden = true;
      if (openMatBtn) openMatBtn.setAttribute("aria-expanded", "false");
    }

    function positionOpenMatMenu(){
      if (!openMatMenu || !openMatBtn) return;
      portalMenuOpen(openMatMenu, openMatBtn);
    }

    function openOpenMatMenu(){
      if (!openMatMenu) return;
      openMatMenu.hidden = false;
      if (openMatBtn) openMatBtn.setAttribute("aria-expanded", "true");

      portalMenuOpen(openMatMenu, openMatBtn);

      // Sync checkbox state from current mode (exclusive selection)
      const boxes = Array.from(openMatMenu.querySelectorAll('input[type="checkbox"]'));
      boxes.forEach(b => { b.checked = (b.value === state.openMatMode); });

      requestAnimationFrame(positionOpenMatMenu);
    }

    if (openMatBtn && openMatMenu) {
      openMatBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = !openMatMenu.hidden;
        if (isOpen) closeOpenMatMenu();
        else openOpenMatMenu();
      });
    }

    if (openMatMenu) {
      const boxes = Array.from(openMatMenu.querySelectorAll('input[type="checkbox"]'));

      boxes.forEach(box => {
        box.addEventListener("change", () => {
          // Exclusive selection like a radio group, but with checkbox visuals.
          if (box.checked) {
            boxes.forEach(b => { if (b !== box) b.checked = false; });
            setOpenMatMode(box.value);
          } else {
            // Unchecking the active box clears the mode
            setOpenMatMode("");
          }

          setOpenMatUI();
          // Re-render with filters applied
          render();
        });
      });
    }

    if (openMatClear) {
      openMatClear.addEventListener("click", (e) => {
        e.preventDefault();
        clearOpenMat();
        if (openMatMenu) {
          openMatMenu.querySelectorAll('input[type="checkbox"]').forEach(b => b.checked = false);
        }
        setOpenMatUI();
        render();
      });
    }

    document.addEventListener("click", (e) => {
      if (!openMatMenu || openMatMenu.hidden) return;
      const target = e.target;
      if (!(target instanceof Element)) return;
      if (target.closest("#openMatMenu") || target.closest("#openMatBtn")) return;
      closeOpenMatMenu();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeOpenMatMenu();
    });

    window.addEventListener("resize", () => {
      if (openMatMenu && !openMatMenu.hidden) positionOpenMatMenu();
    });
    window.addEventListener("scroll", () => {
      if (openMatMenu && !openMatMenu.hidden) positionOpenMatMenu();
    }, { passive: true });

    setOpenMatUI();

    render();

  } catch(err){
    console.error(err);
    status.textContent = "Failed to load data";
  }
}

init();
