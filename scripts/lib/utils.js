/* BASTAU - small DOM & formatting helpers */

import { D } from '../global/globals.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
export const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const uid = (p) => p + Math.random().toString(36).slice(2, 8);
export const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${n}"/></svg>`;
export const initials = (name) => String(name || 'U').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const label = (list, id) => (list.find((x) => x.id === id) || {}).ru || id || '—';
export const catRu = (id) => label(D.CATEGORIES, id);
export const stageRu = (id) => label(D.STAGES, id);
export const fmtRu = (id) => label(D.FORMATS, id);
export const langRu = (id) => label(D.LANGS, id);
export const evtRu = (id) => label(D.EVENT_TYPES, id);
export const skillRu = (s) => D.SKILLS_RU[s] || s;
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
export function dateRu(iso) { const d = new Date(iso); return isNaN(d) ? '—' : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; }
export function daysLeft(iso) { return Math.ceil((new Date(iso) - new Date()) / 86400000); }
export function plural(n, a, b, c) { const m = n % 100, k = n % 10; return n + ' ' + (m > 10 && m < 20 ? c : k === 1 ? a : k > 1 && k < 5 ? b : c); }
export const words = (s) => s.split(' ').map((w) => `<span class="w">${w}</span>`).join(' ');
