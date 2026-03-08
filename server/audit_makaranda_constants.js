const { inspect } = require('util');
const CIVIL_DAYS_MAHAYUGA = 1577917828;
const SIDEREAL_YEAR_DAYS = 365.258756;

const currentBeeja = {
  Sun: -0.35,
  Moon: 1131.1,
  Mars: 14.8,
  Mercury: 45.6,
  Jupiter: -7.5,
  Venus: -20,
  Saturn: -55,
  Rahu: 3.6,
  MoonApogee: 75,
};

const historical = {
  VariantA_499AD: {
    Moon: -25 / 250,
    MoonApogee: -114 / 250,
    Rahu: -96 / 250,
    Mars: 48 / 250,
    Mercury: 420 / 250,
    Jupiter: -47 / 250,
    Venus: -153 / 250,
    Saturn: 20 / 250,
  },
  VariantB_522AD: {
    Moon: -25 / 235,
    MoonApogee: -114 / 235,
    Rahu: -96 / 235,
    Mars: 45 / 235,
    Mercury: 420 / 235,
    Jupiter: -47 / 235,
    Venus: -153 / 235,
    Saturn: 20 / 235,
  }
};

function currentToArcminPerYear(beejaCyclesPerMahayuga) {
  const degPerDay = (beejaCyclesPerMahayuga * 360) / CIVIL_DAYS_MAHAYUGA;
  const degPerYear = degPerDay * SIDEREAL_YEAR_DAYS;
  return degPerYear * 60;
}

console.log('=== Current BEEJA annualized ===\n');
for (const [body, value] of Object.entries(currentBeeja)) {
  console.log(body.padEnd(11), currentToArcminPerYear(value).toFixed(6), 'arcmin/year');
}

console.log('\n=== Historical references ===\n');
for (const [variant, values] of Object.entries(historical)) {
  console.log(variant);
  for (const [body, value] of Object.entries(values)) {
    console.log(' ', body.padEnd(11), value.toFixed(6), 'arcmin/year');
  }
  console.log('');
}
