import { supabase } from '../../scripts/lib/db.js';

export default async function handler(req, res) {
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