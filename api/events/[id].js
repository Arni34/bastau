import { supabase } from '../../scripts/db.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !event) {
      return res.status(404).json({ error: 'Мероприятие не найдено' });
    }

    return res.status(200).json(event);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}