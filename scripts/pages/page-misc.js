/* BASTAU - About page | 404 | the "login required" stub */

import { emptyState } from '../global/components.js';

/* About */
export function renderAbout(root) {
  root.innerHTML = `
    <section class="section section--tight">
      <div class="wrap wrap--narrow">
        <span class="eyebrow">О платформе</span>
        <h1 style="font-size:clamp(28px,4.4vw,42px);margin:10px 0 var(--sp-4)">BASTAU — с чего начинается проект</h1>
        <p style="font-size:18px;color:var(--fg-mut)">Мы собрали в одном месте всё, что нужно школьнику и студенту, чтобы довести идею до результата: каталог проектов, поиск команды, мероприятия, менторов и портфолио, которое собирается само.</p>
        <div class="prose" style="margin-top:var(--sp-6)">
          ${[['Идея не теряется', 'Записал мысль — оформил в проект по понятной форме: проблема, решение, цель, нужные навыки.'],
          ['Команда собирается по навыкам', 'Люди ищут друг друга по навыкам, интересам, школе и городу, а не по случайным чатам.'],
          ['Возможности видно заранее', 'Хакатоны, MUN, олимпиады и конкурсы — с дедлайнами и напоминаниями.'],
          ['Результат остаётся с тобой', 'Каждый проект и достижение остаются в профиле и превращаются в портфолио.']]
          .map(([t, d]) => `<div class="card" data-reveal><h3>${t}</h3><p>${d}</p></div>`).join('')}
        </div>
        <div class="row" style="margin-top:var(--sp-6)">
          <a class="btn btn--primary btn--lg" href="#/auth?mode=signup">Создать профиль</a>
          <a class="btn btn--ghost btn--lg" href="#/projects">Смотреть проекты</a>
        </div>
      </div>
    </section>`;
}

/* Warnings */
export function render404(root) {
  root.innerHTML = `<section class="section"><div class="wrap wrap--narrow">
      ${emptyState('Страница не найдена', 'Возможно, проект удалили или ссылка устарела.', '<a class="btn btn--primary" href="#/">На главную</a>')}
    </div></section>`;
}

export function needAuth(root, title, next) {
  root.innerHTML = `<section class="section"><div class="wrap wrap--narrow">
      ${emptyState(title, 'Вход занимает несколько секунд — можно использовать демо-аккаунт.',
    `<div class="row" style="justify-content:center"><a class="btn btn--primary" href="#/auth?next=${encodeURIComponent(next)}">Войти</a>
       <a class="btn btn--ghost" href="#/auth?mode=signup&next=${encodeURIComponent(next)}">Зарегистрироваться</a></div>`)}
    </div></section>`;
}
