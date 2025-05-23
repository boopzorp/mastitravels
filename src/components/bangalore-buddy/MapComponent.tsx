
// src/components/bangalore-buddy/MapComponent.tsx
"use client";

import React, { type FC, useEffect, useRef } from 'react';
import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { LatLng, PinnedLocation } from '@/lib/types';
import { LocationCategory } from '@/lib/types';
import MapPin from './MapPin';

interface MapComponentProps {
  center: LatLng;
  zoom?: number;
  friendLocation: PinnedLocation | null;
  workLocation: PinnedLocation | null;
  pinnedLocations: PinnedLocation[];
  onMapClick?: (event: google.maps.MapMouseEvent) => void;
  selectedPinId?: string | null;
  route?: google.maps.DirectionsResult | null; // New prop for the route
}

const MapComponent: FC<MapComponentProps> = ({ 
  center, 
  zoom = 12, 
  friendLocation, 
  workLocation,
  pinnedLocations,
  onMapClick,
  selectedPinId,
  route,
}) => {
  const map = useMap();
  const mapsRoutesLib = useMapsLibrary('routes');
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const customMapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  useEffect(() => {
    if (!map || !mapsRoutesLib) return;

    // Initialize or update DirectionsRenderer
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new mapsRoutesLib.DirectionsRenderer({
        suppressMarkers: true, // We use our custom AdvancedMarkers
        preserveViewport: false, // Allows renderer to set viewport to fit the route
        polylineOptions: {
          strokeColor: 'hsl(var(--primary))', // Use primary color from theme
          strokeOpacity: 0.8,
          strokeWeight: 6,
        }
      });
    }
    
    directionsRendererRef.current.setMap(map);

    if (route) {
      directionsRendererRef.current.setDirections(route);
    } else {
      // Clear the route if it's null
      directionsRendererRef.current.setDirections(undefined);
       // Optionally, reset map to center on home or default if no route and home exists
      if (friendLocation) {
        map.setCenter(friendLocation.position);
        map.setZoom(zoom); // Reset to default zoom when no route
      } else {
        map.setCenter(center);
        map.setZoom(zoom);
      }
    }
    
    // Cleanup function to remove the directions display when component unmounts or map/route changes
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [map, mapsRoutesLib, route, friendLocation, center, zoom]);


  return (
    <div className="w-full h-full min-h-[300px] md:min-h-0 rounded-lg overflow-hidden shadow-xl">
      <Map
        mapId={customMapId || undefined} // Use custom Map ID or undefined for default
        center={center} // Center will be overridden by DirectionsRenderer if route is shown
        zoom={zoom}     // Zoom will be overridden by DirectionsRenderer if route is shown
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        onClick={onMapClick}
        className="w-full h-full"
      >
        {friendLocation && (
          <AdvancedMarker 
            position={friendLocation.position} 
            title={friendLocation.name}
            zIndex={10}
          >
            <MapPin category={friendLocation.category || LocationCategory.FRIEND} name={friendLocation.name} />
          </AdvancedMarker>
        )}
        {workLocation && (
          <AdvancedMarker
            position={workLocation.position}
            title={workLocation.name}
            zIndex={5}
          >
            <MapPin category={workLocation.category || LocationCategory.WORK} name={workLocation.name} />
          </AdvancedMarker>
        )}
        {pinnedLocations.map((pin) => (
          <AdvancedMarker 
            key={pin.id} 
            position={pin.position} 
            title={pin.name}
          >
            <MapPin category={pin.category} name={pin.name}/>
          </AdvancedMarker>
        ))}
      </Map>
    </div>
  );
};

export default MapComponent;
