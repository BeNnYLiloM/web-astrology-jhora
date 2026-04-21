const LOCATION_TYPE_PRIORITY = {
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

export const normalizePhotonResult = (feature, index) => {
  const properties = feature?.properties || {};
  const coordinates = feature?.geometry?.coordinates || [];
  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const type = properties.type || properties.osm_value || 'location';
  const region = properties.state || properties.county || properties.district || properties.locality;
  const labelParts = dedupeParts(
    properties.name,
    properties.city,
    properties.locality,
    properties.district,
    properties.state,
    properties.country
  );

  return {
    id: `${properties.osm_type || 'X'}-${properties.osm_id || index}`,
    name: properties.name || properties.city || properties.locality || properties.county || 'Unknown location',
    displayName: labelParts.join(', '),
    region,
    country: properties.country || '',
    countryCode: properties.countrycode ? String(properties.countrycode).toUpperCase() : undefined,
    latitude,
    longitude,
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
