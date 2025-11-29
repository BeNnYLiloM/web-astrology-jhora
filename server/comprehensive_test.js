const axios = require('axios');

async function testSuryaSiddhanta() {
  console.log('=== Comprehensive Surya Siddhanta Test ===\n');

  const testCases = [
    {
      name: "Nov 24, 2025 21:50 (User's main test)",
      payload: {
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
      },
      expected: {
        sun: { sign: 8, name: "Scorpio" },
        ascendant: { sign: 4, name: "Cancer" },
        ayanamsa: "22° 53"
      }
    },
    {
      name: "Nov 23, 2025 12:33 (Second reference point)",
      payload: {
        details: {
          date: "2025-11-23",
          time: "12:33",
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
      },
      expected: {
        ascendant: { sign: 10, name: "Capricorn" },
        ayanamsa: "22° 53"
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n--- ${testCase.name} ---`);
    try {
      const response = await axios.post('http://localhost:3000/api/calculate', testCase.payload);
      const data = response.data;

      console.log(`Ayanamsa: ${data.ayanamsa}`);
      console.log(`Ascendant: Sign ${data.ascendant.sign} (${getSignName(data.ascendant.sign)}), ${data.ascendant.degree.toFixed(2)}°`);

      const sun = data.planets.find(p => p.name === "Sun");
      if (sun) {
        console.log(`Sun: Sign ${sun.sign} (${getSignName(sun.sign)}), ${sun.degree.toFixed(2)}°`);
      }

      // Verification
      if (testCase.expected.sun) {
        const match = sun.sign === testCase.expected.sun.sign;
        console.log(`✓ Sun verification: ${match ? 'PASS' : 'FAIL'} (expected ${testCase.expected.sun.name})`);
      }

      if (testCase.expected.ascendant) {
        const match = data.ascendant.sign === testCase.expected.ascendant.sign;
        console.log(`✓ Ascendant verification: ${match ? 'PASS' : 'FAIL'} (expected ${testCase.expected.ascendant.name})`);
      }

      if (testCase.expected.ayanamsa) {
        const match = data.ayanamsa.startsWith(testCase.expected.ayanamsa);
        console.log(`✓ Ayanamsa verification: ${match ? 'PASS' : 'FAIL'} (expected ${testCase.expected.ayanamsa})`);
      }

      // Display all planets
      console.log('\nAll Planets:');
      data.planets.forEach(p => {
        console.log(`  ${p.name.padEnd(10)}: Sign ${p.sign} (${getSignName(p.sign).padEnd(12)}), ${p.degree.toFixed(2)}°, House ${p.house}`);
      });

    } catch (error) {
      console.error(`Error: ${error.message}`);
      if (error.response) {
        console.error(`Response: ${JSON.stringify(error.response.data)}`);
      }
    }
  }

  console.log('\n=== Test Complete ===');
}

function getSignName(sign) {
  const signs = ["", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return signs[sign] || "Unknown";
}

testSuryaSiddhanta();
