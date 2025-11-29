const axios = require('axios');

const TEST_CASES = [
  {
    name: "CASE 1: 2025-11-24 (Krasnodar)",
    payload: {
      details: {
        date: "2025-11-24",
        time: "21:50",
        latitude: 45.04484,
        longitude: 38.97603,
        timezone: 3,
        ayanamsaType: "Sri Surya Siddhanta (Makaranda)"
      },
      settings: { houseSystem: "Placidus", yearDefinition: "365_DAYS", lifecycleYears: 120 }
    },
    targets: {
      "Ascendant": { sign: 4, degree: 17 + 38 / 60 + 24.81 / 3600 },
      "Sun": { sign: 8, degree: 8 + 4 / 60 + 19.74 / 3600 },
      "Moon": { sign: 9, degree: 29 + 10 / 60 + 25.26 / 3600 },
      "Mars": { sign: 8, degree: 19 + 57 / 60 + 4.75 / 3600 },
      "Mercury": { sign: 7, degree: 24 + 33 / 60 + 18.34 / 3600 },
      "Jupiter": { sign: 4, degree: 2 + 15 / 60 + 15.07 / 3600 },
      "Venus": { sign: 7, degree: 29 + 16 / 60 + 13.28 / 3600 },
      "Saturn": { sign: 11, degree: 27 + 17 / 60 + 0.75 / 3600 },
      "Rahu": { sign: 11, degree: 22 + 20 / 60 + 44.82 / 3600 },
      "Ketu": { sign: 5, degree: 22 + 20 / 60 + 44.82 / 3600 }
    }
  },
  {
    name: "CASE 2: 1992-03-16 (Krasnodar/Far East?)",
    payload: {
      details: {
        date: "1992-03-16",
        time: "16:00",
        latitude: 50.13,
        longitude: 136.54,
        timezone: 10,
        ayanamsaType: "Sri Surya Siddhanta (Makaranda)"
      },
      settings: { houseSystem: "Placidus", yearDefinition: "365_DAYS", lifecycleYears: 120 }
    },
    targets: {
      "Ascendant": { sign: 5, degree: 2 + 3 / 60 + 51.69 / 3600 },
      "Sun": { sign: 12, degree: 2 + 7 / 60 + 18.01 / 3600 },
      "Moon": { sign: 4, degree: 28 + 50 / 60 + 44.13 / 3600 },
      "Mars": { sign: 10, degree: 25 + 30 / 60 + 34.69 / 3600 },
      "Mercury": { sign: 12, degree: 13 + 21 / 60 + 59.66 / 3600 },
      "Jupiter": { sign: 5, degree: 15 + 36 / 60 + 10.52 / 3600 },
      "Venus": { sign: 11, degree: 10 + 17 / 60 + 21.46 / 3600 },
      "Saturn": { sign: 10, degree: 17 + 54 / 60 + 55.30 / 3600 },
      "Rahu": { sign: 9, degree: 14 + 24 / 60 + 22.79 / 3600 },
      "Ketu": { sign: 3, degree: 14 + 24 / 60 + 22.79 / 3600 }
    }
  },
  {
    name: "CASE 3: 1995-08-09 (User Provided)",
    payload: {
      details: {
        date: "1995-08-09",
        time: "06:34",
        latitude: 49.31,
        longitude: 23.12,
        timezone: 3,
        ayanamsaType: "Sri Surya Siddhanta (Makaranda)"
      },
      settings: { houseSystem: "Placidus", yearDefinition: "365_DAYS", lifecycleYears: 120 }
    },
    targets: {
      "Ascendant": { sign: 4, degree: 26 + 42 / 60 + 58.73 / 3600 },
      "Sun": { sign: 4, degree: 21 + 48 / 60 + 12.36 / 3600 },
      "Moon": { sign: 10, degree: 0 + 31 / 60 + 55.22 / 3600 },
      "Mars": { sign: 6, degree: 18 + 18 / 60 + 21.77 / 3600 },
      "Mercury": { sign: 5, degree: 5 + 20 / 60 + 56.69 / 3600 },
      "Jupiter": { sign: 8, degree: 13 + 29 / 60 + 20.11 / 3600 },
      "Venus": { sign: 4, degree: 20 + 30 / 60 + 7.61 / 3600 },
      "Saturn": { sign: 11, degree: 26 + 47 / 60 + 24.33 / 3600 },
      "Rahu": { sign: 7, degree: 8 + 39 / 60 + 25.39 / 3600 },
      "Ketu": { sign: 1, degree: 8 + 39 / 60 + 25.39 / 3600 }
    }
  },
  {
    name: "CASE 4: 1995-08-09 (Hypothesis: New Delhi Coords)",
    payload: {
      details: {
        date: "1995-08-09",
        time: "06:34",
        latitude: 28.61,
        longitude: 77.20,
        timezone: 3, // Keeping TZ 3 as per user input, but changing coords
        ayanamsaType: "Sri Surya Siddhanta (Makaranda)"
      },
      settings: { houseSystem: "Placidus", yearDefinition: "365_DAYS", lifecycleYears: 120 }
    },
    targets: {
      "Ascendant": { sign: 4, degree: 26 + 42 / 60 + 58.73 / 3600 },
      "Sun": { sign: 4, degree: 21 + 48 / 60 + 12.36 / 3600 },
      "Moon": { sign: 10, degree: 0 + 31 / 60 + 55.22 / 3600 },
      "Mars": { sign: 6, degree: 18 + 18 / 60 + 21.77 / 3600 },
      "Mercury": { sign: 5, degree: 5 + 20 / 60 + 56.69 / 3600 },
      "Jupiter": { sign: 8, degree: 13 + 29 / 60 + 20.11 / 3600 },
      "Venus": { sign: 4, degree: 20 + 30 / 60 + 7.61 / 3600 },
      "Saturn": { sign: 11, degree: 26 + 47 / 60 + 24.33 / 3600 },
      "Rahu": { sign: 7, degree: 8 + 39 / 60 + 25.39 / 3600 },
      "Ketu": { sign: 1, degree: 8 + 39 / 60 + 25.39 / 3600 }
    }
  }
];

