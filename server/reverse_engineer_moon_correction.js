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

function solveLeastSquares(rows, targets) {
  const cols = rows[0].length;
  const ata = Array.from({ length: cols }, () => Array(cols).fill(0));
  const atb = Array(cols).fill(0);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const target = targets[i];
    for (let r = 0; r < cols; r++) {
      atb[r] += row[r] * target;
      for (let c = 0; c < cols; c++) {
        ata[r][c] += row[r] * row[c];
      }
    }
  }

  return gaussianSolve(ata, atb);
}

function gaussianSolve(matrix, vector) {
  const n = vector.length;
  const a = matrix.map((row, i) => row.slice().concat(vector[i]));

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(a[row][col]) > Math.abs(a[pivot][col])) pivot = row;
    }
    if (Math.abs(a[pivot][col]) < 1e-12) return null;
    [a[col], a[pivot]] = [a[pivot], a[col]];

    const divisor = a[col][col];
    for (let j = col; j <= n; j++) a[col][j] /= divisor;

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = a[row][col];
      for (let j = col; j <= n; j++) a[row][j] -= factor * a[col][j];
    }
  }

  return a.map((row) => row[n]);
}

function evaluateModel(cases, basisFactory) {
  const rows = cases.map(basisFactory);
  const targets = cases.map((item) => item.requiredResidualMinutes);
  const weights = solveLeastSquares(rows, targets);
  if (!weights) return null;
  const deltas = cases.map((item, index) => rows[index].reduce((sum, value, column) => sum + value * weights[column], 0));
  const residuals = deltas.map((delta, index) => delta - targets[index]);
  const rmse = Math.sqrt(residuals.reduce((sum, value) => sum + value * value, 0) / residuals.length);
  const maxAbs = Math.max(...residuals.map((value) => Math.abs(value)));
  return { weights, deltas, residuals, rmse, maxAbs };
}

function coefficientNames(modelName) {
  if (modelName === 'anomaly_sin') return ['const', 'sinA', 'cosA'];
  if (modelName === 'anomaly_fourier2') return ['const', 'sinA', 'cosA', 'sin2A', 'cos2A'];
  if (modelName === 'anomaly_plus_solar') return ['const', 'sinA', 'cosA', 'sinE', 'cosE', 'sunManda'];
  if (modelName === 'anomaly_plus_epoch') return ['const', 'sinA', 'cosA', 'year', 'year*sinA', 'year*cosA'];
  return [];
}

const analyzed = CASES.map((testCase) => {
  const jd = jdFrom(testCase.date, testCase.time, testCase.timezone);
  const diagnostic = calculateDiagnostics(jd, testCase.latitude, testCase.longitude);
  const jhoraLongitude = (testCase.sign - 1) * 30 + testCase.jhora;
  const currentTrue = diagnostic.moon.trueLongitude;
  const currentMean = diagnostic.moon.meanLongitude;
  const desiredManda = normalize180(jhoraLongitude - currentMean) * 60;
  const currentManda = normalize180(currentTrue - currentMean) * 60;
  const residual = normalize180(jhoraLongitude - currentTrue) * 60;
  const sunElongation = normalize180(currentTrue - diagnostic.sun.trueLongitude);
  const sunManda = normalize180(diagnostic.sun.trueLongitude - diagnostic.sun.meanLongitude) * 60;
  const year = testCase.date.split('.').map(Number)[2];
  const normalizedYear = ((year < 100 ? (year >= 50 ? 1900 + year : 2000 + year) : year) - 1990) / 50;

  return {
    ...testCase,
    jd,
    anomaly: diagnostic.moon.anomaly,
    anomalySigned: normalize180(diagnostic.moon.anomaly),
    meanMoon: currentMean,
    trueMoon: currentTrue,
    sunTrue: diagnostic.sun.trueLongitude,
    currentMandaMinutes: currentManda,
    desiredMandaMinutes: desiredManda,
    requiredResidualMinutes: residual,
    sunElongation,
    sunMandaMinutes: sunManda,
    normalizedYear
  };
});

analyzed.sort((a, b) => a.anomalySigned - b.anomalySigned);
console.log('Moon reverse-analysis cases sorted by signed anomaly:\n');
for (const item of analyzed) {
  console.log([
    item.id.padEnd(12),
    'anom=' + item.anomalySigned.toFixed(2).padStart(7),
    'currM=' + item.currentMandaMinutes.toFixed(2).padStart(8) + "'",
    'needM=' + item.desiredMandaMinutes.toFixed(2).padStart(8) + "'",
    'resid=' + item.requiredResidualMinutes.toFixed(2).padStart(8) + "'",
    'elong=' + item.sunElongation.toFixed(2).padStart(7),
    'sunM=' + item.sunMandaMinutes.toFixed(2).padStart(7) + "'",
    'year=' + item.normalizedYear.toFixed(2).padStart(5)
  ].join(' | '));
}

const models = {
  anomaly_sin: (item) => [1, sinD(item.anomalySigned), cosD(item.anomalySigned)],
  anomaly_fourier2: (item) => [1, sinD(item.anomalySigned), cosD(item.anomalySigned), sinD(2 * item.anomalySigned), cosD(2 * item.anomalySigned)],
  anomaly_plus_solar: (item) => [1, sinD(item.anomalySigned), cosD(item.anomalySigned), sinD(item.sunElongation), cosD(item.sunElongation), item.sunMandaMinutes / 60],
  anomaly_plus_epoch: (item) => [1, sinD(item.anomalySigned), cosD(item.anomalySigned), item.normalizedYear, item.normalizedYear * sinD(item.anomalySigned), item.normalizedYear * cosD(item.anomalySigned)]
};

console.log('\nModel fits for residual correction on top of current Moon:\n');
for (const [name, basisFactory] of Object.entries(models)) {
  const result = evaluateModel(analyzed, basisFactory);
  console.log(name + ': rmse=' + result.rmse.toFixed(2) + "' maxAbs=" + result.maxAbs.toFixed(2) + "'");
  const labels = coefficientNames(name);
  result.weights.forEach((weight, index) => {
    console.log('  ' + labels[index] + '=' + weight.toFixed(4));
  });
}

console.log('\nBest simple model prediction details (anomaly_fourier2):\n');
const best = evaluateModel(analyzed, models.anomaly_fourier2);
for (let i = 0; i < analyzed.length; i++) {
  const item = analyzed[i];
  console.log(item.id.padEnd(12) + ' predicted=' + best.deltas[i].toFixed(2).padStart(8) + "' actual=" + item.requiredResidualMinutes.toFixed(2).padStart(8) + "' residual=" + best.residuals[i].toFixed(2).padStart(8) + "'");
}
