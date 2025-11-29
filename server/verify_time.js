const axios = require('axios');

async function testTimeMatch() {
  const url = 'http://localhost:3000/api/calculate';

  // Hypothesis: Screenshot time is approx 12:29 PM
  const payload = {
    details: {
      date: "2025-11-23",
      time: "12:29",
      timezone: 3,
      latitude: 45.04484,
      longitude: 38.97603,
      ayanamsaType: "Sri Surya Siddhanta (Makaranda)"
    },
    settings: {
      yearDefinition: "SOLAR",
      lifecycleYears: 144,
      calendar: "GREGORIAN"
    }
  };

  try {
    console.log(`Sending request for inferred time: ${payload.details.time}...`);
    const response = await axios.post(url, payload);
    console.log("Response received:");
    console.log("Ayanamsa String:", response.data.ayanamsa);
    console.log("Ascendant:", response.data.ascendant.sign, response.data.ascendant.degree);
    console.log("Ascendant Name:", response.data.ascendant.nakshatra);

    const sign = response.data.ascendant.sign;
    const deg = response.data.ascendant.degree;

    // Check if it matches Screenshot: Lagna 22 Cp 08' (Sign 10, Deg 22.13)
    if (sign === 10 && Math.abs(deg - 22.13) < 1) {
      console.log("MATCH CONFIRMED: The screenshot corresponds to approx 12:29 PM.");
    } else {
      console.log("NO MATCH: Still different.");
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
}

testTimeMatch();
