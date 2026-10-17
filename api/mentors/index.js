import { supabase } from '../../scripts/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { data: mentors, error } = await supabase.from('mentors').select('*');
    if (error) throw error;
    return res.status(200).json(mentors);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}