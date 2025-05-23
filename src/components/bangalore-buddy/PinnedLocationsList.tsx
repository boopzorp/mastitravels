
// src/components/bangalore-buddy/PinnedLocationsList.tsx
"use client";

import type { FC } from 'react';
import type { PinnedLocation } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { List, Trash2, Route as RouteIcon, Home } from 'lucide-react'; 
import MapPin from './MapPin'; 

interface PinnedLocationsListProps {
  locations: PinnedLocation[];
  friendLocationSet: boolean;
  onDeleteLocation?: (id: string) => void; 
  onShowDirections?: (location: PinnedLocation, direction: 'toLocation' | 'fromLocation') => void; 
  showDeleteButton?: boolean; 
}

const PinnedLocationsList: FC<PinnedLocationsListProps> = ({ 
  locations, 
  friendLocationSet, 
  onDeleteLocation,
  onShowDirections,
  showDeleteButton = false 
}) => {
  if (locations.length === 0) {
    return (
      <Card className="shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <List className="text-primary" />
            Other Pinned Places
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No other places pinned yet. Add some to see them here!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <List className="text-primary" />
          Other Pinned Places
        </CardTitle>
        <CardDescription>Your saved spots. Click icons for transit directions.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px] pr-3"> {/* Max height and scroll */}
          <ul className="space-y-3">
            {locations.map((location) => (
              <li key={location.id} className="p-3 border rounded-md hover:bg-secondary/50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <MapPin category={location.category} />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-semibold text-md">{location.name}</h3>
                    {location.description && <p className="text-sm text-muted-foreground">{location.description}</p>}
                     <Badge variant="outline" className="mt-1 text-xs">{location.category}</Badge>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {friendLocationSet && location.distance && (
                      <div className="text-sm font-medium text-primary whitespace-nowrap mt-1">
                        {location.distance}
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      {onShowDirections && friendLocationSet && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary hover:bg-primary/10 h-auto p-1"
                            onClick={() => onShowDirections(location, 'toLocation')}
                            aria-label={`Get directions from Home to ${location.name}`}
                            title="Directions from Home"
                          >
                            <RouteIcon size={18} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary hover:bg-primary/10 h-auto p-1"
                            onClick={() => onShowDirections(location, 'fromLocation')}
                            aria-label={`Get directions from ${location.name} to Home`}
                            title="Directions to Home"
                          >
                            <Home size={16} className="mr-1"/> 
                            <RouteIcon size={18} style={{transform: 'scaleX(-1)'}} />
                          </Button>
                        </>
                      )}
                      {showDeleteButton && onDeleteLocation && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-auto p-1"
                          onClick={() => onDeleteLocation(location.id)}
                          aria-label={`Delete ${location.name}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PinnedLocationsList;
