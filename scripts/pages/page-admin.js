// BASTAU - Admin panel page //

import { icon, $, esc, dateRu } from '../lib/utils.js';
import { me } from '../lib/session.js';
import { D } from '../global/globals.js';
import { toast } from '../global/modals.js';
import { validate, required } from '../global/forms.js';

/* === PAGE === */

export async function renderAdmin(root, _arg, params) {
  root.innerHTML = `
    <section class="section section--tight">
      <div class="wrap">
        <span class="eyebrow">Администрирование</span>
        <h1 style="font-size:clamp(26px,4vw,38px);margin:10px 0 var(--sp-2)">Панель управления</h1>
        
        <div class="tabs" style="margin:var(--sp-5) 0 var(--sp-6)">
          <button class="tab is-on" data-tab="events">Мероприятия</button>
          <button class="tab" data-tab="mentors">Менторы</button>
          <button class="tab" data-tab="projects">Проекты</button>
          <button class="tab" data-tab="users">Пользователи</button>
        </div>

        <div id="admin-content">
          <div class="wrap" style="padding:var(--sp-4) 0"><p>Загрузка данных панели...</p></div>
        </div>
      </div>
    </section>`;

  const content = $('#admin-content', root);
  const tabs = root.querySelectorAll('[data-tab]');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-on'));
      tab.classList.add('is-on');
      const target = tab.dataset.tab;
      if (target === 'events') loadEventsSection(content);
      if (target === 'mentors') loadMentorsSection(content);
      if (target === 'projects') loadProjectsSection(content);
      if (target === 'users') loadUsersSection(content);
    });
  });

  loadEventsSection(content);
}

/* === SECTIONS === */

async function loadEventsSection(container) {
  /* --- Events section --- */
  let events = [];
  try {
    const res = await fetch('/api/events');
    if (res.ok) events = await res.json();
  } catch (e) {
    console.error(e);
  }

  container.innerHTML = `
    <div class="grid-2" style="align-items:start;gap:var(--sp-6)">
      <div>
        <h2 style="font-size:20px;margin-bottom:var(--sp-4)">Добавить мероприятие</h2>
        ${eventForm()}
      </div>
      <div>
        <h3 style="font-size:18px;margin-bottom:var(--sp-3)">Все мероприятия (${events.length})</h3>
        <div class="prose">
          ${events.length === 0 ? '<p style="color:var(--fg-mut)">Нет мероприятий</p>' : ''}
          ${events.map(ev => `
            <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:var(--sp-3) var(--sp-4)">
              <div>
                <b>${esc(ev.title)}</b>
                <div style="font-size:13px;color:var(--fg-mut)">${esc(ev.org)} · ${esc(dateRu(ev.date))}</div>
              </div>
              <button class="btn btn--sm btn--ghost" data-act="del-event" data-id="${ev.id}" style="color:var(--err-color, #e53935)">Удалить</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;

  bindEventForm(container, () => loadEventsSection(container));

  container.querySelectorAll('[data-act="del-event"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Удалить мероприятие безвозвратно?')) return;
      const id = btn.dataset.id;
      try {
        const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast('Мероприятие удалено', 'ok');
          loadEventsSection(container);
        } else toast('Ошибка удаления', 'err');
      } catch (e) { toast('Ошибка сети', 'err'); }
    });
  });
}

