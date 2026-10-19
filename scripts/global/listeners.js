/* BASTAU - Global click / change / keydown handlers */

import { $, stageRu } from '../lib/utils.js';
import { projectById, userById, notify, me, setSession } from '../lib/session.js';

import { M } from './globals.js';
import { closeSheet, confirmSheet, toast, openSheet } from './modals.js';
import { route, go } from '../pages/router.js';
import {
  actApply, actAccept, actReject, actReport, actInvite, actPortfolio, actEventOpen
} from './actions.js';

document.addEventListener('click', async (e) => {
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
      confirmSheet('Удалить участника?', `${ru?.name || 'Пользователь'} потеряет доступ к команде проекта «${p?.title || ''}». Отменить это нельзя.`, 'Удалить', async () => {
        try {
          const res = await fetch(`/api/projects/${pid}/members/${uidv}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Не удалось удалить участника');
          toast('Участник удалён', 'ok');
          route(true);
        } catch (err) {
          toast(err.message, 'err');
        }
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
      toast('Запрос менторства отправлен', 'ok');
      return;
    }
    
    if (act === 'demo-login') {
      return;
    }
    
    if (act === 'logout') { 
      setSession(null);
      closeSheet(); 
      toast('Вы вышли из аккаунта', 'ok'); 
      go('#/'); 
      route(true);
      return; 
    }

    if (act === 'db-reset') {
      confirmSheet('Сбросить данные?', 'Все локальные данные будут очищены.', 'Сбросить', () => {
        localStorage.clear();
        sessionStorage.clear();
        setSession(null);
        toast('Данные сброшены', 'ok'); 
        go('#/'); 
        route(true);
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
      try {
        await fetch(`/api/notifications/read-all`, { method: 'POST' });
        route(true);
      } catch (err) {
        toast('Ошибка обновления уведомлений', 'err');
      }
      return;
    }

    if (act === 'admin-block') {
      confirmSheet('Изменить статус блокировки?', 'Пользователь потеряет или восстановит доступ.', 'Подтвердить', async () => {
        try {
          const res = await fetch(`/api/admin/users/${id}/block`, { method: 'POST' });
          if (!res.ok) throw new Error('Ошибка запроса');
          toast('Статус пользователя изменён', 'ok');
          route(true);
        } catch (err) {
          toast(err.message, 'err');
        }
      });
      return;
    }

    if (act === 'admin-project-del') {
      confirmSheet('Удалить проект?', `Проект и все заявки к нему будут удалены безвозвратно.`, 'Удалить проект', async () => {
        try {
          const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Не удалось удалить проект');
          toast('Проект удалён', 'ok');
          route(true);
        } catch (err) {
          toast(err.message, 'err');
        }
      });
      return;
    }

    if (act === 'admin-event-del') {
      confirmSheet('Удалить мероприятие?', `Мероприятие исчезнет из календаря.`, 'Удалить', async () => {
        try {
          const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
          if (!res.ok) throw new Error('Не удалось удалить мероприятие');
          toast('Мероприятие удалено', 'ok');
          route(true);
        } catch (err) {
          toast(err.message, 'err');
        }
      });
      return;
    }

    if (act === 'admin-report-done') {
      try {
        await fetch(`/api/admin/reports/${id}`, { method: 'DELETE' });
        toast('Жалоба закрыта', 'ok'); 
        route(true);
      } catch (err) {
        toast('Ошибка', 'err');
      }
      return;
    }
  }

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

document.addEventListener('change', async (e) => {
  const sel = e.target.closest('select[data-act]');
  if (!sel) return;
  
  if (sel.dataset.act === 'member-role') {
    const pid = sel.dataset.project;
    const uid = sel.dataset.user;
    const newRole = sel.value;
    try {
      await fetch(`/api/projects/${pid}/members/${uid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });
      toast(`Роль обновлена: ${newRole}`, 'ok');
    } catch (err) {
      toast('Ошибка обновления роли', 'err');
    }
  }
  
  if (sel.dataset.act === 'admin-stage') {
    const id = sel.dataset.id;
    const newStage = sel.value;
    try {
      await fetch(`/api/projects/${id}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage: newStage })
      });
      toast(`Стадия обновлена: ${stageRu(newStage)}`, 'ok');
    } catch (err) {
      toast('Ошибка обновления стадии', 'err');
    }
  }
});

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });