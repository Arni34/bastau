import { normEmail, isValidEmail, emailExists, rateLimited, clientIp } from '../../scripts/lib/userchecks.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (rateLimited(`email-available:${clientIp(req)}`, { limit: 60, windowMs: 60_000 })) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: 'Слишком много запросов. Попробуйте через минуту.' });
  }

  const raw = Array.isArray(req.query.email) ? req.query.email[0] : req.query.email;
  const email = normEmail(raw);
  
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Некорректный email' });
  }

  try {
    const exists = await emailExists(email);
    return res.status(200).json({ available: !exists });
  } catch (err) {
    console.error('email-available error:', err);
    return res.status(500).json({ error: 'Не удалось проверить email' });
  }
}