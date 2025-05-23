// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import type { LatLng, PinnedLocation } from '@/lib/types';
import { LocationCategory } from '@/lib/types';
import { geocodeAddress, calculateDistance } from '@/lib/maps';
import { generateLocationRecommendations, type GenerateLocationRecommendationsInput } from '@/ai/flows/generate-location-recommendations';
import { db } from '@/lib/firebase'; // Firebase integration
import { collection, addDoc, getDocs, doc, setDoc, query, where, orderBy, Timestamp, serverTimestamp, getDoc } from 'firebase/firestore';


import MapComponent from '@/components/bangalore-buddy/MapComponent';
import LocationForm, { type LocationFormInput } from '@/components/bangalore-buddy/LocationForm';
import AddLocationDialog, { type AddLocationFormInput } from '@/components/bangalore-buddy/AddLocationDialog';
import PinnedLocationsList from '@/components/bangalore-buddy/PinnedLocationsList';
import RecommendationsDisplay from '@/components/bangalore-buddy/RecommendationsDisplay';
import { useToast } from '@/hooks/use-toast';
import { Globe, MapPin as MapPinIcon } from 'lucide-react';

// Default center for Bangalore
const DEFAULT_CENTER: LatLng = { lat: 12.9716, lng: 77.5946 };
const LOCATIONS_COLLECTION = 'pinned_locations';
const FRIEND_HOME_DOC_ID = 'friend_special_home_location'; // Specific ID for friend's home in Firestore

