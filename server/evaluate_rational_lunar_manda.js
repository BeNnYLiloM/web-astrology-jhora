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

function signedMinutes(actualLongitude, expectedSign, expectedDegree) {
  const expectedLongitude = (expectedSign - 1) * 30 + expectedDegree;
  return normalize180(actualLongitude - expectedLongitude) * 60;
}

function reduceToFirstQuadrant(angle) {
  const normalized = normalize360(angle);
  const withinHalf = normalized > 180 ? 360 - normalized : normalized;
  return withinHalf > 90 ? 180 - withinHalf : withinHalf;
}

function rationalMoonManda(meanLongitude, apogeeLongitude) {
  const anomaly = normalize360(apogeeLongitude - meanLongitude);
  const bhuja = reduceToFirstQuadrant(anomaly);
  const y = bhuja / 6.0;
  const x = (30.0 - y) * y;
  const denominator = 56.0 - x / 20.0;
  const correction = x / denominator;
  return anomaly < 180
    ? normalize360(meanLongitude + correction)
    : normalize360(meanLongitude - correction);
}

let rms = 0;
let maxAbs = 0;
for (const testCase of CASES) {
  const jd = jdFrom(testCase.date, testCase.time, testCase.timezone);
  const diagnostic = calculateDiagnostics(jd, testCase.latitude, testCase.longitude);
  const corrected = rationalMoonManda(diagnostic.moon.meanLongitude, diagnostic.moon.apogeeLongitude);
  const delta = signedMinutes(corrected, testCase.sign, testCase.jhora);
  rms += delta * delta;
  maxAbs = Math.max(maxAbs, Math.abs(delta));
  console.log(testCase.id + ': ' + delta.toFixed(2) + "'");
}
console.log('RMSE=' + Math.sqrt(rms / CASES.length).toFixed(2) + "' max=" + maxAbs.toFixed(2) + "'");
