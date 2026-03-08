import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { calculatePlanets } = require('../server/SuryaSiddhanta.js');

const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
];

function normalize360(value) {
  let result = value % 360;
  if (result < 0) result += 360;
  return result;
}

function toJulianDay(year, month, day, hourDecimal) {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);

  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    b -
    1524.5 +
    hourDecimal / 24
  );
}

function getSignAndNakshatra(longitude) {
  const signIndex = Math.floor(longitude / 30) + 1;
  const degree = longitude % 30;
  const nakshatraIndex = Math.floor((longitude / 360) * 27);
  return {
    sign: signIndex,
    degree,
    nakshatra: NAKSHATRAS[nakshatraIndex] || 'Unknown'
  };
}

function calculateD9(ascLong, planets) {
  const getNavamsaSign = (longitude) => {
    const signIdx = Math.floor(longitude / 30) + 1;
    const degInSign = longitude % 30;
    const navamsaIdx = Math.floor(degInSign / (30 / 9));

    let startSign;
    if ([1, 5, 9].includes(signIdx)) startSign = 1;
    else if ([2, 6, 10].includes(signIdx)) startSign = 10;
    else if ([3, 7, 11].includes(signIdx)) startSign = 7;
    else startSign = 4;

    return normalize360((startSign + navamsaIdx - 1) * 30 + 15) / 30;
  };

  const ascSign = getNavamsaSign(ascLong);
  const d9Planets = planets.map((planet) => {
    const sign = getNavamsaSign(planet.rawLongitude);
    let house = sign - ascSign + 1;
    if (house <= 0) house += 12;
    return {
      name: planet.name,
      sign,
      degree: 0,
      nakshatra: '',
      isRetrograde: planet.isRetrograde,
      house
    };
  });

  return {
    name: 'Navamsa',
    symbol: 'D-9',
    ascendant: { name: 'Ascendant', sign: ascSign, degree: 0, nakshatra: '', isRetrograde: false, house: 1 },
    planets: d9Planets
  };
}

function calculateDasas(moonLong, birthDateIso, settings) {
  const nakshatraSpan = 13.33333333;
  const pos = moonLong / nakshatraSpan;
  const nakshatraIdx = Math.floor(pos);
  const fractionPassed = pos - nakshatraIdx;
  const fractionLeft = 1.0 - fractionPassed;

  const lords = ['Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'];
  const years = [7, 20, 6, 10, 7, 18, 16, 19, 17];

  const startLordIdx = nakshatraIdx % 9;
  const daysPerYear = settings.yearDefinition === '360_TITHIS' ? 354.36707 : 365.2425;

  const dasas = [];
  let currentDate = new Date(birthDateIso);

  const balanceYears = years[startLordIdx] * fractionLeft;
  const balanceDays = balanceYears * daysPerYear;
  const firstEndDate = new Date(currentDate.getTime() + balanceDays * 24 * 60 * 60 * 1000);

  dasas.push({
    lord: lords[startLordIdx],
    startDate: currentDate.toISOString().split('T')[0],
    endDate: firstEndDate.toISOString().split('T')[0],
    durationYears: years[startLordIdx],
    isCurrent: false
  });

  currentDate = firstEndDate;
  let currLordIdx = (startLordIdx + 1) % 9;
  const lifecycleYears = settings.lifecycleYears || 120;
  const limitDate = new Date(new Date(birthDateIso).getTime() + lifecycleYears * daysPerYear * 24 * 60 * 60 * 1000);

  while (currentDate < limitDate) {
    const lord = lords[currLordIdx];
    const duration = years[currLordIdx];
    const endDate = new Date(currentDate.getTime() + duration * daysPerYear * 24 * 60 * 60 * 1000);

    dasas.push({
      lord,
      startDate: currentDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      durationYears: duration,
      isCurrent: false
    });

    currentDate = endDate;
    currLordIdx = (currLordIdx + 1) % 9;
  }

  const now = new Date();
  dasas.forEach((dasa) => {
    if (now >= new Date(dasa.startDate) && now < new Date(dasa.endDate)) {
      dasa.isCurrent = true;
    }
  });

  return dasas;
}

function buildChart(details, settings) {
  if (details.ayanamsaType !== 'Sri Surya Siddhanta (Makaranda)') {
    const error = new Error('Only Sri Surya Siddhanta (Makaranda) is supported on this deployment.');
    error.statusCode = 400;
    throw error;
  }

  const [y, m, d] = details.date.split('-').map(Number);
  const [h, min] = details.time.split(':').map(Number);
  const utHour = h + min / 60.0 - details.timezone;
  const jd = toJulianDay(y, m, d, utHour);

  const ssData = calculatePlanets(jd, details.latitude, details.longitude, {
    makarandaMode: details.makarandaMode || 'Makaranda Classic'
  });
  const ayanamsaVal = ssData.ayanamsa;

  const planetMap = {};
  let moonLong = 0;
  ssData.planets.forEach((planet) => {
    const info = getSignAndNakshatra(planet.longitude);
    planetMap[planet.name] = {
      name: planet.name,
      sign: info.sign,
      degree: info.degree,
      nakshatra: info.nakshatra,
      isRetrograde: planet.isRetrograde,
      rawLongitude: planet.longitude,
      house: 0
    };
    if (planet.name === 'Moon') moonLong = planet.longitude;
  });

  const order = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const computedPlanets = order.map((name) => planetMap[name]);

  const ascRaw = ssData.ascendant?.longitude;
  if (typeof ascRaw !== 'number') {
    const error = new Error('Makaranda ascendant calculation is unavailable.');
    error.statusCode = 500;
    throw error;
  }

  const ascInfo = getSignAndNakshatra(ascRaw);
  const ascendant = {
    name: 'Ascendant',
    sign: ascInfo.sign,
    degree: ascInfo.degree,
    nakshatra: ascInfo.nakshatra,
    isRetrograde: false,
    house: 1,
    rawLongitude: ascRaw
  };

  computedPlanets.forEach((planet) => {
    let house = planet.sign - ascendant.sign + 1;
    if (house <= 0) house += 12;
    planet.house = house;
  });

  const localDate = new Date(Date.UTC(y, m - 1, d, h, min, 0));
  const dasas = calculateDasas(moonLong, localDate.toISOString(), settings);
  const d9Chart = calculateD9(ascendant.rawLongitude, computedPlanets);
  const finalPlanets = computedPlanets.map(({ rawLongitude, ...rest }) => rest);

  return {
    ascendant,
    planets: finalPlanets,
    divisional: { d9: d9Chart },
    ayanamsa: `${Math.floor(ayanamsaVal)}° ${((ayanamsaVal % 1) * 60).toFixed(2)}'`,
    ayanamsaType: details.ayanamsaType,
    makarandaMode: details.makarandaMode || 'Makaranda Classic',
    dasas,
    settingsUsed: settings
  };
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { details, settings } = req.body || {};
    if (!details || !settings) {
      return res.status(400).json({ error: 'Missing details or settings' });
    }

    return res.status(200).json(buildChart(details, settings));
  } catch (error) {
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      error: 'Calculation failed.',
      details: error.message || 'Unknown error'
    });
  }
}

export { buildChart };
