
export interface LatLng {
  lat: number;
  lng: number;
}

// Predefined category constants for specific location types
export const LocationCategory = {
  FRIEND: 'Friend', // Represents the friend's primary residence
  WORK: 'Work',
  HOME: 'Home', // Could represent other generic home locations if needed
  CAFES: 'Cafes', // Example of a common predefined category
  EXPLORATION: 'Exploration', // Example of another predefined category
  // Custom categories will be strings like "Museum", "Park", "Bookstore"
} as const;

// This type can be used if you want to strictly type check against PREDEFINED categories.
export type PredefinedLocationCategoryType = typeof LocationCategory[keyof typeof LocationCategory];

export interface PinnedLocation {
  id: string;
  name: string;
  description?: string;
  category: string; // Now a flexible string to store predefined or custom categories
  position: LatLng;
  address?: string;
  distance?: string;
}

// These are examples of categories you might frequently use.
// They are no longer strictly enforced by PinnedLocation.category type.
export const ExampleCategories: string[] = [
  LocationCategory.WORK,
  LocationCategory.HOME,
  LocationCategory.CAFES,
  LocationCategory.EXPLORATION,
  "Museum",
  "Park",
  "Restaurant",
  "Shopping Mall",
];
