/* BASTAU - Admin panel page */

import { icon, $ } from '../lib/utils.js';
import { isAdmin } from '../lib/session.js';

import { D } from '../global/globals.js';
import { toast } from '../global/modals.js';
import { validate, required } from '../global/forms.js';
import { emptyState } from '../global/components.js';

/* Admin Panel Stub */
export function renderAdmin(root, _arg, params) {
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
    toast('Функция добавления через API в разработке', 'info');//DEMO
  });
}
