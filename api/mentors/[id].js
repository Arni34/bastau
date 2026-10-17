import { supabase } from '../../scripts/db.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { data: mentor, error } = await supabase
      .from('mentors')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !mentor) {
      return res.status(404).json({ error: 'Ментор не найден' });
    }

    return res.status(200).json(mentor);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}