import { supabase } from '../../scripts/lib/db.js';

export default async function handler(req, res) {
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('projects')
      .delete()
      .eq('deleted', true)
      .or(`deleted_at.lte.${thirtyDaysAgo},deleted_at.is.null`)
      .select();

    if (error) throw error;

    return res.status(200).json({ success: true, purged: data.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}