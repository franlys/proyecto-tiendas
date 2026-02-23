/**
 * Distance Calculation Utilities
 * For delivery fees and service area validation
 */

export interface Coordinates {
    lat: number;
    lng: number;
}

export interface DistanceConfig {
    baseDistanceMiles: number; // Distance included in base price (e.g., 10)
    extraMileFee: number; // Fee per mile beyond base (e.g., $2)
    maxDistanceMiles?: number; // Maximum service area (e.g., 50 miles)
}

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(from: Coordinates, to: Coordinates): number {
    const R = 3959; // Earth's radius in miles (use 6371 for km)

    const dLat = toRadians(to.lat - from.lat);
    const dLon = toRadians(to.lng - from.lng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(from.lat)) *
        Math.cos(toRadians(to.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Calculate delivery fee based on distance
 */
export function calculateDeliveryFee(
    distance: number,
    config: DistanceConfig
): { fee: number; isWithinServiceArea: boolean; extraMiles: number } {
    // Check if within max service area
    if (config.maxDistanceMiles && distance > config.maxDistanceMiles) {
        return {
            fee: 0,
            isWithinServiceArea: false,
            extraMiles: 0,
        };
    }

    // Calculate extra miles beyond base
    const extraMiles = Math.max(0, distance - config.baseDistanceMiles);

    // Calculate fee
    const fee = extraMiles * config.extraMileFee;

    return {
        fee: Math.round(fee * 100) / 100, // Round to cents
        isWithinServiceArea: true,
        extraMiles: Math.round(extraMiles * 10) / 10,
    };
}

/**
 * Get user's current location using browser Geolocation API
 */
export function getCurrentLocation(): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by this browser"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (error) => {
                let message = "Error getting location";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        message = "Location permission denied";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        message = "Location unavailable";
                        break;
                    case error.TIMEOUT:
                        message = "Location request timed out";
                        break;
                }
                reject(new Error(message));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000, // Cache for 1 minute
            }
        );
    });
}

/**
 * Geocode an address using Nominatim (OpenStreetMap) - Free, no API key required
 * Note: For production, consider using Google Maps Geocoding API for better accuracy
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
    try {
        const encodedAddress = encodeURIComponent(address);
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
            {
                headers: {
                    "User-Agent": "Linko-App/1.0", // Required by Nominatim
                },
            }
        );

        if (!response.ok) {
            throw new Error("Geocoding request failed");
        }

        const data = await response.json();

        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
            };
        }

        return null;
    } catch (error) {
        console.error("Geocoding error:", error);
        return null;
    }
}

/**
 * Format distance for display
 */
export function formatDistance(miles: number): string {
    if (miles < 1) {
        return `${Math.round(miles * 10) / 10} mi`;
    }
    return `${Math.round(miles)} mi`;
}

/**
 * Check if a location is within service area
 */
export function isWithinServiceArea(
    businessCoords: Coordinates,
    customerCoords: Coordinates,
    maxMiles: number
): boolean {
    const distance = calculateDistance(businessCoords, customerCoords);
    return distance <= maxMiles;
}

// Common city coordinates for quick lookup (fallback)
export const COMMON_CITIES: Record<string, Coordinates> = {
    // Mexico
    "mexico city": { lat: 19.4326, lng: -99.1332 },
    "guadalajara": { lat: 20.6597, lng: -103.3496 },
    "monterrey": { lat: 25.6866, lng: -100.3161 },
    "cancun": { lat: 21.1619, lng: -86.8515 },
    "tijuana": { lat: 32.5149, lng: -117.0382 },

    // Dominican Republic
    "santo domingo": { lat: 18.4861, lng: -69.9312 },
    "santiago": { lat: 19.4517, lng: -70.6970 },
    "punta cana": { lat: 18.5601, lng: -68.3725 },

    // USA
    "miami": { lat: 25.7617, lng: -80.1918 },
    "new york": { lat: 40.7128, lng: -74.0060 },
    "los angeles": { lat: 34.0522, lng: -118.2437 },
    "houston": { lat: 29.7604, lng: -95.3698 },
    "chicago": { lat: 41.8781, lng: -87.6298 },
};

/**
 * Get coordinates from city name (quick lookup)
 */
export function getCityCoordinates(cityName: string): Coordinates | null {
    const normalizedName = cityName.toLowerCase().trim();
    return COMMON_CITIES[normalizedName] || null;
}
