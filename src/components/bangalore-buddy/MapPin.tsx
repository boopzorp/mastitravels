
// src/components/bangalore-buddy/MapPin.tsx
"use client";

import type { FC } from 'react';
import { LocationCategory, type PredefinedLocationCategoryType } from '@/lib/types';
import { Home, Briefcase, Coffee, Search, User, Pin as DefaultPinIcon, Building, ShoppingCart, Landmark, Trees } from 'lucide-react';

interface MapPinProps {
  category: string; // Accepts any string now
  name?: string; // Optional name for tooltip or accessibility
}

// Extensible style mapping
const categoryStyles: Record<string, { icon: JSX.Element; bgColor: string; MappedName: string }> = {
  [LocationCategory.FRIEND]: { icon: <User size={18} />, bgColor: 'bg-red-500', MappedName: "Friend's Location" },
  [LocationCategory.HOME]: { icon: <Home size={18} />, bgColor: 'bg-green-500', MappedName: "Home" },
  [LocationCategory.WORK]: { icon: <Briefcase size={18} />, bgColor: 'bg-blue-500', MappedName: "Work" },
  [LocationCategory.CAFES]: { icon: <Coffee size={18} />, bgColor: 'bg-orange-500', MappedName: "Cafe" },
  [LocationCategory.EXPLORATION]: { icon: <Search size={18} />, bgColor: 'bg-purple-500', MappedName: "Exploration" },
  "Museum": { icon: <Landmark size={18} />, bgColor: 'bg-yellow-600', MappedName: "Museum" },
  "Park": { icon: <Trees size={18} />, bgColor: 'bg-lime-500', MappedName: "Park" },
  "Restaurant": { icon: <Coffee size={18} />, bgColor: 'bg-amber-500', MappedName: "Restaurant" }, // Re-using coffee for now
  "Shopping Mall": { icon: <ShoppingCart size={18} />, bgColor: 'bg-pink-500', MappedName: "Shopping Mall" },
  "Building": { icon: <Building size={18} />, bgColor: 'bg-cyan-500', MappedName: "Building" },
  // Default for unknown or custom categories
  default: { icon: <DefaultPinIcon size={18}/>, bgColor: 'bg-gray-500', MappedName: "Location" }
};

const MapPin: FC<MapPinProps> = ({ category, name }) => {
  // Attempt to find a specific style; if not found, use the default.
  // Case-insensitive matching for common predefined categories could be added here if desired.
  const style = categoryStyles[category] || categoryStyles.default;
  
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
