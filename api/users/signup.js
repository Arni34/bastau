import { supabase } from '../../scripts/lib/db.js';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, email, password, name, school, grade, city, interests, skills, bio } = req.body;

    if (!username || !email || !password || !name) {
      return res.status(400).json({ error: 'Заполните обязательные поля и пароль' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const customId = randomUUID();

    const newUser = {
      id: customId,
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password_hash,
      name: name.trim(),
      city: city || 'Алматы',
      school: school?.trim() || '',
      grade: grade?.trim() || '',
      bio: bio?.trim() || 'Пока без описания.',
      interests: interests || [],
      skills: skills || [],
      achievements: [],
      events_count: 0,
      joined: new Date().toISOString().slice(0, 10)
    };

    const { data, error } = await supabase.from('users').insert([newUser]).select().single();

    if (error) {
      console.error('Supabase error details:', error);
      return res.status(400).json({ error: error.message || 'Ошибка базы данных' });
    }

    if (data && data.password_hash) {
      delete data.password_hash;
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Catch block error:', err);
    return res.status(500).json({ error: err.message || 'Внутренняя ошибка сервера' });
  }
}