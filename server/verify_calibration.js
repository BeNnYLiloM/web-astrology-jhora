const axios = require('axios');

const TARGETS = {
  "Ascendant": { sign: 4, degree: 17 + 38 / 60 + 24.81 / 3600 }, // Cn 17° 38' 24.81"
  "Sun": { sign: 8, degree: 8 + 4 / 60 + 19.74 / 3600 },         // Sc 8° 04' 19.74"
  "Moon": { sign: 9, degree: 29 + 10 / 60 + 25.26 / 3600 },      // Sg 29° 10' 25.26"
  "Mars": { sign: 8, degree: 19 + 57 / 60 + 4.75 / 3600 },       // Sc 19° 57' 04.75"
  "Mercury": { sign: 7, degree: 24 + 33 / 60 + 18.34 / 3600 },   // Li 24° 33' 18.34"
  "Jupiter": { sign: 4, degree: 2 + 15 / 60 + 15.07 / 3600 },    // Cn 2° 15' 15.07"
  "Venus": { sign: 7, degree: 29 + 16 / 60 + 13.28 / 3600 },     // Li 29° 16' 13.28"
  "Saturn": { sign: 11, degree: 27 + 17 / 60 + 0.75 / 3600 },    // Aq 27° 17' 00.75"
  "Rahu": { sign: 11, degree: 22 + 20 / 60 + 44.82 / 3600 },     // Aq 22° 20' 44.82"
  "Ketu": { sign: 5, degree: 22 + 20 / 60 + 44.82 / 3600 }       // Le 22° 20' 44.82"
};

const toDecimal = (sign, degree) => (sign - 1) * 30 + degree;
const toDMS = (deg) => {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = ((deg - d) * 60 - m) * 60;
  return `${d}° ${m}' ${s.toFixed(2)}"`;
};

async function verifyCalibration() {
  console.log('=== Calibration Check ===\n');

  const payload = {
    details: {
      date: "2025-11-24",
      time: "21:50",
      latitude: 45.04484,
      longitude: 38.97603,
      timezone: 3,
      ayanamsaType: "Sri Surya Siddhanta (Makaranda)"
    },
    settings: {
      houseSystem: "Placidus",
      yearDefinition: "365_DAYS",
      lifecycleYears: 120
    }
  };

  try {
    const response = await axios.post('http://localhost:3000/api/calculate', payload);
    const data = response.data;

    console.log(`Calculated Ayanamsa: ${data.ayanamsa}\n`);

    const checkPlanet = (name, calcSign, calcDeg, isRetrograde) => {
      const target = TARGETS[name];
      if (!target) return;

      const calcTotal = toDecimal(calcSign, calcDeg);
      const targetTotal = toDecimal(target.sign, target.degree);

      let diff = calcTotal - targetTotal;
      if (diff > 180) diff -= 360;
      if (diff < -180) diff += 360;

      console.log(`${name.padEnd(10)} | Target: ${toDMS(target.degree)} (S${target.sign}) | Calc: ${toDMS(calcDeg)} (S${calcSign}) ${isRetrograde ? '(R)' : ''} | Diff: ${diff.toFixed(4)}°`);
    };

    checkPlanet("Ascendant", data.ascendant.sign, data.ascendant.degree);

    data.planets.forEach(p => {
      checkPlanet(p.name, p.sign, p.degree, p.isRetrograde);
    });

  } catch (error) {
    console.error(error.message);
  }
}

verifyCalibration();
