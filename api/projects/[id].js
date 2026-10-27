import { supabase } from '../../scripts/lib/db.js';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!['GET', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    if (req.method === 'GET') {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !project || project.deleted) {
        return res.status(404).json({ error: 'Проект не найден' });
      }

      return res.status(200).json(project);
    }

    if (req.method === 'PATCH') {
      const updates = req.body;

      const { data: updatedProject, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json(updatedProject);
    }

    if (req.method === 'DELETE') {
      const { data: updatedProject, error } = await supabase
        .from('projects')
        .update({ deleted: true })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      return res.status(200).json({ success: true, data: updatedProject });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}