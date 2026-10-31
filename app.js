/* BASTAU - SPA app */

import './scripts/global/listeners.js';
import { M } from './scripts/global/globals.js';

import { $, esc, icon } from './scripts/lib/utils.js';
import { me, isAdmin } from './scripts/lib/session.js';

import { openSheet } from './scripts/global/modals.js';
import { avatar } from './scripts/global/components.js';
import { go, current, route } from './scripts/pages/router.js';

function boot() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  $('#year').textContent = new Date().getFullYear();

  $('#btn-burger').addEventListener('click', (e) => {
    const nav = $('#nav');
    const open = nav.classList.toggle('is-open');
    e.currentTarget.setAttribute('aria-expanded', String(open));
  });
  $('#btn-search').addEventListener('click', () => {
    go('#/projects');
    setTimeout(() => { const i = $('input[name="q"]'); if (i) i.focus(); }, 360);
  });
  $('#btn-bell').addEventListener('click', () => go('#/dashboard?tab=notifications'));
  $('#btn-me').addEventListener('click', () => {
    const u = me();
    if (!u) return;
    openSheet(u.name, `
        <div class="row" style="flex-wrap:nowrap;margin-bottom:var(--sp-4)">${avatar(u, 'lg')}
          <div><div class="member__n" style="font-size:17px">${esc(u.name)}</div><div class="member__r">@${esc(u.username)} · ${esc(u.city)}</div></div></div>
        <div class="grid" style="gap:8px">
          <a class="btn btn--ghost btn--full" href="#/dashboard" data-act="sheet-close">${icon('layers')}Кабинет</a>
          <a class="btn btn--ghost btn--full" href="#/profile/${u.username}" data-act="sheet-close">${icon('user')}Мой профиль</a>
          <a class="btn btn--ghost btn--full" href="#/create" data-act="sheet-close">${icon('plus')}Создать проект</a>
          ${isAdmin() ? `<a class="btn btn--ghost btn--full" href="#/admin" data-act="sheet-close">${icon('shield')}Админ-панель</a>` : ''}
          <button class="btn btn--danger btn--full" type="button" data-act="logout">${icon('logout')}Выйти</button>
        </div>`);
  });

  window.addEventListener('hashchange', () => { if (location.hash !== current) route(); });
  if (!location.hash) location.replace('#/');
  M.init();
  route(true);

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => M.startIntro());
  else M.startIntro();
  setTimeout(() => M.startIntro(), 1200);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
