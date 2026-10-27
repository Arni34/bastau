import { supabase } from '../../scripts/lib/db.js';

export default async function handler(req, res) {
  const { id } = req.query;

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