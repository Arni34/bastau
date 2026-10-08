/* ==========================================================================
   BASTAU — приложение (роутер, хранилище, экраны)
   Прототип MVP: данные живут в localStorage, пароли не сохраняются.
   ========================================================================== */
(() => {
  'use strict';

  const D = window.BASTAU;
  const M = window.BastauMotion;
  const KEY = D.VERSION;
  const ADMIN_IDS = ['u1'];             // демо-администраторы платформы

  /* ============================== Хранилище ============================= */
  let db = load();
  function load() {
    const base = D.seed();
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return base;
      const saved = JSON.parse(raw) || {};
      // Недостающие или битые коллекции подмешиваем из сида: частично записанное
      // хранилище (старая версия, сбой записи) не должно ронять приложение в белый экран.
      Object.keys(base).forEach((k) => {
        if (Array.isArray(base[k]) && !Array.isArray(saved[k])) saved[k] = base[k];
      });
      if (typeof saved.session === 'undefined') saved.session = null;
      return saved;
    } catch (e) { return base; }   /* приватный режим или повреждённый JSON */
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* хранилище недоступно — работаем в памяти */ }
  }
  function resetDb() { db = D.seed(); save(); }

  /* ============================== Утилиты =============================== */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = (p) => p + Math.random().toString(36).slice(2, 8);
  const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const initials = (name) => String(name).trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
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

  /* ============================ Пользователь ============================ */
  const me = () => db.users.find((u) => u.id === db.session) || null;
  const isAdmin = () => !!db.session && ADMIN_IDS.includes(db.session);
  const userById = (id) => db.users.find((u) => u.id === id) || { id, name: 'Пользователь', username: 'user', city: '—', school: '—', grade: '—', skills: [], interests: [], achievements: [], eventsCount: 0, bio: '' };
  const projectById = (id) => db.projects.find((p) => p.id === id) || null;
  const myProjects = (id) => db.projects.filter((p) => p.ownerId === id);
  const myTeams = (id) => db.projects.filter((p) => p.ownerId !== id && p.members.some((m) => m.userId === id));
  const myApps = (id) => db.applications.filter((a) => a.userId === id);
  const incomingApps = (id) => db.applications.filter((a) => { const p = projectById(a.projectId); return p && p.ownerId === id; });
  const myNotifs = (id) => db.notifications.filter((n) => n.userId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = (id) => myNotifs(id).filter((n) => !n.read).length;

  function notify(userId, type, text, href) {
    db.notifications.push({ id: uid('n'), userId, type, text, href: href || '', read: false, createdAt: new Date().toISOString() });
  }

  /* ========================== Тосты и модалки =========================== */
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

  /* ============================== Формы ================================= */
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

  /* ============================= Компоненты ============================= */
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
        <span class="card__meta">${icon('case', 'ic--sm')}${plural(db.projects.filter((p) => p.members.some((m) => m.userId === u.id)).length, 'проект', 'проекта', 'проектов')}</span>
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

  /* =============================== Роутер =============================== */
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

  /* ================================ ГЛАВНАЯ ============================= */
  function renderHome(root) {
    const top = db.projects.slice().sort((a, b) => b.members.length - a.members.length).slice(0, 3);
    const upcoming = db.events.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
    const cities = new Set(db.users.map((u) => u.city)).size;
    const openRoles = db.projects.filter((p) => p.needTeam).length;

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
            <div data-hero-stat><div class="stat__n" data-count="${db.projects.length}">0</div><div class="stat__l">проектов в каталоге</div></div>
            <div data-hero-stat><div class="stat__n" data-count="${db.users.length}">0</div><div class="stat__l">участников</div></div>
            <div data-hero-stat><div class="stat__n" data-count="${db.events.length}">0</div><div class="stat__l">мероприятий</div></div>
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
              <div class="stack">${db.users.slice(0, 4).map((u) => avatar(u, 'sm')).join('')}</div>
              <span class="card__meta">${icon('users', 'ic--sm')}3 / 6 в команде</span>
            </div>
            <div class="card__ft" style="gap:var(--sp-2)">
              <span class="chip chip--skill">Маркетинг</span><span class="chip chip--skill">Дизайн</span><span class="chip chip--skill">+1</span>
              <span class="spacer"></span>
              <a class="card__go" href="#/project/p1">Открыть ${icon('arrow', 'ic--sm ic--arrow')}</a>
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
          <p>Пять шагов, которые BASTAU держит в одном месте — без десятка чатов и потерянных договорённостей.</p>
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
          <p>Хакатоны, MUN, олимпиады и мастер-классы — с дедлайнами регистрации.</p>
        </div>
        <div class="grid grid--3">${upcoming.map(eventCard).join('')}</div>
        <div class="sec-more"><a class="btn btn--ghost" href="#/events">Все мероприятия ${icon('arrow', 'ic--sm ic--arrow')}</a></div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="sec-hd">
          <h2>Наставники</h2>
          <p>Взрослые практики, которые разбирают проекты и помогают дожать результат.</p>
        </div>
        <div class="grid grid--2">${db.mentors.slice(0, 2).map(mentorCard).join('')}</div>
        <div class="sec-more"><a class="btn btn--ghost" href="#/mentors">Все наставники ${icon('arrow', 'ic--sm ic--arrow')}</a></div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="card" style="border-radius:var(--r-xl);padding:var(--sp-7)" data-reveal>
          <div class="split">
            <div>
              <span class="eyebrow">О BASTAU</span>
              <h2 style="margin:10px 0 var(--sp-4);font-size:clamp(24px,3.2vw,32px)">Не каталог проектов, а экосистема</h2>
              <p style="color:var(--fg-mut);max-width:60ch">BASTAU собирает вместе то, что у школьника обычно разбросано: идею, команду, возможности и результат. Профиль растёт вместе с проектами — к выпуску у тебя готовое портфолио, а не список «участвовал».</p>
              <div class="row" style="margin-top:var(--sp-5)">
                <a class="btn btn--primary" href="#/auth?mode=signup">Присоединиться ${icon('arrow', 'ic--sm ic--arrow')}</a>
                <a class="btn btn--ghost" href="#/about">Подробнее о платформе</a>
              </div>
            </div>
            <div class="kv">
              ${[['users', 'Команды с ролями', 'Founder, Developer, Designer — роли видно всем, ответственность понятна.'],
                ['calendar', 'Возможности рядом', 'Хакатоны, MUN и олимпиады в одном списке с дедлайнами.'],
                ['award', 'Портфолио само собирается', 'Проекты, достижения и участие копятся в профиле.']]
                .map(([ic, t, d]) => `<div class="tl"><span class="tl__dot">${icon(ic, 'ic--sm')}</span><div><div class="tl__t">${t}</div><div class="tl__s">${d}</div></div></div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>`;
  }

  /* ============================ КАТАЛОГ ПРОЕКТОВ ======================== */
  function renderProjects(root, _arg, params) {
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
          <span class="count" id="p-count"></span>
          <span class="spacer"></span>
          <a class="btn btn--accent btn--sm" href="#/create">${icon('plus', 'ic--sm')}Создать проект</a>
        </div>
        <div class="grid grid--3" id="p-list"></div>
      </div>
    </section>`;

    const list = db.projects.filter((p) => {
      const q = f.q.toLowerCase();
      if (q && !(p.title + ' ' + p.summary + ' ' + p.problem).toLowerCase().includes(q)) return false;
      if (f.cat && p.category !== f.cat) return false;
      if (f.city && p.city !== f.city) return false;
      if (f.skill && !p.skills.includes(f.skill)) return false;
      if (f.stage && p.stage !== f.stage) return false;
      if (f.fmt && p.format !== f.fmt) return false;
      if (f.lang && p.lang !== f.lang) return false;
      if (f.team === '1' && !p.needTeam) return false;
      return true;
    });
    $('#p-count', root).textContent = list.length ? `Найдено ${plural(list.length, 'проект', 'проекта', 'проектов')}` : 'Ничего не найдено';
    $('#p-list', root).innerHTML = list.length ? list.map(projectCard).join('')
      : emptyState('Под фильтры ничего не подошло', 'Попробуй убрать часть условий или поискать по другому слову.',
        '<button class="btn btn--ghost" type="button" data-act="filters-reset">Сбросить фильтры</button>');

    const form = $('[data-form="filters"]', root);
    const body = $('#filters-body', root);
    if (f.cat || f.city || f.skill || f.stage || f.fmt || f.lang || f.team) {
      body.hidden = false;
      $('[data-act="filters-toggle"]', root).setAttribute('aria-expanded', 'true');
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

  /* ============================ СТРАНИЦА ПРОЕКТА ======================== */
  function renderProject(root, id) {
    const p = projectById(id);
    if (!p) return render404(root);
    const owner = userById(p.ownerId);
    const u = me();
    const mine = u && p.ownerId === u.id;
    const inTeam = u && p.members.some((m) => m.userId === u.id);
    const applied = u && db.applications.find((a) => a.projectId === p.id && a.userId === u.id);
    const apps = db.applications.filter((a) => a.projectId === p.id);

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

            ${mine ? teamManager(p, apps) : ''}
          </div>

          <aside class="split__side">
            <div class="card">
              <div class="row" style="flex-wrap:nowrap">
                <a href="#/profile/${owner.username}" aria-label="Профиль: ${esc(owner.name)}">${avatar(owner)}</a>
                <div style="min-width:0">
                  <div class="member__n">${esc(owner.name)}</div>
                  <div class="member__r">Создатель · ${esc(owner.city)}</div>
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
                    : applied ? `<span class="badge badge--${applied.status === 'rejected' ? 'danger' : applied.status === 'accepted' ? 'ok' : 'warn'}" style="width:100%;justify-content:center;padding:12px">Заявка: ${applied.status === 'pending' ? 'на рассмотрении' : applied.status === 'accepted' ? 'принята' : 'отклонена'}</span>`
                      : `<button class="btn btn--primary btn--full" type="button" data-act="apply" data-id="${p.id}">${icon('users')}Подать заявку в команду</button>`}
              </div>
              <p class="field__hint" style="margin-top:10px">Заявка уходит создателю проекта — ответ придёт в уведомления.</p>
            </div>

            <div class="card" style="margin-top:var(--sp-4)">
              <h3 style="font-size:16px;margin-bottom:var(--sp-2)">Команда</h3>
              ${p.members.map((m) => {
                const mu = userById(m.userId);
                return `<div class="member">
                  <a href="#/profile/${mu.username}" aria-label="Профиль: ${esc(mu.name)}">${avatar(mu, 'sm')}</a>
                  <div style="min-width:0"><div class="member__n">${esc(mu.name)}</div><div class="member__r">${esc(m.role)}</div></div>
                </div>`;
              }).join('')}
            </div>

            <button class="btn btn--ghost btn--sm btn--full" style="margin-top:var(--sp-4)" type="button" data-act="report" data-kind="project" data-id="${p.id}">${icon('flag', 'ic--sm')}Пожаловаться</button>
          </aside>
        </div>
      </div>
    </section>`;
  }

  function teamManager(p, apps) {
    const pend = apps.filter((a) => a.status === 'pending');
    return `<div class="card" style="margin-top:var(--sp-5)" data-reveal>
      <div class="sec-hd" style="margin-bottom:var(--sp-4)"><div><h3 style="font-size:20px">Управление командой</h3>
        <p style="font-size:14px">Заявки, роли и состав — видно только тебе как создателю.</p></div></div>

      <h4 style="font-size:15px;margin-bottom:var(--sp-2)">Заявки${pend.length ? ` · ${pend.length}` : ''}</h4>
      ${pend.length ? pend.map((a) => {
        const au = userById(a.userId);
        return `<div class="card card--pad-sm card--flat" style="margin-bottom:var(--sp-3)">
          <div class="row" style="flex-wrap:nowrap;align-items:flex-start">
            ${avatar(au, 'sm')}
            <div style="min-width:0;flex:1">
              <div class="member__n">${esc(au.name)} <span class="member__r">· ${esc(au.city)}</span></div>
              <p style="font-size:14.5px;color:var(--fg-mut);margin-top:4px">${esc(a.message)}</p>
              <div class="row row--tight" style="margin-top:var(--sp-3)">
                <select class="select" style="min-height:38px;max-width:180px;font-size:14px" data-role-for="${a.id}" aria-label="Роль для ${esc(au.name)}">
                  ${D.ROLES.filter((r) => r !== 'Founder').map((r) => `<option>${r}</option>`).join('')}
                </select>
                <button class="btn btn--primary btn--sm" type="button" data-act="app-accept" data-id="${a.id}">${icon('check', 'ic--sm')}Принять</button>
                <button class="btn btn--ghost btn--sm" type="button" data-act="app-reject" data-id="${a.id}">Отклонить</button>
              </div>
            </div>
          </div>
        </div>`;
      }).join('') : '<p class="field__hint">Новых заявок нет.</p>'}

      <h4 style="font-size:15px;margin:var(--sp-5) 0 var(--sp-2)">Состав</h4>
      ${p.members.map((m) => {
        const mu = userById(m.userId);
        const founder = m.userId === p.ownerId;
        return `<div class="member">
          ${avatar(mu, 'sm')}
          <div style="min-width:0;flex:1"><div class="member__n">${esc(mu.name)}</div><div class="member__r">${esc(m.role)}</div></div>
          ${founder ? '<span class="badge">Founder</span>' : `
            <select class="select" style="min-height:38px;max-width:150px;font-size:14px" data-act="member-role" data-project="${p.id}" data-user="${m.userId}" aria-label="Роль: ${esc(mu.name)}">
              ${D.ROLES.filter((r) => r !== 'Founder').map((r) => `<option ${r === m.role ? 'selected' : ''}>${r}</option>`).join('')}
            </select>
            <button class="ib" type="button" data-act="member-remove" data-project="${p.id}" data-user="${m.userId}" aria-label="Удалить ${esc(mu.name)} из команды">${icon('trash', 'ic--sm')}</button>`}
        </div>`;
      }).join('')}
    </div>`;
  }

  /* ============================ СОЗДАНИЕ ПРОЕКТА ======================== */
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

    $('[data-form="create"]', root).addEventListener('submit', (e) => {
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

      const fd = new FormData(form);
      const link = (fd.get('link') || '').toString().trim();
      const p = {
        id: uid('p'),
        title: fd.get('title').toString().trim(),
        summary: fd.get('summary').toString().trim(),
        problem: fd.get('problem').toString().trim(),
        solution: fd.get('solution').toString().trim(),
        goal: (fd.get('goal') || '').toString().trim() || 'Цель ещё формулируется.',
        category: pickerValue(form, 'category')[0],
        skills: pickerValue(form, 'skills'),
        stage: fd.get('stage').toString(),
        teamSize: Math.max(1, Number(fd.get('teamSize')) || 4),
        city: fd.get('city').toString(),
        format: fd.get('format').toString(),
        lang: fd.get('lang').toString(),
        needTeam: fd.get('needTeam') === 'on',
        links: link ? [{ label: 'Ссылка проекта', url: link }] : [],
        ownerId: u.id,
        members: [{ userId: u.id, role: 'Founder' }],
        createdAt: new Date().toISOString().slice(0, 10),
      };
      db.projects.unshift(p);
      save();
      toast('Проект опубликован в каталоге', 'ok');
      go('#/project/' + p.id);
    });
  }

  /* ============================== ЛЮДИ ================================== */
  function renderPeople(root, _arg, params) {
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

        <div class="row" style="margin:var(--sp-5) 0 var(--sp-4)"><span class="count" id="u-count"></span></div>
        <div class="grid grid--3" id="u-list"></div>
      </div>
    </section>`;

    const list = db.users.filter((u) => {
      if (u.blocked) return false;
      const q = f.q.toLowerCase();
      if (q && !(u.name + ' ' + u.school + ' ' + u.city + ' ' + u.username).toLowerCase().includes(q)) return false;
      if (f.skill && !u.skills.includes(f.skill)) return false;
      if (f.city && u.city !== f.city) return false;
      if (f.interest && !u.interests.includes(f.interest)) return false;
      return true;
    });
    $('#u-count', root).textContent = list.length ? `Найдено ${plural(list.length, 'человек', 'человека', 'человек')}` : 'Никого не нашли';
    $('#u-list', root).innerHTML = list.length ? list.map(personCard).join('')
      : emptyState('Под фильтры никто не подошёл', 'Попробуй выбрать другой навык или расширить город.', '<button class="btn btn--ghost" type="button" data-act="filters-reset">Сбросить фильтры</button>');

    $('[data-form="people"]', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const form = e.currentTarget, fd = new FormData(form), next = new URLSearchParams();
      ['q', 'city', 'interest'].forEach((k) => { const v = (fd.get(k) || '').toString().trim(); if (v) next.set(k, v); });
      const sk = pickerValue(form, 'skill')[0]; if (sk) next.set('skill', sk);
      go('#/people' + (next.toString() ? '?' + next.toString() : ''));
    });
  }

  /* ============================ МЕРОПРИЯТИЯ ============================= */
  function renderEvents(root, _arg, params) {
    const type = params.get('type') || '';
    const list = db.events.slice().sort((a, b) => a.date.localeCompare(b.date)).filter((e) => !type || e.type === type);

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

        ${isAdmin() ? `<div class="card" style="margin-bottom:var(--sp-5)">
          <h3 style="font-size:17px;margin-bottom:var(--sp-3)">Добавить мероприятие</h3>${eventForm()}</div>` : ''}

        <div class="grid grid--3" id="e-list">${list.length ? list.map(eventCard).join('')
          : emptyState('Мероприятий этого типа пока нет', 'Загляни позже — календарь пополняется каждую неделю.', '<a class="btn btn--ghost" href="#/events">Показать все</a>')}</div>
      </div>
    </section>`;
    bindEventForm(root);
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
      const fd = new FormData(form);
      const title = fd.get('title').toString().trim();
      db.events.push({
        id: uid('e'), title, org: fd.get('org').toString().trim(),
        date: fd.get('date').toString(), deadline: (fd.get('deadline') || fd.get('date')).toString(),
        place: (fd.get('place') || '—').toString(), format: fd.get('format').toString(), type: fd.get('type').toString(),
        about: (fd.get('about') || '').toString(),
      });
      db.users.forEach((u) => { if (u.id !== db.session) notify(u.id, 'event', `Новое мероприятие: ${title}`, '#/events'); });
      save();
      toast('Мероприятие добавлено', 'ok');
      route(true);
    });
  }

  /* =============================== МЕНТОРЫ ============================== */
  function renderMentors(root) {
    root.innerHTML = `
    <section class="section section--tight">
      <div class="wrap">
        <span class="eyebrow">Наставники</span>
        <h1 style="font-size:clamp(28px,4.4vw,42px);margin:10px 0 var(--sp-2)">Менторы</h1>
        <p style="color:var(--fg-mut);max-width:60ch">Практики, которые разбирают проекты и помогают с исследованием, продуктом и питчем.</p>
        <div class="grid grid--2" style="margin-top:var(--sp-6)" id="m-list">${db.mentors.map(mentorCard).join('')}</div>
      </div>
    </section>`;
  }

  /* ============================== ПРОФИЛЬ =============================== */
  function renderProfile(root, username) {
    const u = db.users.find((x) => x.username === username);
    if (!u) return render404(root);
    const mine = me() && me().id === u.id;
    const projects = db.projects.filter((p) => p.members.some((m) => m.userId === u.id));

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
            ${mine ? '' : `<button class="ib" type="button" data-act="report" data-kind="user" data-id="${u.id}" aria-label="Пожаловаться на профиль">${icon('flag')}</button>`}
          </div>
        </div>

        <div class="grid grid--4" style="margin-top:var(--sp-6)">
          ${[[projects.length, 'Проекты'], [u.achievements.length, 'Достижения'], [u.eventsCount, 'Мероприятия'], [u.skills.length, 'Навыки']]
            .map(([n, l]) => `<div class="card" data-reveal><div class="stat__n" data-count="${n}">0</div><div class="stat__l">${l}</div></div>`).join('')}
        </div>

        <div class="split" style="margin-top:var(--sp-6)">
          <div class="prose">
            <div class="card" data-reveal><h3>О себе</h3><p>${esc(u.bio)}</p></div>
            <div class="card" data-reveal>
              <h3>Проекты</h3>
              ${projects.length ? `<div class="grid grid--2" style="margin-top:var(--sp-4)">${projects.map(projectCard).join('')}</div>`
                : '<p>Пока нет опубликованных проектов.</p>'}
            </div>
            <div class="card" data-reveal>
              <h3>Достижения и участие</h3>
              <div style="margin-top:var(--sp-3)">
                ${u.achievements.length ? u.achievements.map((a) => `<div class="tl"><span class="tl__dot">${icon('award', 'ic--sm')}</span><div><div class="tl__t">${esc(a)}</div></div></div>`).join('')
                  : '<p>Достижения появятся здесь по мере участия в конкурсах и проектах.</p>'}
              </div>
            </div>
          </div>
          <aside class="split__side">
            <div class="card"><h3 style="font-size:16px;margin-bottom:var(--sp-3)">Навыки</h3>
              <div class="row row--tight">${u.skills.map((s) => `<a class="chip" href="#/people?skill=${encodeURIComponent(s)}">${esc(skillRu(s))}</a>`).join('')}</div>
            </div>
            <div class="card" style="margin-top:var(--sp-4)"><h3 style="font-size:16px;margin-bottom:var(--sp-3)">Интересы</h3>
              <div class="row row--tight">${u.interests.map((i) => `<span class="chip">${esc(i)}</span>`).join('')}</div>
            </div>
            <div class="card" style="margin-top:var(--sp-4)"><h3 style="font-size:16px;margin-bottom:var(--sp-3)">Роли в проектах</h3>
              ${projects.length ? projects.map((p) => {
                const r = p.members.find((m) => m.userId === u.id).role;
                return `<div class="member"><div style="min-width:0;flex:1"><div class="member__n">${esc(p.title)}</div><div class="member__r">${esc(r)}</div></div></div>`;
              }).join('') : '<p class="field__hint">Ролей пока нет.</p>'}
            </div>
          </aside>
        </div>
      </div>
    </section>`;
  }

  /* ============================== КАБИНЕТ =============================== */
  function renderDashboard(root, _arg, params) {
    const u = me();
    if (!u) return needAuth(root, 'Кабинет доступен после входа', '#/dashboard');
    const tab = params.get('tab') || 'overview';
    const mp = myProjects(u.id), mt = myTeams(u.id), ma = myApps(u.id);
    const inApps = incomingApps(u.id).filter((a) => a.status === 'pending');
    const notifs = myNotifs(u.id);
    const upcoming = db.events.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);

    const tabs = [
      ['overview', 'Обзор', 0], ['projects', 'Мои проекты', mp.length], ['apps', 'Заявки', ma.length + inApps.length],
      ['teams', 'Команды', mt.length], ['events', 'События', db.events.length], ['notifs', 'Уведомления', notifs.filter((n) => !n.read).length],
    ];

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
          ${tabs.map(([id, t, n]) => `<a class="tab${tab === id ? ' is-on' : ''}" href="#/dashboard?tab=${id}"${tab === id ? ' aria-current="page"' : ''}>${t}${n ? `<span class="n">${n}</span>` : ''}</a>`).join('')}
        </div>

        <div id="dash" style="margin-top:var(--sp-5)"></div>
      </div>
    </section>`;

    const box = $('#dash', root);
    if (tab === 'overview') {
      box.innerHTML = `
        <div class="grid grid--4">
          ${[[mp.length, 'Мои проекты'], [mt.length, 'Команды'], [ma.length, 'Мои заявки'], [inApps.length, 'Входящие заявки']]
            .map(([n, l]) => `<div class="card" data-reveal><div class="stat__n" data-count="${n}">0</div><div class="stat__l">${l}</div></div>`).join('')}
        </div>
        ${inApps.length ? `<div class="card" style="margin-top:var(--sp-5)">
          <h3 style="font-size:18px;margin-bottom:var(--sp-3)">Новые заявки в твои проекты</h3>
          ${inApps.map((a) => appRow(a, true)).join('')}
        </div>` : ''}
        <div class="sec-hd" style="margin-top:var(--sp-7)"><h2 style="font-size:24px">Ближайшие мероприятия</h2></div>
        <div class="grid grid--3">${upcoming.map(eventCard).join('')}</div>`;
    } else if (tab === 'projects') {
      box.innerHTML = mp.length ? `<div class="grid grid--3">${mp.map(projectCard).join('')}</div>`
        : emptyState('У тебя пока нет проектов', 'Оформи идею в проект — это займёт пару минут, а дальше к тебе начнут приходить заявки.', '<a class="btn btn--primary" href="#/create">Создать проект</a>');
    } else if (tab === 'apps') {
      box.innerHTML = `
        <h3 style="font-size:18px;margin-bottom:var(--sp-3)">Входящие заявки</h3>
        ${inApps.length ? inApps.map((a) => appRow(a, true)).join('') : '<p class="field__hint" style="margin-bottom:var(--sp-5)">Новых заявок нет.</p>'}
        <h3 style="font-size:18px;margin:var(--sp-6) 0 var(--sp-3)">Мои заявки</h3>
        ${ma.length ? ma.map((a) => appRow(a, false)).join('')
          : emptyState('Ты ещё никуда не подавал заявку', 'Найди проект по своим навыкам и напиши пару строк о себе.', '<a class="btn btn--primary" href="#/projects">Смотреть проекты</a>')}`;
    } else if (tab === 'teams') {
      box.innerHTML = mt.length ? `<div class="grid grid--3">${mt.map(projectCard).join('')}</div>`
        : emptyState('Ты пока не в команде', 'Подай заявку в проект — или позови людей в свой.', '<a class="btn btn--primary" href="#/projects">Найти проект</a>');
    } else if (tab === 'events') {
      box.innerHTML = `<div class="grid grid--3">${db.events.slice().sort((a, b) => a.date.localeCompare(b.date)).map(eventCard).join('')}</div>`;
    } else {
      box.innerHTML = notifs.length ? `
        <div class="row" style="margin-bottom:var(--sp-4)"><span class="count">${plural(notifs.length, 'уведомление', 'уведомления', 'уведомлений')}</span>
          <span class="spacer"></span><button class="btn btn--ghost btn--sm" type="button" data-act="notif-read-all">Отметить все прочитанными</button></div>
        <div class="grid">${notifs.map((n) => `<div class="notif${n.read ? '' : ' is-new'}">
          <span class="notif__i">${icon(n.type === 'accepted' ? 'check' : n.type === 'rejected' ? 'x' : n.type === 'event' ? 'calendar' : n.type === 'invite' ? 'users' : 'bell', 'ic--sm')}</span>
          <div style="flex:1;min-width:0"><div class="notif__t">${esc(n.text)}</div><div class="notif__d">${esc(dateRu(n.createdAt.slice(0, 10)))}</div></div>
          ${n.href ? `<a class="btn btn--soft btn--sm" href="${esc(n.href)}">Открыть</a>` : ''}
        </div>`).join('')}</div>`
        : emptyState('Уведомлений пока нет', 'Здесь появятся заявки в твои проекты, ответы на твои заявки и новые мероприятия.', '');
      if (notifs.some((n) => !n.read)) {
        db.notifications.forEach((n) => { if (n.userId === u.id) n.read = true; });
        save();
        $('#bell-dot').hidden = true;
      }
    }
    M.counters(box);
  }

  function appRow(a, incoming) {
    const p = projectById(a.projectId);
    const who = userById(a.userId);
    const st = { pending: ['badge--warn', 'На рассмотрении'], accepted: ['badge--ok', 'Принята'], rejected: ['badge--danger', 'Отклонена'] }[a.status];
    return `<div class="card card--pad-sm" style="margin-bottom:var(--sp-3)">
      <div class="row" style="flex-wrap:nowrap;align-items:flex-start">
        ${incoming ? avatar(who, 'sm') : ''}
        <div style="min-width:0;flex:1">
          <div class="member__n">${incoming ? esc(who.name) + ' → ' : ''}<a href="#/project/${a.projectId}">${esc(p ? p.title : 'Проект удалён')}</a></div>
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

  /* ============================ АВТОРИЗАЦИЯ ============================= */
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
            <p class="field__hint" style="margin-bottom:10px"><b>Демо-режим.</b> Это прототип: данные хранятся только в твоём браузере, пароль не сохраняется.</p>
            <div class="row row--tight">
              <button class="btn btn--soft btn--sm" type="button" data-act="demo-login" data-id="u1">Войти как Ала (админ)</button>
              <button class="btn btn--soft btn--sm" type="button" data-act="demo-login" data-id="u3">Войти как Айгерим</button>
              <button class="btn btn--ghost btn--sm" type="button" data-act="db-reset">Сбросить демо-данные</button>
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
      $('[data-form="login"]', body).addEventListener('submit', (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        if (!validate(form, { login: required('Введите email или username'), password: minLen(6, 'Пароль от 6 символов') })) return;
        const v = new FormData(form).get('login').toString().trim().toLowerCase();
        const user = db.users.find((x) => x.username.toLowerCase() === v || (x.email || '').toLowerCase() === v);
        if (!user) { fieldError(form, 'login', 'Аккаунт не найден. Можно войти через демо-аккаунт ниже.'); toast('Аккаунт не найден', 'err'); return; }
        if (user.blocked) { toast('Аккаунт заблокирован администрацией', 'err'); return; }
        db.session = user.id; save();
        toast(`Привет, ${user.name.split(' ')[0]}!`, 'ok');
        go(next);
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
    body.addEventListener('submit', (e) => {
      const form = e.target.closest('[data-form="signup"]');
      if (!form) return;
      e.preventDefault();
      const step = Number(form.dataset.step);
      const fd = new FormData(form);

      if (step === 1) {
        const ok = validate(form, {
          name: required('Введите имя и фамилию'),
          username: (v) => (!v ? 'Придумайте username' : !/^[a-z0-9_]{3,20}$/i.test(v) ? 'Только латиница, цифры и _, 3–20 символов'
            : db.users.some((u) => u.username.toLowerCase() === v.toLowerCase()) ? 'Такой username уже занят' : ''),
          email: (v) => (!v ? 'Введите email' : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? '' : 'Проверьте формат email'),
          password: minLen(8, 'Минимум 8 символов'),
        });
        if (!ok) return;
        Object.assign(signupState, { name: fd.get('name').toString().trim(), username: fd.get('username').toString().trim(), email: fd.get('email').toString().trim() });
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
        const u = {
          id: uid('u'), username: signupState.username, email: signupState.email, name: signupState.name,
          city: signupState.city || 'Алматы', school: signupState.school, grade: signupState.grade,
          bio: (fd.get('bio') || '').toString().trim() || 'Пока без описания — скоро расскажу о себе.',
          interests: pickerValue(form, 'interests'), skills: pickerValue(form, 'skills'),
          achievements: [], eventsCount: 0, role: 'Участник', joined: new Date().toISOString().slice(0, 10),
        };
        db.users.unshift(u);
        db.session = u.id;
        notify(u.id, 'welcome', 'Добро пожаловать в BASTAU! Создай первый проект или найди команду.', '#/projects');
        save();
        toast('Профиль создан', 'ok');
        go(next);
      }
    });
    body.addEventListener('click', (e) => {
      if (!e.target.closest('[data-act="signup-back"]')) return;
      const step = Number($('[data-form="signup"]', body).dataset.step);
      body.innerHTML = signupStep(step - 1, signupState);
    });
  }

  /* ============================ АДМИН-ПАНЕЛЬ ============================ */
  function renderAdmin(root, _arg, params) {
    if (!isAdmin()) {
      root.innerHTML = `<section class="section"><div class="wrap wrap--narrow">
        ${emptyState('Доступ только для администрации', 'Войди под аккаунтом администратора, чтобы модерировать контент.',
        '<div class="row" style="justify-content:center"><button class="btn btn--primary" type="button" data-act="demo-login" data-id="u1">Войти как админ (демо)</button><a class="btn btn--ghost" href="#/">На главную</a></div>')}
      </div></section>`;
      return;
    }
    const tab = params.get('tab') || 'users';
    const tabs = [['users', 'Пользователи', db.users.length], ['projects', 'Проекты', db.projects.length], ['events', 'Мероприятия', db.events.length], ['reports', 'Жалобы', db.reports.length]];

    root.innerHTML = `
    <section class="section section--tight">
      <div class="wrap">
        <span class="eyebrow">Администрирование</span>
        <h1 style="font-size:clamp(26px,4vw,38px);margin:10px 0 var(--sp-2)">Админ-панель</h1>
        <p style="color:var(--fg-mut)">Модерация пользователей, проектов, мероприятий и жалоб.</p>
        <div class="tabs" style="margin-top:var(--sp-5)">
          ${tabs.map(([id, t, n]) => `<a class="tab${tab === id ? ' is-on' : ''}" href="#/admin?tab=${id}"${tab === id ? ' aria-current="page"' : ''}>${t}<span class="n">${n}</span></a>`).join('')}
        </div>
        <div id="adm" style="margin-top:var(--sp-5)"></div>
      </div>
    </section>`;

    const box = $('#adm', root);
    if (tab === 'users') {
      box.innerHTML = `<div class="tablewrap"><table>
        <caption class="sr">Пользователи платформы</caption>
        <thead><tr><th>Пользователь</th><th>Город</th><th>Школа</th><th>Проекты</th><th>Статус</th><th>Действия</th></tr></thead>
        <tbody>${db.users.map((u) => `<tr>
          <td><div class="row" style="flex-wrap:nowrap">${avatar(u, 'sm')}<div><div class="member__n">${esc(u.name)}</div><div class="member__r">@${esc(u.username)}</div></div></div></td>
          <td>${esc(u.city)}</td><td>${esc(u.school)}</td>
          <td class="num">${db.projects.filter((p) => p.members.some((m) => m.userId === u.id)).length}</td>
          <td>${u.blocked ? '<span class="badge badge--danger">Заблокирован</span>' : '<span class="badge badge--ok">Активен</span>'}</td>
          <td><div class="row row--tight" style="flex-wrap:nowrap">
            <a class="btn btn--ghost btn--sm" href="#/profile/${u.username}">Открыть</a>
            <button class="btn btn--${u.blocked ? 'soft' : 'danger'} btn--sm" type="button" data-act="admin-block" data-id="${u.id}">${u.blocked ? 'Разблокировать' : 'Заблокировать'}</button>
          </div></td></tr>`).join('')}</tbody></table></div>`;
    } else if (tab === 'projects') {
      box.innerHTML = `<div class="tablewrap"><table>
        <caption class="sr">Проекты платформы</caption>
        <thead><tr><th>Проект</th><th>Автор</th><th>Категория</th><th>Стадия</th><th>Команда</th><th>Действия</th></tr></thead>
        <tbody>${db.projects.map((p) => `<tr>
          <td><div class="member__n">${esc(p.title)}</div><div class="member__r">${esc(dateRu(p.createdAt))}</div></td>
          <td>${esc(userById(p.ownerId).name)}</td>
          <td><span class="badge badge--cat cat" data-cat="${esc(p.category)}">${esc(catRu(p.category))}</span></td>
          <td><select class="select" style="min-height:38px;font-size:14px;max-width:150px" data-act="admin-stage" data-id="${p.id}" aria-label="Стадия проекта ${esc(p.title)}">
              ${D.STAGES.map((s) => `<option value="${s.id}" ${s.id === p.stage ? 'selected' : ''}>${s.ru}</option>`).join('')}
            </select></td>
          <td class="num">${p.members.length} / ${p.teamSize}</td>
          <td><div class="row row--tight" style="flex-wrap:nowrap">
            <a class="btn btn--ghost btn--sm" href="#/project/${p.id}">Открыть</a>
            <button class="btn btn--danger btn--sm" type="button" data-act="admin-project-del" data-id="${p.id}" aria-label="Удалить проект ${esc(p.title)}">${icon('trash', 'ic--sm')}</button>
          </div></td></tr>`).join('')}</tbody></table></div>`;
    } else if (tab === 'events') {
      box.innerHTML = `<div class="card" style="margin-bottom:var(--sp-5)"><h3 style="font-size:17px;margin-bottom:var(--sp-3)">Добавить мероприятие</h3>${eventForm()}</div>
        <div class="grid grid--3">${db.events.map(eventCard).join('')}</div>`;
      bindEventForm(box);
    } else {
      box.innerHTML = db.reports.length ? `<div class="tablewrap"><table>
        <caption class="sr">Поступившие жалобы</caption>
        <thead><tr><th>Объект</th><th>Причина</th><th>Комментарий</th><th>Дата</th><th>Действие</th></tr></thead>
        <tbody>${db.reports.map((r) => `<tr>
          <td>${r.targetType === 'project' ? `<a href="#/project/${r.targetId}">${esc((projectById(r.targetId) || {}).title || 'Проект удалён')}</a>` : esc(userById(r.targetId).name)}</td>
          <td>${esc(label(D.REPORT_REASONS, r.reason))}</td>
          <td>${esc(r.note || '—')}</td>
          <td>${esc(dateRu(r.createdAt.slice(0, 10)))}</td>
          <td><button class="btn btn--soft btn--sm" type="button" data-act="admin-report-done" data-id="${r.id}">Рассмотрено</button></td>
        </tr>`).join('')}</tbody></table></div>`
        : emptyState('Жалоб нет', 'Когда пользователи пожалуются на профиль или проект, обращения появятся здесь.', '');
    }
  }

  /* =============================== О BASTAU ============================= */
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

  /* ============================== Действия ============================== */
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
    const mine = myProjects(u.id);
    if (!mine.length) { toast('Сначала создай проект, чтобы приглашать людей', 'err'); return; }
    const target = userById(userId);
    openSheet('Пригласить: ' + target.name, `
      <form class="form" data-form="invite" novalidate>
        <div class="field"><label for="iv-p">Проект</label>
          <select class="select" id="iv-p" name="project">${mine.map((p) => `<option value="${p.id}">${esc(p.title)}</option>`).join('')}</select></div>
        <div class="field"><label for="iv-r">Роль</label>
          <select class="select" id="iv-r" name="role">${D.ROLES.filter((r) => r !== 'Founder').map((r) => `<option>${r}</option>`).join('')}</select></div>
        <div class="row" style="justify-content:flex-end">
          <button class="btn btn--ghost" type="button" data-act="sheet-close">Отмена</button>
          <button class="btn btn--primary" type="submit">Отправить приглашение</button>
        </div>
      </form>`, (box) => {
      $('[data-form="invite"]', box).addEventListener('submit', (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const p = projectById(fd.get('project').toString());
        notify(userId, 'invite', `${u.name} приглашает тебя в проект «${p.title}» на роль ${fd.get('role')}`, '#/project/' + p.id);
        save();
        closeSheet();
        toast('Приглашение отправлено', 'ok');
      });
    });
  }

  function actPortfolio(userId) {
    const u = userById(userId);
    const projects = db.projects.filter((p) => p.members.some((m) => m.userId === u.id));
    openSheet('Портфолио · ' + u.name, `
      <div class="kv">
        <span class="kv__i">${icon('user', 'ic--sm')}<span><b>${esc(u.name)}</b> · @${esc(u.username)}</span></span>
        <span class="kv__i">${icon('case', 'ic--sm')}<span>${esc(u.school)} · ${esc(u.grade)} · ${esc(u.city)}</span></span>
      </div>
      <h3 style="font-size:16px;margin:var(--sp-5) 0 var(--sp-2)">Проекты (${projects.length})</h3>
      ${projects.length ? projects.map((p) => `<div class="member"><div style="flex:1;min-width:0">
        <div class="member__n">${esc(p.title)} · ${esc(catRu(p.category))}</div>
        <div class="member__r">${esc(p.members.find((m) => m.userId === u.id).role)} · ${esc(stageRu(p.stage))}</div></div></div>`).join('')
        : '<p class="field__hint">Проектов пока нет.</p>'}
      <h3 style="font-size:16px;margin:var(--sp-5) 0 var(--sp-2)">Достижения (${u.achievements.length})</h3>
      ${u.achievements.length ? u.achievements.map((a) => `<div class="member"><div class="member__n">${esc(a)}</div></div>`).join('') : '<p class="field__hint">Достижений пока нет.</p>'}
      <p class="field__hint" style="margin-top:var(--sp-4)">Участие в мероприятиях: ${u.eventsCount}</p>
      <div class="row" style="justify-content:flex-end;margin-top:var(--sp-5)">
        <button class="btn btn--ghost" type="button" data-act="sheet-close">Закрыть</button>
        <button class="btn btn--primary" type="button" data-act="portfolio-print">Сохранить как PDF</button>
      </div>`);
  }

  function actEventOpen(id) {
    const e = db.events.find((x) => x.id === id);
    if (!e) return;
    const left = daysLeft(e.deadline);
    openSheet(e.title, `
      <div class="row row--tight" style="margin-bottom:var(--sp-4)">
        <span class="badge badge--stage">${esc(evtRu(e.type))}</span>
        <span class="badge">${esc(fmtRu(e.format))}</span>
        <span class="badge ${left < 0 ? '' : left <= 7 ? 'badge--warn' : 'badge--ok'}">${left < 0 ? 'Регистрация закрыта' : 'Дедлайн ' + esc(dateRu(e.deadline))}</span>
      </div>
      <p style="color:var(--fg-mut)">${esc(e.about || '')}</p>
      <div class="kv" style="margin-top:var(--sp-4)">
        <span class="kv__i">${icon('calendar', 'ic--sm')}<span><b>${esc(dateRu(e.date))}</b></span></span>
        <span class="kv__i">${icon('pin', 'ic--sm')}<span>${esc(e.place)}</span></span>
        <span class="kv__i">${icon('flag', 'ic--sm')}<span>${esc(e.org)}</span></span>
      </div>
      <div class="row" style="justify-content:flex-end;margin-top:var(--sp-5)">
        <button class="btn btn--ghost" type="button" data-act="sheet-close">Закрыть</button>
        <button class="btn btn--primary" type="button" data-act="event-join" data-id="${e.id}">Участвовать</button>
      </div>`);
  }

  /* ========================= Делегирование событий ====================== */
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

  /* ============================== Запуск ================================ */
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
