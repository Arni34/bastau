/* BASTAU - Create project page */

import { skillRu, icon, $ } from '../lib/utils.js';
import { me } from '../lib/session.js';

import { D } from '../global/globals.js';
import { toast } from '../global/modals.js';
import { chipPicker, pickerValue, validate, required, minLen } from '../global/forms.js';
import { go } from '../pages/router.js';
import { needAuth } from './page-misc.js';

/* Create a project */
export function renderCreate(root) {
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
      category: (v) => (pickerValue(form, 'category').length ? '' : 'Выберите категорию'),
      skills: (v) => (pickerValue(form, 'skills').length ? '' : 'Отметьте хотя бы один навык'),
    });

    if (!ok) {
      toast('Проверьте выделенные поля', 'err');
      return;
    }

    const fd = new FormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    const payload = {
      title: fd.get('title').toString(),
      summary: fd.get('summary').toString(),
      problem: fd.get('problem').toString(),
      solution: fd.get('solution').toString(),
      goal: (fd.get('goal') || '').toString(),
      category: pickerValue(form, 'category')[0] || 'Technology',
      skills: pickerValue(form, 'skills'),
      stage: fd.get('stage').toString(),
      teamSize: fd.get('teamSize').toString(),
      city: fd.get('city').toString(),
      format: fd.get('format').toString(),
      lang: fd.get('lang').toString(),
      link: (fd.get('link') || '').toString(),
      needTeam: fd.get('needTeam') !== null,
      owner_id: u.id // <--- ИСПРАВЛЕНО: передаём owner_id
    };

    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error || 'Ошибка публикации проекта', 'err');
        if (submitBtn) submitBtn.disabled = false;
        return;
      }

      toast('Проект успешно опубликован!', 'ok');
      go('#/projects');
    } catch (err) {
      console.error(err);
      toast('Ошибка соединения с сервером', 'err');
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}