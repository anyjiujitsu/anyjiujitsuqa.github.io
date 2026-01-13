// assets/js/pillSelect.js
// Shared controller for all filter pills (States, Open Mat, Guests, etc.)
// Handles: open/close, fixed positioning, outside click, Escape, resize/scroll reposition.

export function createPillSelect({
  btn,
  menu,
  clearBtn,
  onOpen,
  updateSelectedUI,
  onMenuChange,
}){
  if (!btn || !menu) {
    return { open(){}, close(){}, isOpen(){ return false; } };
  }

  let open = false;

  function setAria(){
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    menu.hidden = !open;
  }

  function position(){
    menu.style.position = "fixed";
    menu.style.zIndex = "1000";

    const btnRect = btn.getBoundingClientRect();
    const menuW = menu.offsetWidth || 240;
    const gutter = 8;

    let left = btnRect.left;
    const maxLeft = window.innerWidth - menuW - gutter;
    if (left > maxLeft) left = maxLeft;
    if (left < gutter) left = gutter;

    const top = btnRect.bottom + 8;

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
  }

  function openMenu(){
    open = true;
    setAria();

    requestAnimationFrame(() => {
      if (typeof onOpen === "function") onOpen();
      position();
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

  btn.addEventListener("click", toggleMenu);

  if (typeof onMenuChange === "function") {
    menu.addEventListener("change", (e) => onMenuChange(e));
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
      if (typeof updateSelectedUI === "function") updateSelectedUI();
    });
  }

  setAria();
  if (typeof updateSelectedUI === "function") updateSelectedUI();

  return {
    open: openMenu,
    close: closeMenu,
    isOpen: () => open,
  };
}
