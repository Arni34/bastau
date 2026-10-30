import { supabase } from '../../scripts/lib/db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Get request
    const userId = req.query.user_id;

    // Check User ID
    if (!userId) {
      return res.status(400).json({ error: 'Missing user_id parameter' });
    }

    try {
      // Supabase request
      const { data, error } = await supabase
        .from('user_statuses')
        .select('role, is_active')
        .eq('user_id', userId)
        .maybeSingle();

      // Process error
      if (error) throw error;

      // Default val (if data == null)
      if (!data) {
        return res.status(200).json({ role: 'user', is_active: true });
      }

      // Get responce
      return res.status(200).json(data);
    }
    // Catch server errors
    catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  if (req.method === 'PATCH') {
    try {
      // Get request
      const body = req.body || {};
      const userId = body.user_id || req.query.user_id;
      
      // Check User ID
      if (!userId) {
        return res.status(400).json({ error: 'Missing user_id parameter' });
      }

      // Assemble update data
      const updateData = {};

      if (typeof body.is_active === 'boolean') updateData.is_active = body.is_active;
      if (body.role) updateData.role = body.role;
      if (body.deactivated_at) updateData.deactivated_at = body.deactivated_at;
      if (body.deactivated_reason) updateData.deactivated_reason = body.deactivated_reason;

      // Supabase request
      const { data, error } = await supabase
        .from('user_statuses')
        .update(updateData)
        .eq('user_id', userId)
        .select()
        .single();

      // Process error
      if (error) {
        console.error('Supabase error (user_statuses update):', error);
        return res.status(400).json({ error: error.message });
      }

      // Get responce
      return res.status(200).json(data);
    }
    // Catch server errors
    catch (err) {
      console.error('Server catch error (user-statuses):', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // Allow headers
  res.setHeader('Allow', ['GET', 'PATCH']);
  return res.status(405).json({ error: 'Method not allowed' });
}