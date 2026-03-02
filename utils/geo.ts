/**
 * Calculate the estimated time of arrival (ETA) between two GPS coordinates.
 * Uses Haversine formula with a 1.3x adjustment factor for urban road routes.
 *
 * @param driverLat  Driver's current latitude
 * @param driverLng  Driver's current longitude
 * @param pickupLat  Passenger pickup latitude
 * @param pickupLng  Passenger pickup longitude
 * @param avgSpeedKmh Average urban speed in km/h (default: 25 for Colombian cities)
 * @returns Object with distance in km and ETA in minutes
 */
export function calculateETA(
    driverLat: number,
    driverLng: number,
    pickupLat: number,
    pickupLng: number,
    avgSpeedKmh: number = 25,
): { distanceKm: number; etaMinutes: number } {
    const R = 6371; // Earth radius in km
    const dLat = toRad(pickupLat - driverLat);
    const dLon = toRad(pickupLng - driverLng);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(driverLat)) *
        Math.cos(toRad(pickupLat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightLineKm = R * c;

    // 1.3x factor to approximate real road routes vs straight line
    const adjustedDistance = straightLineKm * 1.3;
    const etaMinutes = Math.ceil((adjustedDistance / avgSpeedKmh) * 60);

    return {
        distanceKm: Math.round(adjustedDistance * 10) / 10, // 1 decimal
        etaMinutes: Math.max(1, etaMinutes), // Minimum 1 minute
    };
}

function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
}

/**
 * Format ETA for display
 */
export function formatETA(etaMinutes: number): string {
    if (etaMinutes < 1) return '< 1 min';
    if (etaMinutes === 1) return '~1 min';
    if (etaMinutes < 60) return `~${etaMinutes} min`;
    const hours = Math.floor(etaMinutes / 60);
    const mins = etaMinutes % 60;
    return mins > 0 ? `~${hours}h ${mins}min` : `~${hours}h`;
}
