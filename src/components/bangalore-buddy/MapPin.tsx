// src/components/bangalore-buddy/MapPin.tsx
"use client";

import type { FC } from 'react';
import { LocationCategory, type LocationCategoryType } from '@/lib/types';
import { Home, Briefcase, Coffee, Search, User, Pin } from 'lucide-react';

interface MapPinProps {
  category: LocationCategoryType;
  name?: string; // Optional name for tooltip or accessibility
}

const categoryStyles: Record<LocationCategoryType, { icon: JSX.Element; bgColor: string; MappedName: string }> = {
  [LocationCategory.FRIEND]: { icon: <User size={18} />, bgColor: 'bg-red-500', MappedName: "Friend's Location" },
  [LocationCategory.HOME]: { icon: <Home size={18} />, bgColor: 'bg-green-500', MappedName: "Home" },
  [LocationCategory.WORK]: { icon: <Briefcase size={18} />, bgColor: 'bg-blue-500', MappedName: "Work" },
  [LocationCategory.CAFES]: { icon: <Coffee size={18} />, bgColor: 'bg-orange-500', MappedName: "Cafe" },
  [LocationCategory.EXPLORATION]: { icon: <Search size={18} />, bgColor: 'bg-purple-500', MappedName: "Exploration" },
};

const MapPin: FC<MapPinProps> = ({ category, name }) => {
  const style = categoryStyles[category] || { icon: <Pin size={18}/>, bgColor: 'bg-gray-500', MappedName: "Location" }; // Fallback for unknown categories
  
  return (
    <div 
      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg transform hover:scale-110 transition-transform cursor-pointer ${style.bgColor}`}
      title={name || style.MappedName} // Tooltip for the pin
      aria-label={name || style.MappedName}
    >
      {style.icon}
    </div>
  );
};

export default MapPin;
