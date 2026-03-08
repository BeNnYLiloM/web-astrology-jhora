const Module = require('module');
const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'swisseph') return {};
  return originalLoad.apply(this, arguments);
};

const { calculateDiagnostics } = require('./SuryaSiddhanta');

const CASES = [
  { id: 'Roman', date: '16.03.1992', time: '16:00', latitude: 50 + 13 / 60, longitude: 136 + 54 / 60, timezone: 10, jhora: 28.5, sign: 4 },
  { id: 'Ekaterina', date: '22.02.71', time: '11:27', latitude: 45 + 13 / 60, longitude: 33 + 59 / 60, timezone: 2, jhora: 29.9, sign: 9 },
  { id: 'Sveta', date: '16.01.86', time: '18:20', latitude: 45 + 2 / 60, longitude: 35 + 23 / 60, timezone: 3, jhora: 17.0833333333, sign: 12 },
  { id: 'Misha', date: '15.08.78', time: '17:15', latitude: 50 + 13 / 60, longitude: 136 + 54 / 60, timezone: 10, jhora: 16.1, sign: 9 },
  { id: 'Yana', date: '7.02.22', time: '2:12', latitude: 44 + 57 / 60, longitude: 34 + 6 / 60, timezone: 3, jhora: 4.3833333333, sign: 1 },
  { id: 'Nadya1', date: '10.03.84', time: '13:35', latitude: 46 + 38 / 60, longitude: 32 + 35 / 60, timezone: 3, jhora: 25.0666666667, sign: 2 },
  { id: 'Darina', date: '28.01.21', time: '16:07', latitude: 44 + 30 / 60, longitude: 34 + 9 / 60, timezone: 3, jhora: 11.3833333333, sign: 4 },
  { id: 'Tanya', date: '22.10.1986', time: '6:45', latitude: 44 + 57 / 60, longitude: 34 + 6 / 60, timezone: 3, jhora: 24.35, sign: 2 },
  { id: 'Nadya2', date: '15.11.85', time: '2:34', latitude: 44 + 30 / 60, longitude: 34 + 10 / 60, timezone: 3, jhora: 0.15, sign: 9 },
  { id: 'Ksyusha', date: '20.08.21', time: '23:10', latitude: 44 + 57 / 60, longitude: 34 + 6 / 60, timezone: 3, jhora: 12.4666666667, sign: 10 },
  { id: 'Polina', date: '15.01.16', time: '15:53', latitude: 44 + 57 / 60, longitude: 34 + 6 / 60, timezone: 3, jhora: 10.5666666667, sign: 12 },
  { id: 'DashaL', date: '3.02.94', time: '6:40', latitude: 44 + 57 / 60, longitude: 34 + 6 / 60, timezone: 2, jhora: 16.7166666667, sign: 7 },
  { id: 'DashaZhuk', date: '2.03.96', time: '18:32', latitude: 45 + 27 / 60, longitude: 34 + 44 / 60, timezone: 2, jhora: 17.9166666667, sign: 4 },
  { id: 'Lavanga', date: '2.02.66', time: '6:30', latitude: 58 + 42 / 60, longitude: 125 + 31 / 60, timezone: 9, jhora: 29.5333333333, sign: 2 }
];

const CANDIDATES = [
  {
    id: 'least_squares_generalized_munjala',
    moonOffsetArcMin: 2.25,
    intercept: 0.1330,
    munjala: 6.1317,
    elong2: 3.8423,
    solar: 10.9973,
    lunar: 6.4578,
  },
  {
    id: 'coverage_13_of_14_generalized_munjala',
    moonOffsetArcMin: 2.25,
    intercept: 0.5,
    munjala: 6.5,
    elong2: 2.5,
    solar: 11.5,
    lunar: 7.25,
  }
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
  value %= 360;
  if (value < 0) value += 360;
  return value;
}

function normalize180(value) {
  value = normalize360(value);
  if (value > 180) value -= 360;
  return value;
}

function sinD(value) {
  return Math.sin(value * Math.PI / 180);
}

function cosD(value) {
  return Math.cos(value * Math.PI / 180);
}

for (const candidate of CANDIDATES) {
  const deltas = [];
  console.log('\n=== ' + candidate.id + ' ===');
  for (const chartCase of CASES) {
    const diagnostics = calculateDiagnostics(
      jdFrom(chartCase.date, chartCase.time, chartCase.timezone),
      chartCase.latitude,
      chartCase.longitude
    );
    const shiftedMoon = normalize360(diagnostics.moon.trueLongitude + candidate.moonOffsetArcMin / 60);
    const meanSun = diagnostics.sun.meanLongitude;
    const meanMoon = normalize360(diagnostics.moon.meanLongitude + candidate.moonOffsetArcMin / 60);
    const meanApogee = diagnostics.moon.apogeeLongitude;
    const eta = normalize180(meanSun - meanApogee);
    const psi = normalize180(meanMoon - meanSun);
    const D = normalize180(shiftedMoon - diagnostics.sun.trueLongitude);
    const M = normalize180(diagnostics.moon.anomaly + candidate.moonOffsetArcMin / 60);
    const Ms = normalize180(diagnostics.sun.anomaly);
    const targetLongitude = (chartCase.sign - 1) * 30 + chartCase.jhora;

    const correctionMinutes =
      candidate.intercept +
      candidate.munjala * (-cosD(eta) * sinD(psi)) +
      candidate.elong2 * sinD(2 * D) +
      candidate.solar * sinD(Ms) +
      candidate.lunar * sinD(M);

    const correctedMoon = normalize360(shiftedMoon + correctionMinutes / 60);
    const deltaMinutes = normalize180(correctedMoon - targetLongitude) * 60;
    deltas.push(deltaMinutes);
    console.log(chartCase.id.padEnd(12) + ' ' + deltaMinutes.toFixed(2) + "'");
  }

  const rmse = Math.sqrt(deltas.reduce((sum, value) => sum + value * value, 0) / deltas.length);
  const maxAbs = Math.max(...deltas.map((value) => Math.abs(value)));
  const within5 = deltas.filter((value) => Math.abs(value) <= 5).length;
  console.log('rmse=' + rmse.toFixed(2) + "' maxAbs=" + maxAbs.toFixed(2) + "' within5=" + within5 + '/' + deltas.length);
}
