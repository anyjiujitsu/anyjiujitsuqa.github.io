// assets/js/filters.js
// Registry for unified pill controllers (shared architecture).

const pills = new Map();

export function registerPill(key, controller) {
  pills.set(key, controller);
  return controller;
}

export function getPill(key) {
  return pills.get(key);
}

export function refreshAllPillIndicators() {
  for (const ctrl of pills.values()) ctrl.renderIndicator();
}
