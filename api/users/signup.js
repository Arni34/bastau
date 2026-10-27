import { supabase } from '../../scripts/lib/db.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import {
  normEmail, normUsername, isValidEmail, USERNAME_RE,
  emailExists, usernameExists, conflictField,
} from '../../scripts/lib/userchecks.js';

const MAX_LIST = 30;
const str = (v) => (typeof v === 'string' ? v.trim() : '');
const strList = (v) =>
  Array.isArray(v) ? v.filter((x) => typeof x === 'string').map((x) => x.trim()).filter(Boolean).slice(0, MAX_LIST) : [];

const CONFLICT_MSG = {
  email: 'Этот email уже зарегистрирован',
  username: 'Этот username уже занят',
};

const fail = (res, status, error, field) => res.status(status).json(field ? { error, field } : { error });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};

    const username = normUsername(body.username);
    const email = normEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : '';
    const name = str(body.name);

    if (!username || !email || !password || !name) {
      return fail(res, 400, 'Заполните обязательные поля и пароль');
    }
    if (!USERNAME_RE.test(username)) {
      return fail(res, 400, 'Username: только латиница, цифры и _, 3–20 символов', 'username');
    }
    if (!isValidEmail(email)) {
      return fail(res, 400, 'Проверьте формат email', 'email');
    }
    if (password.length < 8 || Buffer.byteLength(password) > 72) {
      return fail(res, 400, 'Пароль: от 8 символов, не длиннее 72 байт', 'password');
    }
    if (name.length > 100) return fail(res, 400, 'Слишком длинное имя', 'name');

    const [emailTaken, usernameTaken] = await Promise.all([emailExists(email), usernameExists(username)]);
    if (emailTaken) return fail(res, 409, CONFLICT_MSG.email, 'email');
    if (usernameTaken) return fail(res, 409, CONFLICT_MSG.username, 'username');

    const password_hash = await bcrypt.hash(password, 10);
    const userId = randomUUID();

    const newUser = {
      id: userId,
      username,
      email,
      password_hash,
      name,
      city: str(body.city).slice(0, 60) || 'Алматы',
      school: str(body.school).slice(0, 100),
      grade: str(body.grade).slice(0, 50),
      bio: str(body.bio).slice(0, 1000) || 'Пока без описания.',
      interests: strList(body.interests),
      skills: strList(body.skills),
      achievements: [],
      events_count: 0,
      joined: new Date().toISOString().slice(0, 10),
    };

    // Users
    const { data, error } = await supabase.from('users').insert([newUser]).select().single();

    if (error) {
      const field = conflictField(error);
      if (field) return fail(res, 409, CONFLICT_MSG[field], field);

      console.error('Supabase insert error:', error);
      return fail(res, 500, 'Не удалось создать профиль. Попробуйте позже.');
    }

    // User statuses
    const { error: statusError } = await supabase.from('user_statuses').insert([{
      user_id: userId,
      role: 'user',
      is_active: true,
    }]);

    if (statusError) {
      console.error('Supabase status insert error:', statusError);
      // Handle statuse save error delete or try again)
    }

    const { password_hash: _omit, ...publicUser } = data;
    return res.status(201).json(publicUser);
  } catch (err) {
    console.error('Signup error:', err);
    return fail(res, 500, 'Внутренняя ошибка сервера');
  }
}