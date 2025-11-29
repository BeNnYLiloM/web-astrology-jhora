import { ZodiacSign } from "./types";

export const ZODIAC_NAMES: Record<ZodiacSign, string> = {
  [ZodiacSign.Aries]: "Aries",
  [ZodiacSign.Taurus]: "Taurus",
  [ZodiacSign.Gemini]: "Gemini",
  [ZodiacSign.Cancer]: "Cancer",
  [ZodiacSign.Leo]: "Leo",
  [ZodiacSign.Virgo]: "Virgo",
  [ZodiacSign.Libra]: "Libra",
  [ZodiacSign.Scorpio]: "Scorpio",
  [ZodiacSign.Sagittarius]: "Sagittarius",
  [ZodiacSign.Capricorn]: "Capricorn",
  [ZodiacSign.Aquarius]: "Aquarius",
  [ZodiacSign.Pisces]: "Pisces",
};

export const ZODIAC_SANSKRIT: Record<ZodiacSign, string> = {
  [ZodiacSign.Aries]: "Mesha",
  [ZodiacSign.Taurus]: "Vrishabha",
  [ZodiacSign.Gemini]: "Mithuna",
  [ZodiacSign.Cancer]: "Karka",
  [ZodiacSign.Leo]: "Simha",
  [ZodiacSign.Virgo]: "Kanya",
  [ZodiacSign.Libra]: "Tula",
  [ZodiacSign.Scorpio]: "Vrishchika",
  [ZodiacSign.Sagittarius]: "Dhanu",
  [ZodiacSign.Capricorn]: "Makara",
  [ZodiacSign.Aquarius]: "Kumbha",
  [ZodiacSign.Pisces]: "Meena",
};

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

export const PLANET_NAMES = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu"
];