async function loadMentorsSection(container) {
  /* --- Mentors section --- */
  let mentors = [];
  try {
    const res = await fetch('/api/mentors');
    if (res.ok) mentors = await res.json();
  } catch (e) {
    console.error(e);
  }

  container.innerHTML = `
    <div class="grid-2" style="align-items:start;gap:var(--sp-6)">
      <div>
        <h2 style="font-size:20px;margin-bottom:var(--sp-4)">Добавить ментора</h2>
        ${mentorForm()}
      </div>
      <div>
        <h3 style="font-size:18px;margin-bottom:var(--sp-3)">Все менторы (${mentors.length})</h3>
        <div class="prose">
          ${mentors.length === 0 ? '<p style="color:var(--fg-mut)">Нет менторов</p>' : ''}
          ${mentors.map(m => `
            <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:var(--sp-3) var(--sp-4)">
              <div>
                <b>${esc(m.name)}</b>
                <div style="font-size:13px;color:var(--fg-mut)">${esc(m.spec || 'Ментор')} · ${esc(m.city || '')}</div>
                ${m.skills && m.skills.length ? `<div style="font-size:12px;color:var(--fg-mut);margin-top:2px">Навыки: ${esc(m.skills.join(', '))}</div>` : ''}
                ${m.achievements && m.achievements.length ? `<div style="font-size:12px;color:var(--fg-mut);margin-top:2px">Достижения: ${esc(m.achievements.join(', '))}</div>` : ''}
              </div>
              <button class="btn btn--sm btn--ghost" data-act="del-mentor" data-id="${m.id}" style="color:var(--err-color, #e53935)">Удалить</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;

  bindMentorForm(container, () => loadMentorsSection(container));

  container.querySelectorAll('[data-act="del-mentor"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Удалить ментора безвозвратно?')) return;
      const id = btn.dataset.id;
      try {
        const res = await fetch(`/api/mentors/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast('Ментор удален', 'ok');
          loadMentorsSection(container);
        } else toast('Ошибка удаления', 'err');
      } catch (e) { toast('Ошибка сети', 'err'); }
    });
  });
}

async function loadProjectsSection(container) {
  /* --- Projects section --- */
  let allProjects = [];

  try {
    const res = await fetch('/api/projects?deleted=all');
    if (res.ok) {
      allProjects = await res.json();
    } else {
      const [resAct, resDel] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/projects?deleted=true')
      ]);
      const act = resAct.ok ? await resAct.json() : [];
      const del = resDel.ok ? await resDel.json() : [];
      const map = new Map();
      [...act, ...del].forEach(p => map.set(p.id, p));
      allProjects = Array.from(map.values());
    }
  } catch (e) {
    console.error(e);
  }

  let activeProjects = allProjects.filter(p => !p.deleted);
  let deletedProjects = allProjects.filter(p => p.deleted === true);

  container.innerHTML = `
    <div class="tabs" style="margin-bottom:var(--sp-4);display:flex;gap:var(--sp-2)">
      <button class="btn btn--sm btn--primary" id="subtab-active">Активные (${activeProjects.length})</button>
      <button class="btn btn--sm btn--ghost" id="subtab-deleted">Корзина / Удаленные (${deletedProjects.length})</button>
    </div>
    <div id="projects-subcontent"></div>`;

  const subcontent = $('#projects-subcontent', container);
  const btnAct = $('#subtab-active', container);
  const btnDel = $('#subtab-deleted', container);

  let currentSub = 'active';

  const renderSub = () => {
    if (currentSub === 'active') {
      btnAct.className = 'btn btn--sm btn--primary';
      btnDel.className = 'btn btn--sm btn--ghost';
      subcontent.innerHTML = `
        <div class="field" style="margin-bottom:var(--sp-4)">
          <input class="input" id="proj-search" placeholder="Поиск активных проектов по названию..." />
        </div>
        <div class="prose" id="proj-list">
          ${activeProjects.length === 0 ? '<p style="color:var(--fg-mut)">Нет активных проектов</p>' : ''}
          ${activeProjects.map(renderActiveProjectCard).join('')}
        </div>`;

      const searchInput = $('#proj-search', subcontent);
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = activeProjects.filter(p => p.title.toLowerCase().includes(q) || (p.about || '').toLowerCase().includes(q));
        $('#proj-list', subcontent).innerHTML = filtered.length === 0 
          ? '<p style="color:var(--fg-mut)">Ничего не найдено</p>' 
          : filtered.map(renderActiveProjectCard).join('');
        bindActiveProjectActions();
      });

      bindActiveProjectActions();
    } else {
      btnAct.className = 'btn btn--sm btn--ghost';
      btnDel.className = 'btn btn--sm btn--primary';

      deletedProjects.sort((a, b) => {
        if (!a.deleted_at) return 1;
        if (!b.deleted_at) return -1;
        const deadlineA = new Date(new Date(a.deleted_at).getTime() + 30 * 86400000);
        const deadlineB = new Date(new Date(b.deleted_at).getTime() + 30 * 86400000);
        return deadlineA - deadlineB;
      });

      subcontent.innerHTML = `
        <p style="color:var(--fg-mut);margin-bottom:var(--sp-4)">Проекты удаляются навсегда через 30 дней после мягкого удаления.</p>
        <div class="field" style="margin-bottom:var(--sp-4)">
          <input class="input" id="del-search" placeholder="Поиск в корзине..." />
        </div>
        <div class="prose" id="del-list">
          ${deletedProjects.length === 0 ? '<p style="color:var(--fg-mut)">Удаленных проектов нет</p>' : ''}
          ${deletedProjects.map(renderDeletedProjectCard).join('')}
        </div>`;

      const searchInput = $('#del-search', subcontent);
      searchInput.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase();
        const filtered = deletedProjects.filter(p => p.title.toLowerCase().includes(q));
        $('#del-list', subcontent).innerHTML = filtered.length === 0 
          ? '<p style="color:var(--fg-mut)">Ничего не найдено</p>' 
          : filtered.map(renderDeletedProjectCard).join('');
        bindDeletedProjectActions();
      });

      bindDeletedProjectActions();
    }
  };

  btnAct.addEventListener('click', () => { currentSub = 'active'; renderSub(); });
  btnDel.addEventListener('click', () => { currentSub = 'deleted'; renderSub(); });

  renderSub();

  function renderActiveProjectCard(p) {
    return `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:var(--sp-4)">
        <div>
          <b><a href="#/project/${p.id}" target="_blank" style="color:var(--fg)">${esc(p.title)}</a></b>
          <div style="font-size:13px;color:var(--fg-mut)">Стадия: ${esc(p.stage || '—')}</div>
        </div>
        <button class="btn btn--sm btn--ghost" data-act="soft-del" data-id="${p.id}" style="color:var(--err-color, #e53935)">В корзину</button>
      </div>`;
  }

  function bindActiveProjectActions() {
    subcontent.querySelectorAll('[data-act="soft-del"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (!confirm('Перенести проект в мягкое удаление?')) return;
        try {
          const res = await fetch(`/api/projects/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deleted: true, deleted_at: new Date().toISOString() })
          });
          if (res.ok) {
            toast('Проект отправлен в корзину', 'ok');
            loadProjectsSection(container);
          } else toast('Ошибка', 'err');
        } catch (e) { toast('Ошибка сети', 'err'); }
      });
    });
  }

  function renderDeletedProjectCard(p) {
    let daysLeft = 'Неизвестно';
    let isUrgent = false;

    if (p.deleted_at) {
      const deletedDate = new Date(p.deleted_at);
      const purgeDate = new Date(deletedDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const diffTime = purgeDate - new Date();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      daysLeft = diffDays > 0 ? `Осталось дней до автоочистки: ${diffDays}` : 'Будет удален при следующей очистке';
      if (diffDays <= 5 && diffDays >= 0) isUrgent = true;
    }

    return `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:var(--sp-4);border-left:4px solid ${isUrgent ? 'var(--err-color, #e53935)' : 'var(--border)'}">
        <div>
          <b>${esc(p.title)}</b>
          <div style="font-size:13px;color:var(--fg-mut)">Удален: ${p.deleted_at ? dateRu(p.deleted_at) : '—'}</div>
          <div style="font-size:13px;font-weight:600;color:${isUrgent ? 'var(--err-color, #e53935)' : 'var(--fg-mut)'};margin-top:4px">${daysLeft}</div>
        </div>
        <div class="row row--tight">
          <button class="btn btn--sm btn--primary" data-act="restore-proj" data-id="${p.id}">Восстановить</button>
        </div>
      </div>`;
  }

  function bindDeletedProjectActions() {
    subcontent.querySelectorAll('[data-act="restore-proj"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          const res = await fetch(`/api/projects/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deleted: false, deleted_at: null })
          });
          if (res.ok) {
            toast('Проект восстановлен', 'ok');
            loadProjectsSection(container);
          } else toast('Ошибка при восстановлении', 'err');
        } catch (e) { toast('Ошибка сети', 'err'); }
      });
    });
  }
}

