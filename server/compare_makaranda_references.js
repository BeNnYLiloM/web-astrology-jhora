const Module = require('module');

// `SuryaSiddhanta.js` imports `swisseph`, but the standalone Makaranda logic
// can still be exercised without it. Stub the module here for local regression runs.
const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'swisseph') {
    return {};
  }
  return originalLoad.apply(this, arguments);
};

const { calculatePlanets } = require('./SuryaSiddhanta');
const { moonposition } = require('astronomia');

const DEG = 180 / Math.PI;
const AYANAMSA_EPOCH_JD = 1903470.5;
const AYANAMSA_RATE = 54.0;

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

function parseDate(value) {
  const parts = value.split('.').map((part) => parseInt(part, 10));
  let year = parts[2];
  if (year < 100) {
    year += year >= 50 ? 1900 : 2000;
  }
  return { day: parts[0], month: parts[1], year };
}

function parseTime(value) {
  const [hours, minutes] = value.split(':').map((part) => parseInt(part, 10));
  return { hours, minutes };
}

function parseReferenceDegree(text) {
  const match = text.match(/(\d+)[°º]\s*(\d+)/);
  if (!match) {
    throw new Error(`Cannot parse degree from "${text}"`);
  }
  return parseInt(match[1], 10) + parseInt(match[2], 10) / 60;
}

function parseReferenceSign(text) {
  const raw = text.toLowerCase();
  const signMap = [
    ['aries', 1],
    ['taurus', 2],
    ['gemini', 3],
    ['cancer', 4],
    ['leo', 5],
    ['virgo', 6],
    ['vi', 6],
    ['libra', 7],
    ['li', 7],
    ['scorpio', 8],
    ['scorp', 8],
    ['sagittarius', 9],
    ['sg', 9],
    ['capricorn', 10],
    ['cp', 10],
    ['aquarius', 11],
    ['aq', 11],
    ['pisces', 12],
    ['pi', 12],
  ];

  for (const [token, sign] of signMap) {
    if (raw.includes(token)) {
      return sign;
    }
  }

  return null;
}

function signName(sign) {
  return [
    '',
    'Aries',
    'Taurus',
    'Gemini',
    'Cancer',
    'Leo',
    'Virgo',
    'Libra',
    'Scorpio',
    'Sagittarius',
    'Capricorn',
    'Aquarius',
    'Pisces',
  ][sign];
}

function longitudeToSignDegree(longitude) {
  return {
    sign: Math.floor(longitude / 30) + 1,
    degree: longitude % 30,
  };
}

function degreeToText(degree) {
  const d = Math.floor(degree);
  const totalMinutes = (degree - d) * 60;
  const m = Math.floor(totalMinutes);
  const s = (totalMinutes - m) * 60;
  return `${d}° ${m}' ${s.toFixed(2)}"`;
}

function toArcMinutes(deltaDegrees) {
  return deltaDegrees * 60;
}

function makarandaAyanamsa(jd) {
  const yearsSince = (jd - AYANAMSA_EPOCH_JD) / 365.258756;
  return (yearsSince * AYANAMSA_RATE) / 3600;
}

function modernMoonLongitude(jd) {
  return normalize360(moonposition.position(jd).lon * DEG - makarandaAyanamsa(jd));
}

