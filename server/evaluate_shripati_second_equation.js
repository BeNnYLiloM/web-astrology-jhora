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

const R = 3438;

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
function normalize360(v){v%=360;if(v<0)v+=360;return v;} function normalize180(v){v=normalize360(v); if(v>180)v-=360; return v;}
function sinD(v){return Math.sin(v*Math.PI/180);} function cosD(v){return Math.cos(v*Math.PI/180);} 
function signedMinutes(actual, sign, deg){ return normalize180(actual - ((sign-1)*30 + deg))*60; }
function versedSineD(v){ return 1 - cosD(v); }
function moonHypotenuseFraction(anomalyDeg){
  const odd = 32, even = 31.67;
  const sinAbs = Math.abs(sinD(anomalyDeg));
  const circumference = odd - (odd - even) * sinAbs;
  const P = sinD(anomalyDeg) * (circumference / 360.0);
  const B = cosD(anomalyDeg) * (circumference / 360.0);
  return Math.sqrt((1 + B) * (1 + B) + P * P);
}

function evaluateVariant({ anomalySource, distanceSource, signMode }) {
  const deltas = [];
  for (const c of CASES) {
    const d = calculateDiagnostics(jdFrom(c.date, c.time, c.timezone), c.latitude, c.longitude);
    const anomaly = anomalySource === 'mean' ? normalize180(d.moon.meanLongitude - d.moon.apogeeLongitude) : normalize180(d.moon.trueLongitude - d.moon.apogeeLongitude);
    const moonForDistance = distanceSource === 'mean' ? d.moon.meanLongitude : d.moon.trueLongitude;
    const D = normalize180(moonForDistance - d.sun.trueLongitude);
    const caraBaseMin = 160 * cosD(d.sun.trueLongitude - d.moon.apogeeLongitude);
    const hypFrac = moonHypotenuseFraction(anomaly);
    const ratio = versedSineD(anomaly) / Math.max(1e-9, Math.abs((hypFrac - 1) * R / R));
    const paramaMin = caraBaseMin * ratio;
    const secondMin = paramaMin * sinD(D);
    const corrected = signMode === 'add'
      ? normalize360(d.moon.trueLongitude + secondMin / 60)
      : normalize360(d.moon.trueLongitude - secondMin / 60);
    deltas.push(signedMinutes(corrected, c.sign, c.jhora));
  }
  const rmse = Math.sqrt(deltas.reduce((sum, x) => sum + x * x, 0) / deltas.length);
  const maxAbs = Math.max(...deltas.map((x) => Math.abs(x)));
  return { rmse, maxAbs, deltas };
}

const variants = [];
for (const anomalySource of ['mean','true']) {
  for (const distanceSource of ['mean','true']) {
    for (const signMode of ['add','subtract']) {
      variants.push({ anomalySource, distanceSource, signMode });
    }
  }
}
let best = null;
for (const variant of variants) {
  const result = evaluateVariant(variant);
  if (!best || result.rmse < best.rmse || (Math.abs(result.rmse - best.rmse) < 1e-9 && result.maxAbs < best.maxAbs)) {
    best = { variant, ...result };
  }
}
console.log(JSON.stringify({ variant: best.variant, rmse: best.rmse, maxAbs: best.maxAbs }, null, 2));
for (let i = 0; i < CASES.length; i++) console.log(CASES[i].id + ': ' + best.deltas[i].toFixed(2) + "'");