async function loadUsersSection(container) {
  /* --- Users section --- */
  let users = [];
  const currentUser = me();

  try {
    const [resUsers, resStatuses] = await Promise.all([
      fetch('/api/users'),
      fetch('/api/user-statuses').catch(() => ({ ok: false }))
    ]);

    if (resUsers.ok) {
      const rawUsers = await resUsers.json();
      let statusesMap = new Map();

      if (resStatuses.ok) {
        const statuses = await resStatuses.json();
        if (Array.isArray(statuses)) {
          statuses.forEach(s => statusesMap.set(String(s.user_id || s.id), s));
        }
      }

      users = rawUsers.map(u => {
        const status = statusesMap.get(String(u.id)) || {};
        return {
          ...u,
          role: u.role || status.role || 'user',
          is_active: u.is_active !== undefined ? u.is_active : (status.is_active ?? true),
          deactivated_at: u.deactivated_at || status.deactivated_at || null,
          deactivated_reason: u.deactivated_reason || status.deactivated_reason || ''
        };
      });
    }
  } catch (e) {
    console.error(e);
  }

  container.innerHTML = `
    <div class="tabs" style="margin-bottom:var(--sp-4);display:flex;gap:var(--sp-2)">
      <button class="btn btn--sm btn--primary" id="subtab-active-users">Активные</button>
      <button class="btn btn--sm btn--ghost" id="subtab-blocked-users">Заблокированные</button>
    </div>
    <div id="users-subcontent"></div>`;

  const subcontent = $('#users-subcontent', container);
  const btnAct = $('#subtab-active-users', container);
  const btnBlk = $('#subtab-blocked-users', container);

  let currentSub = 'active';

  const renderSub = () => {
    const filteredUsers = users.filter(u => currentSub === 'active' ? u.is_active !== false : u.is_active === false);

    if (currentSub === 'active') {
      btnAct.className = 'btn btn--sm btn--primary';
      btnBlk.className = 'btn btn--sm btn--ghost';
    } else {
      btnAct.className = 'btn btn--sm btn--ghost';
      btnBlk.className = 'btn btn--sm btn--primary';
    }

    let contentHtml = '';

    if (currentSub === 'active') {
      const admins = filteredUsers.filter(u => u.role === 'admin');
      const moderators = filteredUsers.filter(u => u.role === 'moderator');
      const regularUsers = filteredUsers.filter(u => u.role !== 'moderator' && u.role !== 'admin');

      contentHtml = `
        <div class="field" style="margin-bottom:var(--sp-4)">
          <input class="input" id="user-search" placeholder="Поиск пользователей по имени, email или username..." />
        </div>
        <div id="users-list">
          <h3 style="font-size:16px;margin-bottom:var(--sp-3);color:var(--fg-mut)">Администраторы (${admins.length})</h3>
          <div class="prose" style="margin-bottom:var(--sp-6)">
            ${admins.length === 0 ? '<p style="color:var(--fg-mut);font-size:14px">Нет администраторов</p>' : admins.map(renderUserCard).join('')}
          </div>

          <h3 style="font-size:16px;margin-bottom:var(--sp-3);color:var(--fg-mut)">Модераторы (${moderators.length})</h3>
          <div class="prose" style="margin-bottom:var(--sp-6)">
            ${moderators.length === 0 ? '<p style="color:var(--fg-mut);font-size:14px">Нет модераторов</p>' : moderators.map(renderUserCard).join('')}
          </div>

          <h3 style="font-size:16px;margin-bottom:var(--sp-3);color:var(--fg-mut)">Пользователи (${regularUsers.length})</h3>
          <div class="prose">
            ${regularUsers.length === 0 ? '<p style="color:var(--fg-mut);font-size:14px">Нет пользователей</p>' : regularUsers.map(renderUserCard).join('')}
          </div>
        </div>`;
    } else {
      contentHtml = `
        <div class="field" style="margin-bottom:var(--sp-4)">
          <input class="input" id="user-search" placeholder="Поиск пользователей по имени, email или username..." />
        </div>
        <div class="prose" id="users-list">
          ${filteredUsers.length === 0 ? '<p style="color:var(--fg-mut)">Список пуст</p>' : ''}
          ${filteredUsers.map(renderUserCard).join('')}
        </div>`;
    }

    subcontent.innerHTML = contentHtml;

    const searchInput = $('#user-search', subcontent);
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase();
      const searched = filteredUsers.filter(u => 
        u.name.toLowerCase().includes(q) || 
        (u.username || '').toLowerCase().includes(q) || 
        (u.email || '').toLowerCase().includes(q)
      );
      
      if (currentSub === 'active') {
        const admSearch = searched.filter(u => u.role === 'admin');
        const modSearch = searched.filter(u => u.role === 'moderator');
        const regSearch = searched.filter(u => u.role !== 'moderator' && u.role !== 'admin');
        
        $('#users-list', subcontent).innerHTML = `
          <h3 style="font-size:16px;margin-bottom:var(--sp-3);color:var(--fg-mut)">Администраторы (${admSearch.length})</h3>
          <div class="prose" style="margin-bottom:var(--sp-6)">
            ${admSearch.length === 0 ? '<p style="color:var(--fg-mut);font-size:14px">Ничего не найдено</p>' : admSearch.map(renderUserCard).join('')}
          </div>
          <h3 style="font-size:16px;margin-bottom:var(--sp-3);color:var(--fg-mut)">Модераторы (${modSearch.length})</h3>
          <div class="prose" style="margin-bottom:var(--sp-6)">
            ${modSearch.length === 0 ? '<p style="color:var(--fg-mut);font-size:14px">Ничего не найдено</p>' : modSearch.map(renderUserCard).join('')}
          </div>
          <h3 style="font-size:16px;margin-bottom:var(--sp-3);color:var(--fg-mut)">Пользователи (${regSearch.length})</h3>
          <div class="prose">
            ${regSearch.length === 0 ? '<p style="color:var(--fg-mut);font-size:14px">Ничего не найдено</p>' : regSearch.map(renderUserCard).join('')}
          </div>`;
      } else {
        $('#users-list', subcontent).innerHTML = searched.length === 0 
          ? '<p style="color:var(--fg-mut)">Ничего не найдено</p>' 
          : searched.map(renderUserCard).join('');
      }
      bindUserActions();
    });

    bindUserActions();
  };

  btnAct.addEventListener('click', () => { currentSub = 'active'; renderSub(); });
  btnBlk.addEventListener('click', () => { currentSub = 'blocked'; renderSub(); });

  renderSub();

  function renderUserCard(u) {
    const isActive = u.is_active !== false;
    const isAdmin = u.role === 'admin';
    const isMod = u.role === 'moderator';
    const isSelf = currentUser && String(currentUser.id) === String(u.id);

    let badgeHtml = '';
    if (isAdmin) {
      badgeHtml = '<span class="badge badge--accent" style="font-size:10px;margin-left:6px">Администратор</span>';
    } else if (isMod) {
      badgeHtml = '<span class="badge badge--ok" style="font-size:10px;margin-left:6px">Модератор</span>';
    }

    const selfBadge = isSelf ? '<span class="badge badge--warn" style="font-size:10px;margin-left:4px">Это вы</span>' : '';
    
    const cardBg = isSelf 
      ? 'background: var(--bg-subtle, rgba(59, 130, 246, 0.05)); border: 1px solid var(--accent, #3b82f6);' 
      : 'background: var(--bg);';

    return `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:var(--sp-4);${cardBg}">
        <div>
          <b>${esc(u.name)}</b> (@${esc(u.username)}) ${badgeHtml} ${selfBadge}
          <div style="font-size:13px;color:var(--fg-mut)">${esc(u.email || 'без email')} · Город: ${esc(u.city || '—')}</div>
          ${!isActive && u.deactivated_reason ? `<div style="font-size:12px;color:var(--err-color, #e53935);margin-top:4px">Причина: ${esc(u.deactivated_reason)}</div>` : ''}
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          ${!isSelf && !isAdmin ? `
            ${isActive ? `
              <button class="btn btn--sm btn--ghost" data-act="toggle-role" data-id="${u.id}" data-role="${u.role || 'user'}">
                ${isMod ? 'Отозвать модератора' : 'Сделать модератором'}
              </button>
            ` : ''}
            <button class="btn btn--sm ${isActive ? 'btn--ghost' : 'btn--primary'}" data-act="toggle-active" data-id="${u.id}" data-active="${isActive}" style="${isActive ? 'color:var(--err-color, #e53935)' : ''}">
              ${isActive ? 'Деактивировать' : 'Активировать'}
            </button>
          ` : ''}
        </div>
      </div>`;
  }

  function bindUserActions() {
    subcontent.querySelectorAll('[data-act="toggle-role"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = btn.dataset.id;
        const currentRole = btn.dataset.role;
        const newRole = currentRole === 'moderator' ? 'user' : 'moderator';

        try {
          const res = await fetch('/api/user-statuses', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, role: newRole })
          });

          if (res.ok) {
            toast(newRole === 'moderator' ? 'Назначен модератором' : 'Права модератора отозваны', 'ok');
            const targetUser = users.find(x => String(x.id) === String(userId));
            if (targetUser) {
              targetUser.role = newRole;
            }
            renderSub();
          } else {
            toast('Не удалось изменить роль', 'err');
          }
        } catch (e) {
          toast('Ошибка сети', 'err');
        }
      });
    });

    subcontent.querySelectorAll('[data-act="toggle-active"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userId = btn.dataset.id;
        const currentActive = btn.dataset.active === 'true';
        const newActive = !currentActive;

        if (newActive === true) {
          if (!confirm('Активировать аккаунт пользователя снова?')) return;
          updateUserStatus(userId, true, null, '');
          return;
        }

        let modal = document.getElementById('deactivate-modal');
        if (!modal) {
          modal = document.createElement('div');
          modal.id = 'deactivate-modal';
          modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;';
          modal.innerHTML = `
            <div style="background:var(--bg, #fff);padding:24px;border-radius:12px;width:100%;max-width:420px;box-shadow:0 10px 25px rgba(0,0,0,0.1);display:flex;flex-direction:column;gap:16px;">
              <h3 style="margin:0;font-size:18px;color:var(--fg, #111);">Причина деактивации</h3>
              <p style="margin:0;font-size:13px;color:var(--fg-mut, #666);">Пожалуйста, укажите причину блокировки аккаунта. Это поле обязательно.</p>
              <div class="field" style="margin:0;">
                <textarea id="deactivation-reason-input" class="textarea" placeholder="Например: Нарушение правил платформы..." style="min-height:90px;width:100%;resize:vertical;"></textarea>
                <span id="deactivation-error" style="color:var(--err-color, #e53935);font-size:12px;display:none;margin-top:4px;">Укажите причину деактивации</span>
              </div>
              <div style="display:flex;justify-content:flex-end;gap:8px;">
                <button type="button" id="deactivate-cancel" class="btn btn--sm btn--ghost">Отмена</button>
                <button type="button" id="deactivate-submit" class="btn btn--sm btn--primary" style="background:var(--err-color, #e53935);color:#fff;">Заблокировать</button>
              </div>
            </div>`;
          document.body.appendChild(modal);
        } else {
          modal.style.display = 'flex';
        }

        const textarea = document.getElementById('deactivation-reason-input');
        const errSpan = document.getElementById('deactivation-error');
        textarea.value = '';
        errSpan.style.display = 'none';
        textarea.focus();

        const closeModal = () => {
          modal.style.display = 'none';
          cleanup();
        };

        const submitHandler = () => {
          const reason = textarea.value.trim();
          if (!reason) {
            errSpan.style.display = 'block';
            textarea.focus();
            return;
          }
          closeModal();
          updateUserStatus(userId, false, new Date().toISOString(), reason);
        };

        const cancelBtn = document.getElementById('deactivate-cancel');
        const submitBtn = document.getElementById('deactivate-submit');
        const backdropClick = (e) => { if (e.target === modal) closeModal(); };

        const cleanup = () => {
          cancelBtn.replaceWith(cancelBtn.cloneNode(true));
          submitBtn.replaceWith(submitBtn.cloneNode(true));
          modal.replaceWith(modal.cloneNode(true));
        };

        document.getElementById('deactivate-cancel').addEventListener('click', closeModal);
        document.getElementById('deactivate-submit').addEventListener('click', submitHandler);
        modal.addEventListener('click', backdropClick);
      });
    });
  }

  async function updateUserStatus(userId, newActive, deactivatedAt, deactivatedReason) {
    try {
      const payload = {
        user_id: userId,
        is_active: newActive,
        deactivated_at: deactivatedAt,
        deactivated_reason: deactivatedReason
      };

      const res = await fetch('/api/user-statuses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast(newActive ? 'Аккаунт активирован' : 'Аккаунт деактивирован', 'ok');
        const targetUser = users.find(x => String(x.id) === String(userId));
        if (targetUser) {
          targetUser.is_active = newActive;
          targetUser.deactivated_at = payload.deactivated_at;
          targetUser.deactivated_reason = payload.deactivated_reason;
        }
        renderSub();
      } else toast('Не удалось изменить статус', 'err');
    } catch (e) { toast('Ошибка сети', 'err'); }
  }
}

