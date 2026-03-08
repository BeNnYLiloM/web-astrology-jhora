const Module = require('module');
const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'swisseph') {
    return {};
  }
  return originalLoad.apply(this, arguments);
};

const { calculateDiagnostics } = require('./SuryaSiddhanta');

const CASES = [
  { id: 'Roman', birth: { date: '16.03.1992', time: '16:00', latitude: 50 + 13/60, longitude: 136 + 54/60, timezone: 10 }, jhoraMoon: "28°30'" },
  { id: 'Sveta', birth: { date: '16.01.86', time: '18:20', latitude: 45 + 2/60, longitude: 35 + 23/60, timezone: 3 }, jhoraMoon: "17°05'" },
  { id: 'Tanya', birth: { date: '22.10.1986', time: '6:45', latitude: 44 + 57/60, longitude: 34 + 6/60, timezone: 3 }, jhoraMoon: "24°21'" },
  { id: 'LavangaManjari', birth: { date: '2.02.66', time: '6:30', latitude: 58 + 42/60, longitude: 125 + 31/60, timezone: 9 }, jhoraMoon: "29°32'" }
];

function toJulianDay(year, month, day, hourDecimal) {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + b - 1524.5 + hourDecimal / 24;
}

function parseDate(value) {
  const parts = value.split('.').map((part) => parseInt(part, 10));
  let year = parts[2];
  if (year < 100) year += year >= 50 ? 1900 : 2000;
  return { day: parts[0], month: parts[1], year };
}

function parseTime(value) {
  const [hours, minutes] = value.split(':').map((part) => parseInt(part, 10));
  return { hours, minutes };
}

function toText(value) {
  const degrees = ((value % 360) + 360) % 360;
  const d = Math.floor(degrees);
  const mFloat = (degrees - d) * 60;
  const m = Math.floor(mFloat);
  const s = ((mFloat - m) * 60).toFixed(2);
  return `${d}° ${m}' ${s}"`;
}

for (const testCase of CASES) {
  const { day, month, year } = parseDate(testCase.birth.date);
  const { hours, minutes } = parseTime(testCase.birth.time);
  const jd = toJulianDay(year, month, day, hours + minutes / 60 - testCase.birth.timezone);
  const diagnostic = calculateDiagnostics(jd, testCase.birth.latitude, testCase.birth.longitude);

  console.log(`\n=== ${testCase.id} ===`);
  console.log(`JHora Moon: ${testCase.jhoraMoon}`);
  console.log(`Ahargana: ${diagnostic.ahargana}`);
  console.log(`Ayanamsa: ${diagnostic.ayanamsa.toFixed(6)}`);
  console.log(`Mean Sun: ${toText(diagnostic.sun.meanLongitude)}`);
  console.log(`Mean Moon: ${toText(diagnostic.moon.meanLongitude)}`);
  console.log(`Moon Apogee: ${toText(diagnostic.moon.apogeeLongitude)}`);
  console.log(`Moon Anomaly: ${toText(diagnostic.moon.anomaly)}`);
  console.log(`Moon Manda Correction: ${diagnostic.moon.mandaCorrection.toFixed(6)}°`);
  console.log(`Moon True: ${toText(diagnostic.moon.trueLongitude)}`);
  if (diagnostic.ascendantLongitude !== null) {
    console.log(`Ascendant: ${toText(diagnostic.ascendantLongitude)}`);
  }
}
