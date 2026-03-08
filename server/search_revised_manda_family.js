const Module = require('module');
const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'swisseph') return {};
  return originalLoad.apply(this, arguments);
};

const CIVIL_DAYS_MAHAYUGA = 1577917828;
const REV_MOON = 57753336;
const REV_MOON_APOGEE = 488203;
const KALI_YUGA_EPOCH_JD = 588465.5;
const MOON_BEEJA = (-0.1063829787 / 60) * CIVIL_DAYS_MAHAYUGA / (360 * 365.258756);
const MOON_OFFSET = 11.75;

const CASES = [
  { id: 'Roman', date: '16.03.1992', time: '16:00', timezone: 10, jhora: 28.5, sign: 4 },
  { id: 'Ekaterina', date: '22.02.71', time: '11:27', timezone: 2, jhora: 29.9, sign: 9 },
  { id: 'Sveta', date: '16.01.86', time: '18:20', timezone: 3, jhora: 17.0833333333, sign: 12 },
  { id: 'Misha', date: '15.08.78', time: '17:15', timezone: 10, jhora: 16.1, sign: 9 },
  { id: 'Yana', date: '7.02.22', time: '2:12', timezone: 3, jhora: 4.3833333333, sign: 1 },
  { id: 'Nadya1', date: '10.03.84', time: '13:35', timezone: 3, jhora: 25.0666666667, sign: 2 },
  { id: 'Darina', date: '28.01.21', time: '16:07', timezone: 3, jhora: 11.3833333333, sign: 4 },
  { id: 'Tanya', date: '22.10.1986', time: '6:45', timezone: 3, jhora: 24.35, sign: 2 },
  { id: 'Nadya2', date: '15.11.85', time: '2:34', timezone: 3, jhora: 0.15, sign: 9 },
  { id: 'Ksyusha', date: '20.08.21', time: '23:10', timezone: 3, jhora: 12.4666666667, sign: 10 },
  { id: 'Polina', date: '15.01.16', time: '15:53', timezone: 3, jhora: 10.5666666667, sign: 12 },
  { id: 'DashaL', date: '3.02.94', time: '6:40', timezone: 2, jhora: 16.7166666667, sign: 7 },
  { id: 'DashaZhuk', date: '2.03.96', time: '18:32', timezone: 2, jhora: 17.9166666667, sign: 4 },
  { id: 'Lavanga', date: '2.02.66', time: '6:30', timezone: 9, jhora: 29.5333333333, sign: 2 }
];

function jdFrom(date, time, timezone) {
  let [day, month, year] = date.split('.').map(Number);
  if (year < 100) year += year >= 50 ? 1900 : 2000;
  const [hours, minutes] = time.split(':').map(Number);
  const utHour = hours + minutes / 60 - timezone;
  if (month <= 2) { year -= 1; month += 12; }
  const a = Math.floor(year / 100); const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5 + utHour / 24;
}
function normalize360(value) { let result = value % 360; if (result < 0) result += 360; return result; }
function normalize180(value) { let result = normalize360(value); if (result > 180) result -= 360; return result; }
function sinD(value) { return Math.sin(value * Math.PI / 180); }
function asinD(value) { return Math.asin(Math.max(-1, Math.min(1, value))) * 180 / Math.PI; }
function meanLongitude(ahargana, revs, beeja, offset) {
  const adjustedRevs = revs + beeja;
  const totalRevs = (adjustedRevs * ahargana) / CIVIL_DAYS_MAHAYUGA;
  const fraction = totalRevs - Math.floor(totalRevs);
  return normalize360(fraction * 360 + offset);
}
function mphFromMk(mk, pe, po) {
  const mkNorm = normalize360(mk);
  const sinAbs = Math.abs(sinD(mkNorm));
  const p = pe - (pe - po) * sinAbs;
  return asinD((p * sinD(mkNorm)) / 360.0);
}
function applyRevisedManda(meanLongitudeValue, apogeeLongitude, pe, po) {
  const mk1 = normalize360(apogeeLongitude - meanLongitudeValue);
  const mph1 = mphFromMk(mk1, pe, po);
  const mk2 = normalize360(mk1 + mph1 / 2);
  const mph2 = mphFromMk(mk2, pe, po);
  return normalize360(meanLongitudeValue + mph2);
}
function signedMinutes(actualLongitude, expectedSign, expectedDegree) {
  const expectedLongitude = (expectedSign - 1) * 30 + expectedDegree;
  return normalize180(actualLongitude - expectedLongitude) * 60;
}
const precomputed = CASES.map((testCase) => {
  const jd = jdFrom(testCase.date, testCase.time, testCase.timezone);
  return { ...testCase, ahargana: jd - KALI_YUGA_EPOCH_JD };
});
let best = null;
for (let beeja = -0.65; beeja <= -0.40; beeja += 0.02) {
  const apogeeBeeja = (beeja / 60) * CIVIL_DAYS_MAHAYUGA / (360 * 365.258756);
  for (let offset = 128; offset <= 138; offset += 0.5) {
    for (let pe = 32.0; pe <= 33.4; pe += 0.1) {
      for (let po = 31.2; po <= 32.2; po += 0.1) {
        const deltas = [];
        for (const testCase of precomputed) {
          const meanMoon = meanLongitude(testCase.ahargana, REV_MOON, MOON_BEEJA, MOON_OFFSET);
          const apogee = meanLongitude(testCase.ahargana, REV_MOON_APOGEE, apogeeBeeja, offset);
          const moonTrue = applyRevisedManda(meanMoon, apogee, pe, po);
          deltas.push(signedMinutes(moonTrue, testCase.sign, testCase.jhora));
        }
        const rmse = Math.sqrt(deltas.reduce((sum, delta) => sum + delta * delta, 0) / deltas.length);
        const maxAbs = Math.max(...deltas.map((delta) => Math.abs(delta)));
        if (!best || rmse < best.rmse || (Math.abs(rmse - best.rmse) < 1e-9 && maxAbs < best.maxAbs)) {
          best = { beeja: Number(beeja.toFixed(2)), offset: Number(offset.toFixed(2)), pe: Number(pe.toFixed(2)), po: Number(po.toFixed(2)), rmse, maxAbs, deltas };
        }
      }
    }
  }
}
console.log(JSON.stringify({ beeja: best.beeja, offset: best.offset, pe: best.pe, po: best.po, rmse: best.rmse, maxAbs: best.maxAbs }, null, 2));
for (let i = 0; i < CASES.length; i++) {
  console.log(CASES[i].id + ': ' + best.deltas[i].toFixed(2) + "'");
}
