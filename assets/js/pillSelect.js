// pillSelect.js
// Shared base controller for ALL pill filters.
// Provides: open/close, selection management, hasSelection, and green indicator dot auto-creation.

export class BasePillController {
  /**
   * @param {Object} cfg
   * @param {HTMLElement} cfg.root - The pill root element (button-like)
   * @param {HTMLElement} [cfg.panel] - Optional dropdown panel
   * @param {string} cfg.key - filter key
   * @param {Function} [cfg.onChange] - called when selection changes
   * @param {Function} [cfg.onOpen] - called when opened
   * @param {Function} [cfg.onClose] - called when closed
   */
  constructor(cfg) {
    this.root = cfg.root;
    this.panel = cfg.panel || null;
    this.key = cfg.key;
    this._selection = new Set();
    this._onChange = cfg.onChange || (() => {});
    this._onOpen = cfg.onOpen || (() => {});
    this._onClose = cfg.onClose || (() => {});

    this._wireBaseInteractions();
    this._ensureIndicatorDot();
    this._syncVisualState();
  }

  // --- public API ---
  get hasSelection() {
    return this._selection.size > 0;
  }

  get selection() {
    return Array.from(this._selection);
  }

  setSelection(values = []) {
    this._selection = new Set(values.filter(v => v != null && `${v}`.trim() !== ''));
    this._syncVisualState();
    this._onChange(this);
  }

  toggleValue(value) {
    const v = `${value}`;
    if (this._selection.has(v)) this._selection.delete(v);
    else this._selection.add(v);
    this._syncVisualState();
    this._onChange(this);
  }

  clear() {
    if (!this.hasSelection) return;
    this._selection.clear();
    this._syncVisualState();
    this._onChange(this);
  }

  open() {
    if (!this.panel) return;
    this.root.setAttribute('aria-expanded', 'true');
    this.panel.hidden = false;
    this.panel.classList.add('pill-panel--open');
    this._onOpen(this);
  }

  close() {
    if (!this.panel) return;
    this.root.setAttribute('aria-expanded', 'false');
    this.panel.hidden = true;
    this.panel.classList.remove('pill-panel--open');
    this._onClose(this);
  }

  toggleOpen() {
    if (!this.panel) return;
    const isOpen = this.root.getAttribute('aria-expanded') === 'true';
    isOpen ? this.close() : this.open();
  }

  // --- internals ---
  _wireBaseInteractions() {
    // Root behaves like a button.
    this.root.setAttribute('role', 'button');
    this.root.setAttribute('tabindex', '0');
    if (!this.root.hasAttribute('aria-expanded')) this.root.setAttribute('aria-expanded', 'false');

    // Toggle dropdown only if a panel exists.
    const onActivate = (e) => {
      // Allow clear button inside pill without toggling.
      if (e.target && e.target.closest && e.target.closest('[data-pill-clear]')) return;
      if (!this.panel) return;
      this.toggleOpen();
    };

    this.root.addEventListener('click', onActivate);
    this.root.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate(e);
      }
      if (e.key === 'Escape') {
        this.close();
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!this.panel) return;
      const within = this.root.contains(e.target) || this.panel.contains(e.target);
      if (!within) this.close();
    });
  }

  _ensureIndicatorDot() {
    // Auto-create dot element once. This is the shared indicator behavior.
    let dot = this.root.querySelector('.pill__dot');
    if (!dot) {
      dot = document.createElement('span');
      dot.className = 'pill__dot';
      dot.setAttribute('aria-hidden', 'true');
      this.root.appendChild(dot);
    }
  }

  _syncVisualState() {
    // Shared indicator logic: dot visible + bold label when hasSelection.
    this.root.classList.toggle('pill--has-selection', this.hasSelection);

    const clearBtn = this.root.querySelector('[data-pill-clear]');
    if (clearBtn) {
      clearBtn.hidden = !this.hasSelection;
      clearBtn.setAttribute('aria-hidden', (!this.hasSelection).toString());
    }

    // If panel has checkboxes/radios, reflect selection.
    if (this.panel) {
      const inputs = this.panel.querySelectorAll('input[type="checkbox"], input[type="radio"]');
      inputs.forEach(input => {
        const v = `${input.value}`;
        input.checked = this._selection.has(v);
      });

      const count = this.panel.querySelector('[data-pill-count]');
      if (count) count.textContent = this.hasSelection ? `${this._selection.size}` : '';
    }
  }
}

/**
 * Factory for consistent pill DOM + controller.
 * @param {Object} cfg
 * @param {string} cfg.key
 * @param {string} cfg.label
 * @param {HTMLElement} cfg.mount
 * @param {Array<{label:string,value:string}>} [cfg.options]
 * @param {'multi'|'single'} [cfg.mode]
 * @param {Function} [cfg.onChange]
 */
export function createSelectPill(cfg) {
  const mode = cfg.mode || 'multi';
  const root = document.createElement('div');
  root.className = 'pill';
  root.dataset.pillKey = cfg.key;

  const label = document.createElement('span');
  label.className = 'pill__label';
  label.textContent = cfg.label;

  const caret = document.createElement('span');
  caret.className = 'pill__caret';
  caret.setAttribute('aria-hidden', 'true');
  caret.textContent = '▾';

  const clear = document.createElement('button');
  clear.className = 'pill__clear';
  clear.type = 'button';
  clear.hidden = true;
  clear.dataset.pillClear = '1';
  clear.setAttribute('aria-label', `Clear ${cfg.label}`);
  clear.textContent = 'Clear';

  root.appendChild(label);
  root.appendChild(caret);
  root.appendChild(clear);

  const panel = document.createElement('div');
  panel.className = 'pill-panel';
  panel.hidden = true;

  const header = document.createElement('div');
  header.className = 'pill-panel__header';
  const title = document.createElement('div');
  title.className = 'pill-panel__title';
  title.textContent = cfg.label;
  const count = document.createElement('div');
  count.className = 'pill-panel__count';
  count.dataset.pillCount = '1';
  header.appendChild(title);
  header.appendChild(count);

  const list = document.createElement('div');
  list.className = 'pill-panel__list';

  (cfg.options || []).forEach(opt => {
    const row = document.createElement('label');
    row.className = 'pill-panel__item';

    const input = document.createElement('input');
    input.type = mode === 'single' ? 'radio' : 'checkbox';
    input.name = `pill-${cfg.key}`;
    input.value = opt.value;

    const text = document.createElement('span');
    text.textContent = opt.label;

    row.appendChild(input);
    row.appendChild(text);
    list.appendChild(row);
  });

  panel.appendChild(header);
  panel.appendChild(list);

  cfg.mount.appendChild(root);
  cfg.mount.appendChild(panel);

  const controller = new BasePillController({
    root,
    panel,
    key: cfg.key,
    onChange: cfg.onChange,
  });

  // Clear button uses shared API.
  clear.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    controller.clear();
    controller.close();
  });

  // Input changes route through shared API.
  panel.addEventListener('change', (e) => {
    const t = e.target;
    if (!(t instanceof HTMLInputElement)) return;

    if (mode === 'single') {
      controller.setSelection(t.checked ? [t.value] : []);
      controller.close();
      return;
    }

    controller.toggleValue(t.value);
  });

  return controller;
}
