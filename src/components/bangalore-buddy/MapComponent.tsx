
// src/components/bangalore-buddy/MapComponent.tsx
"use client";

import type { FC } from 'react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import type { LatLng, PinnedLocation } from '@/lib/types';
import { LocationCategory } from '@/lib/types';
import MapPin from './MapPin';

interface MapComponentProps {
  center: LatLng;
  zoom?: number;
  friendLocation: PinnedLocation | null;
  workLocation: PinnedLocation | null; // Added workLocation
  pinnedLocations: PinnedLocation[];
  onMapClick?: (event: google.maps.MapMouseEvent) => void;
  selectedPinId?: string | null;
}

const MapComponent: FC<MapComponentProps> = ({ 
  center, 
  zoom = 12, 
  friendLocation, 
  workLocation, // Destructure workLocation
  pinnedLocations,
  onMapClick,
  selectedPinId,
}) => {
  return (
    <div className="w-full h-full min-h-[300px] md:min-h-0 rounded-lg overflow-hidden shadow-xl">
      <Map
        mapId="bangalore-buddy-map"
        center={center}
        zoom={zoom}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        onClick={onMapClick}
        className="w-full h-full"
      >
        {friendLocation && (
          <AdvancedMarker 
            position={friendLocation.position} 
            title={friendLocation.name}
            zIndex={10} // Ensure friend's home is on top
          >
            <MapPin category={friendLocation.category || LocationCategory.FRIEND} name={friendLocation.name} />
          </AdvancedMarker>
        )}
        {workLocation && ( // Render work location marker
          <AdvancedMarker
            position={workLocation.position}
            title={workLocation.name}
            zIndex={5} // Lower zIndex than home, but higher than others
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
            {/* Ensure category passed is a string; MapPin handles defaults */}
            <MapPin category={pin.category} name={pin.name}/>
          </AdvancedMarker>
        ))}
      </Map>
    </div>
  );
};

export default MapComponent;
