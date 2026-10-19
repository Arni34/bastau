/* BASTAU - Single project page */

import { esc, catRu, stageRu, skillRu, icon, fmtRu, langRu, dateRu } from '../lib/utils.js';
import { me } from '../lib/session.js';

import { M } from '../global/globals.js';
import { avatar } from '../global/components.js';
import { render404 } from './page-misc.js';

/* Project page */
export async function renderProject(root, id) {
  root.innerHTML = `<div class="wrap" style="padding:var(--sp-6) 0"><p>Загрузка проекта...</p></div>`;

  let p = null;
  try {
    const res = await fetch(`/api/projects/${id}`);
    if (res.ok) p = await res.json();
  } catch (err) {
    console.error(err);
  }

  if (!p) return render404(root);

  p.needTeam = p.need_team ?? p.needTeam;
  p.teamSize = p.team_size ?? p.teamSize;
  p.ownerId = p.owner_id ?? p.ownerId;
  p.createdAt = p.created_at ?? p.createdAt;
  p.members = p.members || [];
  p.skills = p.skills || [];
  p.links = p.links || [];

  let owner = { name: 'Пользователь', username: 'user', city: p.city };
  try {
    const resOwner = await fetch(`/api/users/${p.ownerId}`);
    if (resOwner.ok) owner = await resOwner.json();
  } catch (e) {}

  const u = me();
  const mine = u && p.ownerId === u.id;
  const inTeam = u && p.members.some((m) => m.userId === u.id);

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
                <a href="#/profile/${owner.username}" aria-label="Профиль: ${esc(owner.name)}">${avatar(owner)}</a>
                <div style="min-width:0">
                  <div class="member__n">${esc(owner.name)}</div>
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
                ${mine ? `<span class="badge badge--ok" style="width:100%;justify-content:center;padding:12px">Это твой проект</span>`
                : inTeam ? `<span class="badge badge--ok" style="width:100%;justify-content:center;padding:12px">Ты в команде</span>`
                  : `<button class="btn btn--primary btn--full" type="button" data-act="apply" data-id="${p.id}">${icon('users')}Подать заявку в команду</button>`}
              </div>
            </div>

            <div class="card" style="margin-top:var(--sp-4)">
              <h3 style="font-size:16px;margin-bottom:var(--sp-2)">Команда (${p.members.length})</h3>
              ${p.members.map((m) => `
                <div class="member">
                  <div style="min-width:0">
                    <div class="member__n">Участник (${m.userId})</div>
                    <div class="member__r">${esc(m.role)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </aside>
        </div>
      </div>
    </section>`;

  if (M && M.reveal) M.reveal(root);
}
