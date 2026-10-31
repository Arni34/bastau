import { supabase } from '../../scripts/lib/db.js';

export default async function handler(req, res) {
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