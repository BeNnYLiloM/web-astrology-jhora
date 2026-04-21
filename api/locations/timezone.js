import { pickNearestTimezoneResult } from './_shared.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: true, reason: 'Method not allowed.' });
  }

  const name = typeof req.query.name === 'string' ? req.query.name.trim() : '';
  const countryCode = typeof req.query.countryCode === 'string' ? req.query.countryCode.trim() : '';
  const latitude = Number(req.query.lat);
  const longitude = Number(req.query.lon);

  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res.status(400).json({ error: true, reason: 'Missing or invalid location parameters.' });
  }

  try {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', name);
    url.searchParams.set('count', '10');
    url.searchParams.set('language', 'ru');
    url.searchParams.set('format', 'json');
    if (countryCode) {
      url.searchParams.set('countryCode', countryCode);
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'JyotishWeb/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo responded with ${response.status}`);
    }

    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    const matched = pickNearestTimezoneResult(results, latitude, longitude, countryCode);

    if (!matched?.timezone) {
      return res.status(404).json({ error: true, reason: 'Timezone not found for location.' });
    }

    return res.status(200).json({
      timezone: matched.timezone,
      matchedPlace: matched.name
    });
  } catch (error) {
    console.error('Timezone lookup failed:', error.message || error);
    return res.status(502).json({ error: true, reason: 'Timezone lookup is temporarily unavailable.' });
  }
}
