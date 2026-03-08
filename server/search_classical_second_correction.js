const Module = require('module');
const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'swisseph') return {};
  return originalLoad.apply(this, arguments);
};

const { calculateDiagnostics } = require('./SuryaSiddhanta');

const CASES = [
  { id: 'Roman', date: '16.03.1992', time: '16:00', latitude: 50 + 13/60, longitude: 136 + 54/60, timezone: 10, jhora: 28.5, sign: 4 },
  { id: 'Ekaterina', date: '22.02.71', time: '11:27', latitude: 45 + 13/60, longitude: 33 + 59/60, timezone: 2, jhora: 29.9, sign: 9 },
  { id: 'Sveta', date: '16.01.86', time: '18:20', latitude: 45 + 2/60, longitude: 35 + 23/60, timezone: 3, jhora: 17.0833333333, sign: 12 },
  { id: 'Misha', date: '15.08.78', time: '17:15', latitude: 50 + 13/60, longitude: 136 + 54/60, timezone: 10, jhora: 16.1, sign: 9 },
  { id: 'Yana', date: '7.02.22', time: '2:12', latitude: 44 + 57/60, longitude: 34 + 6/60, timezone: 3, jhora: 4.3833333333, sign: 1 },
  { id: 'Nadya1', date: '10.03.84', time: '13:35', latitude: 46 + 38/60, longitude: 32 + 35/60, timezone: 3, jhora: 25.0666666667, sign: 2 },
  { id: 'Darina', date: '28.01.21', time: '16:07', latitude: 44 + 30/60, longitude: 34 + 9/60, timezone: 3, jhora: 11.3833333333, sign: 4 },
  { id: 'Tanya', date: '22.10.1986', time: '6:45', latitude: 44 + 57/60, longitude: 34 + 6/60, timezone: 3, jhora: 24.35, sign: 2 },
  { id: 'Nadya2', date: '15.11.85', time: '2:34', latitude: 44 + 30/60, longitude: 34 + 10/60, timezone: 3, jhora: 0.15, sign: 9 },
  { id: 'Ksyusha', date: '20.08.21', time: '23:10', latitude: 44 + 57/60, longitude: 34 + 6/60, timezone: 3, jhora: 12.4666666667, sign: 10 },
  { id: 'Polina', date: '15.01.16', time: '15:53', latitude: 44 + 57/60, longitude: 34 + 6/60, timezone: 3, jhora: 10.5666666667, sign: 12 },
  { id: 'DashaL', date: '3.02.94', time: '6:40', latitude: 44 + 57/60, longitude: 34 + 6/60, timezone: 2, jhora: 16.7166666667, sign: 7 },
  { id: 'DashaZhuk', date: '2.03.96', time: '18:32', latitude: 45 + 27/60, longitude: 34 + 44/60, timezone: 2, jhora: 17.9166666667, sign: 4 },
  { id: 'Lavanga', date: '2.02.66', time: '6:30', latitude: 58 + 42/60, longitude: 125 + 31/60, timezone: 9, jhora: 29.5333333333, sign: 2 }
];

function jdFrom(date, time, timezone) {
  let [day, month, year] = date.split('.').map(Number);
  if (year < 100) year += year >= 50 ? 1900 : 2000;
  const [hours, minutes] = time.split(':').map(Number);
  const utHour = hours + minutes / 60 - timezone;
  if (month <= 2) {
    year -= 1;
    month += 12;
  }
  const a = Math.floor(year / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5 + utHour / 24;
}

function normalize360(value) {
  let result = value % 360;
  if (result < 0) result += 360;
  return result;
}

function normalize180(value) {
  let result = normalize360(value);
  if (result > 180) result -= 360;
  return result;
}

function sinD(value) { return Math.sin(value * Math.PI / 180); }
function cosD(value) { return Math.cos(value * Math.PI / 180); }

function dailyMotion(diagnosticToday, diagnosticTomorrow, selector) {
  const get = (diagnostic) => selector === 'mean' ? diagnostic.moon.meanLongitude : diagnostic.moon.trueLongitude;
  return normalize180(get(diagnosticTomorrow) - get(diagnosticToday)) * 60;
}

function signedMinutes(actualLongitude, expectedSign, expectedDegree) {
  const expectedLongitude = (expectedSign - 1) * 30 + expectedDegree;
  return normalize180(actualLongitude - expectedLongitude) * 60;
}

const prepared = CASES.map((testCase) => {
  const jd = jdFrom(testCase.date, testCase.time, testCase.timezone);
  const today = calculateDiagnostics(jd, testCase.latitude, testCase.longitude);
  const tomorrow = calculateDiagnostics(jd + 1, testCase.latitude, testCase.longitude);
  return { testCase, jd, today, tomorrow };
});

const variants = [];
for (const moonStage of ['mean', 'true']) {
  for (const sunStage of ['mean', 'true']) {
    for (const dailyStage of ['mean', 'true']) {
      for (const minus11 of [false, true]) {
        for (const sign of ['add', 'subtract']) {
          variants.push({ moonStage, sunStage, dailyStage, minus11, sign });
        }
      }
    }
  }
}

function valueForStage(diagnostic, body, stage) {
  if (body === 'moon') return stage === 'mean' ? diagnostic.moon.meanLongitude : diagnostic.moon.trueLongitude;
  if (body === 'sun') return stage === 'mean' ? diagnostic.sun.meanLongitude : diagnostic.sun.trueLongitude;
  return 0;
}

let best = null;
for (const variant of variants) {
  const deltas = [];
  for (const item of prepared) {
    const moon = valueForStage(item.today, 'moon', variant.moonStage);
    const sun = valueForStage(item.today, 'sun', variant.sunStage);
    const apogee = item.today.moon.apogeeLongitude;
    const dm = dailyMotion(item.today, item.tomorrow, variant.dailyStage) - (variant.minus11 ? 11 : 0);
    const secondCorrection = sinD(moon - sun) * cosD(sun - apogee) * dm / 60.0;
    const corrected = variant.sign === 'add'
      ? normalize360(item.today.moon.trueLongitude + secondCorrection)
      : normalize360(item.today.moon.trueLongitude - secondCorrection);
    deltas.push(signedMinutes(corrected, item.testCase.sign, item.testCase.jhora));
  }
  const rmse = Math.sqrt(deltas.reduce((sum, value) => sum + value * value, 0) / deltas.length);
  const maxAbs = Math.max(...deltas.map((value) => Math.abs(value)));
  if (!best || rmse < best.rmse || (Math.abs(rmse - best.rmse) < 1e-9 && maxAbs < best.maxAbs)) {
    best = { variant, rmse, maxAbs, deltas };
  }
}

console.log(JSON.stringify({ bestVariant: best.variant, rmse: best.rmse, maxAbs: best.maxAbs }, null, 2));
for (let i = 0; i < CASES.length; i++) {
  console.log(CASES[i].id + ': ' + best.deltas[i].toFixed(2) + "'");
}
