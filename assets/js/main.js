// main.js
// Demo bootstrap showing unified pill architecture and indicator behavior.

import { initStatePill } from './state.js';
import { initFilterPills } from './filters.js';

const SAMPLE_EVENTS = [
  { date: '2026-01-24', time: '11:00 AM', title: "Women’s Only Open Mat", state: 'NH', city: 'Nashua', gym: 'Gate City MMA', type: 'Open Mat', tags: ['women', 'nogi'] },
  { date: '2026-02-02', time: '7:00 PM', title: 'Community Open Mat', state: 'MA', city: 'Somerville', gym: 'Example BJJ', type: 'Open Mat', tags: ['gi', 'beginner'] },
  { date: '2026-02-15', time: '12:00 PM', title: 'Guest Seminar', state: 'RI', city: 'Providence', gym: 'Ocean State BJJ', type: 'Seminar', tags: ['nogi'] },
  { date: '2026-03-10', time: '6:30 PM', title: 'Open Mat Night', state: 'CT', city: 'Hartford', gym: 'River City Grappling', type: 'Open Mat', tags: ['gi'] },
];

const els = {
  pillMount: document.querySelector('#pillMount'),
  search: document.querySelector('#searchInput'),
  clearAll: document.querySelector('#clearAll'),
  list: document.querySelector('#eventList'),
  empty: document.querySelector('#emptyState'),
};

let statePill;
let otherPills;

function getFilters() {
  const state = new Set(statePill.selection);
  const openMatOnly = otherPills.openMat.selection[0] === 'only';
  const guests = new Set(otherPills.guests.selection);
  const years = new Set(otherPills.years.selection);
  const q = (els.search.value || '').trim().toLowerCase();

  return { state, openMatOnly, guests, years, q };
}

function applyFilters(events) {
  const f = getFilters();
  return events.filter(ev => {
    if (f.state.size && !f.state.has(ev.state)) return false;

    if (f.openMatOnly && ev.type.toLowerCase() !== 'open mat') return false;

    if (f.years.size) {
      const y = ev.date.slice(0, 4);
      if (!f.years.has(y)) return false;
    }

    if (f.guests.size) {
      // All selected tags must be present (AND) to make behavior predictable.
      for (const tag of f.guests) {
        if (!ev.tags.includes(tag)) return false;
      }
    }

    if (f.q) {
      const blob = `${ev.title} ${ev.gym} ${ev.city} ${ev.state} ${ev.type}`.toLowerCase();
      if (!blob.includes(f.q)) return false;
    }

    return true;
  });
}

function groupByMonth(events) {
  const map = new Map();
  for (const ev of events) {
    const monthKey = ev.date.slice(0, 7); // YYYY-MM
    if (!map.has(monthKey)) map.set(monthKey, []);
    map.get(monthKey).push(ev);
  }
  // sort month keys and events by date
  const keys = Array.from(map.keys()).sort();
  return keys.map(k => ({ month: k, items: map.get(k).sort((a, b) => a.date.localeCompare(b.date)) }));
}

function render() {
  const filtered = applyFilters(SAMPLE_EVENTS);
  const groups = groupByMonth(filtered);

  els.list.innerHTML = '';

  if (!filtered.length) {
    els.empty.hidden = false;
    return;
  }
  els.empty.hidden = true;

  for (const g of groups) {
    const section = document.createElement('section');
    section.className = 'month';

    const h = document.createElement('div');
    h.className = 'month__label';
    h.textContent = monthLabel(g.month);

    const cards = document.createElement('div');
    cards.className = 'cards';

    for (const ev of g.items) {
      cards.appendChild(renderCard(ev));
    }

    section.appendChild(h);
    section.appendChild(cards);
    els.list.appendChild(section);
  }
}

function monthLabel(yyyyMm) {
  const [y, m] = yyyyMm.split('-').map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString(undefined, { month: 'long', year: 'numeric' });
}

function renderCard(ev) {
  const card = document.createElement('div');
  card.className = 'card';

  const left = document.createElement('div');
  left.className = 'card__left';

  const type = document.createElement('div');
  type.className = 'badge';
  type.textContent = ev.type;

  const title = document.createElement('div');
  title.className = 'card__title';
  title.textContent = ev.title;

  const meta = document.createElement('div');
  meta.className = 'card__meta';
  meta.textContent = `${ev.gym} • ${ev.city}, ${ev.state}`;

  left.appendChild(type);
  left.appendChild(title);
  left.appendChild(meta);

  const right = document.createElement('div');
  right.className = 'card__right';
  const date = document.createElement('div');
  date.className = 'card__date';
  date.textContent = prettyDate(ev.date);
  const time = document.createElement('div');
  time.className = 'card__time';
  time.textContent = ev.time;
  right.appendChild(date);
  right.appendChild(time);

  card.appendChild(left);
  card.appendChild(right);

  return card;
}

function prettyDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function anyPillChanged() {
  render();
}

function clearAll() {
  statePill.clear();
  Object.values(otherPills).forEach(p => p.clear());
  els.search.value = '';
  render();
}

function init() {
  statePill = initStatePill(els.pillMount, anyPillChanged);
  otherPills = initFilterPills(els.pillMount, anyPillChanged);

  els.search.addEventListener('input', () => render());
  els.clearAll.addEventListener('click', clearAll);

  render();
}

init();
