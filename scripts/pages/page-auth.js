/* BASTAU - Sign in / sign up page */

import { $, icon, esc, skillRu, dateRu } from '../lib/utils.js';
import { setSession } from '../lib/session.js';

import { D } from '../global/globals.js';
import { toast } from '../global/modals.js';
import { validate, required, minLen, fieldError, chipPicker, pickerValue } from '../global/forms.js';
import { go } from '../pages/router.js';

export function renderAuth(root, _arg, params) {
  const mode = params.get('mode') === 'signup' ? 'signup' : 'login';
  const next = params.get('next') || '#/dashboard';

  root.innerHTML = `
    <section class="section section--tight">
      <div class="wrap wrap--narrow">
        <div class="card" style="border-radius:var(--r-xl);padding:var(--sp-6)">
          <div class="tabs" style="margin-bottom:var(--sp-5)">
            <a class="tab${mode === 'login' ? ' is-on' : ''}" href="#/auth?mode=login&next=${encodeURIComponent(next)}">Вход</a>
            <a class="tab${mode === 'signup' ? ' is-on' : ''}" href="#/auth?mode=signup&next=${encodeURIComponent(next)}">Регистрация</a>
          </div>
          <div id="auth-body"></div>
        </div>
      </div>
    </section>`;

  const body = $('#auth-body', root);
  if (mode === 'login') {
    body.innerHTML = `
        <h1 style="font-size:26px;margin-bottom:var(--sp-2)">С возвращением</h1>
        <p style="color:var(--fg-mut);margin-bottom:var(--sp-5)">Войди, чтобы продолжить работу над проектами.</p>
        <form class="form" data-form="login" novalidate>
          <div class="field"><label for="l-id">Email или username <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="l-id" name="login" autocomplete="username" placeholder="ala или ala@example.kz" required />
            <span class="field__err" data-err="login" role="alert"></span></div>
          <div class="field"><label for="l-pw">Пароль <span class="req" aria-hidden="true">*</span></label>
            <div class="field__wrap">
              <input class="input" id="l-pw" name="password" type="password" autocomplete="current-password" style="padding-right:52px" required />
              <button class="ib field__btn" type="button" data-act="pw-toggle" aria-label="Показать пароль">${icon('eye')}</button>
            </div>
            <span class="field__err" data-err="password" role="alert"></span></div>
          <div class="row" style="justify-content:space-between">
            <button class="btn btn--ghost btn--sm" type="button" data-act="pw-reset">Забыли пароль?</button>
            <button class="btn btn--primary" type="submit">Войти ${icon('arrow', 'ic--sm ic--arrow')}</button>
          </div>
        </form>`;

    $('[data-form="login"]', body).addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      if (!validate(form, { login: required('Введите email или username'), password: minLen(6, 'Пароль от 6 символов') })) return;
        
      const loginVal = new FormData(form).get('login').toString().trim().toLowerCase();
        
      try {
        const res = await fetch('/api/users');
        const users = await res.json();
        const user = users.find((x) => x.username.toLowerCase() === loginVal || (x.email || '').toLowerCase() === loginVal);

        if (!user) {
          fieldError(form, 'login', 'Аккаунт не найден.');
          toast('Аккаунт не найден', 'err');
          return;
        }

        try {
          const resStatus = await fetch(`/api/user-statuses?user_id=${user.id}`);
          if (resStatus.ok) {
            const statusData = await resStatus.json();
            user.role = statusData.role || 'user';
            user.is_active = statusData.is_active ?? true;
            user.deactivated_at = statusData.deactivated_at;
            user.deactivated_reason = statusData.deactivated_reason || '';
            
          }
        } catch (e) {
          user.role = 'user';
          user.is_active = true;
        }

        if (user.is_active === false) {
          showDeactivatedModal(user.deactivated_reason);
          return;
        }

        setSession(user);
        toast(`Привет, ${user.name.split(' ')[0]}!`, 'ok');
        go(next);
      } catch (err) {
        console.error(err);
        toast('Ошибка авторизации', 'err');
      }
    });
  } else {
    body.innerHTML = signupStep(1, signupState);
    bindSignup(body, next);
  }
}

