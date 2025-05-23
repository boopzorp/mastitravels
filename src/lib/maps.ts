
import type { LatLng } from './types';

export async function geocodeAddress(address: string): Promise<LatLng | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("Google Maps API key is not configured.");
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
  return "Calculating..."; 
}

export async function getDirections(
  origin: LatLng,
  destination: LatLng,
  mapsRoutesLib: typeof google.maps.routes, // Pass the library
  travelMode: google.maps.TravelMode = google.maps.TravelMode.DRIVING // Add travelMode parameter
): Promise<google.maps.DirectionsResult | null> {
  if (!mapsRoutesLib) {
    console.error("Google Maps Routes library not available for directions.");
    return null;
  }
  const directionsService = new mapsRoutesLib.DirectionsService();
  try {
    const request: google.maps.DirectionsRequest = {
      origin: new google.maps.LatLng(origin.lat, origin.lng),
      destination: new google.maps.LatLng(destination.lat, destination.lng),
      travelMode: travelMode, // Use the provided travelMode
    };
    return new Promise((resolve, reject) => {
      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          resolve(result);
        } else {
          console.error(`Directions request failed due to ${status}`);
          resolve(null); // Resolve with null on error to handle it gracefully
        }
      });
    });
  } catch (error) {
    console.error('Error fetching directions:', error);
    return null;
  }
}

