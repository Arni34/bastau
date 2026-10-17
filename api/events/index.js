import { supabase } from '../../scripts/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { type } = req.query;
    let query = supabase.from('events').select('*');

    if (type) query = query.eq('type', type);

    const { data: events, error } = await query.order('date', { ascending: true });

    if (error) throw error;

    return res.status(200).json(events);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}