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

    // 1. Проверка обязательных полей
    if (!title || !summary || !problem || !solution || !category || !owner_id) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' });
    }

    // 2. Генерация UUID для проекта
    const projectId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

    // 3. Форматирование массива навыков
    const parsedSkills = Array.isArray(skills) 
      ? skills 
      : (typeof skills === 'string' ? skills.split(',').filter(Boolean) : []);

    // 4. Форматирование ссылок в формат JSONB (как в схеме)
    const formattedLinks = link?.trim() ? [{ label: 'Ссылка', url: link.trim() }] : [];

    // 5. Объект для вставки строго под структуру таблицы Supabase
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
      skills: parsedSkills,            // Колонка в БД: skills
      team_size: Number(teamSize) || 4,// Колонка в БД: team_size
      need_team: Boolean(needTeam),    // Колонка в БД: need_team
      links: formattedLinks,           // Колонка в БД: links (jsonb)
      owner_id,                        // Колонка в БД: owner_id (FK на users.id)
      members: [{ userId: owner_id, role: 'Автор проекта' }], // Исправлено: owner_id вместо author_id
      created_at: new Date().toISOString().slice(0, 10)       // Колонка в БД: created_at (date)
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