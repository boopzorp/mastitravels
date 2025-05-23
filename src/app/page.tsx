
// src/app/page.tsx
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMapsLibrary } from '@vis.gl/react-google-maps';


import type { LatLng, PinnedLocation } from '@/lib/types';
import { LocationCategory } from '@/lib/types';
import { geocodeAddress, calculateDistance, getDirections } from '@/lib/maps';
import { generateLocationRecommendations, type GenerateLocationRecommendationsInput } from '@/ai/flows/generate-location-recommendations';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc, query, where, orderBy, deleteDoc, getDoc } from 'firebase/firestore';

import MapComponent from '@/components/bangalore-buddy/MapComponent';
import OriginalLocationForm, { type LocationFormInput as OriginalLocationFormInputType } from '@/components/bangalore-buddy/LocationForm';
import AddressAutocompleteInput from '@/components/bangalore-buddy/AddressAutocompleteInput';
import PinnedLocationsList from '@/components/bangalore-buddy/PinnedLocationsList';
import RecommendationsDisplay from '@/components/bangalore-buddy/RecommendationsDisplay';
import DirectionsSheet from '@/components/bangalore-buddy/DirectionsSheet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Globe, MapPin as MapPinIcon, Home, Briefcase, PlusCircle, Trash2, Route as RouteIcon } from 'lucide-react';

const DEFAULT_CENTER: LatLng = { lat: 12.9716, lng: 77.5946 };
const LOCATIONS_COLLECTION = 'pinned_locations';
const FRIEND_HOME_DOC_ID = 'friend_special_home_location';
const FRIEND_WORK_DOC_ID = 'friend_special_work_location';

const addressOnlySchema = z.object({
  address: z.string().min(5, "Address is required for geocoding"),
});
type AddressOnlyFormInput = z.infer<typeof addressOnlySchema>;

const otherPlaceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(5, "Address is required for geocoding"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});
type OtherPlaceFormInput = z.infer<typeof otherPlaceSchema>;

