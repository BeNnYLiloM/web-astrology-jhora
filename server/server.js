
const express = require('express');
const cors = require('cors');
const swisseph = require('swisseph');
const path = require('path');
const SuryaSiddhanta = require('./SuryaSiddhanta');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// --- Configuration ---

// Путь к файлам эфемерид. Вы должны скачать .se1 файлы в папку ./ephe
const EPHE_PATH = path.join(__dirname, 'ephe');
swisseph.swe_set_ephe_path(EPHE_PATH);

console.log("Swiss Ephemeris Path set to:", EPHE_PATH);

// Swiss Ephemeris Flags
const SEFLG_SWIEPH = 2;       // Use Swiss Ephemeris
const SEFLG_SIDEREAL = 64 * 1024; // Sidereal calculation
const SEFLG_SPEED = 256;      // Calculate speed (for retrograde check)

// Planet IDs
const PLANETS = [
    { id: swisseph.SE_SUN, name: "Sun" },
    { id: swisseph.SE_MOON, name: "Moon" },
    { id: swisseph.SE_MARS, name: "Mars" },
    { id: swisseph.SE_MERCURY, name: "Mercury" },
    { id: swisseph.SE_JUPITER, name: "Jupiter" },
    { id: swisseph.SE_VENUS, name: "Venus" },
    { id: swisseph.SE_SATURN, name: "Saturn" },
    { id: swisseph.SE_MEAN_NODE, name: "Rahu" }, // Mean Node (Standard in Vedic)
];

// Ayanamsa Modes (J.Hora compatible mappings)
const AYANAMSA_MAP = {
    "Lahiri (Chitra Paksha)": swisseph.SE_SIDM_LAHIRI,
    "Raman": swisseph.SE_SIDM_RAMAN,
    "Krishnamurti (KP)": swisseph.SE_SIDM_KRISHNAMURTI,
    "Surya Siddhanta (Mean)": swisseph.SE_SIDM_SURYASIDDHANTA,
    "Sri Surya Siddhanta (Makaranda)": swisseph.SE_SIDM_SURYASIDDHANTA // Fallback
};

