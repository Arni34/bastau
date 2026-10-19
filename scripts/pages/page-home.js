/* BASTAU - Home page */

import { words, icon, plural } from '../lib/utils.js';

import { M } from '../global/globals.js';
import { avatar, projectCard, eventCard, mentorCard } from '../global/components.js';

/* Homepage */
export async function renderHome(root) {
  root.innerHTML = `<div class="wrap" style="padding:var(--sp-6) 0"><p>Загрузка данных...</p></div>`;

  try {
    const [resProj, resEvt, resUsers, resMent] = await Promise.all([
      fetch('/api/projects'),
      fetch('/api/events'),
      fetch('/api/users'),
      fetch('/api/mentors')
    ]);

    if (!resProj.ok || !resEvt.ok || !resUsers.ok || !resMent.ok) {
      throw new Error('API response error');
    }

    const projects = await resProj.json();
    const events = await resEvt.json();
    const users = await resUsers.json();
    const mentors = await resMent.json();

    const top = projects.slice().sort((a, b) => (b.members?.length || 0) - (a.members?.length || 0)).slice(0, 3);
    const upcoming = events.slice().sort((a, b) => (a.date || '').localeCompare(b.date || '')).slice(0, 3);
    const cities = new Set(users.map((u) => u.city)).size;
    const openRoles = projects.filter((p) => p.need_team || p.needTeam).length;

    root.innerHTML = `
    <section class="hero">
      <div class="wrap hero__in">
        <div>
          <span class="eyebrow" data-hero-eyebrow>Student Project Ecosystem</span>
          <h1 data-h1 style="margin-top:var(--sp-4)">${words('Придумай идею,')} <em>${words('собери команду')}</em> ${words('и доведи до результата')}</h1>
          <p class="hero__lead" data-hero-lead>BASTAU — платформа для школьников и студентов Казахстана. Здесь идея превращается в проект, проект находит команду, а команда — менторов, хакатоны и первые результаты для портфолио.</p>
          <div class="hero__cta" data-hero-cta>
            <a class="btn btn--primary btn--lg" href="#/projects">Найти проект</a>
            <a class="btn btn--ghost btn--lg" href="#/create">Создать проект</a>
            <a class="hero__link" href="#/people">Ищу команду в свой проект ${icon('arrow', 'ic--sm ic--arrow')}</a>
          </div>
          <div class="hero__stats">
            <div data-hero-stat><div class="stat__n" data-count="${projects.length}">0</div><div class="stat__l">проектов в каталоге</div></div>
            <div data-hero-stat><div class="stat__n" data-count="${users.length}">0</div><div class="stat__l">участников</div></div>
            <div data-hero-stat><div class="stat__n" data-count="${events.length}">0</div><div class="stat__l">мероприятий</div></div>
            <div data-hero-stat><div class="stat__n" data-count="${cities}">0</div><div class="stat__l">городов</div></div>
          </div>
        </div>
        <div data-hero-card class="hero__show">
          <div class="card" style="border-radius:var(--r-xl);text-align:left">
            <div class="card__top">
              <span class="badge badge--cat cat" data-cat="Environment">Экология</span>
              <span class="badge badge--stage">Активный</span>
              <span class="spacer"></span>
              <span class="badge badge--accent">Ищет команду</span>
            </div>
            <h3 class="card__ttl" style="font-size:22px">EcoQala</h3>
            <p class="card__txt">Раздельный сбор в школах: боксы, карта пунктов приёма и рейтинг классов.</p>
            <div class="row" style="margin-top:var(--sp-4);justify-content:space-between">
              <div class="stack">${users.slice(0, 4).map((u) => avatar(u, 'sm')).join('')}</div>
              <span class="card__meta">${icon('users', 'ic--sm')}3 / 6 в команде</span>
            </div>
            <div class="card__ft" style="gap:var(--sp-2)">
              <span class="chip chip--skill">Маркетинг</span><span class="chip chip--skill">Дизайн</span><span class="chip chip--skill">+1</span>
              <span class="spacer"></span>
              <a class="card__go" href="#/project/p000-000-001">Открыть ${icon('arrow', 'ic--sm ic--arrow')}</a>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section--tight">
      <div class="wrap">
        <div class="sec-hd">
          <span class="eyebrow">Как это работает</span>
          <h2>Путь от идеи до результата</h2>
        </div>
        <div class="journey" data-journey>
          <div class="journey__line"><span class="journey__fill"></span></div>
          <div class="journey__steps">
            ${[['bulb', 'IDEA', 'Записал идею'], ['layers', 'PROJECT', 'Оформил в проект'], ['users', 'TEAM', 'Собрал команду'], ['rocket', 'ACTION', 'Работаете вместе'], ['award', 'RESULT', 'Результат в портфолио']]
              .map(([ic, k, d]) => `<div class="jstep"><span class="jstep__dot">${icon(ic)}</span><div class="jstep__k">${k}</div><div class="jstep__d">${d}</div></div>`).join('')}
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="sec-hd">
          <h2>Популярные проекты</h2>
          <p>${plural(openRoles, 'проект', 'проекта', 'проектов')} прямо сейчас ищут участников в команду.</p>
        </div>
        <div class="grid grid--3">${top.map(projectCard).join('')}</div>
        <div class="sec-more"><a class="btn btn--ghost" href="#/projects">Все проекты ${icon('arrow', 'ic--sm ic--arrow')}</a></div>
      </div>
    </section>

    <section class="section section--tight">
      <div class="wrap">
        <div class="sec-hd">
          <h2>Ближайшие мероприятия</h2>
        </div>
        <div class="grid grid--3">${upcoming.map(eventCard).join('')}</div>
        <div class="sec-more"><a class="btn btn--ghost" href="#/events">Все мероприятия ${icon('arrow', 'ic--sm ic--arrow')}</a></div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="sec-hd">
          <h2>Наставники</h2>
        </div>
        <div class="grid grid--2">${mentors.slice(0, 2).map(mentorCard).join('')}</div>
        <div class="sec-more"><a class="btn btn--ghost" href="#/mentors">Все наставники ${icon('arrow', 'ic--sm ic--arrow')}</a></div>
      </div>
    </section>`;

    if (M && M.hero) M.hero(root);
    if (M && M.counters) M.counters(root);
    if (M && M.reveal) M.reveal(root);
  } catch (err) {
    console.error(err);
    root.innerHTML = `<div class="wrap"><p>Ошибка загрузки данных главной страницы.</p></div>`;
  }
}
