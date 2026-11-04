/* BASTAU - session storage & current-user helpers */

import { uid } from './utils.js';

const KEY_SESSION = 'bastau_session_user';
const KEY_TOKEN = 'bastau_session_token';

let currentUser = getStoredSession();

function getStoredSession() {
  try {
    const raw = localStorage.getItem(KEY_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setSession(user, token) {
  currentUser = user;
  try {
    if (user) {
      localStorage.setItem(KEY_SESSION, JSON.stringify(user));
      if (token) localStorage.setItem(KEY_TOKEN, token);
    } else {
      localStorage.removeItem(KEY_SESSION);
      localStorage.removeItem(KEY_TOKEN);
    }
  } catch (e) {}
}

/* Токен подтверждает серверу, что правки профиля делает их владелец.
   Без него API отвечает 403 — изменить чужой аккаунт из браузера нельзя. */
export function token() {
  try { return localStorage.getItem(KEY_TOKEN) || ''; } catch (e) { return ''; }
}

export function authHeaders(extra) {
  const t = token();
  return Object.assign({}, extra || {}, t ? { Authorization: `Bearer ${t}` } : {});
}

export const me = () => currentUser;
export const isAdmin = () => false; // DEMO - Get from user_statuses
export const userById = (id) => ({ id, name: 'Пользователь', username: 'user', city: '—', school: '—', grade: '—', skills: [], interests: [], achievements: [], eventsCount: 0, bio: '' });
const myProjects = (id) => [];
const myTeams = (id) => [];
const myApps = (id) => [];
const incomingApps = (id) => [];
const myNotifs = (id) => [];
export const unread = (id) => 0;

export function notify(userId, type, text, href) {
  db.notifications.push({ id: uid('n'), userId, type, text, href: href || '', read: false, createdAt: new Date().toISOString() });
}