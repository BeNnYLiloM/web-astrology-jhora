const LOCATION_TYPE_PRIORITY = {
  PPLA: 0,
  PPLC: 0,
  PPL: 1,
  PPLA2: 1,
  PPLA3: 2,
  PPLA4: 2,
  PPLL: 2,
  ADM2: 3,
  ADM1: 4,
  city: 0,
  town: 1,
  village: 2,
  hamlet: 3,
  locality: 4,
  county: 5,
  district: 6,
  state: 7
};

const dedupeParts = (...parts) => {
  const seen = new Set();

  return parts.filter((part) => {
    if (!part) return false;
    const normalized = String(part).trim();
    if (!normalized) return false;

    const key = normalized.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const normalizeOpenMeteoResult = (item, index) => {
  const latitude = Number(item?.latitude);
  const longitude = Number(item?.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const type = item?.feature_code || item?.admin4 || item?.admin3 || item?.admin2 || item?.admin1 || 'location';
  const region = item?.admin1 || item?.admin2 || item?.admin3 || item?.admin4;
  const labelParts = dedupeParts(
    item?.name,
    item?.admin1,
    item?.country
  );

  return {
    id: String(item?.id || `${item?.country_code || 'XX'}-${item?.name || 'location'}-${index}`),
    name: item?.name || 'Unknown location',
    displayName: labelParts.join(', '),
    region,
    country: item?.country || '',
    countryCode: item?.country_code ? String(item.country_code).toUpperCase() : undefined,
    latitude,
    longitude,
    timezone: item?.timezone,
    type
  };
};

export const compareRank = (left, right) => {
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i]) {
      return left[i] - right[i];
    }
  }
  return 0;
};

export const rankLocationResult = (result) => {
  const typeRank = LOCATION_TYPE_PRIORITY[result.type] ?? 99;
  const hasRegion = result.region ? 0 : 1;
  const hasCountry = result.country ? 0 : 1;

  return [typeRank, hasRegion, hasCountry, result.displayName.length];
};

export const pickNearestTimezoneResult = (results, latitude, longitude, countryCode) => {
  const normalizedCountryCode = countryCode ? String(countryCode).toLowerCase() : null;

  const filtered = results.filter((item) => {
    if (!normalizedCountryCode) return true;
    return String(item.country_code || '').toLowerCase() === normalizedCountryCode;
  });

  const candidates = filtered.length > 0 ? filtered : results;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  return candidates.reduce((best, current) => {
    const currentDistance = Math.abs(current.latitude - latitude) + Math.abs(current.longitude - longitude);
    if (!best) {
      return { item: current, distance: currentDistance };
    }
    return currentDistance < best.distance ? { item: current, distance: currentDistance } : best;
  }, null)?.item || null;
};
