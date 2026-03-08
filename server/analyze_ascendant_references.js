const sidereal = require('astronomia/sidereal');
const nutation = require('astronomia/nutation');
const { calculatePlanets, calculateMakarandaAyanamsa } = require('./SuryaSiddhanta');

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

function toJulianDay(year, month, day, hourDecimal) {
  let y = year;
  let m = month;
  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);

  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    b -
    1524.5 +
    hourDecimal / 24
  );
}

function tropicalAscendant(lstDegrees, latitude, obliquityRadians) {
  const lst = lstDegrees * Math.PI / 180;
  const phi = latitude * Math.PI / 180;
  const ascRadians = Math.atan2(
    -Math.cos(lst),
    Math.sin(obliquityRadians) * Math.tan(phi) + Math.cos(obliquityRadians) * Math.sin(lst)
  );

  return normalize360(ascRadians * 180 / Math.PI + 180);
}

function ascVariant(jd, latitude, longitude, siderealMode, obliquityMode) {
  const siderealSeconds = siderealMode === 'mean' ? sidereal.mean(jd) : sidereal.apparent(jd);
  const lstDegrees = normalize360((siderealSeconds / 3600) * 15 + longitude);
  const [, deltaObliquity] = nutation.nutation(jd);
  const meanObliquity = nutation.meanObliquity(jd);
  const obliquity = obliquityMode === 'mean' ? meanObliquity : meanObliquity + deltaObliquity;
  const tropical = tropicalAscendant(lstDegrees, latitude, obliquity);
  return normalize360(tropical - calculateMakarandaAyanamsa(jd));
}

function formatLongitude(longitude) {
  const sign = Math.floor(longitude / 30) + 1;
  const degree = longitude % 30;
  const signs = ['', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const d = Math.floor(degree);
  const m = Math.round((degree - d) * 60);
  return d + "° " + m + "' " + signs[sign];
}

const cases = [
  {
    name: 'Tanya',
    jhoraAsc: 150 + 29 + 41 / 60,
    birth: { y: 1986, m: 10, d: 22, h: 6, min: 45, tz: 3, lat: 44 + 57 / 60, lon: 34 + 6 / 60 }
  },
  {
    name: 'Ksyusha',
    jhoraAsc: 30 + 4 + 51 / 60,
    birth: { y: 2021, m: 8, d: 20, h: 23, min: 10, tz: 3, lat: 44 + 57 / 60, lon: 34 + 6 / 60 }
  }
];

for (const entry of cases) {
  const { y, m, d, h, min, tz, lat, lon } = entry.birth;
  const jd = toJulianDay(y, m, d, h + min / 60 - tz);
  const classic = calculatePlanets(jd, lat, lon, { makarandaMode: 'Makaranda Classic' }).ascendant.longitude;
  const research = calculatePlanets(jd, lat, lon, { makarandaMode: 'Makaranda Research (Generalized Munjala)' }).ascendant.longitude;
  const variants = {
    apparentTrue: ascVariant(jd, lat, lon, 'apparent', 'true'),
    apparentMean: ascVariant(jd, lat, lon, 'apparent', 'mean'),
    meanTrue: ascVariant(jd, lat, lon, 'mean', 'true'),
    meanMean: ascVariant(jd, lat, lon, 'mean', 'mean'),
  };

  console.log('\n=== ' + entry.name + ' ===');
  console.log('JHora:   ' + formatLongitude(entry.jhoraAsc));
  console.log('Classic: ' + formatLongitude(classic) + ' | delta ' + (normalize180(classic - entry.jhoraAsc) * 60).toFixed(2) + "'");
  console.log('Research:' + ' ' + formatLongitude(research) + ' | delta ' + (normalize180(research - entry.jhoraAsc) * 60).toFixed(2) + "'");
  for (const [name, value] of Object.entries(variants)) {
    console.log(name.padEnd(12) + ' ' + formatLongitude(value).padEnd(18) + ' | delta ' + (normalize180(value - entry.jhoraAsc) * 60).toFixed(2) + "'");
  }
}
