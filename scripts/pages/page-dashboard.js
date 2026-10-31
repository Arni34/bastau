/* BASTAU - Dashboard page */

import { esc, icon, $, dateRu } from '../lib/utils.js';
import { me, userById } from '../lib/session.js';

import { M, D } from '../global/globals.js';
import { avatar, eventCard, projectCard, emptyState } from '../global/components.js';
import { needAuth } from './page-misc.js';
import { toast } from '../global/modals.js';

/* Dashboard */
export async function renderDashboard(root, _arg, params) {
  const u = me();

  if (!u) {
    return needAuth(root, 'Кабинет доступен после входа', '#/dashboard');
  }

  const tab = params.get('tab') || 'overview';

  root.innerHTML = `
    <section class="section section--tight">
      <div class="wrap">

        <div class="row" style="justify-content: space-between;">
          <div class="row" style="flex-wrap: nowrap;">
            ${avatar(u, 'lg')}
            <div>
              <span class="eyebrow">Личный кабинет</span>
              <h1 style="font-size: clamp(24px, 3.6vw, 34px); margin-top: 6px;">
                Привет, ${esc(u.name.split(' ')[0])}
              </h1>
              <p style="color: var(--fg-mut);">
                ${esc(u.school)} · ${esc(u.city)}
              </p>
            </div>
          </div>

          <div class="row" style="gap: var(--sp-2);">
            <a class="btn btn--accent" href="#/create">
              ${icon('plus', 'ic--sm')}Создать проект
            </a>
            <a class="btn btn--ghost" href="#/profile/${u.username}">
              Мой профиль
            </a>
          </div>
        </div>

        <div class="tabs" style="margin-top: var(--sp-6); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--sp-3);">
          <div class="row" style="gap: var(--sp-2);">
            <a class="tab${tab === 'overview' ? ' is-on' : ''}" href="#/dashboard?tab=overview">
              Обзор
            </a>
            <a class="tab${tab === 'projects' ? ' is-on' : ''}" href="#/dashboard?tab=projects">
              Мои проекты
            </a>
            <a class="tab${tab === 'events' ? ' is-on' : ''}" href="#/dashboard?tab=events">
              События
            </a>
            <a class="tab${tab === 'notifications' ? ' is-on' : ''}" href="#/dashboard?tab=notifications" id="notif-tab-link">
              Уведомления
            </a>
          </div>
        </div>

        <div id="dash" style="margin-top: var(--sp-5);">
          <p>Загрузка кабинета...</p>
        </div>

      </div>
    </section>
  `;

  const box = $('#dash', root);

  try {
    const [resProj, resEvt, resNotif] = await Promise.all([
      fetch('/api/projects'),
      fetch('/api/events'),
      fetch(`/api/notifications?user_id=${u.id}`).catch(() => ({ ok: false }))
    ]);

    const projects = await resProj.json();
    const events = await resEvt.json();
    let notifications = resNotif.ok ? await resNotif.json() : [];

    if (!Array.isArray(notifications)) {
      notifications = [];
    }

    const mp = projects.filter(
      (p) => p.owner_id === u.id || (p.members || []).some((m) => m.userId === u.id)
    );

    const unreadCount = notifications.filter((n) => !n.read).length;

    const notifTab = $('#notif-tab-link', root);
    if (notifTab && unreadCount > 0) {
      notifTab.innerHTML = `
        Уведомления 
        <span class="badge badge--warn" style="margin-left: 6px; font-size: 11px; padding: 1px 6px;">
          ${unreadCount}
        </span>
      `;
    }

    if (tab === 'overview') {
      box.innerHTML = `
        <div class="grid grid--4">
          <div class="card" data-reveal>
            <div class="stat__n" data-count="${mp.length}">${mp.length}</div>
            <div class="stat__l">Мои проекты</div>
          </div>
          <div class="card" data-reveal>
            <div class="stat__n" data-count="${events.length}">${events.length}</div>
            <div class="stat__l">Мероприятия</div>
          </div>
        </div>

        <div class="sec-hd" style="margin-top: var(--sp-7);">
          <h2 style="font-size: 24px;">Ближайшие мероприятия</h2>
        </div>

        <div class="grid grid--3">
          ${events.slice(0, 3).map(eventCard).join('')}
        </div>
      `;
    }
    else if (tab === 'projects') {
      box.innerHTML = mp.length
        ? `<div class="grid grid--3">${mp.map(projectCard).join('')}</div>`
        : emptyState(
            'У тебя пока нет проектов',
            'Оформи идею в проект — это займёт пару минут.',
            '<a class="btn btn--primary" href="#/create">Создать проект</a>'
          );
    }
    else if (tab === 'events') {
      box.innerHTML = `
        <div class="grid grid--3">
          ${events.map(eventCard).join('')}
        </div>
      `;
    }
    else if (tab === 'notifications') {
      const renderNotificationsList = () => {
        if (notifications.length === 0) {
          return emptyState(
            'Нет уведомлений',
            'Здесь будут появляться системные уведомления и новости.',
            ''
          );
        }

        const itemsHtml = notifications.map((n) => {
          const cardStyle = `
            padding: var(--sp-4);
            border-left: 4px solid ${n.read ? 'var(--border)' : 'var(--accent, #3b82f6)'};
            background: ${n.read ? 'var(--bg)' : 'var(--bg-subtle, rgba(59, 130, 246, 0.03))'};
          `;

          const actionHtml = !n.read
            ? `<button class="btn btn--sm btn--ghost" data-act="mark-read" data-id="${n.id}" style="white-space: nowrap;">
                 Прочитано
               </button>`
            : `<span class="badge" style="font-size: 11px;">
                 Просмотрено
               </span>`;

          return `
            <div class="card" style="${cardStyle}">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: var(--sp-3);">
                <div>
                  <div style="font-weight: 600; font-size: 16px; color: var(--fg); margin-bottom: 4px;">
                    ${esc(n.header)}
                  </div>
                  <div style="font-size: 14px; color: var(--fg-mut); line-height: 1.5;">
                    ${esc(n.content)}
                  </div>
                  <div style="font-size: 12px; color: var(--fg-mut); margin-top: 8px;">
                    ${n.created_at ? esc(dateRu(n.created_at)) : ''}
                  </div>
                </div>
                ${actionHtml}
              </div>
            </div>
          `;
        }).join('');

        return `
          <div style="display: flex; flex-direction: column; gap: var(--sp-3);">
            ${itemsHtml}
          </div>
        `;
      };

      box.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--sp-4);">
          <h2 style="font-size: 20px; margin: 0;">Ваши уведомления</h2>
          ${
            notifications.length > 0 && unreadCount > 0
              ? `<button class="btn btn--sm btn--ghost" id="mark-all-read">Прочитать все</button>`
              : ''
          }
        </div>
        ${renderNotificationsList()}
      `;

      box.querySelectorAll('[data-act="mark-read"]').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const id = btn.dataset.id;
          try {
            const res = await fetch(`/api/notifications/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ read: true })
            });

            if (res.ok) {
              toast('Уведомление отмечено как прочитанное', 'ok');
              renderDashboard(root, _arg, params);
            } else {
              toast('Не удалось обновить статус', 'err');
            }
          } catch (e) {
            toast('Ошибка сети', 'err');
          }
        });
      });

      const markAllBtn = $('#mark-all-read', box);
      if (markAllBtn) {
        markAllBtn.addEventListener('click', async () => {
          try {
            const res = await fetch('/api/notifications/read-all', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: u.id })
            });

            if (res.ok) {
              toast('Все уведомления прочитаны', 'ok');
              renderDashboard(root, _arg, params);
            } else {
              toast('Ошибка при обновлении', 'err');
            }
          } catch (e) {
            toast('Ошибка сети', 'err');
          }
        });
      }
    }

    if (M && M.counters) {
      M.counters(box);
    }
  } catch (err) {
    console.error(err);
    box.innerHTML = '<p>Ошибка загрузки данных кабинета.</p>';
  }
}

