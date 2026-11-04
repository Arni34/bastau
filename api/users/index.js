import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { supabase } from '../../scripts/lib/db.js';

/* ============================== Доступ ================================
   Редактировать профиль можно только свой, поэтому сервер должен знать,
   кто пришёл. Токен — подпись HMAC от «id пользователя + срок годности»;
   секрет берём из того же ключа Supabase, отдельная переменная не нужна.
   ===================================================================== */
const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret';
const TOKEN_TTL = 1000 * 60 * 60 * 24 * 30;   // 30 дней

const sign = (userId, exp) => crypto.createHmac('sha256', SECRET).update(`${userId}.${exp}`).digest('base64url');

function makeToken(userId) {
  const exp = Date.now() + TOKEN_TTL;
  return `${userId}.${exp}.${sign(userId, exp)}`;
}

function tokenUser(req) {
  const header = req.headers.authorization || '';
  const raw = header.startsWith('Bearer ') ? header.slice(7) : '';
  const [userId, exp, sig] = raw.split('.');
  if (!userId || !exp || !sig || Number(exp) < Date.now()) return null;
  const expected = sign(userId, exp);
  if (sig.length !== expected.length) return null;
  // сравнение за постоянное время: иначе по скорости ответа можно подбирать подпись
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  return userId;
}

/* Поля, которые пользователь может менять у себя. Всё остальное —
   роль, почта, хеш пароля, дата регистрации — через этот эндпоинт не трогается. */
const EDITABLE = ['name', 'school', 'grade', 'city', 'bio', 'skills', 'interests', 'achievements'];

const publicUrl = (id) => `${process.env.SUPABASE_URL}/storage/v1/object/public/avatars/${id}.jpg`;

/* Наружу не отдаём хеш пароля, а почту — только владельцу токена. */
function safe(user, viewerId) {
  const { password_hash, email, ...rest } = user;
  return { ...rest, email: viewerId === user.id ? email : undefined, avatar_url: publicUrl(user.id) };
}

/* ---------------------- Одна запись: /api/users/:id -------------------- */
async function byId(req, res, id) {
  const viewerId = tokenUser(req);
  const isUuid = id.includes('-') || id.length > 30;
  const field = isUuid ? 'id' : 'username';
  const cleanId = !isUuid && id.startsWith('@') ? id.slice(1) : id;

  if (req.method === 'GET') {
    try {
      const { data: user, error } = await supabase.from('users').select('*').eq(field, cleanId).single();
      if (error || !user) return res.status(404).json({ error: 'Пользователь не найден' });
      return res.status(200).json(safe(user, viewerId));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Загрузка аватара: /api/users/<id>?avatar=1, тело — картинка в base64
  if (req.method === 'POST' && req.query.avatar) {
    if (!viewerId || viewerId !== cleanId) return res.status(403).json({ error: 'Можно менять только свой профиль' });
    try {
      const raw = (req.body && req.body.data) || '';
      const base64 = raw.includes(',') ? raw.split(',')[1] : raw;
      if (!base64) return res.status(400).json({ error: 'Файл не передан' });

      const bytes = Buffer.from(base64, 'base64');
      if (bytes.length > 2 * 1024 * 1024) return res.status(413).json({ error: 'Файл больше 2 МБ' });

      // бакет создаётся один раз, при первой загрузке
      try { await supabase.storage.createBucket('avatars', { public: true }); } catch (e) { /* уже есть */ }

      const { error } = await supabase.storage
        .from('avatars')
        .upload(`${cleanId}.jpg`, bytes, { contentType: 'image/jpeg', upsert: true, cacheControl: '3600' });

      if (error) throw error;
      return res.status(200).json({ url: publicUrl(cleanId) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Правка профиля
  if (req.method === 'PATCH') {
    if (!viewerId || viewerId !== cleanId) return res.status(403).json({ error: 'Можно менять только свой профиль' });
    try {
      const body = req.body || {};
      const updates = {};
      EDITABLE.forEach((k) => {
        if (!(k in body)) return;
        const v = body[k];
        if (['skills', 'interests', 'achievements'].includes(k)) {
          updates[k] = Array.isArray(v) ? v.map((x) => String(x).slice(0, 160)).slice(0, 40) : [];
        } else {
          updates[k] = String(v ?? '').slice(0, k === 'bio' ? 600 : 120);
        }
      });
      if (!Object.keys(updates).length) return res.status(400).json({ error: 'Нечего обновлять' });

      const { data, error } = await supabase.from('users').update(updates).eq('id', cleanId).select().single();
      if (error) throw error;
      return res.status(200).json(safe(data, viewerId));
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'POST']);
  return res.status(405).json({ message: 'Method Not Allowed' });
}

/* -------------------------- Список и вход ------------------------------ */
export default async function handler(req, res) {
  const { id } = req.query;
  if (id) return byId(req, res, id);

  // Вход: пароль проверяется здесь, на сервере, сравнением с bcrypt-хешем
  if (req.method === 'POST' && req.query.action === 'login') {
    try {
      const login = String((req.body || {}).login || '').trim().toLowerCase();
      const password = String((req.body || {}).password || '');
      if (!login || !password) return res.status(400).json({ error: 'Введите логин и пароль' });

      const safeLogin = login.replace(/[,.()":%]/g, '');
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.${safeLogin},email.ilike.${login.replace(/[,()":%]/g, '')}`)
        .limit(1);
      if (error) throw error;

      const user = users && users[0];
      // один и тот же ответ на «нет такого пользователя» и «неверный пароль»:
      // иначе форма превращается в проверялку существующих аккаунтов
      const ok = user ? await bcrypt.compare(password, user.password_hash || '') : false;
      if (!ok) return res.status(401).json({ error: 'Неверный логин или пароль' });

      return res.status(200).json({ user: safe(user, user.id), token: makeToken(user.id) });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const viewerId = tokenUser(req);
    const { q, skill, city, interest } = req.query;

    let query = supabase.from('users').select('*');
    if (city) query = query.eq('city', city);
    if (skill) query = query.contains('skills', [skill]);
    if (interest) query = query.contains('interests', [interest]);
    if (q) {
      // экранируем символы, которыми PostgREST разделяет условия фильтра
      const safeQ = String(q).replace(/[,.()":]/g, ' ').trim();
      if (safeQ) query = query.or(`name.ilike.%${safeQ}%,username.ilike.%${safeQ}%,school.ilike.%${safeQ}%,city.ilike.%${safeQ}%`);
    }

    const { data: users, error } = await query.order('joined', { ascending: false });
    if (error) throw error;

    return res.status(200).json((users || []).map((u) => safe(u, viewerId)));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
