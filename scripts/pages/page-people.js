/* BASTAU - People list + user profile pages */

import { icon, esc, skillRu, $, plural, dateRu } from '../lib/utils.js';
import { me } from '../lib/session.js';

import { D, M } from '../global/globals.js';
import { chipPicker, pickerValue } from '../global/forms.js';
import { personCard, emptyState, avatar, projectCard } from '../global/components.js';
import { go } from './router.js';
import { render404 } from './page-misc.js';

/* People */
export async function renderPeople(root, _arg, params) {
  const f = { q: params.get('q') || '', skill: params.get('skill') || '', city: params.get('city') || '', interest: params.get('interest') || '' };

  root.innerHTML = `
    <section class="section section--tight">
      <div class="wrap">
        <span class="eyebrow">Поиск людей</span>
        <h1 style="font-size:clamp(28px,4.4vw,42px);margin:10px 0 var(--sp-2)">Найти команду</h1>
        <p style="color:var(--fg-mut);max-width:60ch">Нужен дизайнер? Выбери навык «Дизайн» и посмотри, кто рядом.</p>

        <form class="filters" style="margin-top:var(--sp-5)" data-form="people" role="search">
          <div class="searchbar">
            <label class="search"><span class="sr">Поиск по имени, школе или городу</span>${icon('search')}
              <input type="search" name="q" value="${esc(f.q)}" placeholder="Имя, школа или город" /></label>
            <button class="btn btn--primary" type="submit">Найти</button>
          </div>
          <fieldset class="fieldset"><legend>Навык</legend>${chipPicker('skill', D.SKILLS, f.skill ? [f.skill] : [], skillRu)}</fieldset>
          <div class="filters__row">
            <div class="field" style="min-width:200px"><label for="pp-city">Город</label>
              <select class="select" id="pp-city" name="city"><option value="">Любой</option>${D.CITIES.map((c) => `<option ${f.city === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
            <div class="field" style="min-width:200px"><label for="pp-int">Интерес</label>
              <select class="select" id="pp-int" name="interest"><option value="">Любой</option>${D.CATEGORIES.map((c) => `<option value="${c.id}" ${f.interest === c.id ? 'selected' : ''}>${c.ru}</option>`).join('')}</select></div>
            <div class="field" style="align-self:flex-end"><button class="btn btn--ghost" type="button" data-act="filters-reset">Сбросить</button></div>
          </div>
        </form>

        <div class="row" style="margin:var(--sp-5) 0 var(--sp-4)"><span class="count" id="u-count">Загрузка...</span></div>
        <div class="grid grid--3" id="u-list"></div>
      </div>
    </section>`;

  try {
    const queryStr = params.toString();
    const res = await fetch(`/api/users${queryStr ? '?' + queryStr : ''}`);
    const list = await res.json();

    const countEl = $('#u-count', root);
    const listEl = $('#u-list', root);

    if (countEl) {
      countEl.textContent = list.length ? `Найдено ${plural(list.length, 'человек', 'человека', 'человек')}` : 'Никого не нашли';
    }
    if (listEl) {
      listEl.innerHTML = list.length ? list.map(personCard).join('')
        : emptyState('Под фильтры никто не подошёл', 'Попробуй выбрать другой навык или расширить город.', '<button class="btn btn--ghost" type="button" data-act="filters-reset">Сбросить фильтры</button>');
    }
  } catch (err) {
    console.error(err);
    const countEl = $('#u-count', root);
    if (countEl) countEl.textContent = 'Ошибка загрузки';
  }

  const form = $('[data-form="people"]', root);
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const next = new URLSearchParams();
      ['q', 'city', 'interest'].forEach((k) => { const v = (fd.get(k) || '').toString().trim(); if (v) next.set(k, v); });
      const sk = pickerValue(form, 'skill')[0]; if (sk) next.set('skill', sk);
      go('#/people' + (next.toString() ? '?' + next.toString() : ''));
    });
  }

  if (M && M.reveal) M.reveal(root);
}

/* Profile */
export async function renderProfile(root, username) {
  root.innerHTML = `<div class="wrap" style="padding:var(--sp-6) 0"><p>Загрузка профиля...</p></div>`;

  try {
    const resUser = await fetch(`/api/users/${username}`);
    if (!resUser.ok) return render404(root);
    const u = await resUser.json();

    u.eventsCount = u.events_count ?? u.eventsCount ?? 0;
    u.skills = u.skills || [];
    u.interests = u.interests || [];
    u.achievements = u.achievements || [];

    const resProj = await fetch('/api/projects');
    const allProjects = await resProj.json();
    const projects = allProjects.filter((p) => (p.members || []).some((m) => m.userId === u.id) || p.owner_id === u.id);

    const mine = me() && me().id === u.id;

    root.innerHTML = `
    <section class="section section--tight">
      <div class="wrap">
        ${u.blocked ? '<div class="card" style="border-color:var(--danger);margin-bottom:var(--sp-4)"><b>Профиль заблокирован администрацией.</b></div>' : ''}
        <div class="phead">
          ${avatar(u, 'xl')}
          <div>
            <h1>${esc(u.name)}</h1>
            <p style="color:var(--fg-mut);margin-top:6px">${u.interests.map(esc).join(' · ')}</p>
            <div class="kv" style="margin-top:var(--sp-4)">
              <span class="kv__i">${icon('case', 'ic--sm')}<span>${esc(u.school)} · ${esc(u.grade)}</span></span>
              <span class="kv__i">${icon('pin', 'ic--sm')}<span>${esc(u.city)}</span></span>
              <span class="kv__i">${icon('user', 'ic--sm')}<span>@${esc(u.username)} · на BASTAU с ${esc(dateRu(u.joined))}</span></span>
            </div>
          </div>
          <div class="row" style="gap:var(--sp-2)">
            ${mine ? '<a class="btn btn--primary" href="#/dashboard">Мой кабинет</a>'
              : `<button class="btn btn--primary" type="button" data-act="invite" data-id="${u.id}">${icon('plus', 'ic--sm')}Пригласить в проект</button>`}
            <button class="btn btn--ghost" type="button" data-act="portfolio" data-id="${u.id}">${icon('award', 'ic--sm')}Портфолио</button>
          </div>
        </div>

        <div class="grid grid--4" style="margin-top:var(--sp-6)">
          ${[[projects.length, 'Проекты'], [u.achievements.length, 'Достижения'], [u.eventsCount, 'Мероприятия'], [u.skills.length, 'Навыки']]
            .map(([n, l]) => `<div class="card" data-reveal><div class="stat__n" data-count="${n}">${n}</div><div class="stat__l">${l}</div></div>`).join('')}
        </div>

        <div class="split" style="margin-top:var(--sp-6)">
          <div class="prose">
            <div class="card" data-reveal><h3>О себе</h3><p>${esc(u.bio)}</p></div>
            <div class="card" data-reveal>
              <h3>Проекты</h3>
              ${projects.length ? `<div class="grid grid--2" style="margin-top:var(--sp-4)">${projects.map(projectCard).join('')}</div>`
                : '<p>Пока нет опубликованных проектов.</p>'}
            </div>
          </div>
          <aside class="split__side">
            <div class="card"><h3 style="font-size:16px;margin-bottom:var(--sp-3)">Навыки</h3>
              <div class="row row--tight">${u.skills.map((s) => `<a class="chip" href="#/people?skill=${encodeURIComponent(s)}">${esc(skillRu(s))}</a>`).join('')}</div>
            </div>
          </aside>
        </div>
      </div>
    </section>`;

    if (M && M.reveal) M.reveal(root);
  } catch (err) {
    console.error(err);
    return render404(root);
  }
}
