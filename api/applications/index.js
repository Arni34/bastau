import { supabase } from '../../scripts/lib/db.js';

// Запрос к одной записи: /api/applications/:id переписан в /api/applications?id=:id (см. vercel.json).
// Раньше это был отдельный файл [id].js, но каждый файл в api/ — отдельная serverless-функция,
// а на тарифе Hobby их не может быть больше 12.
async function byId(req, res, id) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (!id) {
    return res.status(400).json({ error: 'Не указан ID заявки' });
  }

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Заявка не найдена' });

      return res.status(200).json(data);
    } catch (err) {
      console.error('Ошибка получения заявки:', err);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { status } = req.body;

      if (!['pending', 'accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Недопустимый статус заявки' });
      }

      const { data, error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({ success: true, data });
    } catch (err) {
      console.error('Ошибка обновления статуса заявки:', err);
      return res.status(500).json({ error: 'Не удалось обновить статус' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return res.status(200).json({ success: true, message: 'Заявка удалена' });
    } catch (err) {
      console.error('Ошибка удаления заявки:', err);
      return res.status(500).json({ error: 'Не удалось удалить заявку' });
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

export default async function handler(req, res) {
  const { id } = req.query;
  if (id) return byId(req, res, id);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { project_id, user_id, message } = req.body;

      if (!project_id || !user_id) {
        return res.status(400).json({ error: 'Необходимы project_id и user_id' });
      }

      const appId = 'app_' + Math.random().toString(36).substring(2, 11);

      const { data, error } = await supabase
        .from('applications')
        .insert([
          {
            id: appId,
            project_id,
            user_id,
            message: message || '',
            status: 'pending'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return res.status(201).json({ success: true, data });
    } catch (err) {
      console.error('Ошибка создания заявки:', err);
      return res.status(500).json({ error: 'Не удалось отправить заявку' });
    }
  }

  if (req.method === 'GET') {
    try {
      const { project_id, user_id } = req.query;
      let query = supabase.from('applications').select('*');

      if (project_id) query = query.eq('project_id', project_id);
      if (user_id) query = query.eq('user_id', user_id);

      const { data, error } = await query;
      if (error) throw error;

      return res.status(200).json(data);
    } catch (err) {
      console.error('Ошибка получения заявок:', err);
      return res.status(500).json({ error: 'Не удалось получить заявки' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}