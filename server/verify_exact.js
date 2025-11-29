const axios = require('axios');

const toDMS = (deg) => {
  const d = Math.floor(deg);
  const m = Math.floor((deg - d) * 60);
  const s = ((deg - d) * 60 - m) * 60;
  return `${d}° ${m}' ${s.toFixed(2)}"`;
};

const getSignName = (sign) => {
  const signs = ["", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  return signs[sign] || "Unknown";
};

async function verifyExact() {
  console.log('=== Exact Value Verification ===\n');

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

    console.log(`Ayanamsa: ${data.ayanamsa}`);
    console.log(`Ascendant: ${getSignName(data.ascendant.sign)} ${toDMS(data.ascendant.degree)}`);

    console.log('\nPlanetary Positions:');
    data.planets.forEach(p => {
      console.log(`${p.name.padEnd(10)}: ${getSignName(p.sign).padEnd(12)} ${toDMS(p.degree)}`);
    });

  } catch (error) {
    console.error(error);
  }
}

verifyExact();
