import { supabase } from '../../scripts/lib/db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const userId = req.query.user_id;
    if (!userId) {
      return res.status(400).json({ error: 'Missing user_id parameter' });
    }

    try {
      const { data, error } = await supabase
        .from('user_statuses')
        .select('role, is_active')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        return res.status(200).json({ role: 'user', is_active: true });
      }

      return res.status(200).json(data);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const body = req.body || {};
      const userId = body.user_id || req.query.user_id;
      
      if (!userId) {
        return res.status(400).json({ error: 'Missing user_id parameter' });
      }

      const updateData = {};
      if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active;
      if (body.role) updateData.role = body.role;

      const { data, error } = await supabase
        .from('user_statuses')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error (user_statuses update):', error);
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json(data);
    } catch (err) {
      console.error('Server catch error (user-statuses):', err);
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  return res.status(405).json({ error: 'Method not allowed' });
}