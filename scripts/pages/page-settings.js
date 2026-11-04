/* BASTAU - Account settings: профиль, аватар, навыки и портфолио */

import { $, esc, icon, initials } from '../lib/utils.js';
import { me, setSession, authHeaders } from '../lib/session.js';
import { D, M } from '../global/globals.js';
import { chipPicker, pickerValue, validate, required } from '../global/forms.js';
import { toast } from '../global/modals.js';
import { needAuth } from './page-misc.js';

const AVATAR_PX = 512;          // в базу кладём квадрат 512×512 — этого хватает везде
const AVATAR_QUALITY = 0.82;

/* Фото с телефона весит 3–8 МБ. Отправлять такое незачем: ужимаем в браузере
   до квадрата 512×512, обрезая по центру, и шлём ~100 КБ вместо мегабайтов. */
function squashImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Это не похоже на картинку'));
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = AVATAR_PX;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, AVATAR_PX, AVATAR_PX);
        resolve(canvas.toDataURL('image/jpeg', AVATAR_QUALITY));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function renderSettings(root) {
  const current = me();
  if (!current) return needAuth(root, 'Настройки доступны после входа', '#/settings');

  root.innerHTML = '<div class="wrap" style="padding:var(--sp-7) 0"><p>Загружаем профиль…</p></div>';

  let u;
  try {
    const res = await fetch(`/api/users/${current.id}`, { headers: authHeaders() });
    if (!res.ok) throw new Error('not found');
    u = await res.json();
  } catch (e) {
    u = current;
  }

  const skills = u.skills || [];
  const interests = u.interests || [];
  const achievements = u.achievements || [];

  root.innerHTML = `
  <section class="section section--tight">
    <div class="wrap wrap--narrow">
      <span class="eyebrow">Аккаунт</span>
      <h1 style="font-size:clamp(26px,4vw,38px);margin:10px 0 var(--sp-2)">Настройки профиля</h1>
      <p style="color:var(--fg-mut)">Всё, что видят другие участники: фото, данные о себе, навыки и портфолио.</p>

      <form class="form" style="margin-top:var(--sp-6)" data-form="settings" novalidate>

        <div class="card">
          <h3 style="font-size:17px;margin-bottom:var(--sp-4)">Фотография</h3>
          <div class="row" style="flex-wrap:nowrap;gap:var(--sp-4)">
            <span class="avatar avatar--lg" id="ava-box">
              <img id="ava-img" src="${esc(u.avatar_url || '')}" alt="" />
              <span id="ava-ini">${esc(initials(u.name))}</span>
            </span>
            <div style="min-width:0">
              <input type="file" id="ava-file" accept="image/*" hidden />
              <button class="btn btn--ghost btn--sm" type="button" data-act="ava-pick">Выбрать фото</button>
              <p class="field__hint" style="margin-top:8px">JPG или PNG. Картинка обрежется в квадрат и уменьшится до 512 пикселей — грузить тяжёлый файл не нужно.</p>
              <p class="field__err" id="ava-err" role="alert"></p>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="field"><label for="st-name">Имя и фамилия <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="st-name" name="name" value="${esc(u.name || '')}" maxlength="120" required />
            <span class="field__err" data-err="name" role="alert"></span></div>
          <div class="field"><label for="st-city">Город</label>
            <select class="select" id="st-city" name="city">${D.CITIES.map((c) => `<option ${c === u.city ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
          <div class="field"><label for="st-school">Школа, колледж или вуз <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="st-school" name="school" value="${esc(u.school || '')}" maxlength="120" required />
            <span class="field__err" data-err="school" role="alert"></span></div>
          <div class="field"><label for="st-grade">Класс или курс <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="st-grade" name="grade" value="${esc(u.grade || '')}" maxlength="40" placeholder="11 класс / 1 курс" required />
            <span class="field__err" data-err="grade" role="alert"></span></div>
        </div>

        <div class="field">
          <label for="st-bio">О себе</label>
          <textarea class="textarea" id="st-bio" name="bio" maxlength="600" placeholder="Чем занимаешься, что умеешь, что хочешь делать">${esc(u.bio || '')}</textarea>
          <span class="field__hint">До 600 символов. Это первое, что читают в профиле.</span>
        </div>

        <fieldset class="fieldset">
          <legend>Навыки</legend>
          ${chipPicker('skills', D.SKILLS, skills, (s) => (D.SKILLS_RU[s] || s))}
          <span class="field__hint" style="display:block;margin-top:8px">По ним тебя найдут команды в разделе «Люди».</span>
        </fieldset>

        <fieldset class="fieldset">
          <legend>Интересы</legend>
          ${chipPicker('interests', D.CATEGORIES, interests)}
        </fieldset>

        <div class="card">
          <h3 style="font-size:17px;margin-bottom:6px">Портфолио</h3>
          <p class="field__hint" style="margin-bottom:var(--sp-4)">Олимпиады, конкурсы, MUN, хакатоны, сертификаты — всё, что стоит показать. Появится в профиле отдельным блоком.</p>
          <div id="ach-list"></div>
          <div class="row row--tight" style="margin-top:var(--sp-3)">
            <input class="input" id="ach-new" style="flex:1 1 260px" maxlength="160" placeholder="Например: 1 место, республиканская олимпиада 2026" />
            <button class="btn btn--ghost" type="button" data-act="ach-add">${icon('plus', 'ic--sm')}Добавить</button>
          </div>
        </div>

        <div class="row" style="justify-content:flex-end">
          <a class="btn btn--ghost" href="#/profile/${esc(u.username)}">Отмена</a>
          <button class="btn btn--primary btn--lg" type="submit">Сохранить</button>
        </div>
      </form>
    </div>
  </section>`;

  /* ----------------------------- Портфолио ---------------------------- */
  const items = achievements.slice();

  function paintAchievements() {
    const box = $('#ach-list', root);
    box.innerHTML = items.length
      ? items.map((a, i) => `
          <div class="member">
            <span class="tl__dot">${icon('award', 'ic--sm')}</span>
            <div style="flex:1;min-width:0"><div class="member__n">${esc(a)}</div></div>
            <button class="ib" type="button" data-act="ach-del" data-i="${i}" aria-label="Удалить: ${esc(a)}">${icon('trash', 'ic--sm')}</button>
          </div>`).join('')
      : '<p class="field__hint">Пока пусто. Добавь первую строку — например, участие в олимпиаде.</p>';
  }
  paintAchievements();

  const addAchievement = () => {
    const input = $('#ach-new', root);
    const value = input.value.trim();
    if (!value) return;
    if (items.length >= 40) { toast('Больше 40 пунктов не поместится', 'err'); return; }
    items.push(value);
    input.value = '';
    paintAchievements();
  };

  root.addEventListener('click', (e) => {
    const add = e.target.closest('[data-act="ach-add"]');
    if (add) { addAchievement(); return; }
    const del = e.target.closest('[data-act="ach-del"]');
    if (del) { items.splice(Number(del.dataset.i), 1); paintAchievements(); return; }
    if (e.target.closest('[data-act="ava-pick"]')) $('#ava-file', root).click();
  });

  $('#ach-new', root).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addAchievement(); }
  });

  /* ------------------------------ Аватар ------------------------------ */
  const img = $('#ava-img', root);
  const ini = $('#ava-ini', root);
  const showInitials = () => { img.style.display = 'none'; ini.style.display = ''; };
  const showPhoto = () => { img.style.display = ''; ini.style.display = 'none'; };
  img.addEventListener('error', showInitials);
  if (img.getAttribute('src')) showPhoto(); else showInitials();

  $('#ava-file', root).addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const err = $('#ava-err', root);
    err.textContent = '';
    try {
      const dataUrl = await squashImage(file);
      const res = await fetch(`/api/users/${u.id}?avatar=1`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ data: dataUrl }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || 'Не удалось загрузить');

      // к адресу добавляем метку времени, иначе браузер покажет старое фото из кэша
      img.src = `${out.url}?t=${Date.now()}`;
      showPhoto();
      setSession(Object.assign({}, me(), { avatar_url: out.url }));
      toast('Фото обновлено', 'ok');
    } catch (ex) {
      err.textContent = ex.message;
      toast(ex.message, 'err');
    }
  });

  /* ------------------------------ Сохранение --------------------------- */
  $('[data-form="settings"]', root).addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const ok = validate(form, {
      name: required('Введите имя и фамилию'),
      school: required('Укажите место учёбы'),
      grade: required('Укажите класс или курс'),
    });
    if (!ok) { toast('Проверьте выделенные поля', 'err'); return; }

    const btn = $('[type="submit"]', form);
    btn.disabled = true;
    const fd = new FormData(form);

    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PATCH',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          name: fd.get('name').toString().trim(),
          school: fd.get('school').toString().trim(),
          grade: fd.get('grade').toString().trim(),
          city: fd.get('city').toString(),
          bio: (fd.get('bio') || '').toString().trim(),
          skills: pickerValue(form, 'skills'),
          interests: pickerValue(form, 'interests'),
          achievements: items,
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.error || 'Не удалось сохранить');

      setSession(Object.assign({}, me(), out));
      toast('Профиль сохранён', 'ok');
      location.hash = `#/profile/${out.username || u.username}`;
    } catch (ex) {
      toast(ex.message, 'err');
      btn.disabled = false;
    }
  });

  if (M && M.reveal) M.reveal(root);
}
