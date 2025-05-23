
// src/components/bangalore-buddy/DirectionsSheet.tsx
"use client";

import type { FC } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { BusFront, TrainFront, Footprints, AlertCircle } from 'lucide-react';

interface DirectionsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  directions: google.maps.DirectionsResult | null;
  destinationName: string;
}

const DirectionsSheet: FC<DirectionsSheetProps> = ({ 
  isOpen, 
  onOpenChange, 
  directions, 
  destinationName 
}) => {

  const renderStepIcon = (travelMode?: google.maps.TravelMode, transitDetails?: google.maps.TransitDetails) => {
    // Check transit vehicle type first for more specific icons
    if (transitDetails && transitDetails.line && transitDetails.line.vehicle && transitDetails.line.vehicle.type) {
      const vehicleType = transitDetails.line.vehicle.type;
      if (vehicleType === 'BUS') return <BusFront className="mr-2 h-5 w-5 text-primary" />;
      if (['SUBWAY', 'TRAIN', 'TRAM', 'RAIL'].includes(vehicleType)) return <TrainFront className="mr-2 h-5 w-5 text-purple-600" />;
    }

    // Fallback to travelMode if vehicle type is not specific enough or not available
    switch (travelMode) {
      case google.maps.TravelMode.TRANSIT:
        return <BusFront className="mr-2 h-5 w-5 text-primary" />; // Default transit icon
      case google.maps.TravelMode.WALKING:
        return <Footprints className="mr-2 h-5 w-5 text-green-600" />;
      default:
        // For generic transit steps or if specific icon isn't clear
        return <BusFront className="mr-2 h-5 w-5 text-gray-500" />; // A generic icon for other modes if any
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col" side="right">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-xl">Public Transport to {destinationName}</SheetTitle>
          {directions?.routes[0]?.warnings && directions.routes[0].warnings.length > 0 && (
             <SheetDescription className="text-xs text-orange-600">
                {directions.routes[0].warnings.join('; ')}
            </SheetDescription>
          )}
           {directions?.routes[0]?.legs[0] && (
            <SheetDescription>
              Total: {directions.routes[0].legs[0].duration?.text} ({directions.routes[0].legs[0].distance?.text})
            </SheetDescription>
          )}
        </SheetHeader>
        
        <ScrollArea className="flex-grow my-4">
          {directions && directions.routes.length > 0 ? (
            directions.routes[0].legs[0].steps.map((step, index) => (
              <div key={index} className="py-3 border-b last:border-b-0">
                <div className="flex items-start">
                  <div className="pt-1">
                     {renderStepIcon(step.travel_mode, step.transit)}
                  </div>
                  <div className="flex-grow">
                    <div 
                      className="text-sm" 
                      dangerouslySetInnerHTML={{ __html: step.instructions || "" }} 
                    />
                    {step.transit && (
                       <div className="text-xs text-muted-foreground mt-1">
                          {step.transit.line?.vehicle?.name && `${step.transit.line.vehicle.name} `}
                          {step.transit.line?.short_name && `(${step.transit.line.short_name}) `}
                          {step.transit.line?.name && `${step.transit.line.name} `}
                          towards {step.transit.headsign}
                          <br/>
                          {step.transit.num_stops} stops 
                          ({step.duration?.text})
                          {step.transit.departure_time && ` - Departs: ${step.transit.departure_time.text}`}
                       </div>
                    )}
                     {!step.transit && step.duration?.text && (
                       <p className="text-xs text-muted-foreground mt-1">
                        {step.duration.text} ({step.distance?.text})
                       </p>
                     )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <AlertCircle className="w-10 h-10 mb-2"/>
                <p>No public transit directions found.</p>
                <p className="text-xs">Try a different destination or check Google Maps directly.</p>
            </div>
          )}
        </ScrollArea>
        
        <SheetFooter className="pt-4 border-t">
          <Button onClick={() => onOpenChange(false)} variant="outline">Close</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default DirectionsSheet;
