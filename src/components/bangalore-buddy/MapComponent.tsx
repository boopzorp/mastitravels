// src/components/bangalore-buddy/MapComponent.tsx
"use client";

import type { FC } from 'react';
import { Map, AdvancedMarker, Pin as GooglePin } from '@vis.gl/react-google-maps';
import type { LatLng, PinnedLocation } from '@/lib/types';
import { LocationCategory } from '@/lib/types';
import MapPin from './MapPin';

interface MapComponentProps {
  center: LatLng;
  zoom?: number;
  friendLocation: PinnedLocation | null;
  pinnedLocations: PinnedLocation[];
  onMapClick?: (event: google.maps.MapMouseEvent) => void;
  selectedPinId?: string | null;
}

const MapComponent: FC<MapComponentProps> = ({ 
  center, 
  zoom = 12, 
  friendLocation, 
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
          >
            <MapPin category={LocationCategory.FRIEND} name={friendLocation.name} />
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
