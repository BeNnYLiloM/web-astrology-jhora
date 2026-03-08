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
  if (month <= 2) { year -= 1; month += 12; }
  const a = Math.floor(year / 100); const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5 + utHour / 24;
}
function normalize360(v){v%=360;if(v<0)v+=360;return v;} function normalize180(v){v=normalize360(v); if(v>180)v-=360; return v;}
function sinD(v){return Math.sin(v*Math.PI/180);} function cosD(v){return Math.cos(v*Math.PI/180);} 
function signedMinutes(actual, sign, deg){ return normalize180(actual - ((sign-1)*30 + deg))*60; }

const data = CASES.map((c) => {
  const d = calculateDiagnostics(jdFrom(c.date, c.time, c.timezone), c.latitude, c.longitude);
  const D = normalize180(d.moon.trueLongitude - d.sun.trueLongitude);
  const M = normalize180(d.moon.anomaly);
  const Ms = normalize180(d.sun.anomaly);
  const resid = signedMinutes(d.moon.trueLongitude, c.sign, c.jhora);
  return { c, d, D, M, Ms, resid };
});

let best = null;
for (let a of [-12,-10,-8,-6,-4,-2,0,2,4,6,8,10,12]) {
  for (let b of [-12,-10,-8,-6,-4,-2,0,2,4,6,8,10,12]) {
    for (let c of [-12,-10,-8,-6,-4,-2,0,2,4,6,8,10,12]) {
      for (let d of [-12,-10,-8,-6,-4,-2,0,2,4,6,8,10,12]) {
        const deltas = [];
        for (const item of data) {
          const corrMin =
            a * sinD(2 * item.D - item.M) +
            b * sinD(2 * item.D) +
            c * sinD(item.Ms) +
            d * sinD(item.M);
          const corrected = normalize360(item.d.moon.trueLongitude + corrMin / 60);
          deltas.push(signedMinutes(corrected, item.c.sign, item.c.jhora));
        }
        const rmse = Math.sqrt(deltas.reduce((sum, x) => sum + x * x, 0) / deltas.length);
        const maxAbs = Math.max(...deltas.map((x) => Math.abs(x)));
        if (!best || rmse < best.rmse || (Math.abs(rmse - best.rmse) < 1e-9 && maxAbs < best.maxAbs)) {
          best = { a, b, c, d, rmse, maxAbs, deltas };
        }
      }
    }
  }
}
console.log(JSON.stringify(best, null, 2));
for (let i = 0; i < data.length; i++) {
  console.log(CASES[i].id + ': ' + best.deltas[i].toFixed(2) + "'");
}
