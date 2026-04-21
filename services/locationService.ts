import { LocationSuggestion } from "../types";
import { getApiUrl } from "./calcService";

const buildApiUrl = (pathname: string) => {
  const calculateUrl = getApiUrl();

  try {
    const url = new URL(calculateUrl, window.location.origin);
    url.pathname = pathname;
    url.search = "";
    return url.toString();
  } catch {
    return pathname;
  }
};

const LOCATIONS_API_URL = () => buildApiUrl("/api/locations");
const LOCATION_TIMEZONE_API_URL = () => buildApiUrl("/api/locations/timezone");

export const searchLocations = async (
  query: string,
  signal?: AbortSignal
): Promise<LocationSuggestion[]> => {
  const response = await fetch(
    `${LOCATIONS_API_URL()}?q=${encodeURIComponent(query)}&limit=7&lang=ru`,
    { signal }
  );

  if (!response.ok) {
    throw new Error(`Location search failed with status ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data.results) ? data.results : [];
};

export const resolveLocationTimezone = async (
  location: Pick<LocationSuggestion, "name" | "countryCode" | "latitude" | "longitude">,
  signal?: AbortSignal
): Promise<string | null> => {
  const response = await fetch(
    `${LOCATION_TIMEZONE_API_URL()}?name=${encodeURIComponent(location.name)}&countryCode=${encodeURIComponent(location.countryCode || "")}&lat=${location.latitude}&lon=${location.longitude}`,
    { signal }
  );

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return typeof data.timezone === "string" ? data.timezone : null;
};
