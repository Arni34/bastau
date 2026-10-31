import { supabase } from '../../scripts/lib/db.js';

// Запрос к одной записи: /api/mentors/:id переписан в /api/mentors?id=:id (см. vercel.json).
// Раньше это был отдельный файл [id].js, но каждый файл в api/ — отдельная serverless-функция,
// а на тарифе Hobby их не может быть больше 12.
async function byId(req, res, id) {
  if (req.method === 'GET') {
    try {
      const { data: mentor, error } = await supabase
        .from('mentors')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !mentor) {
        return res.status(404).json({ error: 'Ментор не найден' });
      }

      return res.status(200).json(mentor);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('mentors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'DELETE']);
  return res.status(405).json({ message: 'Method Not Allowed' });
}

export default async function handler(req, res) {
  const { id } = req.query;
  if (id) return byId(req, res, id);

  if (req.method === 'GET') {
    try {
      const { data: mentors, error } = await supabase.from('mentors').select('*');
      if (error) throw error;
      return res.status(200).json(mentors);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      const { name, spec, exp, city, bio, contact_email, skills, achievements } = body;

      if (!name) {
        return res.status(400).json({ error: 'Укажите имя ментора' });
      }

      const id = 'm_' + Math.random().toString(36).substring(2, 9);

      const { data, error } = await supabase
        .from('mentors')
        .insert([{ 
          id, 
          name, 
          spec, 
          exp, 
          city, 
          bio, 
          contact_email,
          skills: Array.isArray(skills) ? skills : [],
          achievements: Array.isArray(achievements) ? achievements : []
        }])
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: 'Method Not Allowed' });
}