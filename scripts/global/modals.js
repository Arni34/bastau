/* BASTAU - toast / confirm dialogs */

import { M } from './globals.js';
import { $, icon, esc } from '../lib/utils.js';

export function toast(text, kind) {
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast' + (kind ? ' toast--' + kind : '');
  el.setAttribute('role', 'status');
  el.innerHTML = `${icon(kind === 'err' ? 'x' : kind === 'ok' ? 'check' : 'spark')}<span>${esc(text)}</span>`;
  box.appendChild(el);
  M.toastIn(el);
  setTimeout(() => M.toastOut(el, () => el.remove()), 3800);
}

let sheetPrev = null;
export function openSheet(title, html, onMount) {
  const s = $('#sheet');
  $('#sheet-ttl').textContent = title;
  $('#sheet-bd').innerHTML = html;
  s.hidden = false;
  document.body.classList.add('is-locked');
  sheetPrev = document.activeElement;
  M.openSheet($('.sheet__box'), $('.sheet__scrim'));
  if (onMount) onMount($('#sheet-bd'));
  const focusable = $('#sheet-bd input, #sheet-bd textarea, #sheet-bd select, #sheet-bd button');
  if (focusable) focusable.focus();
}
export function closeSheet() {
  const s = $('#sheet');
  if (s.hidden) return;
  M.closeSheet($('.sheet__box'), $('.sheet__scrim'), () => {
    s.hidden = true;
    $('#sheet-bd').innerHTML = '';
    document.body.classList.remove('is-locked');
    if (sheetPrev && sheetPrev.focus) sheetPrev.focus();
  });
}
export function confirmSheet(title, text, okLabel, onOk) {
  openSheet(title, `
      <p style="color:var(--fg-mut)">${esc(text)}</p>
      <div class="row" style="margin-top:var(--sp-5);justify-content:flex-end">
        <button class="btn btn--ghost" type="button" data-act="sheet-close">Отмена</button>
        <button class="btn btn--danger" type="button" data-act="confirm-ok">${esc(okLabel)}</button>
      </div>`);
  confirmSheet.cb = onOk;
}