export default function HomePage() {
  const [mapCenter, setMapCenter] = useState<LatLng>(DEFAULT_CENTER);
  const [friendHomeLocation, setFriendHomeLocation] = useState<PinnedLocation | null>(null);
  const [friendWorkLocation, setFriendWorkLocation] = useState<PinnedLocation | null>(null);
  const [otherPinnedLocations, setOtherPinnedLocations] = useState<PinnedLocation[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null);
  
  const [activeMapRoute, setActiveMapRoute] = useState<google.maps.DirectionsResult | null>(null);
  const [transitSheetDirections, setTransitSheetDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isDirectionsSheetOpen, setIsDirectionsSheetOpen] = useState(false);
  const [selectedSheetDestinationName, setSelectedSheetDestinationName] = useState<string>("");
  
  const [isAiLoading, setIsAiLoading] = useState(false); 
  const [isHomeSaving, setIsHomeSaving] = useState(false);
  const [isWorkSaving, setIsWorkSaving] = useState(false);
  const [isOtherPlaceSaving, setIsOtherPlaceSaving] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const { toast } = useToast();
  const mapsRoutesLib = useMapsLibrary('routes');

  const homeForm = useForm<AddressOnlyFormInput>({ resolver: zodResolver(addressOnlySchema) });
  const workForm = useForm<AddressOnlyFormInput>({ resolver: zodResolver(addressOnlySchema) });
  const otherPlaceForm = useForm<OtherPlaceFormInput>({ 
    resolver: zodResolver(otherPlaceSchema),
    defaultValues: { name: "", address: "", category: "", description: "" },
  });

  const fetchData = useCallback(async () => {
    if (!db || !db.app?.options?.projectId) {
      toast({ title: "Database Error", description: "Firestore is not configured.", variant: "destructive" });
      setIsDataLoading(false);
      return;
    }
    setIsDataLoading(true);
    try {
      const friendHomeDocRef = doc(db, LOCATIONS_COLLECTION, FRIEND_HOME_DOC_ID);
      const friendHomeDocSnap = await getDoc(friendHomeDocRef);
      if (friendHomeDocSnap.exists()) {
        const homeData = friendHomeDocSnap.data() as Omit<PinnedLocation, 'id' | 'distance'>;
        const homeLocation = { ...homeData, id: friendHomeDocSnap.id } as PinnedLocation;
        setFriendHomeLocation(homeLocation);
        setMapCenter(homeLocation.position); 
        homeForm.setValue('address', homeData.address || "");
      } else {
        setFriendHomeLocation(null);
        homeForm.reset({ address: "" });
      }

      const friendWorkDocRef = doc(db, LOCATIONS_COLLECTION, FRIEND_WORK_DOC_ID);
      const friendWorkDocSnap = await getDoc(friendWorkDocRef);
      if (friendWorkDocSnap.exists()) {
        const workData = friendWorkDocSnap.data() as Omit<PinnedLocation, 'id' | 'distance'>;
        setFriendWorkLocation({ ...workData, id: friendWorkDocSnap.id } as PinnedLocation);
        workForm.setValue('address', workData.address || "");
      } else {
        setFriendWorkLocation(null);
        workForm.reset({ address: "" });
      }

      const q = query(collection(db, LOCATIONS_COLLECTION), 
        where("__name__", "not-in", [FRIEND_HOME_DOC_ID, FRIEND_WORK_DOC_ID]),
        orderBy("name")
      );
      const querySnapshot = await getDocs(q);
      const locationsFromDb: PinnedLocation[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as Omit<PinnedLocation, 'id' | 'distance'>;
        locationsFromDb.push({ ...data, id: docSnap.id } as PinnedLocation);
      });
      setOtherPinnedLocations(locationsFromDb);

    } catch (error) {
      console.error("Error fetching data from Firestore:", error);
      toast({ title: "Firestore Error", description: "Could not load locations.", variant: "destructive" });
    } finally {
      setIsDataLoading(false);
    }
  }, [toast, homeForm, workForm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (friendHomeLocation?.position && friendWorkLocation?.position && mapsRoutesLib) {
      const fetchRoute = async () => {
        const routeResult = await getDirections(friendHomeLocation.position, friendWorkLocation.position, mapsRoutesLib, google.maps.TravelMode.DRIVING);
        setActiveMapRoute(routeResult);
      };
      fetchRoute();
    } else {
      setActiveMapRoute(null); 
    }
  }, [friendHomeLocation?.position, friendWorkLocation?.position, mapsRoutesLib]);

  const handleOriginalLocationFormSubmit = async (data: OriginalLocationFormInputType) => {
     if (!db || !db.app?.options?.projectId) {
      toast({ title: "Database Error", description: "Firestore is not configured for saving.", variant: "destructive" });
      return;
    }
    if (!friendHomeLocation || !friendHomeLocation.address) {
      toast({ title: "Missing Information", description: "Please set your friend's home address first.", variant: "destructive" });
      return;
    }

    setIsAiLoading(true);
    setAiRecommendations(null);

    try {
      const aiInput: GenerateLocationRecommendationsInput = {
        address: friendHomeLocation.address,
        categories: data.categories,
        details: data.details,
      };
      const result = await generateLocationRecommendations(aiInput);
      setAiRecommendations(result.recommendations);
      toast({ title: "AI Recommendations Ready!", description: "Check out the suggestions." });
    } catch (error) {
      console.error("Error generating AI recommendations:", error);
      toast({ title: "AI Error", description: "Could not generate recommendations.", variant: "destructive" });
    }
    setIsAiLoading(false);
  };

  const handleSaveHomeLocation: SubmitHandler<AddressOnlyFormInput> = async (data) => {
    setIsHomeSaving(true);
    const latLng = await geocodeAddress(data.address);
    if (latLng) {
      const locationData: Omit<PinnedLocation, 'id' | 'distance'> = {
        name: "Friend's Home",
        category: LocationCategory.FRIEND,
        position: latLng,
        address: data.address,
      };
      try {
        await setDoc(doc(db, LOCATIONS_COLLECTION, FRIEND_HOME_DOC_ID), locationData);
        setFriendHomeLocation({ ...locationData, id: FRIEND_HOME_DOC_ID });
        setMapCenter(latLng);
        toast({ title: "Friend's Home Updated!", description: data.address });
      } catch (e) { toast({ title: "Error saving home", variant: "destructive" }); }
    } else { toast({ title: "Geocoding failed for Home", variant: "destructive" }); }
    setIsHomeSaving(false);
  };

  const handleSaveWorkLocation: SubmitHandler<AddressOnlyFormInput> = async (data) => {
    setIsWorkSaving(true);
    const latLng = await geocodeAddress(data.address);
    if (latLng) {
      const locationData: Omit<PinnedLocation, 'id' | 'distance'> = {
        name: "Friend's Work",
        category: LocationCategory.WORK,
        position: latLng,
        address: data.address,
      };
      try {
        await setDoc(doc(db, LOCATIONS_COLLECTION, FRIEND_WORK_DOC_ID), locationData);
        setFriendWorkLocation({ ...locationData, id: FRIEND_WORK_DOC_ID });
        if (!friendHomeLocation) setMapCenter(latLng); 
        toast({ title: "Friend's Work Updated!", description: data.address });
      } catch (e) { toast({ title: "Error saving work", variant: "destructive" }); }
    } else { toast({ title: "Geocoding failed for Work", variant: "destructive" }); }
    setIsWorkSaving(false);
  };

  const handleAddOtherPlace: SubmitHandler<OtherPlaceFormInput> = async (data) => {
    setIsOtherPlaceSaving(true);
    const latLng = await geocodeAddress(data.address);
    if (latLng) {
      const newPlaceData: Omit<PinnedLocation, 'id' | 'distance'> = {
        name: data.name,
        category: data.category, 
        position: latLng,
        address: data.address,
        description: data.description,
      };
      try {
        const docRef = await addDoc(collection(db, LOCATIONS_COLLECTION), newPlaceData);
        setOtherPinnedLocations(prev => [...prev, { ...newPlaceData, id: docRef.id }]);
        toast({ title: "Place Added!", description: data.name });
        otherPlaceForm.reset(); 
      } catch (e) { toast({ title: "Error adding place", variant: "destructive" }); }
    } else { toast({ title: "Geocoding failed for new place", variant: "destructive" }); }
    setIsOtherPlaceSaving(false);
  };
  
  const handleDeleteOtherPlace = async (id: string) => {
    try {
      await deleteDoc(doc(db, LOCATIONS_COLLECTION, id));
      setOtherPinnedLocations(prev => prev.filter(loc => loc.id !== id));
      toast({ title: "Place Deleted", description: "Removed from your list." });
    } catch (error) {
      console.error("Error deleting place:", error);
      toast({ title: "Error Deleting Place", variant: "destructive" });
    }
  };

  const handleShowTransitDirections = async (destination: PinnedLocation) => {
    if (!friendHomeLocation || !mapsRoutesLib) {
      toast({ title: "Missing Home Location", description: "Please set friend's home address first.", variant: "destructive" });
      return;
    }
    
    setSelectedSheetDestinationName(destination.name);
    setIsDirectionsSheetOpen(true);
    setTransitSheetDirections(null); 

    const drivingRoute = await getDirections(friendHomeLocation.position, destination.position, mapsRoutesLib, google.maps.TravelMode.DRIVING);
    setActiveMapRoute(drivingRoute);

    const transitRoute = await getDirections(friendHomeLocation.position, destination.position, mapsRoutesLib, google.maps.TravelMode.TRANSIT);
    if (transitRoute) {
      setTransitSheetDirections(transitRoute);
    } else {
      toast({ title: "No Transit Route", description: `Could not find public transit directions to ${destination.name}.`, variant: "destructive"});
    }
  };

  const handleShowHomeToWorkTransit = async () => {
    if (!friendHomeLocation || !friendWorkLocation || !mapsRoutesLib) {
      toast({ title: "Missing Locations", description: "Please set both Home and Work addresses first.", variant: "destructive" });
      return;
    }
    setSelectedSheetDestinationName(friendWorkLocation.name || "Friend's Work");
    setIsDirectionsSheetOpen(true);
    setTransitSheetDirections(null);

    const drivingRoute = await getDirections(friendHomeLocation.position, friendWorkLocation.position, mapsRoutesLib, google.maps.TravelMode.DRIVING);
    setActiveMapRoute(drivingRoute);

    const transitRoute = await getDirections(friendHomeLocation.position, friendWorkLocation.position, mapsRoutesLib, google.maps.TravelMode.TRANSIT);
    if (transitRoute) {
      setTransitSheetDirections(transitRoute);
    } else {
      toast({ title: "No Transit Route", description: `Could not find public transit from Home to ${friendWorkLocation.name || "Work"}.`, variant: "destructive"});
    }
  };

  const handleShowWorkToHomeTransit = async () => {
    if (!friendHomeLocation || !friendWorkLocation || !mapsRoutesLib) {
      toast({ title: "Missing Locations", description: "Please set both Home and Work addresses first.", variant: "destructive" });
      return;
    }
    setSelectedSheetDestinationName(friendHomeLocation.name || "Friend's Home");
    setIsDirectionsSheetOpen(true);
    setTransitSheetDirections(null);

    const drivingRoute = await getDirections(friendWorkLocation.position, friendHomeLocation.position, mapsRoutesLib, google.maps.TravelMode.DRIVING);
    setActiveMapRoute(drivingRoute);

    const transitRoute = await getDirections(friendWorkLocation.position, friendHomeLocation.position, mapsRoutesLib, google.maps.TravelMode.TRANSIT);
    if (transitRoute) {
      setTransitSheetDirections(transitRoute);
    } else {
      toast({ title: "No Transit Route", description: `Could not find public transit from Work to ${friendHomeLocation.name || "Home"}.`, variant: "destructive"});
    }
  };


  useEffect(() => {
    if (friendHomeLocation) {
      setOtherPinnedLocations(prevPins =>
        prevPins.map(pin => ({
          ...pin,
          distance: calculateDistance(friendHomeLocation.position, pin.position),
        }))
      );
      if (friendWorkLocation) {
         setFriendWorkLocation(workLoc => workLoc ? ({...workLoc, distance: calculateDistance(friendHomeLocation.position, workLoc.position) }) : null);
      }

    } else { 
        setOtherPinnedLocations(prevPins => prevPins.map(pin => ({ ...pin, distance: undefined })));
        if (friendWorkLocation) {
           setFriendWorkLocation(workLoc => workLoc ? ({...workLoc, distance: undefined }) : null);
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friendHomeLocation, friendWorkLocation?.position.lat, friendWorkLocation?.position.lng, otherPinnedLocations.length]);


  if (isDataLoading && (!db || !db.app?.options?.projectId)) {
     return (
        <div className="flex flex-col min-h-screen bg-background font-sans items-center justify-center p-4">
          <p className="text-lg text-muted-foreground">Loading application data...</p>
          <p className="text-sm text-red-500">If this persists, ensure Firebase is configured correctly in your .env file.</p>
        </div>
     );
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
          
          <OriginalLocationForm 
            onSubmit={handleOriginalLocationFormSubmit} 
            isLoading={isAiLoading} 
            isFriendHomeSet={!!friendHomeLocation}
          />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Home className="mr-2 h-5 w-5 text-primary" /> Friend's Home</CardTitle>
              <CardDescription>Set your friend's primary residential address. Used for AI recommendations and routing.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...homeForm}>
                <form onSubmit={homeForm.handleSubmit(handleSaveHomeLocation)} className="space-y-4">
                  <FormField
                    control={homeForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Home Address</FormLabel>
                        <FormControl>
                          <AddressAutocompleteInput value={field.value} onChange={field.onChange} placeholder="Enter home address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isHomeSaving} className="w-full">
                    {isHomeSaving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div> : null}
                    Save Home
                  </Button>
                </form>
              </Form>
              {friendHomeLocation && friendWorkLocation && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleShowWorkToHomeTransit} 
                  disabled={!mapsRoutesLib}
                  className="mt-2 w-full flex items-center"
                >
                  <RouteIcon className="mr-2 h-4 w-4" />
                  Show Transit from Work
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><Briefcase className="mr-2 h-5 w-5 text-primary" /> Friend's Work</CardTitle>
              <CardDescription>Set your friend's workplace address for routing.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...workForm}>
                <form onSubmit={workForm.handleSubmit(handleSaveWorkLocation)} className="space-y-4">
                  <FormField
                    control={workForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Address</FormLabel>
                        <FormControl>
                          <AddressAutocompleteInput value={field.value} onChange={field.onChange} placeholder="Enter work address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isWorkSaving} className="w-full">
                     {isWorkSaving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div> : null}
                    Save Work
                  </Button>
                </form>
              </Form>
              {friendHomeLocation && friendWorkLocation && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleShowHomeToWorkTransit} 
                  disabled={!mapsRoutesLib}
                  className="mt-2 w-full flex items-center"
                >
                  <RouteIcon className="mr-2 h-4 w-4" />
                  Show Transit from Home
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center"><PlusCircle className="mr-2 h-5 w-5 text-primary" /> Add Other Places</CardTitle>
              <CardDescription>Pin other locations like cafes, parks, museums, etc.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...otherPlaceForm}>
                <form onSubmit={otherPlaceForm.handleSubmit(handleAddOtherPlace)} className="space-y-4">
                  <FormField control={otherPlaceForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Place Name</FormLabel><FormControl><Input placeholder="e.g., Corner House Ice Cream" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={otherPlaceForm.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><AddressAutocompleteInput value={field.value} onChange={field.onChange} placeholder="Place address" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={otherPlaceForm.control} name="category" render={({ field }) => (
                    <FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g., Cafe, Park, Museum" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={otherPlaceForm.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Notes about this place" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" disabled={isOtherPlaceSaving} className="w-full">
                    {isOtherPlaceSaving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div> : null}
                    Add Place
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <PinnedLocationsList 
            locations={otherPinnedLocations} 
            friendLocationSet={!!friendHomeLocation}
            onDeleteLocation={handleDeleteOtherPlace} 
            onShowDirections={handleShowTransitDirections}
            showDeleteButton={true} 
          />
          
          <RecommendationsDisplay recommendations={aiRecommendations} isLoading={isAiLoading} />
        </div>

        <div className="md:col-span-2 rounded-xl shadow-2xl overflow-hidden h-[50vh] md:h-auto">
          <MapComponent
            center={mapCenter}
            friendLocation={friendHomeLocation}
            workLocation={friendWorkLocation} 
            pinnedLocations={otherPinnedLocations}
            route={activeMapRoute}
          />
        </div>
      </main>
      <footer className="text-center p-4 text-sm text-muted-foreground border-t">
        Built with <span className="text-destructive">&hearts;</span> for good friends in Bangalore.
      </footer>
      <DirectionsSheet 
        isOpen={isDirectionsSheetOpen}
        onOpenChange={setIsDirectionsSheetOpen}
        directions={transitSheetDirections}
        destinationName={selectedSheetDestinationName}
      />
    </div>
  );
}

