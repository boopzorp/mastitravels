
// src/components/bangalore-buddy/MapComponent.tsx
"use client";

import React, { type FC, useEffect, useRef } from 'react';
import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { LatLng, PinnedLocation } from '@/lib/types';
import { LocationCategory } from '@/lib/types';
import MapPin from './MapPin';
import { Button } from '@/components/ui/button';
import { Home as HomeIcon } from 'lucide-react';

interface MapComponentProps {
  center: LatLng; // Used for default/initial centering or when no specific locations are set
  zoom?: number;  // Used for default/initial zoom or when no specific locations are set
  friendLocation: PinnedLocation | null;
  workLocation: PinnedLocation | null;
  pinnedLocations: PinnedLocation[];
  onMapClick?: (event: google.maps.MapMouseEvent) => void;
  selectedPinId?: string | null;
  route?: google.maps.DirectionsResult | null;
}

const MapComponent: FC<MapComponentProps> = ({ 
  center: defaultCenterProp, 
  zoom: defaultZoomProp = 13, 
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

    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new mapsRoutesLib.DirectionsRenderer({
        suppressMarkers: true, 
        preserveViewport: true, // We will manually fitBounds
        polylineOptions: {
          strokeColor: 'hsl(240, 100%, 50%)', 
          strokeOpacity: 0.8,
          strokeWeight: 6,
        }
      });
    }
    
    directionsRendererRef.current.setMap(map);

    if (route && route.routes && route.routes.length > 0) {
      directionsRendererRef.current.setDirections(route);
      const routeBounds = route.routes[0].bounds;
      if (routeBounds) {
        map.fitBounds(routeBounds, 50); // Fit to route with padding
      }
    } else {
      // No route, so clear directions and set center based on available locations or default
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections(null); // Changed undefined to null
      }
      if (friendLocation) {
        map.setCenter(friendLocation.position);
        map.setZoom(defaultZoomProp); 
      } else if (workLocation) { // Only work location is set
        map.setCenter(workLocation.position);
        map.setZoom(defaultZoomProp);
      } else { // No specific locations, use default props
        map.setCenter(defaultCenterProp);
        map.setZoom(defaultZoomProp);
      }
    }
    
    return () => {
      if (directionsRendererRef.current) {
        // directionsRendererRef.current.setMap(null); // Consider if needed on full unmount
      }
    };
  }, [map, mapsRoutesLib, route, friendLocation, workLocation, defaultCenterProp, defaultZoomProp]);


  const handleRecenterHome = () => {
    if (map && friendLocation) {
      map.setCenter(friendLocation.position);
      map.setZoom(defaultZoomProp); 
    }
  };

  return (
    <div className="relative w-full h-full min-h-[300px] md:min-h-0 rounded-lg overflow-hidden shadow-xl">
      {friendLocation && map && (
        <Button
          onClick={handleRecenterHome}
          variant="outline"
          size="icon"
          className="absolute top-3 right-3 z-10 bg-background shadow-md hover:bg-secondary"
          title="Recenter to Home"
        >
          <HomeIcon className="h-5 w-5" />
        </Button>
      )}
      <Map
        mapId={customMapId || undefined} 
        defaultCenter={defaultCenterProp}
        defaultZoom={defaultZoomProp}    
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

