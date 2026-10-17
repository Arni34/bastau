/* BASTAU - SPA app */

(() => {
  'use strict';

  const D = window.BASTAU;
  const M = window.BastauMotion;
  const KEY_SESSION = 'bastau_session_user';

  /* ============================== SESSION ============================= */
  let currentUser = getStoredSession();

  function getStoredSession() {
    try {
      const raw = localStorage.getItem(KEY_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setSession(user) {
    currentUser = user;
    try {
      if (user) {
        localStorage.setItem(KEY_SESSION, JSON.stringify(user));
      } else {
        localStorage.removeItem(KEY_SESSION);
      }
    } catch (e) {}
  }

  /* ============================== UTILS =============================== */
  const $ = (s, r = document) => r.querySelector(s); const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = (p) => p + Math.random().toString(36).slice(2, 8);
  const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const initials = (name) => String(name || 'U').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const label = (list, id) => (list.find((x) => x.id === id) || {}).ru || id || '—';
  const catRu = (id) => label(D.CATEGORIES, id);
  const stageRu = (id) => label(D.STAGES, id);
  const fmtRu = (id) => label(D.FORMATS, id);
  const langRu = (id) => label(D.LANGS, id);
  const evtRu = (id) => label(D.EVENT_TYPES, id);
  const skillRu = (s) => D.SKILLS_RU[s] || s;
  const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
  function dateRu(iso) { const d = new Date(iso); return isNaN(d) ? '—' : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
  function daysLeft(iso) { return Math.ceil((new Date(iso) - new Date()) / 86400000); }
  function plural(n, a, b, c) { const m = n % 100, k = n % 10; return n + ' ' + (m > 10 && m < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c); }
  const words = (s) => s.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');

  /* ============================ USER ============================ */
  const me = () => currentUser;
  const isAdmin = () => false //Get from user_statuses
  const userById = (id) => ({ id, name: 'Пользователь', username: 'user', city: '—', school: '—', grade: '—', skills: [], interests: [], achievements: [], eventsCount: 0, bio: '' });
  const projectById = (id) => null;
  const myProjects = (id) => [];
  const myTeams = (id) => [];
  const myApps = (id) => [];
  const incomingApps = (id) => [];
  const myNotifs = (id) => [];
  const unread = (id) => 0;

  function notify(userId, type, text, href) {
    db.notifications.push({ id: uid('n'), userId, type, text, href: href || '', read: false, createdAt: new Date().toISOString() });
  }

  /* ========================== MODALS =========================== */
  function toast(text, kind) {
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
  function openSheet(title, html, onMount) {
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
  function closeSheet() {
    const s = $('#sheet');
    if (s.hidden) return;
    M.closeSheet($('.sheet__box'), $('.sheet__scrim'), () => {
      s.hidden = true;
      $('#sheet-bd').innerHTML = '';
      document.body.classList.remove('is-locked');
      if (sheetPrev && sheetPrev.focus) sheetPrev.focus();
    });
  }
  function confirmSheet(title, text, okLabel, onOk) {
    openSheet(title, `
      <p style="color:var(--fg-mut)">${esc(text)}</p>
      <div class="row" style="margin-top:var(--sp-5);justify-content:flex-end">
        <button class="btn btn--ghost" type="button" data-act="sheet-close">Отмена</button>
        <button class="btn btn--danger" type="button" data-act="confirm-ok">${esc(okLabel)}</button>
      </div>`);
    confirmSheet.cb = onOk;
  }

  /* ============================== FORMS ================================= */
  function fieldError(form, name, msg) {
    const input = form.querySelector(`[name="${name}"]`);
    const box = form.querySelector(`[data-err="${name}"]`);
    if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (box) box.innerHTML = msg ? `${icon('x', 'ic--sm')}<span>${esc(msg)}</span>` : '';
  }
  function validate(form, rules) {
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
  const required = (msg) => (v) => (v ? '' : msg);
  const minLen = (n, msg) => (v) => (v.length >= n ? '' : msg);

  function chipPicker(name, options, selected, ruFn) {
    return `<div class="fgroup" data-picker="${name}">${options.map((o) => {
      const id = typeof o === 'string' ? o : o.id;
      const text = typeof o === 'string' ? (ruFn ? ruFn(o) : o) : o.ru;
      const on = selected.includes(id);
      return `<button type="button" class="chip${on ? ' chip--on' : ''}" data-pick="${esc(id)}" aria-pressed="${on}">${esc(text)}</button>`;
    }).join('')}<input type="hidden" name="${name}" value="${esc(selected.join(','))}" /></div>`;
  }
  function pickerValue(form, name) {
    const el = form.querySelector(`[name="${name}"]`);
    return el && el.value ? el.value.split(',').filter(Boolean) : [];
  }

  /* ============================= COMPONENTS ============================= */
  function avatar(user, size) {
    const cls = size ? ` avatar--${size}` : '';
    return `<span class="avatar${cls}" aria-hidden="true">${esc(initials(user.name))}</span>`;
  }

  function projectCard(p) {
    return `<article class="card" data-reveal>
      <div class="card__top">
        <span class="badge badge--cat cat" data-cat="${esc(p.category)}">${esc(catRu(p.category))}</span>
        <span class="badge badge--stage">${esc(stageRu(p.stage))}</span>
        ${p.needTeam ? '<span class="badge badge--accent">Ищет команду</span>' : ''}
      </div>
      <h3 class="card__ttl">${esc(p.title)}</h3>
      <p class="card__txt">${esc(p.summary)}</p>
      <div class="row row--tight" style="margin-top:var(--sp-4)">
        ${p.skills.slice(0, 3).map((s) => `<span class="chip chip--skill">${esc(skillRu(s))}</span>`).join('')}
        ${p.skills.length > 3 ? `<span class="chip chip--skill">+${p.skills.length - 3}</span>` : ''}
      </div>
      <div class="card__meta-row">
        <span class="card__meta">${icon('users', 'ic--sm')}${p.members.length} / ${p.teamSize}</span>
        <span class="card__meta">${icon('pin', 'ic--sm')}${esc(p.city)}</span>
      </div>
      <a class="btn btn--primary btn--full card__act" href="#/project/${p.id}">Подробнее</a>
    </article>`;
  }

  function personCard(u) {
    u.skills = u.skills || [];
    return `<article class="card" data-reveal>
      <div class="row" style="flex-wrap:nowrap">
        ${avatar(u)}
        <div style="min-width:0">
          <h3 class="card__ttl" style="margin-bottom:2px">${esc(u.name)}</h3>
          <p class="card__meta">${esc(u.city)} · ${esc(u.grade)}</p>
        </div>
      </div>
      <p class="card__txt" style="margin-top:var(--sp-3)">${esc(u.bio)}</p>
      <div class="row row--tight" style="margin-top:var(--sp-4)">
        ${u.skills.slice(0, 3).map((s) => `<span class="chip chip--skill">${esc(skillRu(s))}</span>`).join('')}
      </div>
      <div class="card__meta-row">
        <span class="card__meta">${icon('case', 'ic--sm')}Участник платформы</span>
      </div>
      <a class="btn btn--ghost btn--full card__act" href="#/profile/${u.username}">Открыть профиль</a>
    </article>`;
  }

  function eventCard(e) {
    const left = daysLeft(e.deadline);
    const dl = left < 0 ? { cls: 'badge', t: 'Регистрация закрыта' }
      : left <= 7 ? { cls: 'badge badge--warn', t: `До дедлайна ${plural(left, 'день', 'дня', 'дней')}` }
        : { cls: 'badge badge--ok', t: `Заявки до ${dateRu(e.deadline)}` };
    return `<article class="card" data-reveal>
      <div class="card__top">
        <span class="badge badge--stage">${esc(evtRu(e.type))}</span>
        <span class="badge">${esc(fmtRu(e.format))}</span>
      </div>
      <h3 class="card__ttl">${esc(e.title)}</h3>
      <div class="kv" style="margin:var(--sp-3) 0">
        <span class="kv__i">${icon('calendar', 'ic--sm')}<span><b>${esc(dateRu(e.date))}</b></span></span>
        <span class="kv__i">${icon('pin', 'ic--sm')}<span>${esc(e.place)}</span></span>
        <span class="kv__i">${icon('flag', 'ic--sm')}<span>${esc(e.org)}</span></span>
      </div>
      <span class="${dl.cls}">${esc(dl.t)}</span>
      <button class="btn btn--ghost btn--full card__act" type="button" data-act="event-open" data-id="${e.id}">Подробнее</button>
      ${isAdmin() ? `<button class="btn btn--danger btn--full btn--sm" style="margin-top:8px" type="button" data-act="admin-event-del" data-id="${e.id}">Удалить</button>` : ''}
    </article>`;
  }

  function mentorCard(m) {
    return `<article class="card" data-reveal>
      <div class="row" style="flex-wrap:nowrap">
        ${avatar(m)}
        <div style="min-width:0">
          <h3 class="card__ttl" style="margin-bottom:2px">${esc(m.name)}</h3>
          <p class="card__meta">${esc(m.spec)}</p>
        </div>
      </div>
      <p class="card__txt" style="margin-top:var(--sp-3)">${esc(m.bio)}</p>
      <div class="row row--tight" style="margin-top:var(--sp-4)">
        ${m.skills.map((s) => `<span class="chip chip--skill">${esc(skillRu(s))}</span>`).join('')}
      </div>
      <div class="card__meta-row">
        <span class="card__meta">${icon('award', 'ic--sm')}${esc(m.exp)}</span>
      </div>
      <button class="btn btn--ghost btn--full card__act" type="button" data-act="mentor-ask" data-id="${m.id}">Запросить наставничество</button>
    </article>`;
  }

  function emptyState(title, text, btn) {
    return `<div class="empty">${icon('compass')}<h3>${esc(title)}</h3><p>${esc(text)}</p>${btn || ''}</div>`;
  }

  /* =============================== ROUTER =============================== */
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

  let current = '';
  function route(skipAnim) {
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

  function go(hash) { if (location.hash === hash) route(true); else location.hash = hash; }

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

  /* ================================ PAGES ============================= */

  /* Homepage */
  async function renderHome(root) {
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

  /* Projects list */
  async function renderProjects(root, _arg, params) {
  const f = {
    q: params.get('q') || '', cat: params.get('cat') || '', city: params.get('city') || '',
    skill: params.get('skill') || '', stage: params.get('stage') || '', fmt: params.get('fmt') || '',
    lang: params.get('lang') || '', team: params.get('team') || '',
  };

  root.innerHTML = `
  <section class="section section--tight">
    <div class="wrap">
      <span class="eyebrow">Каталог</span>
      <h1 style="font-size:clamp(28px,4.4vw,42px);margin:10px 0 var(--sp-4)">Проекты</h1>
      <p style="color:var(--fg-mut);max-width:60ch">Найди проект по интересам и навыкам — или создай свой и собери команду.</p>

      <form class="filters" style="margin-top:var(--sp-5)" data-form="filters" role="search">
        <div class="searchbar">
          <label class="search">
            <span class="sr">Поиск по названию проекта</span>
            ${icon('search')}
            <input type="search" name="q" value="${esc(f.q)}" placeholder="Название проекта или ключевое слово" />
          </label>
          <button class="btn btn--primary" type="submit">Найти</button>
          <button class="btn btn--ghost" type="button" data-act="filters-toggle" aria-expanded="false" aria-controls="filters-body">${icon('filter')}Фильтры</button>
        </div>

        <div id="filters-body" class="filters" hidden>
          <fieldset class="fieldset"><legend>Категория</legend>
            ${chipPicker('cat', D.CATEGORIES, f.cat ? [f.cat] : [])}
          </fieldset>
          <div class="grid grid--4">
            <div class="field"><label for="f-city">Город</label>
              <select class="select" id="f-city" name="city"><option value="">Любой</option>${D.CITIES.map((c) => `<option ${f.city === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
            <div class="field"><label for="f-skill">Нужный навык</label>
              <select class="select" id="f-skill" name="skill"><option value="">Любой</option>${D.SKILLS.map((s) => `<option value="${esc(s)}" ${f.skill === s ? 'selected' : ''}>${esc(skillRu(s))}</option>`).join('')}</select></div>
            <div class="field"><label for="f-stage">Стадия</label>
              <select class="select" id="f-stage" name="stage"><option value="">Любая</option>${D.STAGES.map((s) => `<option value="${esc(s.id)}" ${f.stage === s.id ? 'selected' : ''}>${esc(s.ru)}</option>`).join('')}</select></div>
            <div class="field"><label for="f-fmt">Формат</label>
              <select class="select" id="f-fmt" name="fmt"><option value="">Любой</option>${D.FORMATS.map((s) => `<option value="${esc(s.id)}" ${f.fmt === s.id ? 'selected' : ''}>${esc(s.ru)}</option>`).join('')}</select></div>
            <div class="field"><label for="f-lang">Язык</label>
              <select class="select" id="f-lang" name="lang"><option value="">Любой</option>${D.LANGS.map((s) => `<option value="${esc(s.id)}" ${f.lang === s.id ? 'selected' : ''}>${esc(s.ru)}</option>`).join('')}</select></div>
            <div class="field"><label for="f-team">Набор в команду</label>
              <select class="select" id="f-team" name="team"><option value="">Неважно</option><option value="1" ${f.team === '1' ? 'selected' : ''}>Только те, кто ищет</option></select></div>
          </div>
          <div class="filters__row">
            <button class="btn btn--primary" type="submit">Применить фильтры</button>
            <button class="btn btn--ghost" type="button" data-act="filters-reset">Сбросить</button>
          </div>
        </div>
      </form>

      <div class="row" style="margin:var(--sp-5) 0 var(--sp-4)">
        <span class="count" id="p-count">Загрузка...</span>
        <span class="spacer"></span>
        <a class="btn btn--accent btn--sm" href="#/create">${icon('plus', 'ic--sm')}Создать проект</a>
      </div>
      <div class="grid grid--3" id="p-list"></div>
    </div>
  </section>`;

  try {
    const queryStr = params.toString();
    const res = await fetch(`/api/projects${queryStr ? '?' + queryStr : ''}`);
    const list = await res.json();

    const countEl = $('#p-count', root);
    const listEl = $('#p-list', root);

    if (countEl) {
      countEl.textContent = list.length ? `Найдено ${plural(list.length, 'проект', 'проекта', 'проектов')}` : 'Ничего не найдено';
    }
    if (listEl) {
      listEl.innerHTML = list.length ? list.map(projectCard).join('')
        : emptyState('Под фильтры ничего не подошло', 'Попробуй убрать часть условий или поискать по другому слову.',
          '<button class="btn btn--ghost" type="button" data-act="filters-reset">Сбросить фильтры</button>');
    }
  } catch (err) {
    console.error(err);
    const countEl = $('#p-count', root);
    if (countEl) countEl.textContent = 'Ошибка загрузки проектов';
  }

  const form = $('[data-form="filters"]', root);
  const body = $('#filters-body', root);
  if (form && body) {
    if (f.cat || f.city || f.skill || f.stage || f.fmt || f.lang || f.team) {
      body.hidden = false;
      const toggleBtn = $('[data-act="filters-toggle"]', root);
      if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const next = new URLSearchParams();
      ['q', 'city', 'skill', 'stage', 'fmt', 'lang', 'team'].forEach((k) => {
        const v = (fd.get(k) || '').toString().trim(); if (v) next.set(k, v);
      });
      const cat = pickerValue(form, 'cat')[0]; if (cat) next.set('cat', cat);
      go('#/projects' + (next.toString() ? '?' + next.toString() : ''));
    });
  }

  if (M && M.reveal) M.reveal(root);
  }

  /* Project page */
  async function renderProject(root, id) {
    root.innerHTML = `<div class="wrap" style="padding:var(--sp-6) 0"><p>Загрузка проекта...</p></div>`;

    let p = null;
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) p = await res.json();
    } catch (err) {
      console.error(err);
    }

    if (!p) return render404(root);

    p.needTeam = p.need_team ?? p.needTeam;
    p.teamSize = p.team_size ?? p.teamSize;
    p.ownerId = p.owner_id ?? p.ownerId;
    p.createdAt = p.created_at ?? p.createdAt;
    p.members = p.members || [];
    p.skills = p.skills || [];
    p.links = p.links || [];

    let owner = { name: 'Пользователь', username: 'user', city: p.city };
    try {
      const resOwner = await fetch(`/api/users/${p.ownerId}`);
      if (resOwner.ok) owner = await resOwner.json();
    } catch (e) {}

    const u = me();
    const mine = u && p.ownerId === u.id;
    const inTeam = u && p.members.some((m) => m.userId === u.id);

    root.innerHTML = `
    <section class="section section--tight">
      <div class="wrap">
        <a class="btn btn--ghost btn--sm" href="#/projects">К каталогу</a>

        <div class="split" style="margin-top:var(--sp-5)">
          <div>
            <div class="row row--tight">
              <span class="badge badge--cat cat" data-cat="${esc(p.category)}">${esc(catRu(p.category))}</span>
              <span class="badge badge--stage">${esc(stageRu(p.stage))}</span>
              ${p.needTeam ? `<span class="badge badge--accent">Ищет команду</span>` : ''}
            </div>
            <h1 style="font-size:clamp(28px,4.4vw,44px);margin:var(--sp-3) 0">${esc(p.title)}</h1>
            <p style="font-size:18px;color:var(--fg-mut);max-width:62ch">${esc(p.summary)}</p>

            <div class="prose" style="margin-top:var(--sp-6)">
              <div class="card" data-reveal><h3>Проблема</h3><p>${esc(p.problem)}</p></div>
              <div class="card" data-reveal><h3>Решение</h3><p>${esc(p.solution)}</p></div>
              <div class="card" data-reveal><h3>Цель проекта</h3><p>${esc(p.goal)}</p></div>
            </div>

            <div class="card" style="margin-top:var(--sp-5)" data-reveal>
              <h3 style="margin-bottom:var(--sp-3)">Нужные навыки</h3>
              <div class="row row--tight">${p.skills.map((s) => `<a class="chip" href="#/projects?skill=${encodeURIComponent(s)}">${esc(skillRu(s))}</a>`).join('')}</div>
            </div>
          </div>

          <aside class="split__side">
            <div class="card">
              <div class="row" style="flex-wrap:nowrap">
                <a href="#/profile/${owner.username}" aria-label="Профиль: ${esc(owner.name)}">${avatar(owner)}</a>
                <div style="min-width:0">
                  <div class="member__n">${esc(owner.name)}</div>
                  <div class="member__r">Создатель · ${esc(owner.city || p.city)}</div>
                </div>
              </div>

              <div class="kv" style="margin-top:var(--sp-4)">
                <span class="kv__i">${icon('users', 'ic--sm')}<span><b>${p.members.length} из ${p.teamSize}</b> в команде</span></span>
                <span class="kv__i">${icon('pin', 'ic--sm')}<span>${esc(p.city)} · ${esc(fmtRu(p.format))}</span></span>
                <span class="kv__i">${icon('globe', 'ic--sm')}<span>Язык проекта: ${esc(langRu(p.lang))}</span></span>
                <span class="kv__i">${icon('calendar', 'ic--sm')}<span>Создан ${esc(dateRu(p.createdAt))}</span></span>
                ${p.links.map((l) => `<span class="kv__i">${icon('link', 'ic--sm')}<a href="${esc(l.url)}" target="_blank" rel="noopener noreferrer">${esc(l.label)}</a></span>`).join('')}
              </div>

              <div style="margin-top:var(--sp-5)">
                ${mine ? `<span class="badge badge--ok" style="width:100%;justify-content:center;padding:12px">Это твой проект</span>`
                  : inTeam ? `<span class="badge badge--ok" style="width:100%;justify-content:center;padding:12px">Ты в команде</span>`
                    : `<button class="btn btn--primary btn--full" type="button" data-act="apply" data-id="${p.id}">${icon('users')}Подать заявку в команду</button>`}
              </div>
            </div>

            <div class="card" style="margin-top:var(--sp-4)">
              <h3 style="font-size:16px;margin-bottom:var(--sp-2)">Команда (${p.members.length})</h3>
              ${p.members.map((m) => `
                <div class="member">
                  <div style="min-width:0">
                    <div class="member__n">Участник (${m.userId})</div>
                    <div class="member__r">${esc(m.role)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </aside>
        </div>
      </div>
    </section>`;

    if (M && M.reveal) M.reveal(root);
  }

  /* Create a project */
  function renderCreate(root) {
    const u = me();
    if (!u) return needAuth(root, 'Чтобы создать проект, войди в аккаунт', '#/create');

    root.innerHTML = `
    <section class="section section--tight">
      <div class="wrap wrap--narrow">
        <span class="eyebrow">Новый проект</span>
        <h1 style="font-size:clamp(26px,4vw,38px);margin:10px 0 var(--sp-2)">Создать проект</h1>
        <p style="color:var(--fg-mut)">Заполни поля — проект появится в каталоге, и тебе начнут приходить заявки в команду.</p>

      <form class="form" style="margin-top:var(--sp-6)" data-form="create" novalidate>
        <div class="field">
          <label for="c-title">Название проекта <span class="req" aria-hidden="true">*</span></label>
          <input class="input" id="c-title" name="title" maxlength="60" placeholder="Например: EcoQala" required />
          <span class="field__hint">Коротко и узнаваемо — до 60 символов.</span>
          <span class="field__err" data-err="title" role="alert"></span>
        </div>

        <div class="field">
          <label for="c-summary">Краткое описание <span class="req" aria-hidden="true">*</span></label>
          <textarea class="textarea" id="c-summary" name="summary" maxlength="180" placeholder="Одно-два предложения: что делает проект" style="min-height:90px" required></textarea>
          <span class="field__hint">Это описание видно на карточке в каталоге.</span>
          <span class="field__err" data-err="summary" role="alert"></span>
        </div>

        <div class="field">
          <label for="c-problem">Проблема <span class="req" aria-hidden="true">*</span></label>
          <textarea class="textarea" id="c-problem" name="problem" placeholder="Какую проблему решает проект? Для кого она важна?" required></textarea>
          <span class="field__err" data-err="problem" role="alert"></span>
        </div>

        <div class="field">
          <label for="c-solution">Решение <span class="req" aria-hidden="true">*</span></label>
          <textarea class="textarea" id="c-solution" name="solution" placeholder="Как именно проект решает эту проблему?" required></textarea>
          <span class="field__err" data-err="solution" role="alert"></span>
        </div>

        <div class="field">
          <label for="c-goal">Цель проекта</label>
          <input class="input" id="c-goal" name="goal" placeholder="Измеримый результат: сколько и к какому сроку" />
          <span class="field__hint">Например: подключить 20 школ до конца учебного года.</span>
        </div>

        <fieldset class="fieldset">
          <legend>Категория <span class="req" aria-hidden="true">*</span></legend>
          ${chipPicker('category', D.CATEGORIES, ['Technology'])}
          <span class="field__err" data-err="category" role="alert"></span>
        </fieldset>

        <fieldset class="fieldset">
          <legend>Необходимые навыки <span class="req" aria-hidden="true">*</span></legend>
          ${chipPicker('skills', D.SKILLS, [], skillRu)}
          <span class="field__hint" style="display:block;margin-top:8px">Отметь всё, чего сейчас не хватает команде.</span>
          <span class="field__err" data-err="skills" role="alert"></span>
        </fieldset>

        <div class="grid-2">
            <div class="field"><label for="c-stage">Стадия проекта</label>
              <select class="select" id="c-stage" name="stage">${D.STAGES.map((s) => `<option value="${s.id}">${s.ru}</option>`).join('')}</select></div>
            <div class="field"><label for="c-team">Количество участников</label>
              <input class="input" id="c-team" name="teamSize" type="number" inputmode="numeric" min="1" max="20" value="4" /></div>
            <div class="field"><label for="c-city">Город</label>
              <select class="select" id="c-city" name="city">${D.CITIES.map((c) => `<option ${c === u.city ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
            <div class="field"><label for="c-format">Формат работы</label>
              <select class="select" id="c-format" name="format">${D.FORMATS.map((f) => `<option value="${f.id}">${f.ru}</option>`).join('')}</select></div>
            <div class="field"><label for="c-lang">Язык проекта</label>
              <select class="select" id="c-lang" name="lang">${D.LANGS.map((l) => `<option value="${l.id}" ${l.id === 'ru' ? 'selected' : ''}>${l.ru}</option>`).join('')}</select></div>
            <div class="field"><label for="c-link">Контакты или ссылка</label>
              <input class="input" id="c-link" name="link" type="url" inputmode="url" placeholder="https://" /></div>
          </div>

          <label class="check"><input type="checkbox" name="needTeam" checked /><span><b>Нужны участники в команду</b><br /><span class="field__hint">Проект получит метку «Ищет команду» и попадёт в подборки для поиска людей.</span></span></label>

          <div class="row" style="justify-content:flex-end">
            <a class="btn btn--ghost" href="#/projects">Отмена</a>
            <button class="btn btn--primary btn--lg" type="submit">${icon('rocket')}Опубликовать проект</button>
          </div>
        </form>
      </div>
    </section>`;

    $('[data-form="create"]', root).addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const ok = validate(form, {
        title: required('Введите название проекта'),
        summary: minLen(20, 'Опишите проект хотя бы в 20 символах'),
        problem: minLen(20, 'Опишите проблему подробнее'),
        solution: minLen(20, 'Опишите решение подробнее'),
        category: required('Выберите категорию'),
        skills: (v) => (v ? '' : 'Отметьте хотя бы один навык'),
      });
      if (!ok) { toast('Проверьте выделенные поля', 'err'); return; }

      toast('Создание проектов пока настраивается через API', 'info');
    });
  }

  /* People */
  async function renderPeople(root, _arg, params) {
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

   /* Events */
  async function renderEvents(root, _arg, params) {
  const type = params.get('type') || '';

  root.innerHTML = `
  <section class="section section--tight">
    <div class="wrap">
      <span class="eyebrow">Календарь</span>
      <h1 style="font-size:clamp(28px,4.4vw,42px);margin:10px 0 var(--sp-2)">Мероприятия</h1>
      <p style="color:var(--fg-mut);max-width:60ch">Хакатоны, MUN, олимпиады, конкурсы проектов и мастер-классы — с дедлайнами регистрации.</p>

      <div class="fgroup" style="margin:var(--sp-5) 0">
        <a class="chip${!type ? ' chip--on' : ''}" href="#/events">Все</a>
        ${D.EVENT_TYPES.map((t) => `<a class="chip${type === t.id ? ' chip--on' : ''}" href="#/events?type=${t.id}">${esc(t.ru)}</a>`).join('')}
      </div>

      <div class="grid grid--3" id="e-list"><p>Загрузка мероприятий...</p></div>
    </div>
  </section>`;

  try {
    const res = await fetch(`/api/events${type ? '?type=' + type : ''}`);
    const list = await res.json();

    $('#e-list', root).innerHTML = list.length ? list.map(eventCard).join('')
      : emptyState('Мероприятий этого типа пока нет', 'Загляни позже — календарь пополняется каждую неделю.', '<a class="btn btn--ghost" href="#/events">Показать все</a>');
  } catch (err) {
    console.error(err);
    $('#e-list', root).innerHTML = '<p>Ошибка загрузки мероприятий</p>';
  }

  if (M && M.reveal) M.reveal(root);
  }
  
  /* Mentors */
  async function renderMentors(root) {
  root.innerHTML = `
  <section class="section section--tight">
    <div class="wrap">
      <span class="eyebrow">Наставники</span>
      <h1 style="font-size:clamp(28px,4.4vw,42px);margin:10px 0 var(--sp-2)">Менторы</h1>
      <p style="color:var(--fg-mut);max-width:60ch">Практики, которые разбирают проекты и помогают с исследованием, продуктом и питчем.</p>
      <div class="grid grid--2" style="margin-top:var(--sp-6)" id="m-list"><p>Загрузка менторов...</p></div>
    </div>
  </section>`;

  try {
    const res = await fetch('/api/mentors');
    const mentors = await res.json();
    $('#m-list', root).innerHTML = mentors.map(mentorCard).join('');
  } catch (err) {
    console.error(err);
    $('#m-list', root).innerHTML = '<p>Ошибка загрузки данных менторов</p>';
  }

  if (M && M.reveal) M.reveal(root);
  }
  
  /* Profile */
  async function renderProfile(root, username) {
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
  
  /* Dashboard */
  async function renderDashboard(root, _arg, params) {
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
    const p = { title: 'Проект' }; // Безопасный дефолт, пока данные грузятся асинхронно
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

  /* Auth */
  function renderAuth(root, _arg, params) {
    const mode = params.get('mode') === 'signup' ? 'signup' : 'login';
    const next = params.get('next') || '#/dashboard';

    root.innerHTML = `
    <section class="section section--tight">
      <div class="wrap wrap--narrow">
        <div class="card" style="border-radius:var(--r-xl);padding:var(--sp-6)">
          <div class="tabs" style="margin-bottom:var(--sp-5)">
            <a class="tab${mode === 'login' ? ' is-on' : ''}" href="#/auth?mode=login&next=${encodeURIComponent(next)}">Вход</a>
            <a class="tab${mode === 'signup' ? ' is-on' : ''}" href="#/auth?mode=signup&next=${encodeURIComponent(next)}">Регистрация</a>
          </div>
          <div id="auth-body"></div>
          <div class="card card--flat card--pad-sm" style="margin-top:var(--sp-5);background:var(--surface-2)">
            <p class="field__hint" style="margin-bottom:10px"><b>Демо-режим.</b> Сессия сохраняется в браузере.</p>
            <div class="row row--tight">
              <button class="btn btn--soft btn--sm" type="button" data-act="demo-login" data-id="u0000-0001">Войти как администратор</button>
            </div>
          </div>
        </div>
      </div>
    </section>`;

    const body = $('#auth-body', root);
    if (mode === 'login') {
      body.innerHTML = `
        <h1 style="font-size:26px;margin-bottom:var(--sp-2)">С возвращением</h1>
        <p style="color:var(--fg-mut);margin-bottom:var(--sp-5)">Войди, чтобы продолжить работу над проектами.</p>
        <form class="form" data-form="login" novalidate>
          <div class="field"><label for="l-id">Email или username <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="l-id" name="login" autocomplete="username" placeholder="ala или ala@example.kz" required />
            <span class="field__err" data-err="login" role="alert"></span></div>
          <div class="field"><label for="l-pw">Пароль <span class="req" aria-hidden="true">*</span></label>
            <div class="field__wrap">
              <input class="input" id="l-pw" name="password" type="password" autocomplete="current-password" style="padding-right:52px" required />
              <button class="ib field__btn" type="button" data-act="pw-toggle" aria-label="Показать пароль">${icon('eye')}</button>
            </div>
            <span class="field__err" data-err="password" role="alert"></span></div>
          <div class="row" style="justify-content:space-between">
            <button class="btn btn--ghost btn--sm" type="button" data-act="pw-reset">Забыли пароль?</button>
            <button class="btn btn--primary" type="submit">Войти ${icon('arrow', 'ic--sm ic--arrow')}</button>
          </div>
        </form>`;

      $('[data-form="login"]', body).addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (!validate(form, { login: required('Введите email или username'), password: minLen(6, 'Пароль от 6 символов') })) return;
        
        const loginVal = new FormData(form).get('login').toString().trim().toLowerCase();
        
        try {
          const res = await fetch('/api/users');
          const users = await res.json();
          const user = users.find((x) => x.username.toLowerCase() === loginVal || (x.email || '').toLowerCase() === loginVal);

          if (!user) {
            fieldError(form, 'login', 'Аккаунт не найден.');
            toast('Аккаунт не найден', 'err');
            return;
          }
          if (user.blocked) {
            toast('Аккаунт заблокирован администрацией', 'err');
            return;
          }

          setSession(user);
          toast(`Привет, ${user.name.split(' ')[0]}!`, 'ok');
          go(next);
        } catch (err) {
          console.error(err);
          toast('Ошибка авторизации', 'err');
        }
      });
    } else {
      body.innerHTML = signupStep(1, signupState);
      bindSignup(body, next);
    }
  }

  const signupState = {};
  function signupStep(step, data) {
    const bar = `<div class="steps" role="group" aria-label="Шаг ${step} из 3">
      ${[1, 2, 3].map((i) => `<span class="steps__i ${i < step ? 'is-done' : i === step ? 'is-on' : ''}"></span>`).join('')}
    </div><p class="field__hint" style="margin-bottom:var(--sp-4)">Шаг ${step} из 3</p>`;

    if (step === 1) {
      return `${bar}<h1 style="font-size:26px;margin-bottom:var(--sp-2)">Создай аккаунт</h1>
      <p style="color:var(--fg-mut);margin-bottom:var(--sp-5)">Начнём с основного — это займёт минуту.</p>
      <form class="form" data-form="signup" data-step="1" novalidate>
        <div class="grid-2">
          <div class="field"><label for="s-name">Имя и фамилия <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="s-name" name="name" autocomplete="name" value="${esc(data.name || '')}" required /><span class="field__err" data-err="name" role="alert"></span></div>
          <div class="field"><label for="s-user">Username <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="s-user" name="username" autocomplete="username" value="${esc(data.username || '')}" placeholder="latin_nick" required /><span class="field__err" data-err="username" role="alert"></span></div>
          <div class="field"><label for="s-mail">Email <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="s-mail" name="email" type="email" inputmode="email" autocomplete="email" value="${esc(data.email || '')}" required /><span class="field__err" data-err="email" role="alert"></span></div>
          <div class="field"><label for="s-pw">Пароль <span class="req" aria-hidden="true">*</span></label>
            <div class="field__wrap"><input class="input" id="s-pw" name="password" type="password" autocomplete="new-password" style="padding-right:52px" required />
              <button class="ib field__btn" type="button" data-act="pw-toggle" aria-label="Показать пароль">${icon('eye')}</button></div>
            <span class="field__hint">Минимум 8 символов.</span><span class="field__err" data-err="password" role="alert"></span></div>
        </div>
        <div class="row" style="justify-content:flex-end"><button class="btn btn--primary" type="submit">Дальше ${icon('arrow', 'ic--sm ic--arrow')}</button></div>
      </form>`;
    }
    if (step === 2) {
      return `${bar}<h1 style="font-size:26px;margin-bottom:var(--sp-2)">Где ты учишься</h1>
      <p style="color:var(--fg-mut);margin-bottom:var(--sp-5)">Так проще находить команду рядом с тобой.</p>
      <form class="form" data-form="signup" data-step="2" novalidate>
        <div class="grid-2">
          <div class="field"><label for="s-school">Школа или колледж <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="s-school" name="school" value="${esc(data.school || '')}" required /><span class="field__err" data-err="school" role="alert"></span></div>
          <div class="field"><label for="s-grade">Класс или курс <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="s-grade" name="grade" value="${esc(data.grade || '')}" placeholder="11 класс / 1 курс" required /><span class="field__err" data-err="grade" role="alert"></span></div>
          <div class="field"><label for="s-city">Город</label>
            <select class="select" id="s-city" name="city">${D.CITIES.map((c) => `<option ${data.city === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        </div>
        <div class="row" style="justify-content:space-between"><button class="btn btn--ghost" type="button" data-act="signup-back">Назад</button>
          <button class="btn btn--primary" type="submit">Дальше ${icon('arrow', 'ic--sm ic--arrow')}</button></div>
      </form>`;
    }
    return `${bar}<h1 style="font-size:26px;margin-bottom:var(--sp-2)">Интересы и навыки</h1>
      <p style="color:var(--fg-mut);margin-bottom:var(--sp-5)">По ним тебя найдут команды — и мы подберём проекты.</p>
      <form class="form" data-form="signup" data-step="3" novalidate>
        <fieldset class="fieldset"><legend>Интересы <span class="req" aria-hidden="true">*</span></legend>
          ${chipPicker('interests', D.CATEGORIES, [])}<span class="field__err" data-err="interests" role="alert"></span></fieldset>
        <fieldset class="fieldset"><legend>Навыки <span class="req" aria-hidden="true">*</span></legend>
          ${chipPicker('skills', D.SKILLS, [], skillRu)}<span class="field__err" data-err="skills" role="alert"></span></fieldset>
        <div class="field"><label for="s-bio">О себе и опыте</label>
          <textarea class="textarea" id="s-bio" name="bio" placeholder="Чем занимался, в каких конкурсах участвовал, что хочешь делать" style="min-height:100px"></textarea></div>
        <div class="row" style="justify-content:space-between"><button class="btn btn--ghost" type="button" data-act="signup-back">Назад</button>
          <button class="btn btn--primary btn--lg" type="submit">Создать профиль</button></div>
      </form>`;
  }

  function bindSignup(body, next) {
    body.addEventListener('submit', async (e) => {
      const form = e.target.closest('[data-form="signup"]');
      if (!form) return;
      e.preventDefault();
      const step = Number(form.dataset.step);
      const fd = new FormData(form);

      if (step === 1) {
        const ok = validate(form, {
          name: required('Введите имя и фамилию'),
          username: (v) => (!v ? 'Придумайте username' : !/^[a-z0-9_]{3,20}$/i.test(v) ? 'Только латиница, цифры и _, 3–20 символов' : ''),
          email: (v) => (!v ? 'Введите email' : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? '' : 'Проверьте формат email'),
          password: minLen(8, 'Минимум 8 символов'),
        });
        if (!ok) return;
        Object.assign(signupState, { 
          name: fd.get('name').toString().trim(), 
          username: fd.get('username').toString().trim(), 
          email: fd.get('email').toString().trim(),
          password: fd.get('password').toString()
        });
        body.innerHTML = signupStep(2, signupState);
      } else if (step === 2) {
        if (!validate(form, { school: required('Укажите школу или колледж'), grade: required('Укажите класс или курс') })) return;
        Object.assign(signupState, { school: fd.get('school').toString().trim(), grade: fd.get('grade').toString().trim(), city: fd.get('city').toString() });
        body.innerHTML = signupStep(3, signupState);
      } else {
        const ok = validate(form, {
          interests: (v) => (v ? '' : 'Отметьте хотя бы один интерес'),
          skills: (v) => (v ? '' : 'Отметьте хотя бы один навык'),
        });
        if (!ok) return;

        const payload = {
          ...signupState,
          interests: pickerValue(form, 'interests'),
          skills: pickerValue(form, 'skills'),
          bio: (fd.get('bio') || '').toString().trim(),
        };

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
          const res = await fetch('/api/users/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          const data = await res.json();

          if (!res.ok) {
            toast(data.error || 'Ошибка регистрации', 'err');
            if (submitBtn) submitBtn.disabled = false;
            return;
          }

          setSession(data);
          toast('Профиль успешно создан!', 'ok');
          go(next);
        } catch (err) {
          console.error(err);
          toast('Ошибка соединения с сервером', 'err');
          if (submitBtn) submitBtn.disabled = false;
        }
      }
    });

    body.addEventListener('click', (e) => {
      if (!e.target.closest('[data-act="signup-back"]')) return;
      const step = Number($('[data-form="signup"]', body).dataset.step);
      body.innerHTML = signupStep(step - 1, signupState);
    });
  }

  /* Admin Panel Stub */
  function renderAdmin(root, _arg, params) {
    if (!isAdmin()) {
      root.innerHTML = `<section class="section"><div class="wrap wrap--narrow">
        ${emptyState('Доступ только для администрации', 'Войдите под учетной записью администратора.', '<a class="btn btn--ghost" href="#/">На главную</a>')}
      </div></section>`;
      return;
    }
    root.innerHTML = `
    <section class="section section--tight">
      <div class="wrap">
        <span class="eyebrow">Администрирование</span>
        <h1 style="font-size:clamp(26px,4vw,38px);margin:10px 0 var(--sp-2)">Админ-панель</h1>
        <p style="color:var(--fg-mut)">Панель управления переведена на Supabase API.</p>
      </div>
    </section>`;
  }

  function eventForm() {
    return `<form class="form" data-form="event" novalidate style="gap:var(--sp-4)">
      <div class="grid-2">
        <div class="field"><label for="ev-t">Название <span class="req" aria-hidden="true">*</span></label><input class="input" id="ev-t" name="title" required /><span class="field__err" data-err="title" role="alert"></span></div>
        <div class="field"><label for="ev-o">Организатор <span class="req" aria-hidden="true">*</span></label><input class="input" id="ev-o" name="org" required /><span class="field__err" data-err="org" role="alert"></span></div>
        <div class="field"><label for="ev-d">Дата <span class="req" aria-hidden="true">*</span></label><input class="input" id="ev-d" name="date" type="date" required /><span class="field__err" data-err="date" role="alert"></span></div>
        <div class="field"><label for="ev-dl">Дедлайн регистрации</label><input class="input" id="ev-dl" name="deadline" type="date" /></div>
        <div class="field"><label for="ev-p">Место</label><input class="input" id="ev-p" name="place" placeholder="Город или площадка" /></div>
        <div class="field"><label for="ev-f">Формат</label><select class="select" id="ev-f" name="format">${D.FORMATS.map((f) => `<option value="${f.id}">${f.ru}</option>`).join('')}</select></div>
        <div class="field"><label for="ev-ty">Тип</label><select class="select" id="ev-ty" name="type">${D.EVENT_TYPES.map((t) => `<option value="${t.id}">${t.ru}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label for="ev-ab">Описание</label><textarea class="textarea" id="ev-ab" name="about" style="min-height:80px"></textarea></div>
      <div class="row" style="justify-content:flex-end"><button class="btn btn--primary" type="submit">${icon('plus')}Добавить</button></div>
    </form>`;
  }

  function bindEventForm(root) {
    const form = $('[data-form="event"]', root);
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!validate(form, { title: required('Введите название'), org: required('Укажите организатора'), date: required('Выберите дату') })) return;
      toast('Функция добавления через API в разработке', 'info');
    });
  }

  /* About */
  function renderAbout(root) {
    root.innerHTML = `
    <section class="section section--tight">
      <div class="wrap wrap--narrow">
        <span class="eyebrow">О платформе</span>
        <h1 style="font-size:clamp(28px,4.4vw,42px);margin:10px 0 var(--sp-4)">BASTAU — с чего начинается проект</h1>
        <p style="font-size:18px;color:var(--fg-mut)">Мы собрали в одном месте всё, что нужно школьнику и студенту, чтобы довести идею до результата: каталог проектов, поиск команды, мероприятия, менторов и портфолио, которое собирается само.</p>
        <div class="prose" style="margin-top:var(--sp-6)">
          ${[['Идея не теряется', 'Записал мысль — оформил в проект по понятной форме: проблема, решение, цель, нужные навыки.'],
            ['Команда собирается по навыкам', 'Люди ищут друг друга по навыкам, интересам, школе и городу, а не по случайным чатам.'],
            ['Возможности видно заранее', 'Хакатоны, MUN, олимпиады и конкурсы — с дедлайнами и напоминаниями.'],
            ['Результат остаётся с тобой', 'Каждый проект и достижение остаются в профиле и превращаются в портфолио.']]
            .map(([t, d]) => `<div class="card" data-reveal><h3>${t}</h3><p>${d}</p></div>`).join('')}
        </div>
        <div class="row" style="margin-top:var(--sp-6)">
          <a class="btn btn--primary btn--lg" href="#/auth?mode=signup">Создать профиль</a>
          <a class="btn btn--ghost btn--lg" href="#/projects">Смотреть проекты</a>
        </div>
      </div>
    </section>`;
  }

  /* Warnings */
  function render404(root) {
    root.innerHTML = `<section class="section"><div class="wrap wrap--narrow">
      ${emptyState('Страница не найдена', 'Возможно, проект удалили или ссылка устарела.', '<a class="btn btn--primary" href="#/">На главную</a>')}
    </div></section>`;
  }

  function needAuth(root, title, next) {
    root.innerHTML = `<section class="section"><div class="wrap wrap--narrow">
      ${emptyState(title, 'Вход занимает несколько секунд — можно использовать демо-аккаунт.',
      `<div class="row" style="justify-content:center"><a class="btn btn--primary" href="#/auth?next=${encodeURIComponent(next)}">Войти</a>
       <a class="btn btn--ghost" href="#/auth?mode=signup&next=${encodeURIComponent(next)}">Зарегистрироваться</a></div>`)}
    </div></section>`;
  }

  /* ============================== ACTIONS ============================== */
  function actApply(projectId) {
    const u = me();
    if (!u) { go('#/auth?next=' + encodeURIComponent('#/project/' + projectId)); return; }
    const p = projectById(projectId);
    openSheet('Заявка в команду · ' + p.title, `
      <form class="form" data-form="apply" novalidate>
        <div class="field">
          <label for="ap-msg">Почему вы хотите присоединиться к проекту? <span class="req" aria-hidden="true">*</span></label>
          <textarea class="textarea" id="ap-msg" name="message" placeholder="Пара предложений: что умеешь и чем поможешь команде" required></textarea>
          <span class="field__hint">Нужные навыки: ${esc(p.skills.map(skillRu).join(', '))}.</span>
          <span class="field__err" data-err="message" role="alert"></span>
        </div>
        <div class="row" style="justify-content:flex-end">
          <button class="btn btn--ghost" type="button" data-act="sheet-close">Отмена</button>
          <button class="btn btn--primary" type="submit">Отправить заявку</button>
        </div>
      </form>`, (box) => {
      $('[data-form="apply"]', box).addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (!validate(form, { message: minLen(15, 'Напишите хотя бы пару предложений') })) return;
        db.applications.push({
          id: uid('a'), projectId, userId: u.id, status: 'pending',
          message: new FormData(form).get('message').toString().trim(),
          createdAt: new Date().toISOString().slice(0, 10),
        });
        notify(p.ownerId, 'application', `${u.name} подал заявку в проект «${p.title}»`, '#/project/' + p.id);
        save();
        closeSheet();
        toast('Заявка отправлена создателю проекта', 'ok');
        route(true);
      });
    });
  }

  function actAccept(appId, role) {
    const a = db.applications.find((x) => x.id === appId);
    if (!a) return;
    const p = projectById(a.projectId);
    a.status = 'accepted';
    if (p && !p.members.some((m) => m.userId === a.userId)) p.members.push({ userId: a.userId, role: role || 'Developer' });
    notify(a.userId, 'accepted', `Заявку приняли: ты в команде «${p ? p.title : 'проекта'}» как ${role || 'Developer'}`, '#/project/' + a.projectId);
    save();
    toast('Участник добавлен в команду', 'ok');
    route(true);
  }

  function actReject(appId) {
    const a = db.applications.find((x) => x.id === appId);
    if (!a) return;
    const p = projectById(a.projectId);
    a.status = 'rejected';
    notify(a.userId, 'rejected', `Заявка в «${p ? p.title : 'проект'}» отклонена. Попробуй другие проекты — их много.`, '#/projects');
    save();
    toast('Заявка отклонена');
    route(true);
  }

  function actReport(kind, id) {
    if (!me()) { go('#/auth'); return; }
    openSheet('Пожаловаться', `
      <form class="form" data-form="report" novalidate>
        <fieldset class="fieldset"><legend>Причина <span class="req" aria-hidden="true">*</span></legend>
          <div style="display:grid;gap:2px">
            ${D.REPORT_REASONS.map((r, i) => `<label class="check"><input type="radio" name="reason" value="${r.id}" ${i === 0 ? 'checked' : ''} /><span>${esc(r.ru)}</span></label>`).join('')}
          </div>
        </fieldset>
        <div class="field"><label for="rp-note">Комментарий</label>
          <textarea class="textarea" id="rp-note" name="note" style="min-height:90px" placeholder="Что именно не так?"></textarea></div>
        <div class="row" style="justify-content:flex-end">
          <button class="btn btn--ghost" type="button" data-act="sheet-close">Отмена</button>
          <button class="btn btn--danger" type="submit">Отправить жалобу</button>
        </div>
      </form>`, (box) => {
      $('[data-form="report"]', box).addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        db.reports.push({
          id: uid('r'), targetType: kind, targetId: id, reason: fd.get('reason').toString(),
          note: (fd.get('note') || '').toString().trim(), byUser: db.session, createdAt: new Date().toISOString(),
        });
        save();
        closeSheet();
        toast('Жалоба отправлена администрации', 'ok');
      });
    });
  }

  function actInvite(userId) {
    const u = me();
    if (!u) { go('#/auth'); return; }

    openSheet('Пригласить в проект', `
      <div id="sheet-invite-body" style="padding:var(--sp-4) 0">
        <p style="color:var(--fg-mut)">Загрузка проектов...</p>
      </div>
    `);

    Promise.all([
      fetch('/api/projects').then((r) => r.json()),
      fetch(`/api/users/${userId}`).then((r) => r.json())
    ]).then(([allProjects, target]) => {
      const box = $('#sheet-invite-body');
      if (!box) return;

      const mine = allProjects.filter((p) => p.owner_id === u.id || p.ownerId === u.id);

      if (!mine.length) {
        box.innerHTML = `<p class="field__hint">Сначала создай проект, чтобы приглашать людей.</p>
          <div class="row" style="justify-content:flex-end;margin-top:var(--sp-4)">
            <button class="btn btn--ghost" type="button" data-act="sheet-close">Закрыть</button>
          </div>`;
        return;
      }

      box.innerHTML = `
        <form class="form" data-form="invite" novalidate>
          <p style="margin-bottom:var(--sp-3)">Приглашение для <b>${esc(target.name)}</b>:</p>
          <div class="field"><label for="iv-p">Проект</label>
            <select class="select" id="iv-p" name="project">${mine.map((p) => `<option value="${p.id}">${esc(p.title)}</option>`).join('')}</select></div>
          <div class="field"><label for="iv-r">Роль</label>
            <select class="select" id="iv-r" name="role">${D.ROLES.filter((r) => r !== 'Founder').map((r) => `<option>${r}</option>`).join('')}</select></div>
          <div class="row" style="justify-content:flex-end;margin-top:var(--sp-4)">
            <button class="btn btn--ghost" type="button" data-act="sheet-close">Отмена</button>
            <button class="btn btn--primary" type="submit">Отправить приглашение</button>
          </div>
        </form>`;

      $('[data-form="invite"]', box).addEventListener('submit', (e) => {
        e.preventDefault();
        closeSheet();
        toast('Приглашение отправлено', 'ok');
      });
    }).catch((err) => {
      console.error(err);
      const box = $('#sheet-invite-body');
      if (box) box.innerHTML = `<p style="color:var(--danger)">Ошибка загрузки данных</p>`;
    });
  }

  function actPortfolio(userId) {
    openSheet('Портфолио', `
      <div id="sheet-portfolio-body" style="padding:var(--sp-4) 0">
        <p style="color:var(--fg-mut)">Загрузка профиля и проектов...</p>
      </div>
    `);

    Promise.all([
      fetch(`/api/users/${userId}`).then((r) => r.json()),
      fetch('/api/projects').then((r) => r.json())
    ]).then(([u, allProjects]) => {
      const box = $('#sheet-portfolio-body');
      if (!box) return;

      u.achievements = u.achievements || [];
      u.eventsCount = u.events_count ?? u.eventsCount ?? 0;
      const projects = allProjects.filter((p) => (p.members || []).some((m) => m.userId === u.id) || p.owner_id === u.id);

      const titleEl = box.closest('.sheet')?.querySelector('.sheet__ttl');
      if (titleEl) titleEl.textContent = 'Портфолио · ' + u.name;

      box.innerHTML = `
        <div class="kv">
          <span class="kv__i">${icon('user', 'ic--sm')}<span><b>${esc(u.name)}</b> · @${esc(u.username)}</span></span>
          <span class="kv__i">${icon('case', 'ic--sm')}<span>${esc(u.school)} · ${esc(u.grade)} · ${esc(u.city)}</span></span>
        </div>
        <h3 style="font-size:16px;margin:var(--sp-5) 0 var(--sp-2)">Проекты (${projects.length})</h3>
        ${projects.length ? projects.map((p) => {
          const m = (p.members || []).find((mem) => mem.userId === u.id) || { role: 'Участник' };
          return `<div class="member"><div style="flex:1;min-width:0">
          <div class="member__n">${esc(p.title)} ·${esc(catRu(p.category))}</div>
          <div class="member__r">${esc(m.role)} ·${esc(stageRu(p.stage))}</div></div></div>`;
        }).join('')
          : '<p class="field__hint">Проектов пока нет.</p>'}
        <h3 style="font-size:16px;margin:var(--sp-5) 0 var(--sp-2)">Достижения (${u.achievements.length})</h3>
        ${u.achievements.length ? u.achievements.map((a) => `<div class="member"><div class="member__n">${esc(a)}</div></div>`).join('') : '<p class="field__hint">Достижений пока нет.</p>'}
        <p class="field__hint" style="margin-top:var(--sp-4)">Участие в мероприятиях: ${u.eventsCount}</p>
        <div class="row" style="justify-content:flex-end;margin-top:var(--sp-5)">
          <button class="btn btn--ghost" type="button" data-act="sheet-close">Закрыть</button>
          <button class="btn btn--primary" type="button" data-act="portfolio-print">Сохранить как PDF</button>
        </div>`;
    }).catch((err) => {
      console.error(err);
      const box = $('#sheet-portfolio-body');
      if (box) box.innerHTML = `<p style="color:var(--danger)">Ошибка загрузки портфолио</p>`;
    });
  }

  function actEventOpen(id) {
    openSheet('Загрузка мероприятия...', `
      <div id="sheet-event-body" style="padding:var(--sp-4) 0">
        <p style="color:var(--fg-mut)">Загружаем подробную информацию...</p>
      </div>
    `);

    fetch(`/api/events/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Мероприятие не найдено');
        return res.json();
      })
      .then((e) => {
        const box = $('#sheet-event-body');
        if (!box) return;

        const sheetEl = box.closest('.sheet');
        if (sheetEl) {
          const titleEl = sheetEl.querySelector('.sheet__ttl');
          if (titleEl) titleEl.textContent = e.title;
        }

        e.deadline = e.reg_deadline || e.deadline || e.date;
        const left = daysLeft(e.deadline);
        const isClosed = left < 0;

        box.innerHTML = `
          <div class="row row--tight" style="margin-bottom:var(--sp-4)">
            <span class="badge badge--stage">${esc(evtRu(e.type))}</span>
            <span class="badge">${esc(fmtRu(e.format))}</span>
            <span class="badge ${isClosed ? '' : left <= 7 ? 'badge--warn' : 'badge--ok'}">${isClosed ? 'Регистрация закрыта' : 'Дедлайн ' + esc(dateRu(e.deadline))}</span>
          </div>
          <p style="color:var(--fg-mut);line-height:1.6">${esc(e.about || 'Описание скоро появится.')}</p>
          <div class="kv" style="margin-top:var(--sp-4)">
            <span class="kv__i">${icon('calendar', 'ic--sm')}<span><b>${esc(dateRu(e.date))}</b></span></span>
            <span class="kv__i">${icon('pin', 'ic--sm')}<span>${esc(e.place)}</span></span>
            ${e.org ? `<span class="kv__i">${icon('flag', 'ic--sm')}<span>${esc(e.org)}</span></span>` : ''}
          </div>
          <div class="row" style="justify-content:flex-end;margin-top:var(--sp-5)">
            <button class="btn btn--ghost" type="button" data-act="sheet-close">Закрыть</button>
            ${isClosed ? '' : `<button class="btn btn--primary" type="button" data-act="event-join" data-id="${e.id}">Участвовать</button>`}
          </div>`;
      })
      .catch((err) => {
        console.error(err);
        const box = $('#sheet-event-body');
        if (box) box.innerHTML = `<p style="color:var(--danger)">Не удалось загрузить мероприятие</p>`;
      });
  }

  /* ========================= LISTENERS ====================== */
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-act]');
    if (t) {
      const act = t.dataset.act;
      const id = t.dataset.id;

      if (act === 'sheet-close') { closeSheet(); return; }
      if (act === 'confirm-ok') { const cb = confirmSheet.cb; closeSheet(); if (cb) cb(); return; }
      if (act === 'apply') { actApply(id); return; }
      if (act === 'app-accept') {
        const sel = document.querySelector(`[data-role-for="${id}"]`);
        actAccept(id, sel ? sel.value : 'Developer'); return;
      }
      if (act === 'app-reject') { actReject(id); return; }
      if (act === 'member-remove') {
        const pid = t.dataset.project, uidv = t.dataset.user;
        const p = projectById(pid), ru = userById(uidv);
        confirmSheet('Удалить участника?', `${ru.name} потеряет доступ к команде проекта «${p.title}». Отменить это нельзя.`, 'Удалить', () => {
          p.members = p.members.filter((m) => m.userId !== uidv);
          db.applications = db.applications.filter((a) => !(a.projectId === pid && a.userId === uidv));
          notify(uidv, 'removed', `Тебя больше нет в команде «${p.title}»`, '#/projects');
          save(); toast('Участник удалён'); route(true);
        });
        return;
      }
      if (act === 'report') { actReport(t.dataset.kind, id); return; }
      if (act === 'invite') { actInvite(id); return; }
      if (act === 'portfolio') { actPortfolio(id); return; }
      if (act === 'portfolio-print') { window.print(); return; }
      if (act === 'event-open') { actEventOpen(id); return; }
      if (act === 'event-join') { closeSheet(); toast('Отметили участие — событие в твоём кабинете', 'ok'); return; }
      if (act === 'mentor-ask') {
        if (!me()) { go('#/auth'); return; }
        toast(`Запрос менторства отправлен: ${db.mentors.find((x) => x.id === id).name}`, 'ok');
        return;
      }
      if (act === 'demo-login') {
        db.session = id; save();
        toast(`Вход выполнен: ${userById(id).name}`, 'ok');
        go('#/dashboard'); return;
      }
      if (act === 'logout') { db.session = null; save(); closeSheet(); toast('Вы вышли из аккаунта'); go('#/'); return; }
      if (act === 'db-reset') {
        confirmSheet('Сбросить демо-данные?', 'Все созданные проекты, заявки и аккаунты в этом браузере будут удалены.', 'Сбросить', () => {
          resetDb(); toast('Демо-данные сброшены', 'ok'); go('#/'); route(true);
        });
        return;
      }
      if (act === 'pw-toggle') {
        const input = t.parentElement.querySelector('input');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        t.setAttribute('aria-label', show ? 'Скрыть пароль' : 'Показать пароль');
        return;
      }
      if (act === 'pw-reset') {
        openSheet('Восстановление пароля', `
          <p style="color:var(--fg-mut)">Введите email — пришлём ссылку для смены пароля.</p>
          <form class="form" data-form="pwreset" style="margin-top:var(--sp-4)">
            <div class="field"><label for="pr-m">Email</label><input class="input" id="pr-m" name="email" type="email" inputmode="email" required /></div>
            <div class="row" style="justify-content:flex-end">
              <button class="btn btn--ghost" type="button" data-act="sheet-close">Отмена</button>
              <button class="btn btn--primary" type="submit">Отправить ссылку</button>
            </div>
          </form>`, (box) => {
          $('[data-form="pwreset"]', box).addEventListener('submit', (ev) => {
            ev.preventDefault(); closeSheet(); toast('Если такой email есть — письмо отправлено', 'ok');
          });
        });
        return;
      }
      if (act === 'filters-toggle') {
        const body = $('#filters-body');
        body.hidden = !body.hidden;
        t.setAttribute('aria-expanded', String(!body.hidden));
        M.refresh();
        return;
      }
      if (act === 'filters-reset') { go(location.hash.split('?')[0]); return; }
      if (act === 'notif-read-all') {
        const u = me(); if (!u) return;
        db.notifications.forEach((n) => { if (n.userId === u.id) n.read = true; });
        save(); route(true); return;
      }
      if (act === 'admin-block') {
        const bu = db.users.find((x) => x.id === id);
        bu.blocked = !bu.blocked; save();
        toast(bu.blocked ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
        route(true); return;
      }
      if (act === 'admin-project-del') {
        const p = projectById(id);
        confirmSheet('Удалить проект?', `«${p.title}» и все заявки к нему будут удалены безвозвратно.`, 'Удалить проект', () => {
          db.projects = db.projects.filter((x) => x.id !== id);
          db.applications = db.applications.filter((a) => a.projectId !== id);
          save(); toast('Проект удалён'); route(true);
        });
        return;
      }
      if (act === 'admin-event-del') {
        const ev = db.events.find((x) => x.id === id);
        confirmSheet('Удалить мероприятие?', `«${ev.title}» исчезнет из календаря.`, 'Удалить', () => {
          db.events = db.events.filter((x) => x.id !== id); save(); toast('Мероприятие удалено'); route(true);
        });
        return;
      }
      if (act === 'admin-report-done') {
        db.reports = db.reports.filter((r) => r.id !== id); save(); toast('Жалоба закрыта', 'ok'); route(true); return;
      }
    }

    // чипы-переключатели в формах
    const chip = e.target.closest('[data-pick]');
    if (chip) {
      const box = chip.closest('[data-picker]');
      const input = box.querySelector('input[type="hidden"]');
      const single = ['cat', 'category', 'skill'].includes(box.dataset.picker);
      const val = chip.dataset.pick;
      let cur = input.value ? input.value.split(',').filter(Boolean) : [];
      if (single) {
        cur = cur.includes(val) ? [] : [val];
        box.querySelectorAll('[data-pick]').forEach((c) => {
          const on = cur.includes(c.dataset.pick);
          c.classList.toggle('chip--on', on); c.setAttribute('aria-pressed', String(on));
        });
      } else {
        const on = cur.includes(val);
        cur = on ? cur.filter((x) => x !== val) : cur.concat(val);
        chip.classList.toggle('chip--on', !on); chip.setAttribute('aria-pressed', String(!on));
      }
      input.value = cur.join(',');
      const err = box.parentElement.querySelector(`[data-err="${box.dataset.picker}"]`);
      if (err) err.innerHTML = '';
      return;
    }

    if (e.target.closest('[data-close]')) closeSheet();
  });

  document.addEventListener('change', (e) => {
    const sel = e.target.closest('select[data-act]');
    if (!sel) return;
    if (sel.dataset.act === 'member-role') {
      const p = projectById(sel.dataset.project);
      p.members.find((x) => x.userId === sel.dataset.user).role = sel.value;
      save();
      toast(`Роль обновлена: ${sel.value}`, 'ok');
    }
    if (sel.dataset.act === 'admin-stage') {
      const p = projectById(sel.dataset.id);
      p.stage = sel.value; save();
      toast(`Стадия «${p.title}»: ${stageRu(sel.value)}`, 'ok');
    }
  });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

  /* ============================== START ================================ */
  function boot() {
    // страницу всегда открываем сверху: браузерное восстановление прокрутки ломает SPA-переходы
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
    $('#btn-bell').addEventListener('click', () => go('#/dashboard?tab=notifs'));
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

    // При заходе без хэша location.replace('#/') порождает лишний hashchange: он перерисовывал
    // первый экран уже после старта заставки, и вступление героя оставалось на паузе.
    window.addEventListener('hashchange', () => { if (location.hash !== current) route(); });
    if (!location.hash) location.replace('#/');
    M.init();
    route(true);
    // заставка проигрывается после первой отрисовки и запускает вступление первого экрана
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => M.startIntro());
    else M.startIntro();
    setTimeout(() => M.startIntro(), 1200);   // страховка, если шрифты не догрузились
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
