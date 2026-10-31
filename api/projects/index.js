import { supabase } from '../../scripts/lib/db.js';

// Запрос к одной записи: /api/projects/:id переписан в /api/projects?id=:id (см. vercel.json).
// Раньше это был отдельный файл [id].js, но каждый файл в api/ — отдельная serverless-функция,
// а на тарифе Hobby их не может быть больше 12.
async function byId(req, res, id) {
  if (!['GET', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    if (req.method === 'GET') {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .neq('deleted', true)
        .maybeSingle();

      if (error || !project) {
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
        .update({ deleted: true, deleted_at: new Date().toISOString() })
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

export default async function handler(req, res) {
  const { id } = req.query;
  if (id) return byId(req, res, id);

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { q, cat, city, skill, stage, fmt, lang, team, deleted } = req.query;

    let query = supabase.from('projects').select('*');

    if (deleted === 'true') {
      query = query.eq('deleted', true);
    } 
    else if (deleted === 'all') {
    } else {
      query = query.or('deleted.is.null,deleted.eq.false');
    }

    if (cat) query = query.eq('category', cat);
    if (city) query = query.eq('city', city);
    if (stage) query = query.eq('stage', stage);
    if (fmt) query = query.eq('format', fmt);
    if (lang) query = query.eq('lang', lang);
    if (team === '1') query = query.eq('need_team', true);
    if (skill) query = query.contains('skills', [skill]);
    
    if (q) {
      query = query.or(`title.ilike.%${q}%,summary.ilike.%${q}%,problem.ilike.%${q}%`);
    }

    const { data: projects, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json(projects);
  }
  catch (err) {
    return res.status(500).json({ error: err.message });
  }
}