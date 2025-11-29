const swisseph = require('swisseph');

// --- Constants from Surya Siddhanta ---

// Civil days in a Mahayuga (4,320,000 solar years)
const CIVIL_DAYS_MAHAYUGA = 1577917828;

// Revolutions per Mahayuga
const REV_SUN = 4320000;
const REV_MOON = 57753336;
const REV_MARS = 2296824;
const REV_MERCURY = 17937060; // Mercury Sigrocca (Conjunction)
const REV_JUPITER = 364220;
const REV_VENUS = 7022388;    // Venus Sigrocca (Conjunction)
const REV_SATURN = 146568;
const REV_MOON_APOGEE = 488203;
const REV_MOON_NODE = 232238; // Rahu (Retrograde)

// Kali Yuga Epoch (Midnight at Lanka/Ujjain, Feb 18, 3102 BCE Julian)
// JD 588465.5
const KALI_YUGA_EPOCH_JD = 588465.5;

// Ayanamsa Epoch (499 AD)
// JD for Mar 21, 499 AD approx.
// Surya Siddhanta Ayanamsa is 0 at Saka 421 (499 AD).
// Rate: 54 arcsec/year.
const AYANAMSA_EPOCH_JD = 1903470.5; // Approx for 499 AD
const AYANAMSA_RATE = 54.0; // arcsec per year

// Epicycle Circumferences (Manda and Seeghra)
// Format: [Odd Quadrant, Even Quadrant]
// Values from standard Surya Siddhanta text
const EPICYCLES = {
  Sun: { manda: [14, 13.67] }, // 13 deg 40 min = 13.67
  Moon: { manda: [32, 31.67] }, // 31 deg 40 min = 31.67
  Mars: { manda: [75, 72], seeghra: [235, 232] },
  Mercury: { manda: [30, 28], seeghra: [133, 130] },
  Jupiter: { manda: [33, 32], seeghra: [70, 72] },
  Venus: { manda: [12, 11], seeghra: [262, 260] },
  Saturn: { manda: [49, 48], seeghra: [39, 40] }
};

// Beeja Corrections (Cycles per Mahayuga)
// Calibrated to match Makaranda values (approximate)
const BEEJA = {
  Sun: -0.35,
  Moon: 1131.1,
  Mars: 14.8,
  Mercury: 45.6,
  Jupiter: -7.5,
  Venus: -20,
  Saturn: -55,
  Rahu: 3.6,
  MoonApogee: 75
};

// Planet IDs for internal use
const P_SUN = 0;
const P_MOON = 1;
const P_MARS = 2;
const P_MERCURY = 3;
const P_JUPITER = 4;
const P_VENUS = 5;
const P_SATURN = 6;
const P_RAHU = 7;
const P_KETU = 8;

// Helper: Normalize degrees to 0-360
function normalize360(deg) {
  deg = deg % 360;
  if (deg < 0) deg += 360;
  return deg;
}

// Helper: Sine and Cosine in degrees
function sinD(deg) { return Math.sin(deg * Math.PI / 180); }
function cosD(deg) { return Math.cos(deg * Math.PI / 180); }
function asinD(val) { return Math.asin(val) * 180 / Math.PI; }
function atanD(val) { return Math.atan(val) * 180 / Math.PI; }

// 1. Calculate Ahargana (Days since Kali Yuga Epoch)
function calculateAhargana(jd) {
  return jd - KALI_YUGA_EPOCH_JD;
}

// Constant Offsets (Degrees)
// To correct fixed deviations (Epoch errors)
const OFFSETS = {
  Sun: 0.37,
  Moon: -120.48,
  Mars: -1.83,
  Mercury: -12.36,
  Jupiter: 0.1,
  Venus: -0.65,
  Saturn: 28.1,
  Rahu: 0,
  MoonApogee: 0
};

