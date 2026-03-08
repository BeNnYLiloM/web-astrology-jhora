const CIVIL_DAYS_MAHAYUGA = 1577917828;
const REV_MOON = 57753336;
const REV_MOON_APOGEE = 488203;
const KALI_YUGA_EPOCH_JD = 588465.5;
const MOON_BEEJA = (-0.1063829787 / 60) * CIVIL_DAYS_MAHAYUGA / (360 * 365.258756);
const MOON_APOGEE_BEEJA = (-0.4851063830 / 60) * CIVIL_DAYS_MAHAYUGA / (360 * 365.258756);
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
function normalize360(v){v%=360;if(v<0)v+=360;return v;} function normalize180(v){v=normalize360(v);if(v>180)v-=360;return v;}
function sinD(v){return Math.sin(v*Math.PI/180);} function asinD(v){return Math.asin(Math.max(-1,Math.min(1,v)))*180/Math.PI;}
function meanLongitude(ahargana,revs,beeja,offset){const adjusted=revs+beeja; const total=(adjusted*ahargana)/CIVIL_DAYS_MAHAYUGA; const frac=total-Math.floor(total); return normalize360(frac*360+offset);}
function simpleMoon(meanMoon, apogee){ const anomaly = normalize360(meanMoon - apogee); const circ = 32 - (32 - 31.67) * Math.abs(sinD(anomaly)); const corr = asinD((circ * sinD(anomaly))/360); return anomaly < 180 ? normalize360(meanMoon - corr) : normalize360(meanMoon + Math.abs(corr)); }
function fixedMaxMoon(meanMoon, apogee){ const anomaly = normalize360(apogee - meanMoon); const maxEq = 5 + 2/60 + 10/3600; const corr = asinD(sinD(anomaly) * sinD(maxEq)); return normalize360(meanMoon + corr); }
function signedMinutes(actual, sign, deg){ return normalize180(actual - ((sign-1)*30 + deg))*60; }
for (const mode of ['simple','fixedmax']) {
  let rms=0,max=0;
  console.log('\\nMODE=' + mode);
  for (const c of CASES) {
    const jd = jdFrom(c.date,c.time,c.timezone);
    const ah = jd - KALI_YUGA_EPOCH_JD;
    const meanMoon = meanLongitude(ah, REV_MOON, MOON_BEEJA, 0);
    const apogee = meanLongitude(ah, REV_MOON_APOGEE, MOON_APOGEE_BEEJA, 90);
    const moon = mode === 'simple' ? simpleMoon(meanMoon, apogee) : fixedMaxMoon(meanMoon, apogee);
    const delta = signedMinutes(moon, c.sign, c.jhora);
    rms += delta*delta; max = Math.max(max, Math.abs(delta));
    console.log(c.id + ': ' + delta.toFixed(2) + "'");
  }
  console.log('RMSE=' + Math.sqrt(rms/CASES.length).toFixed(2) + "' max=" + max.toFixed(2) + "'");
}

