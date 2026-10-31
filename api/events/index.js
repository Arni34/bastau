import { supabase } from '../../scripts/lib/db.js';

// Запрос к одной записи: /api/events/:id переписан в /api/events?id=:id (см. vercel.json).
// Раньше это был отдельный файл [id].js, но каждый файл в api/ — отдельная serverless-функция,
// а на тарифе Hobby их не может быть больше 12.
async function byId(req, res, id) {
  if (req.method === 'GET') {
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

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('events')
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

export default async function handler(req, res) {
  const { id } = req.query;
  if (id) return byId(req, res, id);

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