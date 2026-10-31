import { supabase } from '../../scripts/lib/db.js';

// Запрос к одной записи: /api/users/:id переписан в /api/users?id=:id (см. vercel.json).
// Раньше это был отдельный файл [id].js, но каждый файл в api/ — отдельная serverless-функция,
// а на тарифе Hobby их не может быть больше 12.
async function byId(req, res, id) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const isUuid = id.includes('-') || id.length > 30;
    const field = isUuid ? 'id' : 'username';

    const cleanId = !isUuid && id.startsWith('@') ? id.slice(1) : id;

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq(field, cleanId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export default async function handler(req, res) {
  const { id } = req.query;
  if (id) return byId(req, res, id);

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { q, skill, city, interest } = req.query;

    let query = supabase.from('users').select('*');

    if (city) query = query.eq('city', city);
    if (skill) query = query.contains('skills', [skill]);
    if (interest) query = query.contains('interests', [interest]);

    if (q) {
      query = query.or(`name.ilike.%${q}%,username.ilike.%${q}%,school.ilike.%${q}%,city.ilike.%${q}%`);
    }

    const { data: users, error } = await query.order('joined', { ascending: false });

    if (error) throw error;

    return res.status(200).json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}