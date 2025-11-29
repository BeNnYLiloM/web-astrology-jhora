
import { GoogleGenAI } from "@google/genai";
import { ChartData, AiAnalysisResult } from "../types";
import { ZODIAC_NAMES } from "../constants";

export const generateAstrologyReport = async (chart: ChartData): Promise<AiAnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const currentDasa = chart.dasas.find(d => d.isCurrent);
  const currentDasaText = currentDasa 
    ? `Current Main Period (Mahadasa): ${currentDasa.lord} (Ends: ${currentDasa.endDate})` 
    : "Current period unknown";

  // Construct a text representation of the chart for the AI
  const chartDescription = `
    Vedic Astrology Chart Data:
    Ascendant (Lagna): ${ZODIAC_NAMES[chart.ascendant.sign]} at ${chart.ascendant.degree} degrees.
    Planetary Positions:
    ${chart.planets.map(p => `- ${p.name}: ${ZODIAC_NAMES[p.sign]} in House ${p.house} (${p.degree} deg), Nakshatra: ${p.nakshatra} ${p.isRetrograde ? '(R)' : ''}`).join('\n')}
    
    Time Cycle Information:
    ${currentDasaText}
  `;

  const prompt = `
    Act as an expert Vedic Astrologer (Jyotishi) similar to the analysis provided by Jagannatha Hora software.
    Analyze the following chart data:
    ${chartDescription}

    Please provide a structured response in JSON format with the following keys:
    1. "summary": A brief 2-sentence overview of the chart's strength.
    2. "yogas": An array of strings listing 3-5 major planetary combinations (Yogas) formed (e.g., Gaja Kesari, Budhaditya).
    3. "prediction": A detailed paragraph (approx 100 words) describing the person's general nature and specifically mentioning the influence of the current ${currentDasa ? currentDasa.lord : ''} Mahadasa.

    Output RAW JSON only. No markdown formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as AiAnalysisResult;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      summary: "Could not generate analysis at this time.",
      yogas: ["Analysis Unavailable"],
      prediction: "Please ensure your API Key is valid and try again."
    };
  }
};
