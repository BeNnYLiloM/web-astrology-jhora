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

const BASE = {
  moonOffsetArcMin: 2.25,
  intercept: 0.1330,
  munjala: 6.1317,
  elong2: 3.8423,
  solar: 10.9973,
  lunar: 6.4578,
};

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

function solveLeastSquares(rows, targets) {
  const cols = rows[0].length;
  const ata = Array.from({ length: cols }, () => Array(cols).fill(0));
  const atb = Array(cols).fill(0);
  for (let i = 0; i < rows.length; i += 1) {
    for (let r = 0; r < cols; r += 1) {
      atb[r] += rows[i][r] * targets[i];
      for (let c = 0; c < cols; c += 1) ata[r][c] += rows[i][r] * rows[i][c];
    }
  }
  return gaussianSolve(ata, atb);
}

function gaussianSolve(matrix, vector) {
  const n = vector.length;
  const a = matrix.map((row, i) => row.slice().concat(vector[i]));
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    if (Math.abs(a[pivot][col]) < 1e-12) return null;
    [a[col], a[pivot]] = [a[pivot], a[col]];
    const divisor = a[col][col];
    for (let j = col; j <= n; j += 1) a[col][j] /= divisor;
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = a[row][col];
      for (let j = col; j <= n; j += 1) a[row][j] -= factor * a[col][j];
    }
  }
  return a.map((row) => row[n]);
}

const data = CASES.map((chartCase) => {
  const diagnostics = calculateDiagnostics(
    jdFrom(chartCase.date, chartCase.time, chartCase.timezone),
    chartCase.latitude,
    chartCase.longitude
  );
  const shiftedMoon = normalize360(diagnostics.moon.trueLongitude + BASE.moonOffsetArcMin / 60);
  const meanSun = diagnostics.sun.meanLongitude;
  const meanMoon = normalize360(diagnostics.moon.meanLongitude + BASE.moonOffsetArcMin / 60);
  const meanApogee = diagnostics.moon.apogeeLongitude;
  const eta = normalize180(meanSun - meanApogee);
  const psi = normalize180(meanMoon - meanSun);
  const D = normalize180(shiftedMoon - diagnostics.sun.trueLongitude);
  const M = normalize180(diagnostics.moon.anomaly + BASE.moonOffsetArcMin / 60);
  const Ms = normalize180(diagnostics.sun.anomaly);
  const targetLongitude = (chartCase.sign - 1) * 30 + chartCase.jhora;

  const baseCorrectionMinutes =
    BASE.intercept +
    BASE.munjala * (-cosD(eta) * sinD(psi)) +
    BASE.elong2 * sinD(2 * D) +
    BASE.solar * sinD(Ms) +
    BASE.lunar * sinD(M);

  const baseCorrectedMoon = normalize360(shiftedMoon + baseCorrectionMinutes / 60);
  const residualTargetMinutes = -normalize180(baseCorrectedMoon - targetLongitude) * 60;

  return {
    id: chartCase.id,
    residualTargetMinutes,
    terms: {
      sin2DPlusM: sinD(2 * D + M),
      sin2MMinus2D: sinD(2 * M - 2 * D),
      sinMPlusMsMinus2D: sinD(M + Ms - 2 * D),
      sinMsMinus2D: sinD(Ms - 2 * D),
      sinMPlusMs: sinD(M + Ms),
      sinD: sinD(D)
    }
  };
});

const results = [];
for (const termName of Object.keys(data[0].terms)) {
  const rows = data.map((row) => [1, row.terms[termName]]);
  const targets = data.map((row) => row.residualTargetMinutes);
  const weights = solveLeastSquares(rows, targets);
  const residuals = rows.map((row, index) => row.reduce((sum, value, termIndex) => sum + value * weights[termIndex], 0) - targets[index]);
  const rmse = Math.sqrt(residuals.reduce((sum, value) => sum + value * value, 0) / residuals.length);
  const maxAbs = Math.max(...residuals.map((value) => Math.abs(value)));
  const within5 = residuals.filter((value) => Math.abs(value) <= 5).length;
  results.push({ termName, weights, rmse, maxAbs, within5 });
}
results.sort((a, b) => a.maxAbs - b.maxAbs || a.rmse - b.rmse);
for (const result of results) {
  console.log(JSON.stringify(result));
}
