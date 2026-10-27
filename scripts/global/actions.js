/* BASTAU - User actions */

import {
  esc, skillRu, $, uid, icon, catRu, stageRu, daysLeft, evtRu, fmtRu, dateRu
} from '../lib/utils.js';

import { D } from './globals.js';
import { me, projectById, notify } from '../lib/session.js';
import { openSheet, closeSheet, toast } from './modals.js';
import { validate, minLen } from './forms.js';
import { go, route } from '../pages/router.js';

export function actApply(projectId) {
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

export function actAccept(appId, role) {
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

export function actReject(appId) {
  const a = db.applications.find((x) => x.id === appId);
  if (!a) return;
  const p = projectById(a.projectId);
  a.status = 'rejected';
  notify(a.userId, 'rejected', `Заявка в «${p ? p.title : 'проект'}» отклонена. Попробуй другие проекты — их много.`, '#/projects');
  save();
  toast('Заявка отклонена');
  route(true);
}

export function actReport(kind, id) {
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

export function actInvite(userId) {
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

export function actPortfolio(userId) {
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

export function actEventOpen(id) {
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
        const titleEl = sheetEl.querySelector('#sheet-ttl');
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

export function actAskMentor(id) {
  const u = me();
  if (!u) { go('#/auth'); return; }

  const btn = document.querySelector(`[data-act="mentor-ask"][data-id="${id}"]`);
  const email = btn ? btn.dataset.email : '';

  if (!email) {
    toast('У наставника не указан email для связи', 'error');
    return;
  }

  console.log(`Отправлено на ${email}: Запрос на наставничество от пользователя ${u.username || u.email}`);
  toast('Запрос на наставничество успешно отправлен наставнику!', 'ok');
}