/* === FORMS === */

function eventForm() {
  return `<form class="form" data-form="event" novalidate style="gap:var(--sp-4)">
      <div class="grid-2">
        <div class="field"><label for="ev-t">Название <span class="req" aria-hidden="true">*</span></label><input class="input" id="ev-t" name="title" required /><span class="field__err" data-err="title" role="alert"></span></div>
        <div class="field"><label for="ev-o">Организатор <span class="req" aria-hidden="true">*</span></label><input class="input" id="ev-o" name="org" required /><span class="field__err" data-err="org" role="alert"></span></div>
        <div class="field"><label for="ev-d">Дата <span class="req" aria-hidden="true">*</span></label><input class="input" id="ev-d" name="date" type="date" required /><span class="field__err" data-err="date" role="alert"></span></div>
        <div class="field"><label for="ev-dl">Дедлайн регистрации</label><input class="input" id="ev-dl" name="reg_deadline" type="date" /></div>
        <div class="field"><label for="ev-p">Место</label><input class="input" id="ev-p" name="place" placeholder="Город или площадка" /></div>
        <div class="field"><label for="ev-f">Формат</label><select class="select" id="ev-f" name="format">${D.FORMATS.map((f) => `<option value="${f.id}">${f.ru}</option>`).join('')}</select></div>
        <div class="field"><label for="ev-ty">Тип</label><select class="select" id="ev-ty" name="type">${D.EVENT_TYPES.map((t) => `<option value="${t.id}">${t.ru}</option>`).join('')}</select></div>
      </div>
      <div class="field"><label for="ev-ab">Описание</label><textarea class="textarea" id="ev-ab" name="about" style="min-height:80px"></textarea></div>
      <div class="row" style="justify-content:flex-end"><button class="btn btn--primary" type="submit" data-submit-btn>${icon('plus')}Добавить мероприятие</button></div>
    </form>`;
}