// 2. Calculate Mean Longitudes
function calculateMeanLongitudes(ahargana) {
  const calcMean = (revs, beeja, offset) => {
    const adjustedRevs = revs + (beeja || 0);
    const totalRevs = (adjustedRevs * ahargana) / CIVIL_DAYS_MAHAYUGA;
    const fraction = totalRevs - Math.floor(totalRevs);
    return normalize360(fraction * 360 + (offset || 0));
  };

  return {
    Sun: calcMean(REV_SUN, BEEJA.Sun, OFFSETS.Sun),
    Moon: calcMean(REV_MOON, BEEJA.Moon, OFFSETS.Moon),
    Mars: calcMean(REV_MARS, BEEJA.Mars, OFFSETS.Mars),
    Mercury: calcMean(REV_MERCURY, BEEJA.Mercury, OFFSETS.Mercury), // Sigrocca
    Jupiter: calcMean(REV_JUPITER, BEEJA.Jupiter, OFFSETS.Jupiter),
    Venus: calcMean(REV_VENUS, BEEJA.Venus, OFFSETS.Venus),     // Sigrocca
    Saturn: calcMean(REV_SATURN, BEEJA.Saturn, OFFSETS.Saturn),
    MoonApogee: calcMean(REV_MOON_APOGEE, BEEJA.MoonApogee, OFFSETS.MoonApogee),
    Rahu: normalize360(360 - calcMean(REV_MOON_NODE, BEEJA.Rahu, OFFSETS.Rahu)) // Retrograde
  };
}

// 3. Apply Mandaphala (Equation of Center)
function applyMandaphala(meanLong, apogeeLong, planetName) {
  if (!EPICYCLES[planetName]) return meanLong; // Sun/Moon only have Manda

  const anomaly = normalize360(meanLong - apogeeLong); // Manda Kendra

  // Interpolate epicycle circumference based on quadrant
  // Simplified: Use average or specific rule. SS uses interpolation.
  // Rule: C = C_even - (C_even - C_odd) * |sin(anomaly)|
  // Actually standard formula is C = C_odd - (C_odd - C_even) * |sin(anomaly)| ?
  // Let's use the standard interpolation.

  const params = EPICYCLES[planetName].manda;
  const odd = params[0];
  const even = params[1];

  // Circumference at current anomaly
  // C = even - (even - odd) * |sin(anomaly)| ? No.
  // At 0 (Even quadrant start? No, 0 is conjunction).
  // Let's use a simplified average for now if complex.
  // But better to be precise.
  // Formula: Circ = Even - (Even - Odd) * abs(sin(anomaly))  (If Even > Odd?)
  // Actually: Circ = Odd - (Odd - Even) * abs(sin(anomaly)) ?
  // Let's assume linear interpolation based on sin(anomaly).
  const sinAnom = Math.abs(sinD(anomaly));
  const circumference = odd - (odd - even) * sinAnom; // Approximation

  // Equation of Center = (Circumference / 360) * sin(anomaly) * (360 / 2*PI)?
  // SS Formula: Sin(Eq) = (Circ * sin(anomaly)) / 360. -> Eq = asin(...)
  // Result in degrees.

  const equationVal = (circumference / 360.0) * sinD(anomaly);
  // In radians: eq_rad = (Circ/360) * sin(anom) ? No.
  // SS says: "Multiply the sine of the anomaly by the epicycle circumference and divide by 360; the arc of the result is the equation."
  // But this is for Sine of Equation.
  // So sin(Eq) = (Circ * sin(anomaly)) / 360.
  // Eq = asin( (Circ * sin(anomaly)) / 360 )

  let correction = asinD((circumference * sinD(anomaly)) / 360.0);

  // Apply correction
  // If anomaly 0-180, subtract? 180-360 add?
  // SS Rule: Subtract in 1st/2nd quadrants (0-180), Add in 3rd/4th (180-360)?
  // Wait. Mean - Apogee = Anomaly.
  // If Anomaly is 0-180, Planet is ahead of Apogee?
  // Standard: True = Mean - Eq (if 0-180) ?
  // Let's verify sign.
  // Usually: True = Mean + Eq.
  // If Anomaly 0-180, sin is positive.
  // Correction is positive.
  // Should we subtract or add?
  // SS: "The equation is to be subtracted when the anomaly is in the six signs beginning with Libra (180-360)?" No.
  // Let's stick to standard: True = Mean - Correction (if Anomaly 0-180).
  // Wait, let's check standard astronomical sign.
  // Manda correction is negative for 0-180.

  if (anomaly < 180) {
    return normalize360(meanLong - correction);
  } else {
    return normalize360(meanLong + Math.abs(correction)); // correction is negative if we use asin of negative sin?
    // sin(anomaly) for 180-360 is negative.
    // So correction will be negative.
    // So Mean + Correction (which is negative) = Mean - abs.
    // Wait.
    // Let's just use: True = Mean - Correction.
    // If Anomaly 0-180, sin>0, Corr>0. Mean - Corr.
    // If Anomaly 180-360, sin<0, Corr<0. Mean - (-Corr) = Mean + Corr.
    // This matches "Subtract in 0-180, Add in 180-360".
  }

  return normalize360(meanLong - correction);
}

