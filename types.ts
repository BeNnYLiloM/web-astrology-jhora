
export enum ZodiacSign {
  Aries = 1,
  Taurus = 2,
  Gemini = 3,
  Cancer = 4,
  Leo = 5,
  Virgo = 6,
  Libra = 7,
  Scorpio = 8,
  Sagittarius = 9,
  Capricorn = 10,
  Aquarius = 11,
  Pisces = 12
}

export enum AyanamsaType {
  LAHIRI = "Lahiri (Chitra Paksha)",
  RAMAN = "Raman",
  KP = "Krishnamurti (KP)",
  SURYA_SIDDHANTA = "Surya Siddhanta (Mean)",
  SSS_MAKARANDA = "Sri Surya Siddhanta (Makaranda)"
}

export type YearDefinition = 'SOLAR' | '360_TITHIS';
export type CalendarType = 'GREGORIAN' | 'JULIAN' | 'MIXED';

export interface CalculationSettings {
  lifecycleYears: number;
  yearDefinition: YearDefinition;
  calendar: CalendarType;
}

export interface PlanetPosition {
  name: string;
  sign: ZodiacSign;
  degree: number; // 0-30 within the sign
  nakshatra: string;
  isRetrograde: boolean;
  house: number; // 1-12 (Calculated based on Ascendant)
}

export interface DasaPeriod {
  lord: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  durationYears: number;
  isCurrent: boolean;
}

export interface BirthDetails {
  name: string;
  date: string;
  time: string;
  place?: string;
  latitude: number;
  longitude: number;
  timezone: number;
  ayanamsaType: AyanamsaType;
}

export interface DivisionalChart {
  name: string;
  symbol: string; // e.g., "D-9"
  ascendant: PlanetPosition;
  planets: PlanetPosition[];
}

export interface ChartData {
  ascendant: PlanetPosition;
  planets: PlanetPosition[];
  divisional: {
    d9: DivisionalChart;
  };
  ayanamsa: string;
  ayanamsaType: AyanamsaType;
  dasas: DasaPeriod[];
  settingsUsed: CalculationSettings;
}

export enum ChartStyle {
  SouthIndian = 'SOUTH_INDIAN',
  NorthIndian = 'NORTH_INDIAN' // Simplified demo supports South mostly
}

export interface AiAnalysisResult {
  summary: string;
  yogas: string[];
  prediction: string;
}
