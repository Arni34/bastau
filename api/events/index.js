import { supabase } from '../../scripts/lib/db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
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

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const { title, org, date, reg_deadline, place, format, type, about } = body;

      if (!title || !org || !date) {
        return res.status(400).json({ error: 'Заполните обязательные поля' });
      }

      const id = 'ev_' + Math.random().toString(36).substring(2, 9);

      const { data, error } = await supabase
        .from('events')
        .insert([{ 
          id,
          title, 
          org, 
          date, 
          reg_deadline: reg_deadline || null, 
          place, 
          format, 
          type, 
          about 
        }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: 'Method Not Allowed' });
}