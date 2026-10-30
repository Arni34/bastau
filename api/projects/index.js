import { supabase } from '../../scripts/lib/db.js';

export default async function handler(req, res) {
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
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}