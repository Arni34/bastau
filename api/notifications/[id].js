import { supabase } from '../../scripts/lib/db.js';

export default async function handler(req, res) {
  const { id } = req.query;

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