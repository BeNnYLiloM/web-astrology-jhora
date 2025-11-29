const axios = require('axios');

async function reproduceIssue() {
  const url = 'http://localhost:3000/api/calculate';

  const payload = {
    details: {
      name: "Native",
      date: "2025-11-24",
      time: "21:50",
      place: "Krasnodar, Russia",
      latitude: 45.04484,
      longitude: 38.97603,
      timezone: 3,
      ayanamsaType: "Sri Surya Siddhanta (Makaranda)"
    },
    settings: {
      lifecycleYears: 144,
      yearDefinition: "SOLAR",
      calendar: "GREGORIAN"
    }
  };

  try {
    console.log(`Sending request for: ${payload.details.date} ${payload.details.time}...`);
    const response = await axios.post(url, payload);
    console.log("Response received:");

    const sun = response.data.planets.find(p => p.name === "Sun");
    console.log(`Sun: Sign ${sun.sign} (${sun.sign === 8 ? 'Scorpio' : 'Other'}), Degree ${sun.degree}`);

    const asc = response.data.ascendant;
    console.log(`Ascendant: Sign ${asc.sign}, Degree ${asc.degree}`);

    console.log(`Ayanamsa: ${response.data.ayanamsa}`);

  } catch (error) {
    console.error("Error:", error.message);
  }
}

reproduceIssue();