function showDeactivatedModal(reason) {
  let modal = document.getElementById('deactivated-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'deactivated-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px;';
    document.body.appendChild(modal);
  }

  const reasonText = reason ? esc(reason) : 'Причина не указана администрацией.';

  modal.innerHTML = `
    <div style="background:var(--bg, #fff);padding:24px;border-radius:16px;width:100%;max-width:440px;box-shadow:0 10px 25px rgba(0,0,0,0.15);display:flex;flex-direction:column;gap:16px;">
      <div style="display:flex;align-items:center;gap:12px;color:var(--err-color, #e53935);">
        <div style="background:rgba(229,57,53,0.1);padding:8px;border-radius:50%;display:flex;">
          ${icon('alert', 'ic--md')}
        </div>
        <h3 style="margin:0;font-size:20px;color:var(--fg, #111);">Аккаунт деактивирован</h3>
      </div>
      
      <p style="margin:0;font-size:14px;color:var(--fg-mut, #666);line-height:1.5;">
        Ваш аккаунт был заблокирован.
      </p>

      <div style="background:var(--bg-subtle, #f5f5f5);padding:14px;border-radius:8px;border-left:3px solid var(--err-color, #e53935);">
        <div style="font-size:12px;color:var(--fg-mut, #888);margin-bottom:4px;font-weight:600;">ПРИЧИНА БЛОКИРОВКИ:</div>
        <div style="font-size:14px;color:var(--fg, #111);line-height:1.4;">${reasonText}</div>
      </div>

      <p style="margin:0;font-size:13px;color:var(--fg-mut, #666);">
        Если вы считаете, что это произошло по ошибке, обратитесь в службу поддержки.
      </p>

      <div style="display:flex;justify-content:flex-end;margin-top:8px;">
        <button type="button" id="deactivated-modal-close" class="btn btn--primary">Понятно</button>
      </div>
    </div>`;

  modal.style.display = 'flex';

  const closeBtn = document.getElementById('deactivated-modal-close');
  const closeModal = () => { modal.style.display = 'none'; };

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
}

const signupState = {};

const CONFLICT_MSG = {
  email: 'Этот email уже зарегистрирован. Войдите или используйте другой адрес.',
  username: 'Этот username уже занят.',
};

const normEmail = (v) => String(v || '').trim().toLowerCase();

