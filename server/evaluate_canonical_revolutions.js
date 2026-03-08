const Module = require('module');
const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'swisseph') return {};
  return originalLoad.apply(this, arguments);
};
const fs = require('fs');
const original = require('./SuryaSiddhanta');
const src = fs.readFileSync(require.resolve('./SuryaSiddhanta'), 'utf8');
const vm = require('vm');

function loadWithReplacements(replacements) {
  let modified = src;
  for (const [from, to] of replacements) modified = modified.replace(from, to);
  const module = { exports: {} };
  const sandbox = {
    require: (name) => name === 'swisseph' ? {} : require(name),
    module,
    exports: module.exports,
    console,
    Math
  };
  vm.runInNewContext(modified, sandbox, { filename: 'SuryaSiddhanta.modified.js' });
  return module.exports;
}

const canonical = loadWithReplacements([
  ['const REV_MARS = 2296824;', 'const REV_MARS = 2296832;'],
  ['const REV_VENUS = 7022388;', 'const REV_VENUS = 7022376;']
]);

const cases = [
  { id: 'Valeriya', date: '09.08.1995', time: '6:36', latitude: 49 + 31 / 60, longitude: 23 + 12 / 60, timezone: 3, body: 'Mars', sign: 6, degree: 18.3 },
  { id: 'Roman', date: '16.03.1992', time: '16:00', latitude: 50 + 13 / 60, longitude: 136 + 54 / 60, timezone: 10, body: 'Moon', sign: 4, degree: 28.5 },
  { id: 'Tanya', date: '22.10.1986', time: '6:45', latitude: 44 + 57 / 60, longitude: 34 + 6 / 60, timezone: 3, body: 'Moon', sign: 2, degree: 24.35 }
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
function deltaMinutes(longitude, sign, degree){ return normalize180(longitude - ((sign-1)*30 + degree))*60; }
for (const c of cases) {
  const jd = jdFrom(c.date, c.time, c.timezone);
  const current = original.calculatePlanets(jd, c.latitude, c.longitude);
  const canon = canonical.calculatePlanets(jd, c.latitude, c.longitude);
  const currentLon = current.planets.find((p) => p.name === c.body).longitude;
  const canonLon = canon.planets.find((p) => p.name === c.body).longitude;
  console.log(c.id + ' current=' + deltaMinutes(currentLon, c.sign, c.degree).toFixed(2) + "' canonical=" + deltaMinutes(canonLon, c.sign, c.degree).toFixed(2) + "' shift=" + deltaMinutes(canonLon, Math.floor(currentLon/30)+1, currentLon%30).toFixed(2) + "'");
}

