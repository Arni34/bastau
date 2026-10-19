/* BASTAU - Card components */

import {
  esc, initials, catRu, stageRu, skillRu, icon, daysLeft, plural, dateRu, evtRu, fmtRu
} from '../lib/utils.js';
import { isAdmin } from '../lib/session.js';

export function avatar(user, size) {
  const cls = size ? ` avatar--${size}` : '';
  return `<span class="avatar${cls}" aria-hidden="true">${esc(initials(user.name))}</span>`;
}

export function projectCard(p) {
  return `<article class="card" data-reveal>
      <div class="card__top">
        <span class="badge badge--cat cat" data-cat="${esc(p.category)}">${esc(catRu(p.category))}</span>
        <span class="badge badge--stage">${esc(stageRu(p.stage))}</span>
        ${p.needTeam ? '<span class="badge badge--accent">Ищет команду</span>' : ''}
      </div>
      <h3 class="card__ttl">${esc(p.title)}</h3>
      <p class="card__txt">${esc(p.summary)}</p>
      <div class="row row--tight" style="margin-top:var(--sp-4)">
        ${p.skills.slice(0, 3).map((s) => `<span class="chip chip--skill">${esc(skillRu(s))}</span>`).join('')}
        ${p.skills.length > 3 ? `<span class="chip chip--skill">+${p.skills.length - 3}</span>` : ''}
      </div>
      <div class="card__meta-row">
        <span class="card__meta">${icon('users', 'ic--sm')}${p.members.length} / ${p.teamSize}</span>
        <span class="card__meta">${icon('pin', 'ic--sm')}${esc(p.city)}</span>
      </div>
      <a class="btn btn--primary btn--full card__act" href="#/project/${p.id}">Подробнее</a>
    </article>`;
}

export function personCard(u) {
  u.skills = u.skills || [];
  return `<article class="card" data-reveal>
      <div class="row" style="flex-wrap:nowrap">
        ${avatar(u)}
        <div style="min-width:0">
          <h3 class="card__ttl" style="margin-bottom:2px">${esc(u.name)}</h3>
          <p class="card__meta">${esc(u.city)} · ${esc(u.grade)}</p>
        </div>
      </div>
      <p class="card__txt" style="margin-top:var(--sp-3)">${esc(u.bio)}</p>
      <div class="row row--tight" style="margin-top:var(--sp-4)">
        ${u.skills.slice(0, 3).map((s) => `<span class="chip chip--skill">${esc(skillRu(s))}</span>`).join('')}
      </div>
      <div class="card__meta-row">
        <span class="card__meta">${icon('case', 'ic--sm')}Участник платформы</span>
      </div>
      <a class="btn btn--ghost btn--full card__act" href="#/profile/${u.username}">Открыть профиль</a>
    </article>`;
}

export function eventCard(e) {
  const left = daysLeft(e.deadline);
  const dl = left < 0 ? { cls: 'badge', t: 'Регистрация закрыта' }
    : left <= 7 ? { cls: 'badge badge--warn', t: `До дедлайна ${plural(left, 'день', 'дня', 'дней')}` }
      : { cls: 'badge badge--ok', t: `Заявки до ${dateRu(e.deadline)}` };
  return `<article class="card" data-reveal>
      <div class="card__top">
        <span class="badge badge--stage">${esc(evtRu(e.type))}</span>
        <span class="badge">${esc(fmtRu(e.format))}</span>
      </div>
      <h3 class="card__ttl">${esc(e.title)}</h3>
      <div class="kv" style="margin:var(--sp-3) 0">
        <span class="kv__i">${icon('calendar', 'ic--sm')}<span><b>${esc(dateRu(e.date))}</b></span></span>
        <span class="kv__i">${icon('pin', 'ic--sm')}<span>${esc(e.place)}</span></span>
        <span class="kv__i">${icon('flag', 'ic--sm')}<span>${esc(e.org)}</span></span>
      </div>
      <span class="${dl.cls}">${esc(dl.t)}</span>
      <button class="btn btn--ghost btn--full card__act" type="button" data-act="event-open" data-id="${e.id}">Подробнее</button>
      ${isAdmin() ? `<button class="btn btn--danger btn--full btn--sm" style="margin-top:8px" type="button" data-act="admin-event-del" data-id="${e.id}">Удалить</button>` : ''}
    </article>`;
}

export function mentorCard(m) {
  return `<article class="card" data-reveal>
      <div class="row" style="flex-wrap:nowrap">
        ${avatar(m)}
        <div style="min-width:0">
          <h3 class="card__ttl" style="margin-bottom:2px">${esc(m.name)}</h3>
          <p class="card__meta">${esc(m.spec)}</p>
        </div>
      </div>
      <p class="card__txt" style="margin-top:var(--sp-3)">${esc(m.bio)}</p>
      <div class="row row--tight" style="margin-top:var(--sp-4)">
        ${m.skills.map((s) => `<span class="chip chip--skill">${esc(skillRu(s))}</span>`).join('')}
      </div>
      <div class="card__meta-row">
        <span class="card__meta">${icon('award', 'ic--sm')}${esc(m.exp)}</span>
      </div>
      <button class="btn btn--ghost btn--full card__act" type="button" data-act="mentor-ask" data-id="${m.id}">Запросить наставничество</button>
    </article>`;
}

export function emptyState(title, text, btn) {
  return `<div class="empty">${icon('compass')}<h3>${esc(title)}</h3><p>${esc(text)}</p>${btn || ''}</div>`;
}
