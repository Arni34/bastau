/* BASTAU - Single project page */

import { esc, catRu, stageRu, skillRu, icon, fmtRu, langRu, dateRu } from '../lib/utils.js';
import { me } from '../lib/session.js';

import { M } from '../global/globals.js';
import { avatar } from '../global/components.js';
import { toast } from '../global/modals.js';
import { render404 } from './page-misc.js';

export async function renderProject(root, id) {
  root.innerHTML = `<div class="wrap" style="padding:var(--sp-6) 0"><p>Загрузка проекта...</p></div>`;

  let p = null;
  let applications = [];

  try {
    const [resProj, resApps] = await Promise.all([
      fetch(`/api/projects/${id}`),
      fetch(`/api/applications?project_id=${id}`)
    ]);

    if (resProj.ok) p = await resProj.json();
    if (resApps.ok) applications = await resApps.json();
  } catch (err) {
    console.error(err);
  }

  if (!p || p.deleted) return render404(root);

  p.needTeam = p.need_team ?? p.needTeam;
  p.teamSize = p.team_size ?? p.teamSize;
  p.ownerId = p.owner_id ?? p.ownerId;
  p.createdAt = p.created_at ?? p.createdAt;
  p.members = p.members || [];
  p.skills = p.skills || [];
  p.links = p.links || [];

  const userIdsToFetch = new Set([
    p.ownerId,
    ...p.members.map(m => m.userId || m.user_id),
    ...applications.map(a => a.user_id)
  ]);

  const usersMap = {};
  await Promise.all(
    Array.from(userIdsToFetch).filter(Boolean).map(async (userId) => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (res.ok) {
          const userData = await res.json();
          usersMap[userId] = userData;
        }
      } catch (e) {}
    })
  );

  const owner = usersMap[p.ownerId] || { name: 'Пользователь', username: 'user', city: p.city };

  const u = me();
  const mine = u && p.ownerId === u.id;
  const inTeam = u && p.members.some((m) => (m.userId || m.user_id) === u.id);

  const myApp = u ? applications.find(a => a.user_id === u.id) : null;

  const pendingApps = applications.filter(a => a.status === 'pending');
  const rejectedApps = applications.filter(a => a.status === 'rejected');

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
                <a href="#/profile/${esc(owner.username)}" aria-label="Профиль: ${esc(owner.name)}">${avatar(owner)}</a>
                <div style="min-width:0">
                  <div class="member__n">${esc(owner.name)} (@${esc(owner.username)})</div>
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
                ${
                  mine ? `
                    <div style="display:flex;flex-direction:column;gap:8px">
                      <span class="badge badge--ok" style="width:100%;justify-content:center;padding:12px">Это твой проект</span>
                      <button class="btn btn--ghost btn--full" type="button" data-act="delete-project" style="color:var(--err-color, #e53935)">Удалить проект</button>
                    </div>
                  `
                  : inTeam ? `<span class="badge badge--ok" style="width:100%;justify-content:center;padding:12px">Вы участвуете</span>`
                  : myApp?.status === 'accepted' ? `<span class="badge badge--ok" style="width:100%;justify-content:center;padding:12px">Вы участвуете</span>`
                  : myApp?.status === 'rejected' ? `<span class="badge badge--err" style="width:100%;justify-content:center;padding:12px">Вас отклонили</span>`
                  : myApp?.status === 'pending' ? `<span class="badge badge--warn" style="width:100%;justify-content:center;padding:12px">Заявка подана!</span>`
                  : `<button class="btn btn--primary btn--full" type="button" data-act="apply" data-id="${p.id}">${icon('users')}Подать заявку в команду</button>`
                }
              </div>
            </div>

            <div class="card" style="margin-top:var(--sp-4)">
              <h3 style="font-size:16px;margin-bottom:var(--sp-2)">Команда (${p.members.length})</h3>
              ${p.members.length === 0 ? `<p style="color:var(--fg-mut);font-size:14px">Пока никого нет в команде</p>` : ''}
              ${p.members.map((m) => {
                const memberUserId = m.userId || m.user_id;
                const memberUser = usersMap[memberUserId] || { name: 'Участник', username: memberUserId };
                const isOwner = memberUserId === p.ownerId;
                const displayName = memberUser.username ? `@${memberUser.username}` : memberUserId;
                return `
                  <div class="member" style="display:flex;justify-content:space-between;align-items:center;border-top:1px solid var(--border);padding-top:10px;margin-top:10px">
                    <div style="min-width:0">
                      <div class="member__n">${esc(memberUser.name)} (${esc(displayName)})</div>
                      <div class="member__r">Роль: ${esc(m.role || 'Участник')}</div>
                    </div>
                    ${mine && !isOwner ? `<button class="btn btn--sm btn--ghost" data-act="remove-member" data-userid="${memberUserId}" style="color:var(--err-color, #e53935)">Удалить</button>` : ''}
                  </div>
                `;
              }).join('')}

              ${mine ? `
                <h3 style="font-size:16px;margin:var(--sp-4) 0 var(--sp-2)">Входящие заявки (${pendingApps.length})</h3>
                ${pendingApps.length === 0 ? `<p style="color:var(--fg-mut);font-size:14px">Нет новых заявок</p>` : ''}
                ${pendingApps.map((app) => {
                  const appUser = usersMap[app.user_id] || { name: 'Пользователь', username: app.user_id };
                  const displayName = appUser.username ? `@${appUser.username}` : app.user_id;
                  return `
                    <div class="member app-card" data-appid="${app.id}" style="flex-direction:column;align-items:stretch;gap:8px;border-top:1px solid var(--border);padding-top:12px;margin-top:12px">
                      <div>
                        <div class="member__n">Кандидат: ${esc(appUser.name)} (${esc(displayName)})</div>
                        <div class="member__r" style="margin-top:4px">Роль: <b>${esc(app.role || 'Не указана')}</b></div>
                        <div class="member__r" style="margin-top:2px">Сообщение: "${esc(app.message || 'Без сообщения')}"</div>
                      </div>
                      <div class="row row--tight" style="justify-content:flex-end">
                        <button class="btn btn--sm btn--ghost" data-act="reject-app" data-appid="${app.id}">Отклонить</button>
                        <button class="btn btn--sm btn--primary" data-act="accept-app" data-appid="${app.id}" data-userid="${app.user_id}" data-role="${esc(app.role || 'Участник')}">Принять</button>
                      </div>
                    </div>
                  `;
                }).join('')}

                ${rejectedApps.length > 0 ? `
                  <h3 style="font-size:16px;margin:var(--sp-4) 0 var(--sp-2)">Отклоненные заявки (${rejectedApps.length})</h3>
                  ${rejectedApps.map((app) => {
                    const appUser = usersMap[app.user_id] || { name: 'Пользователь', username: app.user_id };
                    const displayName = appUser.username ? `@${appUser.username}` : app.user_id;
                    return `
                      <div class="member" style="flex-direction:column;align-items:stretch;gap:8px;border-top:1px solid var(--border);padding-top:12px;margin-top:12px">
                        <div>
                          <div class="member__n" style="color:var(--fg-mut)">Кандидат: ${esc(appUser.name)} (${esc(displayName)})</div>
                          <div class="member__r" style="margin-top:4px">Роль: ${esc(app.role || 'Не указана')}</div>
                          <div class="member__r" style="margin-top:2px">Сообщение: "${esc(app.message || 'Без сообщения')}"</div>
                        </div>
                        <div class="row row--tight" style="justify-content:flex-end">
                          <button class="btn btn--sm btn--ghost" data-act="delete-app" data-appid="${app.id}">Отозвать решение (удалить)</button>
                        </div>
                      </div>
                    `;
                  }).join('')}
                ` : ''}
              ` : ''}
            </div>
          </aside>
        </div>
      </div>
    </section>`;

  if (M && M.reveal) M.reveal(root);

  if (mine) {
    root.querySelector('[data-act="delete-project"]')?.addEventListener('click', async () => {
      if (!confirm('Вы уверены, что хотите удалить этот проект?')) return;

      try {
        const res = await fetch(`/api/projects/${id}`, {
          method: 'DELETE'
        });

        if (res.ok) {
          toast('Проект успешно удален', 'ok');
          window.location.hash = '#/projects';
        } else {
          toast('Не удалось удалить проект', 'error');
        }
      } catch (e) {
        console.error(e);
        toast('Ошибка сети', 'error');
      }
    });

    root.querySelectorAll('[data-act="accept-app"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const appId = btn.getAttribute('data-appid');
        const userId = btn.getAttribute('data-userid');
        const role = btn.getAttribute('data-role');

        const card = root.querySelector(`.app-card[data-appid="${appId}"]`);
        const rejectBtn = card?.querySelector('[data-act="reject-app"]');

        if (rejectBtn) rejectBtn.disabled = true;
        btn.disabled = true;
        btn.textContent = 'Загрузка...';

        try {
          const updatedMembers = [...p.members, { userId, role }];
          const resProjUpdate = await fetch(`/api/projects/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ members: updatedMembers })
          });

          if (!resProjUpdate.ok) throw new Error('Не удалось обновить участников проекта');

          const resAppDelete = await fetch(`/api/applications/${appId}`, {
            method: 'DELETE'
          });

          if (!resAppDelete.ok) throw new Error('Не удалось удалить заявку');

          toast('Заявка принята, участник добавлен в команду!', 'ok');
          renderProject(root, id);
        } catch (e) {
          console.error(e);
          toast('Ошибка при принятии заявки', 'error');
          if (rejectBtn) rejectBtn.disabled = false;
          btn.disabled = false;
          btn.textContent = 'Принять';
        }
      });
    });

    root.querySelectorAll('[data-act="reject-app"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const appId = btn.getAttribute('data-appid');
        
        const card = root.querySelector(`.app-card[data-appid="${appId}"]`);
        const acceptBtn = card?.querySelector('[data-act="accept-app"]');

        if (acceptBtn) acceptBtn.disabled = true;
        btn.disabled = true;
        btn.textContent = 'Загрузка...';

        try {
          const res = await fetch(`/api/applications/${appId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected' })
          });
          if (res.ok) {
            toast('Заявка отклонена', 'ok');
            renderProject(root, id);
          } else {
            throw new Error('Ошибка сервера');
          }
        } catch (e) {
          console.error(e);
          toast('Ошибка при отклонении заявки', 'error');
          if (acceptBtn) acceptBtn.disabled = false;
          btn.disabled = false;
          btn.textContent = 'Отклонить';
        }
      });
    });

    root.querySelectorAll('[data-act="delete-app"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const appId = btn.getAttribute('data-appid');
        try {
          const res = await fetch(`/api/applications/${appId}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            toast('Решение отозвано, заявка удалена', 'ok');
            renderProject(root, id);
          } else {
            toast('Ошибка при удалении заявки', 'error');
          }
        } catch (e) {
          console.error(e);
          toast('Ошибка сети', 'error');
        }
      });
    });

    root.querySelectorAll('[data-act="remove-member"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const userIdToRemove = btn.getAttribute('data-userid');
        
        try {
          const updatedMembers = p.members.filter(m => (m.userId || m.user_id) !== userIdToRemove);
          const res = await fetch(`/api/projects/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ members: updatedMembers })
          });

          if (res.ok) {
            toast('Участник удален из команды', 'ok');
            renderProject(root, id);
          } else {
            toast('Не удалось удалить участника', 'error');
          }
        } catch (e) {
          console.error(e);
          toast('Ошибка сети', 'error');
        }
      });
    });
  }
}