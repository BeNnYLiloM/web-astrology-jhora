const axios = require('axios');

async function testAyanamsa() {
  const url = 'http://localhost:3000/api/calculate';
  const payload = {
    details: {
      date: "2025-11-23",
      time: "15:15",
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
    console.log("Sending request with Sri Surya Siddhanta (Makaranda)...");
    const response = await axios.post(url, payload);
    console.log("Response received:");
    console.log("Ayanamsa String:", response.data.ayanamsa);
    console.log("Ayanamsa Type:", response.data.ayanamsaType);
    console.log("Ascendant:", response.data.ascendant.sign, response.data.ascendant.degree);

    // Parse Ayanamsa string to check value range
    // Format: "24° 15.33'"
    const parts = response.data.ayanamsa.split('°');
    const deg = parseInt(parts[0]);
    console.log(`Parsed Degrees: ${deg}`);

    if (deg >= 22 && deg <= 26) {
      console.log("SUCCESS: Ayanamsa value is within expected range for modern times (approx 22-26 deg).");
    } else {
      console.warn("WARNING: Ayanamsa value seems out of expected range for modern times.");
    }

    // Test built-in SS to see what it gives
    console.log("\nTesting built-in Surya Siddhanta (Mean)...");
    const payload2 = { ...payload };
    payload2.details.ayanamsaType = "Surya Siddhanta (Mean)";
    const response2 = await axios.post(url, payload2);
    console.log("Built-in SS Ayanamsa:", response2.data.ayanamsa);

  } catch (error) {
    console.error("Error testing Ayanamsa:", error.message);
    if (error.response) {
      console.error("Server response:", error.response.data);
    }
  }
}

testAyanamsa();
