import { supabase } from '../../scripts/lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      title,
      summary,
      problem,
      solution,
      goal,
      category,
      skills,
      stage,
      teamSize,
      city,
      format,
      lang,
      link,
      needTeam,
      owner_id
    } = req.body;

    // Check
    if (!title || !summary || !problem || !solution || !category || !owner_id) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    // UUID
    const projectId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

    // Skills array
    const parsedSkills = Array.isArray(skills) 
      ? skills 
      : (typeof skills === 'string' ? skills.split(',').filter(Boolean) : []);

    // Links
    const formattedLinks = link?.trim() ? [{ label: 'Ссылка', url: link.trim() }] : [];

    // Object
    const newProject = {
      id: projectId,
      title: title.trim(),
      summary: summary.trim(),
      problem: problem.trim(),
      solution: solution.trim(),
      goal: goal?.trim() || '',
      category: category.trim(),
      stage: stage || 'idea',
      city: city || 'Алматы',
      format: format || 'online',
      lang: lang || 'ru',
      skills: parsedSkills,
      team_size: Number(teamSize) || 4,
      need_team: Boolean(needTeam),
      links: formattedLinks,
      owner_id,
      members: [{ userId: owner_id, role: 'Автор проекта' }],
      created_at: new Date().toISOString().slice(0, 10)
    };

    const { data, error } = await supabase.from('projects').insert([newProject]).select().single();

    if (error) {
      console.error('Supabase error creating project:', error);
      return res.status(400).json({ error: error.message || 'Ошибка базы данных' });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('Server catch error:', err);
    return res.status(500).json({ error: err.message || 'Внутренняя ошибка сервера' });
  }
}