async function isEmailFree(email) {
  try {
    const res = await fetch(`/api/users/email-available?email=${encodeURIComponent(email)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.available === 'boolean' ? data.available : null;
  } catch (err) {
    return null;
  }
}

function showConflict(form, field) {
  const msg = CONFLICT_MSG[field];
  fieldError(form, field, msg);
  const input = form.querySelector(`[name="${field}"]`);
  if (input) input.focus();
  toast(msg, 'err');
}

function resetSignupState() {
  Object.keys(signupState).forEach((k) => delete signupState[k]);
}

function signupStep(step, data) {
  const bar = `<div class="steps" role="group" aria-label="Шаг ${step} из 3">
      ${[1, 2, 3].map((i) => `<span class="steps__i ${i < step ? 'is-done' : i === step ? 'is-on' : ''}"></span>`).join('')}
    </div><p class="field__hint" style="margin-bottom:var(--sp-4)">Шаг ${step} из 3</p>`;

  if (step === 1) {
    return `${bar}<h1 style="font-size:26px;margin-bottom:var(--sp-2)">Создай аккаунт</h1>
      <p style="color:var(--fg-mut);margin-bottom:var(--sp-5)">Начнём с основного — это займёт минуту.</p>
      <form class="form" data-form="signup" data-step="1" novalidate>
        <div class="grid-2">
          <div class="field"><label for="s-name">Имя и фамилия <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="s-name" name="name" autocomplete="name" value="${esc(data.name || '')}" required /><span class="field__err" data-err="name" role="alert"></span></div>
          <div class="field"><label for="s-user">Username <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="s-user" name="username" autocomplete="username" value="${esc(data.username || '')}" placeholder="latin_nick" required /><span class="field__err" data-err="username" role="alert"></span></div>
          <div class="field"><label for="s-mail">Email <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="s-mail" name="email" type="email" inputmode="email" autocomplete="email" value="${esc(data.email || '')}" required /><span class="field__err" data-err="email" role="alert"></span></div>
          <div class="field"><label for="s-pw">Пароль <span class="req" aria-hidden="true">*</span></label>
            <div class="field__wrap"><input class="input" id="s-pw" name="password" type="password" autocomplete="new-password" style="padding-right:52px" required />
              <button class="ib field__btn" type="button" data-act="pw-toggle" aria-label="Показать пароль">${icon('eye')}</button></div>
            <span class="field__hint">Минимум 8 символов.</span><span class="field__err" data-err="password" role="alert"></span></div>
        </div>
        <div class="row" style="justify-content:flex-end"><button class="btn btn--primary" type="submit">Дальше ${icon('arrow', 'ic--sm ic--arrow')}</button></div>
      </form>`;
  }
  if (step === 2) {
    return `${bar}<h1 style="font-size:26px;margin-bottom:var(--sp-2)">Где ты учишься</h1>
      <p style="color:var(--fg-mut);margin-bottom:var(--sp-5)">Так проще находить команду рядом с тобой.</p>
      <form class="form" data-form="signup" data-step="2" novalidate>
        <div class="grid-2">
          <div class="field"><label for="s-school">Школа или колледж <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="s-school" name="school" value="${esc(data.school || '')}" required /><span class="field__err" data-err="school" role="alert"></span></div>
          <div class="field"><label for="s-grade">Класс или курс <span class="req" aria-hidden="true">*</span></label>
            <input class="input" id="s-grade" name="grade" value="${esc(data.grade || '')}" placeholder="11 класс / 1 курс" required /><span class="field__err" data-err="grade" role="alert"></span></div>
          <div class="field"><label for="s-city">Город</label>
            <select class="select" id="s-city" name="city">${D.CITIES.map((c) => `<option ${data.city === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
        </div>
        <div class="row" style="justify-content:space-between"><button class="btn btn--ghost" type="button" data-act="signup-back">Назад</button>
          <button class="btn btn--primary" type="submit">Дальше ${icon('arrow', 'ic--sm ic--arrow')}</button></div>
      </form>`;
  }
  return `${bar}<h1 style="font-size:26px;margin-bottom:var(--sp-2)">Интересы и навыки</h1>
      <p style="color:var(--fg-mut);margin-bottom:var(--sp-5)">По ним тебя найдут команды — и мы подберём проекты.</p>
      <form class="form" data-form="signup" data-step="3" novalidate>
        <fieldset class="fieldset"><legend>Интересы <span class="req" aria-hidden="true">*</span></legend>
          ${chipPicker('interests', D.CATEGORIES, [])}<span class="field__err" data-err="interests" role="alert"></span></fieldset>
        <fieldset class="fieldset"><legend>Навыки <span class="req" aria-hidden="true">*</span></legend>
          ${chipPicker('skills', D.SKILLS, [], skillRu)}<span class="field__err" data-err="skills" role="alert"></span></fieldset>
        <div class="field"><label for="s-bio">О себе и опыте</label>
          <textarea class="textarea" id="s-bio" name="bio" placeholder="Чем занимался, в каких конкурсах участвовал, что хочешь делать" style="min-height:100px"></textarea></div>
        <div class="row" style="justify-content:space-between"><button class="btn btn--ghost" type="button" data-act="signup-back">Назад</button>
          <button class="btn btn--primary btn--lg" type="submit">Создать профиль</button></div>
      </form>`;
}

function bindSignup(body, next) {
  body.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-form="signup"]');
    if (!form) return;
    e.preventDefault();
    const step = Number(form.dataset.step);
    const fd = new FormData(form);

    if (step === 1) {
      const ok = validate(form, {
        name: required('Введите имя и фамилию'),
        username: (v) => (!v ? 'Придумайте username' : !/^[a-z0-9_]{3,20}$/i.test(v) ? 'Только латиница, цифры и _, 3–20 символов' : ''),
        email: (v) => (!v ? 'Введите email' : /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? '' : 'Проверьте формат email'),
        password: minLen(8, 'Минимум 8 символов'),
      });
      if (!ok) return;

      const email = normEmail(fd.get('email'));

      const nextBtn = form.querySelector('button[type="submit"]');
      if (nextBtn) nextBtn.disabled = true;
      const free = await isEmailFree(email);
      if (nextBtn) nextBtn.disabled = false;

      if (free === false) {
        showConflict(form, 'email');
        return;
      }

      Object.assign(signupState, {
        name: fd.get('name').toString().trim(),
        username: fd.get('username').toString().trim(),
        email,
        password: fd.get('password').toString(),
      });
      body.innerHTML = signupStep(2, signupState);
    } else if (step === 2) {
      if (!validate(form, { school: required('Укажите школу или колледж'), grade: required('Укажите класс или курс') })) return;
      Object.assign(signupState, { school: fd.get('school').toString().trim(), grade: fd.get('grade').toString().trim(), city: fd.get('city').toString() });
      body.innerHTML = signupStep(3, signupState);
    } else {
      const ok = validate(form, {
        interests: (v) => (v ? '' : 'Отметьте хотя бы один интерес'),
        skills: (v) => (v ? '' : 'Отметьте хотя бы один навык'),
      });
      if (!ok) return;

      const payload = {
        ...signupState,
        email: normEmail(signupState.email),
        interests: pickerValue(form, 'interests'),
        skills: pickerValue(form, 'skills'),
        bio: (fd.get('bio') || '').toString().trim(),
      };

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch('/api/users/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));

        if (res.status === 409 && CONFLICT_MSG[data.field]) {
          body.innerHTML = signupStep(1, signupState);
          showConflict($('[data-form="signup"]', body), data.field);
          return;
        }

        if (!res.ok) {
          toast(data.error || 'Ошибка регистрации', 'err');
          if (submitBtn) submitBtn.disabled = false;
          return;
        }

        data.role = 'user';

        resetSignupState();
        setSession(data);
        toast('Профиль успешно создан!', 'ok');
        go(next);
      } catch (err) {
        console.error(err);
        toast('Ошибка соединения с сервером', 'err');
        if (submitBtn) submitBtn.disabled = false;
      }
    }
  });

  body.addEventListener('click', (e) => {
    if (!e.target.closest('[data-act="signup-back"]')) return;
    const step = Number($('[data-form="signup"]', body).dataset.step);
    body.innerHTML = signupStep(step - 1, signupState);
  });
}