const toDecimal = (sign, degree) => (sign - 1) * 30 + degree;
const toDMS = (deg) => {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = ((deg - d) * 60 - m) * 60;
  return `${d}° ${m}' ${s.toFixed(2)}"`;
};

async function verifyDual() {
  console.log('=== Dual Calibration Check ===\n');

  for (const testCase of TEST_CASES) {
    console.log(`\n--- ${testCase.name} ---`);
    try {
      const response = await axios.post('http://localhost:3000/api/calculate', testCase.payload);
      const data = response.data;

      console.log(`Calculated Ayanamsa: ${data.ayanamsa}`);

      const checkPlanet = (name, calcSign, calcDeg, isRetrograde) => {
        const target = testCase.targets[name];
        if (!target) return;

        const calcTotal = toDecimal(calcSign, calcDeg);
        const targetTotal = toDecimal(target.sign, target.degree);

        let diff = calcTotal - targetTotal;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        const status = Math.abs(diff) < 0.1 ? "OK" : "FAIL";
        console.log(`${name.padEnd(10)} | Target: ${toDMS(target.degree)} (S${target.sign}) | Calc: ${toDMS(calcDeg)} (S${calcSign}) ${isRetrograde ? '(R)' : ''} | Diff: ${diff.toFixed(4)}° [${status}]`);
      };

      checkPlanet("Ascendant", data.ascendant.sign, data.ascendant.degree);

      data.planets.forEach(p => {
        checkPlanet(p.name, p.sign, p.degree, p.isRetrograde);
      });

    } catch (error) {
      console.error(`Error in ${testCase.name}:`, error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    }
  }
}

verifyDual();