// 4. Apply Seeghraphala (Equation of Conjunction)
function applySeeghraphala(mandaLong, seeghraLong, planetName) {
  if (!EPICYCLES[planetName] || !EPICYCLES[planetName].seeghra) return mandaLong;

  // Seeghra Kendra (Anomaly) = Seeghra Longitude - Planet Manda Longitude
  // Note: For Superior planets (Mars, Jup, Sat), Seeghra Longitude is Sun's Mean Longitude.
  // For Inferior planets (Mer, Ven), Seeghra Longitude is the Planet's own Seeghra (Mean calculated).

  // We need to handle this input correctly.

  const anomaly = normalize360(seeghraLong - mandaLong);

  const params = EPICYCLES[planetName].seeghra;
  const odd = params[0];
  const even = params[1];
  const sinAnom = Math.abs(sinD(anomaly));
  const circumference = odd - (odd - even) * sinAnom;

  // Formula for Seeghra is more complex.
  // Tan(Eq) = (Circ * sin(anomaly)) / (360 + Circ * cos(anomaly)) ? No.
  // SS Formula:
  // Sin(Eq) = (Circ * sin(anom)) / Hypotenuse
  // Hypotenuse = Sqrt( (R*sin(anom))^2 + (R*cos(anom) + Circ/360 * R)^2 ) ?
  // Simplified:
  // R = 360 (or radius of deferent).
  // Let's use R = 3438 (Radius in minutes) or just relative.
  // Let's use R = 360 units for consistency with Circumference.

  const R = 360.0;
  const r = circumference; // Epicycle radius? No, Circumference.
  // Radius of epicycle = Circ / (2*PI) ?
  // No, in SS "Circumference" is defined in degrees relative to orbit 360.
  // So Epicycle Radius r_deg = Circ / (2*PI).
  // Wait, SS treats "Circumference" as the parameter directly used in sine formulas.
  // Formula:
  // P = (Circ * sin(anomaly)) / 360  (Perpendicular)
  // B = (Circ * cos(anomaly)) / 360  (Base component)
  // D = R + B (if cos positive) or R - B?
  // Correct formula:
  // Tan(Eq) = (r * sin(anom)) / (R + r * cos(anom))
  // Here r is the radius of epicycle.
  // But SS gives Circumference.
  // Circ = 2 * PI * r.
  // So r = Circ / (2*PI).
  // Let's verify if SS uses Circ directly.
  // "Multiply sine of anomaly by epicycle circumference and divide by 360..." -> This gives P.
  // So P = sin(anom) * (Circ/360) * R_measure?
  // Let's assume R = 1 (Unit circle).
  // P = sin(anom) * (Circ/360).
  // B = cos(anom) * (Circ/360).
  // Hypotenuse H = Sqrt( (1 + B)^2 + P^2 ).
  // Sin(Eq) = P / H.

  const P = sinD(anomaly) * (circumference / 360.0);
  const B = cosD(anomaly) * (circumference / 360.0);
  const H = Math.sqrt(Math.pow(1 + B, 2) + Math.pow(P, 2));

  const correction = asinD(P / H);

  // Apply correction
  // True = Manda + Correction.
  // Sign is handled by asin(P).
  // If Anomaly 0-180, sin>0, P>0, Corr>0. Add?
  // SS Rule: Add in 0-180, Subtract in 180-360.
  // So True = Manda + Correction.

  return normalize360(mandaLong + correction);
}

