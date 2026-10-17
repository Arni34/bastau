import { supabase } from '../../scripts/db.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // ID (u0000-0001) or username (@ala)
    const isUsername = !id.startsWith('u');
    const field = isUsername ? 'username' : 'id';

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq(field, id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}