// Consts
const NAKSHATRAS = [
    "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
    "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
    "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
    "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
    "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

// --- Promisified SwissEph Wrappers ---

const calcUt = (jd, planetId, flags) => {
    return new Promise((resolve, reject) => {
        swisseph.swe_calc_ut(jd, planetId, flags, (result) => {
            if (result.error) reject(result.error);
            else resolve(result);
        });
    });
};

const calcHouses = (jd, lat, lon) => {
    return new Promise((resolve, reject) => {
        swisseph.swe_houses(jd, lat, lon, 'P', (result) => {
            if (result.error) reject(result.error);
            else resolve(result);
        });
    });
};

const getAyanamsaUt = (jd) => {
    return new Promise((resolve) => {
        swisseph.swe_get_ayanamsa_ut(jd, (result) => resolve(result));
    });
};

const julday = (year, month, day, hour, isGregorian = true) => {
    return new Promise((resolve) => {
        const flag = isGregorian ? swisseph.SE_GREG_CAL : swisseph.SE_JUL_CAL;
        swisseph.swe_julday(year, month, day, hour, flag, (jd) => resolve(jd));
    });
};

// --- Helpers ---

const normalize360 = (d) => {
    let res = d % 360;
    if (res < 0) res += 360;
    return res;
};

const getSignAndNakshatra = (longitude) => {
    const signIndex = Math.floor(longitude / 30) + 1; // 1-12
    const degree = longitude % 30;
    const nakshatraIndex = Math.floor((longitude / 360) * 27);
    return {
        sign: signIndex,
        degree: degree,
        nakshatra: NAKSHATRAS[nakshatraIndex] || "Unknown"
    };
};

const calculateD9 = (ascLong, planets) => {
    const getNavamsaSign = (long) => {
        const signIdx = Math.floor(long / 30) + 1;
        const degInSign = long % 30;
        const navamsaIdx = Math.floor(degInSign / (30 / 9)); // 0-8

        let startSign;
        if ([1, 5, 9].includes(signIdx)) startSign = 1;
        else if ([2, 6, 10].includes(signIdx)) startSign = 10;
        else if ([3, 7, 11].includes(signIdx)) startSign = 7;
        else startSign = 4;

        return normalize360((startSign + navamsaIdx - 1) * 30 + 15) / 30;
    };

    const ascSign = getNavamsaSign(ascLong);
    const d9Planets = planets.map(p => {
        const sign = getNavamsaSign(p.rawLongitude);
        let house = sign - ascSign + 1;
        if (house <= 0) house += 12;
        return {
            name: p.name,
            sign: sign,
            degree: 0,
            nakshatra: "",
            isRetrograde: p.isRetrograde,
            house: house
        };
    });

    return {
        name: "Navamsa",
        symbol: "D-9",
        ascendant: { name: "Ascendant", sign: ascSign, degree: 0, nakshatra: "", isRetrograde: false, house: 1 },
        planets: d9Planets
    };
};

const calculateDasas = (moonLong, birthDateIso, settings) => {
    const nakshatraSpan = 13.33333333;
    const pos = moonLong / nakshatraSpan;
    const nakshatraIdx = Math.floor(pos);
    const fractionPassed = pos - nakshatraIdx;
    const fractionLeft = 1.0 - fractionPassed;

    const lords = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
    const years = [7, 20, 6, 10, 7, 18, 16, 19, 17];

    const startLordIdx = nakshatraIdx % 9;
    const daysPerYear = settings.yearDefinition === '360_TITHIS' ? 354.36707 : 365.2425;

    const dasas = [];
    let currentDate = new Date(birthDateIso);

    const balanceYears = years[startLordIdx] * fractionLeft;
    const balanceDays = balanceYears * daysPerYear;

    const firstEndDate = new Date(currentDate.getTime() + balanceDays * 24 * 60 * 60 * 1000);

    dasas.push({
        lord: lords[startLordIdx],
        startDate: currentDate.toISOString().split('T')[0],
        endDate: firstEndDate.toISOString().split('T')[0],
        durationYears: years[startLordIdx],
        isCurrent: false
    });

    currentDate = firstEndDate;
    let currLordIdx = (startLordIdx + 1) % 9;

    const lifecycleYears = settings.lifecycleYears || 120;
    const limitDate = new Date(new Date(birthDateIso).getTime() + lifecycleYears * daysPerYear * 24 * 60 * 60 * 1000);

    while (currentDate < limitDate) {
        const lord = lords[currLordIdx];
        const duration = years[currLordIdx];
        const endDate = new Date(currentDate.getTime() + duration * daysPerYear * 24 * 60 * 60 * 1000);

        dasas.push({
            lord: lord,
            startDate: currentDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            durationYears: duration,
            isCurrent: false
        });

        currentDate = endDate;
        currLordIdx = (currLordIdx + 1) % 9;
    }

    const now = new Date();
    dasas.forEach(d => {
        if (now >= new Date(d.startDate) && now < new Date(d.endDate)) {
            d.isCurrent = true;
        }
    });

    return dasas;
};


// --- API ---

app.get('/', (req, res) => {
    res.send('Jyotish Backend is running correctly. Send POST requests to /api/calculate.');
});

app.post('/api/calculate', async (req, res) => {
    const startTime = Date.now();
    try {
        console.log(`[${new Date().toISOString()}] Request received from ${req.ip}`);
        const { details, settings } = req.body;

        if (!details || !settings) {
            console.warn("Invalid Request: Missing details/settings");
            return res.status(400).json({ error: "Missing details or settings" });
        }

        const [y, m, d] = details.date.split('-').map(Number);
        const [h, min] = details.time.split(':').map(Number);
        const hourDec = h + min / 60.0;
        let utHour = hourDec - details.timezone;

        const utcDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
        utcDate.setUTCHours(0);
        utcDate.setUTCMinutes(utHour * 60);

        const uy = utcDate.getUTCFullYear();
        const um = utcDate.getUTCMonth() + 1;
        const ud = utcDate.getUTCDate();
        const uh = utcDate.getUTCHours() + utcDate.getUTCMinutes() / 60.0 + utcDate.getUTCSeconds() / 3600.0;

        console.log(`DEBUG: Date Input: ${y}-${m}-${d} ${h}:${min}`);
        console.log(`DEBUG: UTC Date: ${uy}-${um}-${ud} ${uh}`);

        const jd = await julday(uy, um, ud, uh);

        console.log(`DEBUG: Calculated JD: ${jd}`);

        let ayanamsaVal = 0;
        let computedPlanets = [];
        let ascendant = {};
        let moonLong = 0;

        if (details.ayanamsaType === "Sri Surya Siddhanta (Makaranda)") {
            console.log("Using Custom Surya Siddhanta Calculation...");
            const SuryaSiddhanta = require('./SuryaSiddhanta');
            const ssData = SuryaSiddhanta.calculatePlanets(jd, details.latitude, details.longitude);
            ayanamsaVal = ssData.ayanamsa;

            // Map SS planets to response format
            const planetMap = {};
            ssData.planets.forEach(p => {
                const info = getSignAndNakshatra(p.longitude);
                planetMap[p.name] = {
                    name: p.name,
                    sign: info.sign,
                    degree: info.degree,
                    nakshatra: info.nakshatra,
                    isRetrograde: p.isRetrograde,
                    rawLongitude: p.longitude,
                    house: 0
                };
                if (p.name === "Moon") moonLong = p.longitude;
            });

            const ORDER = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"];
            computedPlanets = ORDER.map(name => planetMap[name]);
            let ascRaw = ssData.ascendant && typeof ssData.ascendant.longitude === 'number'
                ? ssData.ascendant.longitude
                : null;

            if (ascRaw === null) {
                const tropicalHouses = await calcHouses(jd, details.latitude, details.longitude);
                ascRaw = normalize360(tropicalHouses.ascendant - ayanamsaVal);
            }

            const ascInfo = getSignAndNakshatra(ascRaw);
            ascendant = {
                name: "Ascendant",
                sign: ascInfo.sign,
                degree: ascInfo.degree,
                nakshatra: ascInfo.nakshatra,
                isRetrograde: false,
                house: 1,
                rawLongitude: ascRaw
            };

        } else {
            // Standard SwissEph Logic
            let ayanamsaMode = AYANAMSA_MAP[details.ayanamsaType] || swisseph.SE_SIDM_LAHIRI;
            swisseph.swe_set_sid_mode(ayanamsaMode, 0, 0);
            ayanamsaVal = await getAyanamsaUt(jd);

            const tropicalHouses = await calcHouses(jd, details.latitude, details.longitude);
            let ascRaw = tropicalHouses.ascendant - ayanamsaVal;
            ascRaw = normalize360(ascRaw);

            const ascInfo = getSignAndNakshatra(ascRaw);
            ascendant = {
                name: "Ascendant",
                sign: ascInfo.sign,
                degree: ascInfo.degree,
                nakshatra: ascInfo.nakshatra,
                isRetrograde: false,
                house: 1,
                rawLongitude: ascRaw
            };

            for (const p of PLANETS) {
                const data = await calcUt(jd, p.id, SEFLG_SWIEPH | SEFLG_SIDEREAL | SEFLG_SPEED);
                const info = getSignAndNakshatra(data.longitude);

                if (p.name === "Moon") moonLong = data.longitude;

                computedPlanets.push({
                    name: p.name,
                    sign: info.sign,
                    degree: info.degree,
                    nakshatra: info.nakshatra,
                    isRetrograde: data.longitudeSpeed < 0,
                    rawLongitude: data.longitude,
                    house: 0
                });
            }

            const rahu = computedPlanets.find(p => p.name === "Rahu");
            if (rahu) {
                const ketuLong = normalize360(rahu.rawLongitude + 180);
                const kInfo = getSignAndNakshatra(ketuLong);
                computedPlanets.push({
                    name: "Ketu",
                    sign: kInfo.sign,
                    degree: kInfo.degree,
                    nakshatra: kInfo.nakshatra,
                    isRetrograde: true,
                    rawLongitude: ketuLong,
                    house: 0
                });
            }
        }

        // Common House Calculation (Bhava)
        computedPlanets.forEach(p => {
            let h = p.sign - ascendant.sign + 1;
            if (h <= 0) h += 12;
            p.house = h;
        });

        const d9Chart = calculateD9(ascendant.rawLongitude, computedPlanets);
        const dasas = calculateDasas(moonLong, utcDate.toISOString(), settings);

        const finalPlanets = computedPlanets.map(p => {
            const { rawLongitude, ...rest } = p;
            return rest;
        });

        console.log(`Calculation completed in ${Date.now() - startTime}ms`);

        res.json({
            ascendant,
            planets: finalPlanets,
            divisional: { d9: d9Chart },
            ayanamsa: `${Math.floor(ayanamsaVal)}° ${((ayanamsaVal % 1) * 60).toFixed(2)}'`,
            ayanamsaType: details.ayanamsaType,
            dasas,
            settingsUsed: settings
        });

    } catch (err) {
        console.error("Server Calculation Error:", err);
        res.status(500).json({
            error: "Calculation failed on server.",
            details: err.message || "Unknown error"
        });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Jyotish Backend (SwissEph) running on port ${PORT}`);
    console.log(`Test URL: http://localhost:${PORT}/`);
});