function mentorForm() {
  return `<form class="form" data-form="mentor" novalidate style="gap:var(--sp-4)">
      <div class="grid-2">
        <div class="field"><label for="m-n">Имя и фамилия <span class="req" aria-hidden="true">*</span></label><input class="input" id="m-n" name="name" required /><span class="field__err" data-err="name" role="alert"></span></div>
        <div class="field"><label for="m-spec">Специализация</label><input class="input" id="m-spec" name="spec" placeholder="AI, Web, Embedded..." /></div>
        <div class="field"><label for="m-exp">Опыт / Должность</label><input class="input" id="m-exp" name="exp" placeholder="Senior / 5 лет опыта" /></div>
        <div class="field"><label for="m-ct">Город</label><select class="select" id="m-ct" name="city">${D.CITIES.map((c) => `<option>${c}</option>`).join('')}</select></div>
        <div class="field"><label for="m-mail">Email для связи</label><input class="input" id="m-mail" name="contact_email" type="email" placeholder="mentor@example.kz" /></div>
      </div>

      <div class="field">
        <label>Навыки <span class="req" aria-hidden="true">*</span> (минимум 2)</label>
        <div id="list-skills" style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px"></div>
        <button type="button" class="btn btn--sm btn--ghost" data-act="add-skill">+ Добавить навык</button>
      </div>

      <div class="field">
        <label>Достижения <span class="req" aria-hidden="true">*</span> (минимум 2)</label>
        <div id="list-ach" style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px"></div>
        <button type="button" class="btn btn--sm btn--ghost" data-act="add-ach">+ Добавить достижение</button>
      </div>

      <div class="field"><label for="m-b">О менторе</label><textarea class="textarea" id="m-b" name="bio" style="min-height:80px"></textarea></div>
      <div class="row" style="justify-content:flex-end"><button class="btn btn--primary" type="submit" data-submit-btn>${icon('plus')}Добавить ментора</button></div>
    </form>`;
}

