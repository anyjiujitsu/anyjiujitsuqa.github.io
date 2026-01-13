// assets/js/pillSelect.js
// Shared dropdown pill controller (INDEX + EVENTS).
// Contract:
// - Same open/close behavior for every pill
// - Same positioning (portaled to <body> to avoid transformed parent issues)
// - Same indicator behavior (dot is ensured/created if missing)
// - Only one pill menu open at a time

function getRegistry(){
  window.__pillSelectRegistry = window.__pillSelectRegistry || new Set();
  window.__pillSelectCloseAll = window.__pillSelectCloseAll || (() => {
    for (const fn of window.__pillSelectRegistry) { try { fn(); } catch(e) {} }
  });
  return window.__pillSelectRegistry;
}

export function ensurePillDot(btn, dotId){
  if (!btn) return null;

  let dot = document.getElementById(dotId);
  if (dot) return dot;

  dot = document.createElement("span");
  dot.id = dotId;
  dot.className = "pill__dot";
  dot.setAttribute("aria-hidden", "true");
  dot.style.display = "none";

  const caret = btn.querySelector(".pill__caret");
  if (caret && caret.parentNode === btn) btn.insertBefore(dot, caret);
  else btn.appendChild(dot);

  return dot;
}

export function createPillSelect({
  btn,
  menu,
  clearBtn,
  dotId,
  hasSelection,
  onOpen,
  onMenuChange,
  onClear,
}){
  if (!btn || !menu) {
    return { open(){}, close(){}, isOpen(){ return false; }, updateSelectedUI(){} };
  }

  let open = false;
  let originalParent = null;
  let originalNextSibling = null;

  const dot = dotId ? ensurePillDot(btn, dotId) : null;

  function updateSelectedUI(){
    const selected = typeof hasSelection === "function" ? !!hasSelection() : false;
    btn.classList.toggle("pill--selected", selected);
    if (dot) dot.style.display = selected ? "inline-block" : "none";
  }

  function attachToBody(){
    if (menu.parentElement === document.body) return;
    originalParent = menu.parentElement;
    originalNextSibling = menu.nextSibling;
    document.body.appendChild(menu);
  }

  function restoreFromBody(){
    if (!originalParent) return;
    if (originalNextSibling && originalNextSibling.parentNode === originalParent) {
      originalParent.insertBefore(menu, originalNextSibling);
    } else {
      originalParent.appendChild(menu);
    }
    originalParent = null;
    originalNextSibling = null;
  }

  function setAria(){
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    menu.hidden = !open;
  }

  function position(){
    // Force fixed layout, and neutralize common CSS that can “center” the menu.
    menu.style.setProperty("position", "fixed", "important");
    menu.style.setProperty("z-index", "1000", "important");
    menu.style.transform = "none";
    menu.style.right = "auto";
    menu.style.bottom = "auto";
    menu.style.margin = "0";

    const btnRect = btn.getBoundingClientRect();
    const menuW = menu.offsetWidth || 240;
    const gutter = 8;

    let left = btnRect.left;
    const maxLeft = window.innerWidth - menuW - gutter;
    if (left > maxLeft) left = maxLeft;
    if (left < gutter) left = gutter;

    const top = btnRect.bottom + 8;

    menu.style.setProperty("left", `${left}px`, "important");
    menu.style.setProperty("top", `${top}px`, "important");
  }

  function onResize(){ if (open) position(); }
  function onScroll(){ if (open) position(); }

  function onDocClick(e){
    if (!open) return;
    const target = e.target;
    if (!(target instanceof Element)) return;
    if (target.closest(`#${menu.id}`) || target.closest(`#${btn.id}`)) return;
    closeMenu();
  }

  function onKeyDown(e){
    if (e.key === "Escape") closeMenu();
  }

  function openMenu(){
    try { window.__pillSelectCloseAll?.(); } catch(e) {}

    open = true;
    attachToBody();
    setAria();

    requestAnimationFrame(() => {
      if (typeof onOpen === "function") onOpen();
      position();
      // Some layouts settle one tick later (mobile zoom / transforms)
      setTimeout(position, 0);
    });

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeyDown);
  }

  function closeMenu(){
    if (!open) return;
    open = false;
    setAria();
    restoreFromBody();

    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("keydown", onKeyDown);
  }

  function toggleMenu(e){
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (open) closeMenu();
    else openMenu();
  }

  // Wire base interactions
  btn.addEventListener("click", toggleMenu);

  if (typeof onMenuChange === "function"){
    menu.addEventListener("change", (e) => onMenuChange(e));
  }

  if (clearBtn){
    clearBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof onClear === "function") onClear();
      updateSelectedUI();
      closeMenu();
    });
  }

  // Register so opening one pill closes others
  const reg = getRegistry();
  reg.add(closeMenu);

  // initial UI
  setAria();
  updateSelectedUI();

  return {
    open: openMenu,
    close: closeMenu,
    isOpen: () => open,
    updateSelectedUI,
  };
}
