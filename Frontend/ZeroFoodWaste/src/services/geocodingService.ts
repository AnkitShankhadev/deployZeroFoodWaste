/**
 * Geocoding Service
 * Uses Nominatim (OpenStreetMap) - FREE service, no API key required
 * This service converts addresses to coordinates and vice versa
 */

export interface GeocodingResult {
  lat: number;
  lng: number;
  address: string;
  displayName: string;
}

export interface ReverseGeocodingResult {
  address: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

// Base URL for Nominatim API
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

/**
 * Forward Geocoding - Convert address string to coordinates
 * @param address - The address to geocode
 * @returns Promise with coordinates and formatted address
 */
export const geocodeAddress = async (
  address: string,
): Promise<GeocodingResult | null> => {
  try {
    console.log("🔍 Geocoding address:", address);

    const response = await fetch(
      `${NOMINATIM_BASE}/search?q=${encodeURIComponent(address)}&format=json&limit=1&addressdetails=1`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn("⚠️ No results found for address:", address);
      return null;
    }

    const result = data[0];
    const geoResult: GeocodingResult = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.address?.road || result.address?.hamlet || "",
      displayName: result.display_name,
    };

    console.log("✅ Geocoding successful:", geoResult);
    return geoResult;
  } catch (error) {
    console.error("❌ Geocoding error:", error);
    return null;
  }
};

/**
 * Reverse Geocoding - Convert coordinates to address
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Promise with formatted address
 */
export const reverseGeocode = async (
  lat: number,
  lng: number,
): Promise<ReverseGeocodingResult | null> => {
  try {
    console.log("🔍 Reverse geocoding coordinates:", { lat, lng });

    const response = await fetch(
      `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    const address = data.address || {};
    const result: ReverseGeocodingResult = {
      address: data.display_name || "Unknown location",
      city: address.city || address.town || address.village,
      state: address.state,
      country: address.country,
      zipCode: address.postcode,
    };

    console.log("✅ Reverse geocoding successful:", result);
    return result;
  } catch (error) {
    console.error("❌ Reverse geocoding error:", error);
    return null;
  }
};

/**
 * Search for places by name and get their coordinates
 * @param query - Search query
 * @returns Promise with array of matching locations
 */
export const searchPlaces = async (
  query: string,
): Promise<GeocodingResult[]> => {
  try {
    console.log("🔍 Searching for places:", query);

    const response = await fetch(
      `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      console.warn("⚠️ No places found for query:", query);
      return [];
    }

    const results: GeocodingResult[] = data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.address?.road || item.address?.hamlet || "",
      displayName: item.display_name,
    }));

    console.log("✅ Place search successful, found:", results.length);
    return results;
  } catch (error) {
    console.error("❌ Place search error:", error);
    return [];
  }
};

/**
 * Calculate distance between two points using Haversine formula
 * @param lat1 - Latitude of point 1
 * @param lon1 - Longitude of point 1
 * @param lat2 - Latitude of point 2
 * @param lon2 - Longitude of point 2
 * @returns Distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Convert degrees to radians
 */
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format distance for display
 * @param distanceKm - Distance in kilometers
 * @returns Formatted string
 */
export const formatDistance = (distanceKm: number): string => {
  if (distanceKm < 1) {
    return `${(distanceKm * 1000).toFixed(0)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};
