import { supabase } from '../../scripts/lib/db.js';

// Запрос к одной записи: /api/notifications/:id переписан в /api/notifications?id=:id (см. vercel.json).
// Раньше это был отдельный файл [id].js, но каждый файл в api/ — отдельная serverless-функция,
// а на тарифе Hobby их не может быть больше 12.
async function byId(req, res, id) {
  if (!id) {
    return res.status(400).json({ error: 'ID уведомления не указан' });
  }

  // PATCH
  if (req.method === 'PATCH') {
    try {
      const { read } = req.body;

      const { data, error } = await supabase
        .from('notifications')
        .update({ read: read !== undefined ? read : true })
        .eq('id', id)
        .select();

      if (error) throw error;

      return res.status(200).json(data[0] || { success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // DELETE
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}

export default async function handler(req, res) {
  const { id } = req.query;
  if (id) return byId(req, res, id);

  // GET
  if (req.method === 'GET') {
    try {
      const { user_id } = req.query;

      if (!user_id) {
        return res.status(400).json({ error: 'Параметр user_id обязателен' });
      }

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json(notifications || []);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // PATCH
  if (req.method === 'PATCH') {
    try {
      const { user_id } = req.body;

      if (!user_id) {
        return res.status(400).json({ error: 'Параметр user_id обязателен' });
      }

      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user_id);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  // POST
  if (req.method === 'POST') {
    try {
      const { user_id, header, content } = req.body;

      if (!user_id || !header) {
        return res.status(400).json({ error: 'Заполните обязательные поля user_id и header' });
      }

      const { data, error } = await supabase
        .from('notifications')
        .insert([{ user_id, header, content, read: false }])
        .select();

      if (error) throw error;

      return res.status(201).json(data[0]);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}