const swisseph = require('swisseph');
const path = require('path');

// Set Ephemeris Path
const EPHE_PATH = path.join(__dirname, 'ephe');
swisseph.swe_set_ephe_path(EPHE_PATH);

const julday = (year, month, day, hour) => {
  return new Promise((resolve) => {
    swisseph.swe_julday(year, month, day, hour, swisseph.SE_GREG_CAL, (jd) => resolve(jd));
  });
};

const calcHouses = (jd, lat, lon) => {
  return new Promise((resolve, reject) => {
    swisseph.swe_houses(jd, lat, lon, 'P', (result) => {
      if (result.error) reject(result.error);
      else resolve(result);
    });
  });
};

async function debugAscendant() {
  // User Data: 2025-11-23 15:15 GMT+3, Krasnodar (45.04484, 38.97603)
  const y = 2025, m = 11, d = 23;
  const h = 15, min = 15;
  const timezone = 3;
  const lat = 45.04484;
  const lon = 38.97603;

  const hourDec = h + min / 60.0;
  const utHour = hourDec - timezone; // 12.25

  console.log(`Input: ${y}-${m}-${d} ${h}:${min} (TZ ${timezone})`);
  console.log(`UT Hour: ${utHour}`);

  const jd = await julday(y, m, d, utHour);
  console.log(`JD: ${jd}`);

  // Calculate Houses
  try {
    const houses = await calcHouses(jd, lat, lon);
    console.log(`Tropical Ascendant: ${houses.ascendant}`);

    // Check Sidereal Time
    swisseph.swe_sidtime(jd, (result) => {
      console.log(`Sidereal Time Result:`, result);
      if (result && result.sid_time) {
        console.log(`GMST: ${result.sid_time}`);
        const lst = (result.sid_time + lon / 15) % 24;
        console.log(`LST (approx): ${lst}`);
      }
    });

  } catch (err) {
    console.error("Error:", err);
  }
}

debugAscendant();
