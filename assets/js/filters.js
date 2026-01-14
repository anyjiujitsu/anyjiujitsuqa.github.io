// filters.js
// All non-state pills built with the SAME shared controller.

import { createSelectPill } from './pillSelect.js';

export function initFilterPills(mount, onChange) {
  const pills = {};

  pills.openMat = createSelectPill({
    key: 'openMat',
    label: 'Open Mat',
    mount,
    options: [
      { label: 'Only Open Mats', value: 'only' },
    ],
    mode: 'single',
    onChange,
  });

  pills.guests = createSelectPill({
    key: 'guests',
    label: 'Guests',
    mount,
    options: [
      { label: 'Women’s Only', value: 'women' },
      { label: 'Beginner Friendly', value: 'beginner' },
      { label: 'Gi', value: 'gi' },
      { label: 'No-Gi', value: 'nogi' },
    ],
    mode: 'multi',
    onChange,
  });

  pills.years = createSelectPill({
    key: 'years',
    label: 'Years',
    mount,
    options: [
      { label: '2026', value: '2026' },
      { label: '2025', value: '2025' },
      { label: '2024', value: '2024' },
    ],
    mode: 'multi',
    onChange,
  });

  return pills;
}
