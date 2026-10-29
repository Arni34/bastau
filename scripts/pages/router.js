/* BASTAU - Hash router */

import { $, $$, initials } from '../lib/utils.js';
import { me, unread } from '../lib/session.js';

import { M } from '../global/globals.js';

import { renderHome } from './page-home.js';
import { renderProjects } from './page-projects.js';
import { renderProject } from './page-project.js';
import { renderCreate } from './page-create.js';
import { renderPeople, renderProfile } from './page-people.js';
import { renderEvents, renderMentors } from './page-events.js';
import { renderDashboard } from './page-dashboard.js';
import { renderAuth } from './page-auth.js';
import { renderAdmin } from './page-admin.js';
import { renderAbout, render404 } from './page-misc.js';

const routes = {
  '': renderHome,
  'projects': renderProjects,
  'project': renderProject,
  'create': renderCreate,
  'people': renderPeople,
  'events': renderEvents,
  'mentors': renderMentors,
  'dashboard': renderDashboard,
  'profile': renderProfile,
  'auth': renderAuth,
  'admin': renderAdmin,
  'about': renderAbout,
};

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, query] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  return { name: parts[0] || '', arg: decodeURIComponent(parts[1] || ''), params: new URLSearchParams(query || '') };
}

export let current = '';
export function route(skipAnim) {
  const { name, arg, params } = parseHash();
  const view = routes[name] || render404;
  const main = $('#main');

  const paint = () => {
    M.killView();
    main.innerHTML = '';
    view(main, arg, params);
    syncChrome(name);
    if (!skipAnim) M.enterView(main);
    M.reveal(main);
    M.counters(main);
    M.journey(main);
    if (name === '') M.hero(main);
    if (current !== location.hash) main.focus({ preventScroll: true });
    current = location.hash;
    requestAnimationFrame(() => M.refresh());
  };

  if (!skipAnim && main.innerHTML) {
    main.classList.add('is-leaving');
    M.leaveView(main, () => { main.classList.remove('is-leaving'); paint(); });
  } else paint();
}

export function go(hash) { if (location.hash === hash) route(true); else location.hash = hash; }

function syncChrome(name) {
  const map = { '': 'home', 'project': 'projects', 'profile': 'people' };
  const active = map[name] || name;
  $$('[data-nav]').forEach((a) => {
    const on = a.dataset.nav === active;
    a.classList.toggle('is-on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  const u = me();
  $('#btn-me').hidden = !u;
  $('#btn-bell').hidden = !u;
  $('.hdr__login').hidden = !!u;
  if (u) {
    $('#btn-me').textContent = initials(u.name);
    $('#btn-me').setAttribute('aria-label', `Кабинет: ${u.name}`);
    const n = unread(u.id);
    $('#bell-dot').hidden = n === 0;
    $('#btn-bell').setAttribute('aria-label', n ? `Уведомления: ${n} новых` : 'Уведомления');
  }
  $('#nav').classList.remove('is-open');
  $('#btn-burger').setAttribute('aria-expanded', 'false');
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
}
