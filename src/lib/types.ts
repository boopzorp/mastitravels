export interface LatLng {
  lat: number;
  lng: number;
}

export const LocationCategory = {
  FRIEND: 'Friend',
  WORK: 'Work',
  HOME: 'Home',
  CAFES: 'Cafes',
  EXPLORATION: 'Exploration',
} as const;

export type LocationCategoryType = typeof LocationCategory[keyof typeof LocationCategory];

export interface PinnedLocation {
  id: string;
  name: string;
  description?: string;
  category: LocationCategoryType;
  position: LatLng;
  address?: string; 
  distance?: string; 
}

export const DefaultLocationCategories: LocationCategoryType[] = [
  LocationCategory.WORK,
  LocationCategory.HOME,
  LocationCategory.CAFES,
  LocationCategory.EXPLORATION,
];
