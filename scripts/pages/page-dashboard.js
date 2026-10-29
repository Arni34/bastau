/* BASTAU - Dashboard page */

import { esc, icon, $, dateRu } from '../lib/utils.js';
import { me, userById } from '../lib/session.js';

import { M, D } from '../global/globals.js';
import { avatar, eventCard, projectCard, emptyState } from '../global/components.js';
import { needAuth } from './page-misc.js';

/* Dashboard */
export async function renderDashboard(root, _arg, params) {
  const u = me();
  if (!u) return needAuth(root, 'Кабинет доступен после входа', '#/dashboard');
  const tab = params.get('tab') || 'overview';

  root.innerHTML = `
  <section class="section section--tight">
    <div class="wrap">
      <div class="row" style="justify-content:space-between">
        <div class="row" style="flex-wrap:nowrap">
          ${avatar(u, 'lg')}
          <div>
            <span class="eyebrow">Личный кабинет</span>
            <h1 style="font-size:clamp(24px,3.6vw,34px);margin-top:6px">Привет, ${esc(u.name.split(' ')[0])}</h1>
            <p style="color:var(--fg-mut)">${esc(u.school)} · ${esc(u.city)}</p>
          </div>
        </div>
        <div class="row" style="gap:var(--sp-2)">
          <a class="btn btn--accent" href="#/create">${icon('plus', 'ic--sm')}Создать проект</a>
          <a class="btn btn--ghost" href="#/profile/${u.username}">Мой профиль</a>
        </div>
      </div>

      <div class="tabs" style="margin-top:var(--sp-6)">
        <a class="tab${tab === 'overview' ? ' is-on' : ''}" href="#/dashboard?tab=overview">Обзор</a>
        <a class="tab${tab === 'projects' ? ' is-on' : ''}" href="#/dashboard?tab=projects">Мои проекты</a>
        <a class="tab${tab === 'events' ? ' is-on' : ''}" href="#/dashboard?tab=events">События</a>
      </div>

      <div id="dash" style="margin-top:var(--sp-5)"><p>Загрузка кабинета...</p></div>
    </div>
  </section>`;

  const box = $('#dash', root);
  try {
    const [resProj, resEvt] = await Promise.all([
      fetch('/api/projects'),
      fetch('/api/events')
    ]);
    const projects = await resProj.json();
    const events = await resEvt.json();

    const mp = projects.filter((p) => p.owner_id === u.id || (p.members || []).some(m => m.userId === u.id));

    if (tab === 'overview') {
      box.innerHTML = `
        <div class="grid grid--4">
          <div class="card" data-reveal><div class="stat__n" data-count="${mp.length}">${mp.length}</div><div class="stat__l">Мои проекты</div></div>
          <div class="card" data-reveal><div class="stat__n" data-count="${events.length}">${events.length}</div><div class="stat__l">Мероприятия</div></div>
        </div>
        <div class="sec-hd" style="margin-top:var(--sp-7)"><h2 style="font-size:24px">Ближайшие мероприятия</h2></div>
        <div class="grid grid--3">${events.slice(0, 3).map(eventCard).join('')}</div>`;
    } else if (tab === 'projects') {
      box.innerHTML = mp.length ? `<div class="grid grid--3">${mp.map(projectCard).join('')}</div>`
        : emptyState('У тебя пока нет проектов', 'Оформи идею в проект — это займёт пару минут.', '<a class="btn btn--primary" href="#/create">Создать проект</a>');
    } else {
      box.innerHTML = `<div class="grid grid--3">${events.map(eventCard).join('')}</div>`;
    }
    if (M && M.counters) M.counters(box);
  } catch (err) {
    console.error(err);
    box.innerHTML = '<p>Ошибка загрузки данных кабинета.</p>';
  }
}

function appRow(a, incoming) {
  const p = { title: 'Проект' };
  const who = userById(a.userId);
  const st = { pending: ['badge--warn', 'На рассмотрении'], accepted: ['badge--ok', 'Принята'], rejected: ['badge--danger', 'Отклонена'] }[a.status] || ['badge', 'Неизвестно'];
    
  return `<div class="card card--pad-sm" style="margin-bottom:var(--sp-3)">
      <div class="row" style="flex-wrap:nowrap;align-items:flex-start">
        ${incoming ? avatar(who, 'sm') : ''}
        <div style="min-width:0;flex:1">
          <div class="member__n">${incoming ? esc(who.name) + ' → ' : ''}<a href="#/project/${a.projectId}">${esc(p.title)}</a></div>
          <p style="font-size:14.5px;color:var(--fg-mut);margin-top:4px">${esc(a.message)}</p>
          <div class="row row--tight" style="margin-top:var(--sp-3)">
            <span class="badge ${st[0]}">${st[1]}</span>
            <span class="badge">${esc(dateRu(a.createdAt))}</span>
            ${incoming && a.status === 'pending' ? `
              <select class="select" style="min-height:38px;max-width:170px;font-size:14px" data-role-for="${a.id}" aria-label="Роль для ${esc(who.name)}">
                ${D.ROLES.filter((r) => r !== 'Founder').map((r) => `<option>${r}</option>`).join('')}
              </select>
              <button class="btn btn--primary btn--sm" type="button" data-act="app-accept" data-id="${a.id}">Принять</button>
              <button class="btn btn--ghost btn--sm" type="button" data-act="app-reject" data-id="${a.id}">Отклонить</button>` : ''}
          </div>
        </div>
      </div>
    </div>`;
}
