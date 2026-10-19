/* BASTAU - Events + mentors pages */

import { esc, $ } from '../lib/utils.js';

import { D, M } from '../global/globals.js';
import { eventCard, emptyState, mentorCard } from '../global/components.js';

/* Events */
export async function renderEvents(root, _arg, params) {
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
export async function renderMentors(root) {
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
