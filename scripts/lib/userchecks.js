/* Общие проверки пользователя, валидация и встроенный лимитер */
import { supabase } from './db.js';

export const EMAIL_MAX = 254;
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

/* Нормализация строк (регистр, обрезка пробелов) */
const normStr = (v) => (typeof v === 'string' ? v.trim().toLowerCase() : '');
export const normEmail = normStr;
export const normUsername = normStr;

export const isValidEmail = (email) => email.length <= EMAIL_MAX && EMAIL_RE.test(email);

async function exists(column, value) {
  const { data, error } = await supabase.from('users').select('id').eq(column, value).limit(1);
  if (error) throw error;
  return data.length > 0;
}

export const emailExists = (email) => exists('email', email);
export const usernameExists = (username) => exists('username', username);

/**
 * Какое поле нарушило уникальный индекс (Postgres 23505).
 */
export function conflictField(error) {
  if (!error || error.code !== '23505') return null;
  const text = `${error.message || ''} ${error.details || ''}`.toLowerCase();
  if (text.includes('email')) return 'email';
  if (text.includes('username')) return 'username';
  return null;
}

/* --- Встроенный модуль лимитера (ранее rateLimit.js) --- */

const hits = new Map();

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  return (typeof fwd === 'string' && fwd.split(',')[0].trim()) || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
}

/** true — лимит превышен. */
export function rateLimited(key, { limit = 60, windowMs = 60_000 } = {}) {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
  }
  const rec = hits.get(key);
  if (!rec || now > rec.reset) {
    hits.set(key, { count: 1, reset: now + windowMs });
    return false;
  }
  rec.count += 1;
  return rec.count > limit;
}