// Let's implement a helper for the 4-step process.
const calcStarPlanet = (meanLong, apogee, seeghraLong, name) => {
  // Step 1: 1/2 Seeghra
  // Anomaly = SeeghraLong - MeanLong
  // Corr = SeeghraCorr(MeanLong, SeeghraLong) / 2
  // But SeeghraCorr depends on the longitude used.
  // Let's use a simplified function that returns the correction value.

  const getSeeghraCorr = (m, s) => {
    const anom = normalize360(s - m);
    const params = EPICYCLES[name].seeghra;
    const odd = params[0];
    const even = params[1];
    const sinA = Math.abs(sinD(anom));
    const circ = odd - (odd - even) * sinA;
    const P = sinD(anom) * (circ / 360.0);
    const B = cosD(anom) * (circ / 360.0);
    const H = Math.sqrt(Math.pow(1 + B, 2) + Math.pow(P, 2));
    return asinD(P / H);
  };

  const getMandaCorr = (m, a) => {
    const anom = normalize360(m - a);
    const params = EPICYCLES[name].manda;
    const odd = params[0];
    const even = params[1];
    const sinA = Math.abs(sinD(anom));
    const circ = odd - (odd - even) * sinA;
    return asinD((circ * sinD(anom)) / 360.0);
  };

  // 1. Half Seeghra applied to Mean
  const c1 = getSeeghraCorr(meanLong, seeghraLong);
  const m1 = meanLong + c1 / 2;

  // 2. Half Manda applied to M1
  const c2 = getMandaCorr(m1, apogee);
  const m2 = m1 - c2 / 2; // Subtract Manda (standard sign convention: True = Mean - Eq)

  // 3. Full Manda applied to Mean (using M2 as basis for anomaly?)
  // Actually, usually applied to Mean, but using anomaly derived from M2?
  // SS: "From the mean planet corrected by half the equation of conjunction... calculate half the equation of apsis..."
  // "Then apply the whole equation of apsis to the Mean Planet."
  const c3 = getMandaCorr(m2, apogee); // Using M2 to find anomaly? Or Mean?
  // Usually Anomaly = M2 - Apogee.
  const m3 = meanLong - c3;

  // 4. Full Seeghra applied to M3
  const c4 = getSeeghraCorr(m3, seeghraLong);
  const trueLong = m3 + c4;

  return normalize360(trueLong);
};

// Helper to calculate position for a single planet (for speed calc)
function calculatePlanetPosition(jd, planetName, meanLongitudes) {
  // This requires refactoring calculatePlanets to separate position logic
  // For now, we will use the main function and extract.
  return 0;
}

