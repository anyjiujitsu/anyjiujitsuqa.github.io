// state.js
// States pill definition using the shared base controller in pillSelect.js

import { createSelectPill } from './pillSelect.js';

const STATE_OPTIONS = [
  { label: 'MA', value: 'MA' },
  { label: 'NH', value: 'NH' },
  { label: 'RI', value: 'RI' },
  { label: 'CT', value: 'CT' },
  { label: 'VT', value: 'VT' },
  { label: 'ME', value: 'ME' },
];

/**
 * @param {HTMLElement} mount - element that receives the pill + panel
 * @param {Function} onChange - called whenever selection changes
 */
export function initStatePill(mount, onChange) {
  return createSelectPill({
    key: 'state',
    label: 'States',
    mount,
    options: STATE_OPTIONS,
    mode: 'multi',
    onChange,
  });
}
