/* BASTAU - Projects catalog page */

import { icon, esc, skillRu, $, plural } from '../lib/utils.js';

import { D, M } from '../global/globals.js';
import { chipPicker, pickerValue } from '../global/forms.js';
import { projectCard, emptyState } from '../global/components.js';
import { go } from './router.js';

/* Projects list */
export async function renderProjects(root, _arg, params) {
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