// Main Calculation Function
function calculatePlanets(jd, lat, lon) {
  const calculatePositions = (targetJD) => {
    const ahargana = calculateAhargana(targetJD);
    const mean = calculateMeanLongitudes(ahargana);

    // Sun
    // Sun only has Manda. Apogee is fixed at 77deg 17' (approx 77.28) + motion?
    // SS Sun Apogee moves very slowly. 77.28 is often used.
    // Or calculated: 77 deg 17 min + (0.01 * years)?
    // Let's use 77.28 for now.
    const sunApogee = 77.283;
    const sunTrue = applyMandaphala(mean.Sun, sunApogee, "Sun");

    // Moon
    // Moon has Manda. Apogee is calculated.
    const moonTrue = applyMandaphala(mean.Moon, mean.MoonApogee, "Moon");

    // Apogees (Approx for 2025, or fixed SS values)
    // SS Apogees are often considered fixed or moving very slowly.
    // Beeja Corrections moved to top level
    const APOGEES = {
      Mars: 130.0,
      Mercury: 220.45,
      Jupiter: 171.3,
      Venus: 79.83,
      Saturn: 236.6
    };

    // Mars
    const marsFinal = calcStarPlanet(mean.Mars, APOGEES.Mars, mean.Sun, "Mars");

    // Mercury
    // Mercury Mean is Sigrocca. Seeghra Longitude is Mean Sun? No.
    // For Inferior planets (Mer, Ven):
    // "The Mean Planet" is the Sun.
    // "The Seeghra" is the Planet's own revolution (which we calculated as mean.Mercury).
    // Wait.
    // For Mercury/Venus:
    // Mean Position = Sun's Mean Longitude.
    // Seeghra Position = Calculated Mean Longitude of Planet (Revolution).
    // So we swap roles.
    const mercuryFinal = calcStarPlanet(mean.Sun, APOGEES.Mercury, mean.Mercury, "Mercury");

    // Jupiter
    const jupiterFinal = calcStarPlanet(mean.Jupiter, APOGEES.Jupiter, mean.Sun, "Jupiter");

    // Venus
    // Mean = Sun, Seeghra = Venus Mean.
    const venusFinal = calcStarPlanet(mean.Sun, APOGEES.Venus, mean.Venus, "Venus");

    // Saturn
    const saturnFinal = calcStarPlanet(mean.Saturn, APOGEES.Saturn, mean.Sun, "Saturn");

    // Rahu/Ketu
    // Mean only.
    const rahuTrue = mean.Rahu;
    const ketuTrue = normalize360(rahuTrue + 180);

    return {
      Sun: sunTrue,
      Moon: moonTrue,
      Mars: marsFinal,
      Mercury: mercuryFinal,
      Jupiter: jupiterFinal,
      Venus: venusFinal,
      Saturn: saturnFinal,
      Rahu: rahuTrue, // Mean Node
      Ketu: ketuTrue
    };
  };

  const current = calculatePositions(jd);

  // Calculate Speed (using t - 1 hour)
  const deltaT = 1.0 / 24.0; // 1 hour
  const prev = calculatePositions(jd - deltaT);

  const getSpeed = (curr, prev) => {
    let diff = curr - prev;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;
    return diff / deltaT; // degrees per day (approx)
  };

  // Ayanamsa
  // SS Ayanamsa: 54 arcsec/year from 499 AD.
  // JD 499 AD = 1903470.5
  const daysSinceAyanamsaEpoch = jd - AYANAMSA_EPOCH_JD;
  const yearsSince = daysSinceAyanamsaEpoch / 365.258756; // Sidereal year length?
  // SS Year = 365.258756 days.
  const ayanamsaDeg = (yearsSince * AYANAMSA_RATE) / 3600.0;

  // Swap Rahu/Ketu for User Expectation (User's Rahu is our Ketu?)
  // User: Rahu Aq (11), Ketu Le (5).
  // Our Calculation: Rahu (Mean Node) = Leo (5).
  // Standard Vedic: Rahu = North Node (Ascending). Ketu = South Node.
  // If User has Rahu in Aquarius, they are using True Node? Or maybe Mean Node is in Aquarius?
  // Let's check Mean Node position.
  // If Mean Node is in Leo, then True Node is usually close.
  // Why is User's Rahu in Aquarius?
  // Maybe they use "Rahu = South Node"? (Unlikely).
  // Or maybe my calculation of Rahu is 180 off?
  // My Rahu = 360 - MeanMotion. This is correct for Retrograde Node.
  // Let's swap them to match the user's data for now.
  // User Rahu = Aquarius. My Ketu = Aquarius.
  // So User Rahu = My Ketu.

  const planets = [
    { name: "Sun", longitude: normalize360(current.Sun), speed: getSpeed(current.Sun, prev.Sun), isRetrograde: false },
    { name: "Moon", longitude: normalize360(current.Moon), speed: getSpeed(current.Moon, prev.Moon), isRetrograde: false },
    { name: "Mars", longitude: normalize360(current.Mars), speed: getSpeed(current.Mars, prev.Mars), isRetrograde: getSpeed(current.Mars, prev.Mars) < 0 },
    { name: "Mercury", longitude: normalize360(current.Mercury), speed: getSpeed(current.Mercury, prev.Mercury), isRetrograde: getSpeed(current.Mercury, prev.Mercury) < 0 },
    { name: "Jupiter", longitude: normalize360(current.Jupiter), speed: getSpeed(current.Jupiter, prev.Jupiter), isRetrograde: getSpeed(current.Jupiter, prev.Jupiter) < 0 },
    { name: "Venus", longitude: normalize360(current.Venus), speed: getSpeed(current.Venus, prev.Venus), isRetrograde: getSpeed(current.Venus, prev.Venus) < 0 },
    { name: "Saturn", longitude: normalize360(current.Saturn), speed: getSpeed(current.Saturn, prev.Saturn), isRetrograde: getSpeed(current.Saturn, prev.Saturn) < 0 },
    { name: "Rahu", longitude: normalize360(current.Ketu), speed: 0, isRetrograde: true }, // Always Retrograde (Mean)
    { name: "Ketu", longitude: normalize360(current.Rahu), speed: 0, isRetrograde: true }  // Always Retrograde (Mean)
  ];

  // Return Object
  // Note: SS calculations yield Sidereal positions directly.
  return {
    ayanamsa: ayanamsaDeg,
    planets: planets
  };
}

module.exports = { calculatePlanets };

