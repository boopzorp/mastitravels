// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { LatLng, PinnedLocation } from '@/lib/types';
import { LocationCategory } from '@/lib/types';
import { geocodeAddress, calculateDistance } from '@/lib/maps';
import { generateLocationRecommendations, type GenerateLocationRecommendationsInput } from '@/ai/flows/generate-location-recommendations';

import MapComponent from '@/components/bangalore-buddy/MapComponent';
import LocationForm, { type LocationFormInput } from '@/components/bangalore-buddy/LocationForm';
import AddLocationDialog, { type AddLocationFormInput } from '@/components/bangalore-buddy/AddLocationDialog';
import PinnedLocationsList from '@/components/bangalore-buddy/PinnedLocationsList';
import RecommendationsDisplay from '@/components/bangalore-buddy/RecommendationsDisplay';
import { useToast } from '@/hooks/use-toast';
import { Globe, MapPin as MapPinIcon } from 'lucide-react'; // Renamed to avoid conflict

// Default center for Bangalore
const DEFAULT_CENTER: LatLng = { lat: 12.9716, lng: 77.5946 };

export default function HomePage() {
  const [mapCenter, setMapCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [friendLocation, setFriendLocation] = useState<PinnedLocation | null>(null);
  const [pinnedLocations, setPinnedLocations] = useState<PinnedLocation[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null);
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPinLoading, setIsPinLoading] = useState(false);
  const [isAddLocationDialogOpen, setIsAddLocationDialogOpen] = useState(false);

  const { toast } = useToast();

  const handleLocationFormSubmit = async (data: LocationFormInput) => {
    setIsAiLoading(true);
    setAiRecommendations(null);

    const friendLatLng = await geocodeAddress(data.address);
    if (friendLatLng) {
      const newFriendLocation: PinnedLocation = {
        id: 'friend-location',
        name: "Friend's Place",
        category: LocationCategory.FRIEND,
        position: friendLatLng,
        address: data.address,
      };
      setFriendLocation(newFriendLocation);
      setMapCenter(friendLatLng);

      // Update distances for existing pins
      setPinnedLocations(prevPins => 
        prevPins.map(pin => ({
          ...pin,
          distance: calculateDistance(newFriendLocation.position, pin.position)
        }))
      );
      
      toast({ title: "Friend's location updated!", description: "Map centered on the new address." });
    } else {
      toast({ title: "Geocoding Failed", description: "Could not find coordinates for the friend's address.", variant: "destructive" });
      // Keep old friend location if geocoding fails or set map to default
      // setMapCenter(DEFAULT_CENTER); // Optionally reset map center
    }

    try {
      const aiInput: GenerateLocationRecommendationsInput = {
        address: data.address,
        categories: data.categories,
        details: data.details,
      };
      const result = await generateLocationRecommendations(aiInput);
      setAiRecommendations(result.recommendations);
      toast({ title: "AI Recommendations Ready!", description: "Check out the suggestions below." });
    } catch (error) {
      console.error("AI Recommendation Error:", error);
      toast({ title: "AI Error", description: "Could not fetch recommendations.", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddPinnedLocation = async (data: AddLocationFormInput) => {
    setIsPinLoading(true);
    const newPinLatLng = await geocodeAddress(data.address);

    if (newPinLatLng) {
      const newPin: PinnedLocation = {
        id: `pin-${Date.now()}`, // Simple unique ID
        name: data.name,
        description: data.description,
        category: data.category,
        position: newPinLatLng,
        address: data.address,
        distance: friendLocation ? calculateDistance(friendLocation.position, newPinLatLng) : "N/A",
      };
      setPinnedLocations((prev) => [...prev, newPin]);
      toast({ title: "Location Pinned!", description: `${data.name} has been added to the map.` });
      setIsAddLocationDialogOpen(false); // Close dialog on success
    } else {
      toast({ title: "Geocoding Failed", description: "Could not find coordinates for the pinned location address.", variant: "destructive" });
    }
    setIsPinLoading(false);
  };

  // Recalculate distances if friendLocation changes and Maps API is loaded
  useEffect(() => {
    if (friendLocation && typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.geometry) {
      setPinnedLocations(prevPins =>
        prevPins.map(pin => ({
          ...pin,
          distance: calculateDistance(friendLocation.position, pin.position),
        }))
      );
    }
  }, [friendLocation]);


  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <header className="p-4 shadow-md bg-card border-b">
        <h1 className="text-3xl font-bold text-primary flex items-center justify-center">
          <Globe className="mr-3 h-8 w-8" />
          Bangalore Buddy
          <MapPinIcon className="ml-3 h-8 w-8" />
        </h1>
      </header>

      <main className="flex-grow grid md:grid-cols-3 gap-6 p-6">
        {/* Controls Panel */}
        <div className="md:col-span-1 flex flex-col space-y-6 overflow-y-auto 
                        max-h-[calc(100vh-theme(spacing.32))] md:max-h-[calc(100vh-theme(spacing.24))] 
                        scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent p-1">
          <LocationForm onSubmit={handleLocationFormSubmit} isLoading={isAiLoading} />
          
          <AddLocationDialog 
            onSave={handleAddPinnedLocation} 
            isLoading={isPinLoading}
            open={isAddLocationDialogOpen}
            onOpenChange={setIsAddLocationDialogOpen}
          />
          
          <PinnedLocationsList locations={pinnedLocations} friendLocationSet={!!friendLocation} />
          
          <RecommendationsDisplay recommendations={aiRecommendations} isLoading={isAiLoading} />
        </div>

        {/* Map Panel */}
        <div className="md:col-span-2 rounded-xl shadow-2xl overflow-hidden h-[50vh] md:h-auto">
          <MapComponent
            center={mapCenter}
            friendLocation={friendLocation}
            pinnedLocations={pinnedLocations}
          />
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        Built with <span className="text-destructive">&hearts;</span> for good friends in Bangalore.
      </footer>
    </div>
  );
}
