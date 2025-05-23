import type { LatLng } from './types';

export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Google Maps API key is not configured.");
    // Note: UI should inform user if this happens.
    return null;
  }
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return { lat: location.lat, lng: location.lng };
    } else {
      console.error('Geocoding failed:', data.status, data.error_message);
      return null;
    }
  } catch (error) {
    console.error('Error during geocoding:', error);
    return null;
  }
}

export function calculateDistance(pos1: LatLng, pos2: LatLng): string {
  // This function relies on the Google Maps JavaScript API being loaded.
  // It should be called on the client-side after the API is available.
  if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.geometry) {
    const service = window.google.maps.geometry.spherical;
    const p1 = new window.google.maps.LatLng(pos1.lat, pos1.lng);
    const p2 = new window.google.maps.LatLng(pos2.lat, pos2.lng);
    const distanceInMeters = service.computeDistanceBetween(p1, p2);
    
    if (distanceInMeters > 1000) {
      return `${(distanceInMeters / 1000).toFixed(2)} km`;
    }
    return `${distanceInMeters.toFixed(0)} m`;
  }
  // Fallback or indication that API is not ready
  // console.warn("Google Maps Geometry library not available for distance calculation.");
  return "Calculating..."; 
}
