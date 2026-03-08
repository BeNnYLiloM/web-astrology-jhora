const CIVIL_DAYS_MAHAYUGA = 1577917828;
const REV_MOON = 57753336;
const REV_MOON_APOGEE = 488203;
const KALI_YUGA_EPOCH_JD = 588465.5;
const MOON_MANDA = [32, 31.67];

const CASES = [
  ['Roman', '16.03.1992', '16:00', 10, "28°30'", 4],
  ['Ekaterina', '22.02.71', '11:27', 2, "29°54'", 9],
  ['Sveta', '16.01.86', '18:20', 3, "17°05'", 12],
  ['Misha', '15.08.78', '17:15', 10, "16°06'", 9],
  ['Yana', '7.02.22', '2:12', 3, "4°23'", 1],
  ['Nadya1', '10.03.84', '13:35', 3, "25°04'", 2],
  ['Darina', '28.01.21', '16:07', 3, "11°23'", 4],
  ['Tanya', '22.10.1986', '6:45', 3, "24°21'", 2],
  ['Nadya2', '15.11.85', '2:34', 3, "0°09' Sagittarius", 9],
  ['Ksyusha', '20.08.21', '23:10', 3, "12°28'", 10],
  ['Polina', '15.01.16', '15:53', 3, "10°34'", 12],
  ['DashaL', '3.02.94', '6:40', 2, "16°43'", 7],
  ['DashaZhuk', '2.03.96', '18:32', 2, "17°55'", 4],
  ['Lavanga', '2.02.66', '6:30', 9, "29°32'", 2]
];

const variants = {
  Current: { moonBeeja: 1131.1, apogeeBeeja: 75, moonOffset: -120.48, apogeeOffset: 0 },
  Historical499: {
    moonBeeja: (-0.1 / 60) * CIVIL_DAYS_MAHAYUGA / (360 * 365.258756),
    apogeeBeeja: (-0.456 / 60) * CIVIL_DAYS_MAHAYUGA / (360 * 365.258756),
    moonOffset: 0,
    apogeeOffset: 0
  },
  Historical522: {
    moonBeeja: (-0.1063829787 / 60) * CIVIL_DAYS_MAHAYUGA / (360 * 365.258756),
    apogeeBeeja: (-0.4851063830 / 60) * CIVIL_DAYS_MAHAYUGA / (360 * 365.258756),
    moonOffset: 0,
    apogeeOffset: 0
  }
};

function normalize360(v){ v%=360; if(v<0)v+=360; return v; }
function normalize180(v){ let n=normalize360(v); if(n>180)n-=360; return n; }
function sinD(d){ return Math.sin(d*Math.PI/180); }
function asinD(v){ return Math.asin(v)*180/Math.PI; }
function jdFrom(date,time,tz){ let [d,m,y]=date.split('.').map(Number); if(y<100) y += y>=50 ? 1900 : 2000; const [h,min]=time.split(':').map(Number); const hour=h+min/60-tz; if(m<=2){y-=1;m+=12;} const a=Math.floor(y/100), b=2-a+Math.floor(a/4); return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+b-1524.5+hour/24; }
function parseRefDegree(text){ const m=text.match(/(\d+)[°º]\s*(\d+)/); return Number(m[1])+Number(m[2])/60; }
function calcMean(revs, beeja, offset, ahargana){ const totalRevs=((revs+beeja)*ahargana)/CIVIL_DAYS_MAHAYUGA; const fraction=totalRevs-Math.floor(totalRevs); return normalize360(fraction*360+offset); }
function moonTrue(moonMean, apogeeMean){ const anomaly = normalize360(moonMean - apogeeMean); const [odd, even] = MOON_MANDA; const circumference = odd - (odd - even) * Math.abs(sinD(anomaly)); const correction = asinD((circumference * sinD(anomaly)) / 360.0); return normalize360(moonMean - correction); }
function score(params){
  let sumSq = 0; let maxAbs = 0;
  for (const [,date,time,tz,jh,sign] of CASES){
    const jd=jdFrom(date,time,tz); const ah = jd - KALI_YUGA_EPOCH_JD;
    const meanMoon = calcMean(REV_MOON, params.moonBeeja, params.moonOffset, ah);
    const meanApogee = calcMean(REV_MOON_APOGEE, params.apogeeBeeja, params.apogeeOffset, ah);
    const actual = moonTrue(meanMoon, meanApogee);
    const expected = (sign - 1) * 30 + parseRefDegree(jh);
    const delta = normalize180(actual - expected);
    const minutes = delta * 60;
    sumSq += minutes * minutes;
    maxAbs = Math.max(maxAbs, Math.abs(minutes));
  }
  return { rmse: Math.sqrt(sumSq / CASES.length), maxAbs };
}

function search(base){
  let best = { ...base, ...score(base) };
  for (let moonOffset = -180; moonOffset <= 180; moonOffset += 15) {
    for (let apogeeOffset = -180; apogeeOffset <= 180; apogeeOffset += 15) {
      const candidate = { ...base, moonOffset, apogeeOffset };
      const scored = { ...candidate, ...score(candidate) };
      if (scored.rmse < best.rmse) best = scored;
    }
  }
  for (let step of [5, 1, 0.25]) {
    let improved = true;
    while (improved) {
      improved = false;
      for (let dMoon = -step; dMoon <= step; dMoon += step) {
        for (let dApogee = -step; dApogee <= step; dApogee += step) {
          const candidate = {
            ...base,
            moonOffset: best.moonOffset + dMoon,
            apogeeOffset: best.apogeeOffset + dApogee
          };
          const scored = { ...candidate, ...score(candidate) };
          if (scored.rmse + 1e-9 < best.rmse) {
            best = scored;
            improved = true;
          }
        }
      }
    }
  }
  return best;
}

for (const [label, base] of Object.entries(variants)) {
  const raw = score(base);
  const tuned = search(base);
  console.log('\n=== ' + label + ' ===');
  console.log('raw   rmse=', raw.rmse.toFixed(2), 'maxAbs=', raw.maxAbs.toFixed(2));
  console.log('tuned rmse=', tuned.rmse.toFixed(2), 'maxAbs=', tuned.maxAbs.toFixed(2), 'moonOffset=', tuned.moonOffset.toFixed(2), 'apogeeOffset=', tuned.apogeeOffset.toFixed(2));
}
