import { supabase } from '../../scripts/lib/db.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
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

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('mentors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).json({ message: 'Method Not Allowed' });
}