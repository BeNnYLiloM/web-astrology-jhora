
import { BirthDetails, ChartData, CalculationSettings } from "../types";

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3000/api/calculate';
const STORAGE_KEY = 'jyotish_api_url';

export const getApiUrl = (): string => {
    return localStorage.getItem(STORAGE_KEY) || DEFAULT_API_URL;
};

export const setApiUrl = (url: string) => {
    localStorage.setItem(STORAGE_KEY, url);
};

export const calculateChart = async (details: BirthDetails, settings: CalculationSettings): Promise<ChartData> => {
    const url = getApiUrl();
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ details, settings }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error (${response.status}): ${errorText || response.statusText}`);
        }

        const data: ChartData = await response.json();
        return data;

    } catch (error) {
        console.error(`Backend calculation failed while calling ${url}:`, error);
        throw error;
    }
};