/* === FORM BINDERS === */

function bindEventForm(root, onSuccess) {
  const form = $('[data-form="event"]', root);
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate(form, { title: required('Введите название'), org: required('Укажите организатора'), date: required('Выберите дату') })) return;

    const submitBtn = form.querySelector('[data-submit-btn]');
    if (submitBtn) submitBtn.disabled = true;

    const fd = new FormData(form);
    const payload = Object.fromEntries(fd.entries());

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast('Мероприятие успешно создано!', 'ok');
        form.reset();
        if (onSuccess) onSuccess();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast(errData.error || 'Ошибка создания мероприятия', 'err');
        if (submitBtn) submitBtn.disabled = false;
      }
    } catch (err) {
      toast('Ошибка сети', 'err');
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function bindMentorForm(root, onSuccess) {
  const form = $('[data-form="mentor"]', root);
  if (!form) return;

  let skillsList = ['', ''];
  let achList = ['', ''];

  const renderLists = () => {
    const sContainer = $('#list-skills', form);
    const aContainer = $('#list-ach', form);

    sContainer.innerHTML = skillsList.map((val, idx) => `
      <div style="display:flex;gap:8px">
        <input class="input skill-item" data-idx="${idx}" value="${esc(val)}" placeholder="Например: Python" />
        <button type="button" class="btn btn--sm btn--ghost" data-del-skill="${idx}" style="color:var(--err-color, #e53935)">✕</button>
      </div>
    `).join('');

    aContainer.innerHTML = achList.map((val, idx) => `
      <div style="display:flex;gap:8px">
        <input class="input ach-item" data-idx="${idx}" value="${esc(val)}" placeholder="Например: Победитель хакатона" />
        <button type="button" class="btn btn--sm btn--ghost" data-del-ach="${idx}" style="color:var(--err-color, #e53935)">✕</button>
      </div>
    `).join('');
  };

  renderLists();

  form.addEventListener('input', (e) => {
    if (e.target.classList.contains('skill-item')) {
      skillsList[e.target.dataset.idx] = e.target.value;
    } else if (e.target.classList.contains('ach-item')) {
      achList[e.target.dataset.idx] = e.target.value;
    }
  });

  form.addEventListener('click', (e) => {
    e.target.closest('[data-act="add-skill"]') && (skillsList.push(''), renderLists());
    e.target.closest('[data-act="add-ach"]') && (achList.push(''), renderLists());
    if (e.target.dataset.delSkill !== undefined) {
      skillsList.splice(Number(e.target.dataset.delSkill), 1);
      renderLists();
    }
    if (e.target.dataset.delAch !== undefined) {
      achList.splice(Number(e.target.dataset.delAch), 1);
      renderLists();
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate(form, { name: required('Укажите имя ментора') })) return;

    const cleanSkills = skillsList.map(s => s.trim()).filter(Boolean);
    const cleanAch = achList.map(a => a.trim()).filter(Boolean);

    if (cleanSkills.length < 2) {
      toast('Добавьте хотя бы 2 навыка', 'err');
      return;
    }
    if (cleanAch.length < 2) {
      toast('Добавьте хотя бы 2 достижения', 'err');
      return;
    }

    const submitBtn = form.querySelector('[data-submit-btn]');
    if (submitBtn) submitBtn.disabled = true;

    const fd = new FormData(form);
    const rawData = Object.fromEntries(fd.entries());

    const payload = {
      ...rawData,
      skills: cleanSkills,
      achievements: cleanAch
    };

    try {
      const res = await fetch('/api/mentors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast('Ментор успешно добавлен!', 'ok');
        form.reset();
        if (onSuccess) onSuccess();
      } else {
        const errData = await res.json().catch(() => ({}));
        toast(errData.error || 'Ошибка добавления ментора', 'err');
        if (submitBtn) submitBtn.disabled = false;
      }
    } catch (err) {
      toast('Ошибка сети', 'err');
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}