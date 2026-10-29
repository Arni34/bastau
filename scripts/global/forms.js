/* BASTAU - form validation & chip pickers */

import { icon, esc } from '../lib/utils.js';

export function fieldError(form, name, msg) {
  const input = form.querySelector(`[name="${name}"]`);
  const box = form.querySelector(`[data-err="${name}"]`);
  if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  if (box) box.innerHTML = msg ? `${icon('x', 'ic--sm')}<span>${esc(msg)}</span>` : '';
}
export function validate(form, rules) {
  let firstBad = null;
  Object.entries(rules).forEach(([name, check]) => {
    const el = form.querySelector(`[name="${name}"]`);
    const msg = check(el ? el.value.trim() : '', form);
    fieldError(form, name, msg);
    if (msg && !firstBad) firstBad = el;
  });
  if (firstBad) { firstBad.focus(); firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' }); return false; }
  return true;
}
export const required = (msg) => (v) => (v ? '' : msg);
export const minLen = (n, msg) => (v) => (v.length >= n ? '' : msg);

export function chipPicker(name, options, selected, ruFn) {
  return `<div class="fgroup" data-picker="${name}">${options.map((o) => {
    const id = typeof o === 'string' ? o : o.id;
    const text = typeof o === 'string' ? (ruFn ? ruFn(o) : o) : o.ru;
    const on = selected.includes(id);
    return `<button type="button" class="chip${on ? ' chip--on' : ''}" data-pick="${esc(id)}" aria-pressed="${on}">${esc(text)}</button>`;
  }).join('')}<input type="hidden" name="${name}" value="${esc(selected.join(','))}" /></div>`;
}
export function pickerValue(form, name) {
  const el = form.querySelector(`[name="${name}"]`);
  return el && el.value ? el.value.split(',').filter(Boolean) : [];
}