export default function HomePage() {
  const [mapCenter, setMapCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [friendLocation, setFriendLocation] = useState<PinnedLocation | null>(null);
  const [pinnedLocations, setPinnedLocations] = useState<PinnedLocation[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null);
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPinLoading, setIsPinLoading] = useState(false); // For adding new general pins
  const [isDataLoading, setIsDataLoading] = useState(true); // For initial data load from Firestore
  const [isAddLocationDialogOpen, setIsAddLocationDialogOpen] = useState(false);

  const { toast } = useToast();

  // Fetch initial data from Firestore
  useEffect(() => {
    const fetchData = async () => {
      if (!db || !db.app?.options?.projectId) {
        toast({ title: "Database Error", description: "Firestore is not configured. Please check setup.", variant: "destructive" });
        setIsDataLoading(false);
        return;
      }
      setIsDataLoading(true);
      try {
        // Fetch friend's home location
        const friendHomeDocRef = doc(db, LOCATIONS_COLLECTION, FRIEND_HOME_DOC_ID);
        const friendHomeDocSnap = await getDoc(friendHomeDocRef);
        if (friendHomeDocSnap.exists()) {
          const homeData = friendHomeDocSnap.data() as Omit<PinnedLocation, 'id' | 'distance'>;
           const homeLocation = {
            ...homeData,
            id: friendHomeDocSnap.id,
            // distance will be calculated if other pins exist or friend location is set
          } as PinnedLocation;
          setFriendLocation(homeLocation);
          setMapCenter(homeLocation.position);
        }

        // Fetch other pinned locations
        const q = query(collection(db, LOCATIONS_COLLECTION), where("category", "!=", LocationCategory.FRIEND), orderBy("name"));
        const querySnapshot = await getDocs(q);
        const locationsFromDb: PinnedLocation[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as Omit<PinnedLocation, 'id' | 'distance'>;
          locationsFromDb.push({ 
            ...data, 
            id: docSnap.id,
            // distance will be calculated later
          } as PinnedLocation);
        });
        setPinnedLocations(locationsFromDb);

      } catch (error) {
        console.error("Error fetching data from Firestore:", error);
        toast({ title: "Firestore Error", description: "Could not load locations.", variant: "destructive" });
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchData();
  }, [toast]);


  const handleLocationFormSubmit = async (data: LocationFormInput) => {
    if (!db || !db.app?.options?.projectId) {
      toast({ title: "Database Error", description: "Firestore is not configured for saving.", variant: "destructive" });
      return;
    }
    setIsAiLoading(true); // Use isAiLoading for overall process including geocoding and AI
    setAiRecommendations(null);

    const friendLatLng = await geocodeAddress(data.address);
    if (friendLatLng) {
      const newFriendLocationData: Omit<PinnedLocation, 'id' | 'distance'> = {
        name: "Friend's Place",
        category: LocationCategory.FRIEND,
        position: friendLatLng,
        address: data.address,
        // Firestore specific fields like createdAt can be added here
      };
      
      try {
        await setDoc(doc(db, LOCATIONS_COLLECTION, FRIEND_HOME_DOC_ID), newFriendLocationData);
        const newFriendLocationWithId: PinnedLocation = { ...newFriendLocationData, id: FRIEND_HOME_DOC_ID };
        setFriendLocation(newFriendLocationWithId);
        setMapCenter(friendLatLng);
        toast({ title: "Friend's location updated!", description: "Saved to Firestore and map centered." });
        
        // Trigger AI recommendations
        const aiInput: GenerateLocationRecommendationsInput = {
          address: data.address,
          categories: data.categories,
          details: data.details,
        };
        const result = await generateLocationRecommendations(aiInput);
        setAiRecommendations(result.recommendations);
        toast({ title: "AI Recommendations Ready!", description: "Check out the suggestions below." });

      } catch (error) {
        console.error("Error saving friend's location to Firestore:", error);
        toast({ title: "Firestore Save Error", description: "Could not save friend's location.", variant: "destructive" });
      }
    } else {
      toast({ title: "Geocoding Failed", description: "Could not find coordinates for the friend's address.", variant: "destructive" });
    }
    setIsAiLoading(false);
  };

  const handleAddPinnedLocation = async (data: AddLocationFormInput) => {
     if (!db || !db.app?.options?.projectId) {
      toast({ title: "Database Error", description: "Firestore is not configured for saving.", variant: "destructive" });
      return;
    }
    setIsPinLoading(true);
    const newPinLatLng = await geocodeAddress(data.address);

    if (newPinLatLng) {
      const newPinData: Omit<PinnedLocation, 'id' | 'distance'> = {
        name: data.name,
        description: data.description,
        category: data.category,
        position: newPinLatLng,
        address: data.address,
        // serverTimestamp() can be used for createdAt/updatedAt if desired
      };
      try {
        const docRef = await addDoc(collection(db, LOCATIONS_COLLECTION), newPinData);
        const newPinWithId: PinnedLocation = { ...newPinData, id: docRef.id };
        setPinnedLocations((prev) => [...prev, newPinWithId]);
        toast({ title: "Location Pinned!", description: `${data.name} has been saved to Firestore.` });
        setIsAddLocationDialogOpen(false);
        form.reset(); // Assuming 'form' is accessible or passed to close dialog properly
      } catch (error) {
        console.error("Error adding pinned location to Firestore:", error);
        toast({ title: "Firestore Save Error", description: "Could not save the new pin.", variant: "destructive" });
      }
    } else {
      toast({ title: "Geocoding Failed", description: "Could not find coordinates for the pinned location address.", variant: "destructive" });
    }
    setIsPinLoading(false);
  };

  // Recalculate distances if friendLocation or pinnedLocations change
  useEffect(() => {
    if (friendLocation && pinnedLocations.length > 0 && typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.geometry) {
      setPinnedLocations(prevPins =>
        prevPins.map(pin => ({
          ...pin,
          distance: calculateDistance(friendLocation.position, pin.position),
        }))
      );
    } else if (friendLocation && pinnedLocations.length === 0) {
      // If there are no other pins, ensure friendLocation itself doesn't show distance
      setFriendLocation(loc => loc ? ({...loc, distance: undefined}) : null);
    }
  }, [friendLocation, pinnedLocations]);


  if (isDataLoading && (!db || !db.app?.options?.projectId)) {
     // Still show a loading or message if db isn't ready during initial check phase
     return (
        <div className="flex flex-col min-h-screen bg-background font-sans items-center justify-center">
          <p className="text-lg text-muted-foreground">Loading application data...</p>
          <p className="text-sm text-red-500">If this persists, ensure Firebase is configured correctly in your .env file.</p>
        </div>
     )
  }
   if (isDataLoading && db && db.app?.options?.projectId) {
    return (
      <div className="flex flex-col min-h-screen bg-background font-sans items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-lg text-muted-foreground">Loading locations from your Bangalore Buddy database...</p>
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      <header className="p-4 shadow-md bg-card border-b">
        <h1 className="text-3xl font-bold text-primary flex items-center justify-center">
          <Globe className="mr-3 h-8 w-8" />
          Bangalore Buddy (Admin)
          <MapPinIcon className="ml-3 h-8 w-8" />
        </h1>
      </header>

      <main className="flex-grow grid md:grid-cols-3 gap-6 p-6">
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
