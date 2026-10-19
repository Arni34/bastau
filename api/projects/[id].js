import { supabase } from '../../scripts/lib/db.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !project) {
      return res.status(404).json({ error: 'Проект не найден' });
    }

    return res.status(200).json(project);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}