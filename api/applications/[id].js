import { supabase } from '../../scripts/lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

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