function appRow(a, incoming) {
  const p = { title: 'Проект' };
  const who = userById(a.userId);

  const statusMap = {
    pending: ['badge--warn', 'На рассмотрении'],
    accepted: ['badge--ok', 'Принята'],
    rejected: ['badge--danger', 'Отклонена']
  };

  const st = statusMap[a.status] || ['badge', 'Неизвестно'];

  const roleOptionsHtml = D.ROLES
    .filter((r) => r !== 'Founder')
    .map((r) => `<option>${r}</option>`)
    .join('');

  const actionsHtml = incoming && a.status === 'pending'
    ? `
      <select class="select" style="min-height: 38px; max-width: 170px; font-size: 14px;" data-role-for="${a.id}" aria-label="Роль для ${esc(who.name)}">
        ${roleOptionsHtml}
      </select>
      <button class="btn btn--primary btn--sm" type="button" data-act="app-accept" data-id="${a.id}">
        Принять
      </button>
      <button class="btn btn--ghost btn--sm" type="button" data-act="app-reject" data-id="${a.id}">
        Отклонить
      </button>
    `
    : '';

  return `
    <div class="card card--pad-sm" style="margin-bottom: var(--sp-3);">
      <div class="row" style="flex-wrap: nowrap; align-items: flex-start;">
        ${incoming ? avatar(who, 'sm') : ''}
        
        <div style="min-width: 0; flex: 1;">
          <div class="member__n">
            ${incoming ? esc(who.name) + ' → ' : ''}
            <a href="#/project/${a.projectId}">${esc(p.title)}</a>
          </div>

          <p style="font-size: 14.5px; color: var(--fg-mut); margin-top: 4px;">
            ${esc(a.message)}
          </p>

          <div class="row row--tight" style="margin-top: var(--sp-3);">
            <span class="badge ${st[0]}">${st[1]}</span>
            <span class="badge">${esc(dateRu(a.createdAt))}</span>
            ${actionsHtml}
          </div>
        </div>
      </div>
    </div>
  `;
}