const CASES = [
  {
    id: 'Valeriya',
    birth: { date: '09.08.1995', time: '6:36', latitude: 49 + 31 / 60, longitude: 23 + 12 / 60, timezone: 3 },
    checks: [{ body: 'Mars', jhora: "18°18'" }],
  },
  {
    id: 'Roman',
    birth: { date: '16.03.1992', time: '16:00', latitude: 50 + 13 / 60, longitude: 136 + 54 / 60, timezone: 10 },
    checks: [{ body: 'Moon', jhora: "28°30'" }],
  },
  {
    id: 'Ekaterina',
    birth: { date: '22.02.71', time: '11:27', latitude: 45 + 13 / 60, longitude: 33 + 59 / 60, timezone: 2 },
    checks: [{ body: 'Moon', jhora: "29°54'" }],
  },
  {
    id: 'Sveta',
    birth: { date: '16.01.86', time: '18:20', latitude: 45 + 2 / 60, longitude: 35 + 23 / 60, timezone: 3 },
    checks: [{ body: 'Moon', jhora: "17°05'" }],
  },
  {
    id: 'Misha',
    birth: { date: '15.08.78', time: '17:15', latitude: 50 + 13 / 60, longitude: 136 + 54 / 60, timezone: 10 },
    checks: [{ body: 'Moon', jhora: "16°06'" }],
  },
  {
    id: 'Yana',
    birth: { date: '7.02.22', time: '2:12', latitude: 44 + 57 / 60, longitude: 34 + 6 / 60, timezone: 3 },
    checks: [{ body: 'Moon', jhora: "4°23'" }],
  },
  {
    id: 'Nadya1',
    birth: { date: '10.03.84', time: '13:35', latitude: 46 + 38 / 60, longitude: 32 + 35 / 60, timezone: 3 },
    checks: [{ body: 'Moon', jhora: "25°04'" }],
  },
  {
    id: 'Darina',
    birth: { date: '28.01.21', time: '16:07', latitude: 44 + 30 / 60, longitude: 34 + 9 / 60, timezone: 3 },
    checks: [{ body: 'Moon', jhora: "11°23'" }],
  },
  {
    id: 'Tanya',
    birth: { date: '22.10.1986', time: '6:45', latitude: 44 + 57 / 60, longitude: 34 + 6 / 60, timezone: 3 },
    checks: [
      { body: 'Moon', jhora: "24°21'" },
      { body: 'Ascendant', jhora: "29°41' Virgo" },
    ],
  },
  {
    id: 'Nadya2',
    birth: { date: '15.11.85', time: '2:34', latitude: 44 + 30 / 60, longitude: 34 + 10 / 60, timezone: 3 },
    checks: [{ body: 'Moon', jhora: "0°09' Sagittarius" }],
  },
  {
    id: 'Ksyusha',
    birth: { date: '20.08.21', time: '23:10', latitude: 44 + 57 / 60, longitude: 34 + 6 / 60, timezone: 3 },
    checks: [
      { body: 'Moon', jhora: "12°28'" },
      { body: 'Ascendant', jhora: "4°51' Taurus" },
    ],
  },
  {
    id: 'Polina',
    birth: { date: '15.01.16', time: '15:53', latitude: 44 + 57 / 60, longitude: 34 + 6 / 60, timezone: 3 },
    checks: [{ body: 'Moon', jhora: "10°34'" }],
  },
  {
    id: 'DashaL',
    birth: { date: '3.02.94', time: '6:40', latitude: 44 + 57 / 60, longitude: 34 + 6 / 60, timezone: 2 },
    checks: [{ body: 'Moon', jhora: "16°43'" }],
  },
  {
    id: 'DashaZhuk',
    birth: { date: '2.03.96', time: '18:32', latitude: 45 + 27 / 60, longitude: 34 + 44 / 60, timezone: 2 },
    checks: [{ body: 'Moon', jhora: "17°55'" }],
  },
  {
    id: 'LavangaManjari',
    birth: { date: '2.02.66', time: '6:30', latitude: 58 + 42 / 60, longitude: 125 + 31 / 60, timezone: 9 },
    checks: [{ body: 'Moon', jhora: "29°32'" }],
  },
];

function compare(check, value) {
  const actual = longitudeToSignDegree(value);
  const expectedDegree = parseReferenceDegree(check.jhora);
  const expectedSign = parseReferenceSign(check.jhora);
  let delta;

  if (expectedSign) {
    const expectedLongitude = (expectedSign - 1) * 30 + expectedDegree;
    const actualLongitude = (actual.sign - 1) * 30 + actual.degree;
    delta = actualLongitude - expectedLongitude;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
  } else {
    delta = actual.degree - expectedDegree;
  }

  return {
    sign: actual.sign,
    degree: actual.degree,
    deltaMinutes: toArcMinutes(delta),
  };
}

for (const testCase of CASES) {
  const { day, month, year } = parseDate(testCase.birth.date);
  const { hours, minutes } = parseTime(testCase.birth.time);
  const jd = toJulianDay(year, month, day, hours + minutes / 60 - testCase.birth.timezone);

  const makaranda = calculatePlanets(jd, testCase.birth.latitude, testCase.birth.longitude);
  const makarandaByName = Object.fromEntries(makaranda.planets.map((planet) => [planet.name, planet.longitude]));
  const ascendantLongitude = makaranda.ascendant ? makaranda.ascendant.longitude : null;

  console.log(`\n=== ${testCase.id} ===`);
  console.log(`Birth: ${testCase.birth.date} ${testCase.birth.time} GMT+${testCase.birth.timezone}`);

  for (const check of testCase.checks) {
    const currentValue = check.body === 'Ascendant' ? ascendantLongitude : makarandaByName[check.body];
    if (currentValue === null || typeof currentValue !== 'number') {
      console.log(`${check.body.padEnd(9)} | JHora: ${check.jhora} | Current: unavailable`);
      continue;
    }
    const current = compare(check, currentValue);

    const lines = [
      `${check.body.padEnd(9)} | JHora: ${check.jhora.padEnd(18)} | Current: ${degreeToText(current.degree).padEnd(16)} ${signName(current.sign)} | Delta: ${current.deltaMinutes.toFixed(2)}'`,
    ];

    if (check.body === 'Moon') {
      const modern = compare(check, modernMoonLongitude(jd));
      lines.push(
        `${' '.repeat(9)} | ${' '.repeat(25)}Modern:  ${degreeToText(modern.degree).padEnd(16)} ${signName(modern.sign)} | Delta: ${modern.deltaMinutes.toFixed(2)}'`
      );
    }

    console.log(lines.join('\n'));
  }
}
