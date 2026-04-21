import { compareRank, normalizeOpenMeteoResult, rankLocationResult } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: true, reason: 'Method not allowed.' });
  }

  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 7, 1), 10);
  const lang = typeof req.query.lang === 'string' ? req.query.lang : 'ru';

  if (query.length < 2) {
    return res.status(200).json({ results: [] });
  }

  try {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', query);
    url.searchParams.set('count', String(limit));
    url.searchParams.set('language', lang);
    url.searchParams.set('format', 'json');

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Open-Meteo responded with ${response.status}`);
    }

    const data = await response.json();
    const items = Array.isArray(data?.results) ? data.results : [];
    const results = items
      .map(normalizeOpenMeteoResult)
      .filter(Boolean)
      .sort((a, b) => compareRank(rankLocationResult(a), rankLocationResult(b)))
      .slice(0, limit);

    return res.status(200).json({ results });
  } catch (error) {
    console.error('Location search failed:', error.message || error);
    return res.status(502).json({ error: true, reason: 'Location search is temporarily unavailable.', source: 'open-meteo' });
  }
}
