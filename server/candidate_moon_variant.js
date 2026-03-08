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
const candidate = {
  moonBeeja: (-0.1063829787 / 60) * CIVIL_DAYS_MAHAYUGA / (360 * 365.258756),
  apogeeBeeja: (-0.4851063830 / 60) * CIVIL_DAYS_MAHAYUGA / (360 * 365.258756),
  moonOffset: 11.75,
  apogeeOffset: 130.5
};
function normalize360(v){ v%=360; if(v<0)v+=360; return v; }
function normalize180(v){ let n=normalize360(v); if(n>180)n-=360; return n; }
function sinD(d){ return Math.sin(d*Math.PI/180); }
function asinD(v){ return Math.asin(v)*180/Math.PI; }
function jdFrom(date,time,tz){ let [d,m,y]=date.split('.').map(Number); if(y<100) y += y>=50 ? 1900 : 2000; const [h,min]=time.split(':').map(Number); const hour=h+min/60-tz; if(m<=2){y-=1;m+=12;} const a=Math.floor(y/100), b=2-a+Math.floor(a/4); return Math.floor(365.25*(y+4716))+Math.floor(30.6001*(m+1))+d+b-1524.5+hour/24; }
function parseRefDegree(text){ const m=text.match(/(\d+)[°º]\s*(\d+)/); return Number(m[1])+Number(m[2])/60; }
function calcMean(revs, beeja, offset, ahargana){ const totalRevs=((revs+beeja)*ahargana)/CIVIL_DAYS_MAHAYUGA; const fraction=totalRevs-Math.floor(totalRevs); return normalize360(fraction*360+offset); }
function moonTrue(moonMean, apogeeMean){ const anomaly = normalize360(moonMean - apogeeMean); const [odd, even] = MOON_MANDA; const circumference = odd - (odd - even) * Math.abs(sinD(anomaly)); const correction = asinD((circumference * sinD(anomaly)) / 360.0); return normalize360(moonMean - correction); }
function dmsInSign(longitude){ const d = Math.floor(longitude % 30); const mFloat = (longitude % 30 - d)*60; const m = Math.floor(mFloat); const s = ((mFloat - m)*60).toFixed(2); return d + '° ' + m + "' " + s + '"'; }
for (const [name,date,time,tz,jh,sign] of CASES){
  const jd=jdFrom(date,time,tz); const ah = jd - KALI_YUGA_EPOCH_JD;
  const meanMoon = calcMean(REV_MOON, candidate.moonBeeja, candidate.moonOffset, ah);
  const meanApogee = calcMean(REV_MOON_APOGEE, candidate.apogeeBeeja, candidate.apogeeOffset, ah);
  const actual = moonTrue(meanMoon, meanApogee);
  const expected = (sign - 1) * 30 + parseRefDegree(jh);
  const delta = normalize180(actual - expected) * 60;
  console.log(name.padEnd(10), 'Moon', dmsInSign(actual).padEnd(16), 'deltaMin', delta.toFixed(2));
}
