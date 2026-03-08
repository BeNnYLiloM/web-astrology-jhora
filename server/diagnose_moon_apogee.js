const Module = require('module');
const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'swisseph') return {};
  return originalLoad.apply(this, arguments);
};

const { calculateDiagnostics } = require('./SuryaSiddhanta');

const CASES = [
  { id: 'Roman', date: '16.03.1992', time: '16:00', latitude: 50 + 13/60, longitude: 136 + 54/60, timezone: 10, jhora: 28.5, sign: 4 },
  { id: 'Tanya', date: '22.10.1986', time: '6:45', latitude: 44 + 57/60, longitude: 34 + 6/60, timezone: 3, jhora: 24.35, sign: 2 },
  { id: 'Nadya2', date: '15.11.85', time: '2:34', latitude: 44 + 30/60, longitude: 34 + 10/60, timezone: 3, jhora: 0.15, sign: 9 },
  { id: 'Ksyusha', date: '20.08.21', time: '23:10', latitude: 44 + 57/60, longitude: 34 + 6/60, timezone: 3, jhora: 12.4666666667, sign: 10 },
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

function inSignDegrees(longitude) {
  const degree = longitude % 30;
  return degree < 0 ? degree + 30 : degree;
}

for (const testCase of CASES) {
  const jd = jdFrom(testCase.date, testCase.time, testCase.timezone);
  const diagnostic = calculateDiagnostics(jd, testCase.latitude, testCase.longitude);
  const meanErr = signedMinutes(diagnostic.moon.meanLongitude, testCase.sign, testCase.jhora);
  const trueErr = signedMinutes(diagnostic.moon.trueLongitude, testCase.sign, testCase.jhora);
  const mandaArcMin = diagnostic.moon.mandaCorrection * 60;
  const anomalyInSign = inSignDegrees(diagnostic.moon.anomaly);
  const apogeeInSign = inSignDegrees(diagnostic.moon.apogeeLongitude);

  console.log('\n=== ' + testCase.id + ' ===');
  console.log('mean error: ' + meanErr.toFixed(2) + "'");
  console.log('true error: ' + trueErr.toFixed(2) + "'");
  console.log('manda contribution: ' + mandaArcMin.toFixed(2) + "'");
  console.log('anomaly: ' + diagnostic.moon.anomaly.toFixed(4) + '° (' + anomalyInSign.toFixed(4) + '° in sign)');
  console.log('apogee: ' + diagnostic.moon.apogeeLongitude.toFixed(4) + '° (' + apogeeInSign.toFixed(4) + '° in sign)');
}
