const EPICYCLES = {
  Moon: { manda: [32, 31.67] }
};
const CIVIL_DAYS_MAHAYUGA = 1577917828;
const REV_SUN = 4320000;
const REV_MOON = 57753336;
const REV_MOON_APOGEE = 488203;
const KALI_YUGA_EPOCH_JD = 588465.5;
const OFFSETS = {
  Sun: 0.37,
  Moon: -120.48,
  MoonApogee: 0
};

const variants = {
  Current: { Sun: -0.35, Moon: 1131.1, MoonApogee: 75 },
  Historical499: {
    Sun: -0.35,
    Moon: (-0.1 / 60) * CIVIL_DAYS_MAHAYUGA / (360 * 365.258756),
    MoonApogee: (-0.456 / 60) * CIVIL_DAYS_MAHAYUGA / (360 * 365.258756)
  },
  Historical522: {
    Sun: -0.35,
    Moon: (-0.1063829787 / 60) * CIVIL_DAYS_MAHAYUGA / (360 * 365.258756),
    MoonApogee: (-0.4851063830 / 60) * CIVIL_DAYS_MAHAYUGA / (360 * 365.258756)
  }
};

const CASES = [
  ['Roman','16.03.1992','16:00',10,4,28.5],
  ['Ekaterina','22.02.71','11:27',2,9,29.9],
  ['Sveta','16.01.86','18:20',3,12,17.0833333333],
  ['Tanya','22.10.1986','6:45',3,2,24.35],
  ['Lavanga','2.02.66','6:30',9,2,29.5333333333]
];

function normalize360(v){ v%=360; if(v<0)v+=360; return v; }
function sinD(d){ return Math.sin(d*Math.PI/180); }
function asinD(v){ return Math.asin(v)*180/Math.PI; }
function jdFrom(date,time,tz){ let [d,m,y]=date.split('.').map(Number); if(y<100) y += y>=50 ? 1900 : 2000; const [h,min]=time.split(':').map(Number); const hour=h+min/60-tz; if(m<=2){y-=1;m+=12;} const a=Math.floor(y/100), b=2-a+Math.floor(a/4); return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+b-1524.5+hour/24; }
function calcMean(revs, beeja, offset, ahargana){ const adjustedRevs = revs + beeja; const totalRevs=(adjustedRevs*ahargana)/CIVIL_DAYS_MAHAYUGA; const fraction = totalRevs - Math.floor(totalRevs); return normalize360(fraction*360 + offset); }
function applyMoonManda(meanMoon, meanApogee){ const anomaly = normalize360(meanMoon - meanApogee); const odd=EPICYCLES.Moon.manda[0], even=EPICYCLES.Moon.manda[1]; const circumference = odd - (odd - even) * Math.abs(sinD(anomaly)); const correction = asinD((circumference * sinD(anomaly)) / 360.0); return normalize360(meanMoon - correction); }
function diffInSign(actual, expected, sign){ let d = (actual % 30) - expected; return d*60; }
for (const [label, beeja] of Object.entries(variants)) {
  console.log('\n=== ' + label + ' ===');
  for (const [name,date,time,tz,sign,jhoraDeg] of CASES) {
    const jd = jdFrom(date,time,tz); const ahargana = jd - KALI_YUGA_EPOCH_JD;
    const meanSun = calcMean(REV_SUN, beeja.Sun, OFFSETS.Sun, ahargana);
    const meanMoon = calcMean(REV_MOON, beeja.Moon, OFFSETS.Moon, ahargana);
    const meanApogee = calcMean(REV_MOON_APOGEE, beeja.MoonApogee, OFFSETS.MoonApogee, ahargana);
    const trueMoon = applyMoonManda(meanMoon, meanApogee);
    const meanSign = Math.floor(meanMoon/30)+1;
    const trueSign = Math.floor(trueMoon/30)+1;
    const meanDelta = meanSign === sign ? diffInSign(meanMoon, jhoraDeg, sign).toFixed(2) : 'sign';
    const trueDelta = trueSign === sign ? diffInSign(trueMoon, jhoraDeg, sign).toFixed(2) : 'sign';
    console.log(name.padEnd(10), 'mean', String(meanDelta).padStart(8), 'true', String(trueDelta).padStart(8), 'meanSign', meanSign, 'trueSign', trueSign);
  }
}
