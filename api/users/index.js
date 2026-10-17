import { supabase } from '../../scripts/db.js';

export default async function handler(req, res) {
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