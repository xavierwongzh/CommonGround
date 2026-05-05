export type TravelMode = 'public_transport' | 'walking' | 'cycling' | 'driving';

export type TimeThreshold = 10 | 15 | 30 | 45 | 60 | 90 | 120 | 180;

export interface Location {
  id: string;
  name: string;
  address: string;
  postalCode?: string;
  lat: number;
  lng: number;
  colour: string;
  travelMode: TravelMode;
  timeThresholds: TimeThreshold[];
  isVisible: boolean;
  unavailableModes?: TravelMode[];
}

export interface IsochronePolygon {
  id: string;
  locationId: string;
  travelMode: TravelMode;
  timeThreshold: TimeThreshold;
  polygon: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
  colour: string;
  opacity: number;
  isMock?: boolean;
}

export interface PlaceResult {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  reviewCount?: number;
  googlePlaceId: string;
  insideIsochroneIds: string[];
  insideOverlap: boolean;
  estimatedTravelTime?: number;
  photoUrl?: string;
}

export interface OverlapResult {
  id: string;
  locationIds: string[];
  travelMode: TravelMode;
  timeThreshold: TimeThreshold;
  polygon: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null;
  areaSqKm: number;
  placeIdsInside: string[];
}

export interface AppState {
  locations: Location[];
  isochrones: IsochronePolygon[];
  overlapResults: OverlapResult[];
  places: PlaceResult[];
  selectedPlaceId: string | null;
  selectedCategory: string;
  showOverlap: boolean;
  globalTravelMode: TravelMode;
  useGlobalMode: boolean;
  isDarkMode: boolean;
}

export type PlaceCategory =
  | 'food'
  | 'cafe'
  | 'supermarket'
  | 'gym'
  | 'shopping_mall'
  | 'park'
  | 'library'
  | 'hotel';

export interface PlaceCategoryOption {
  value: PlaceCategory;
  label: string;
  icon: string;
  googleType: string;
  keyword?: string; // optional extra keyword to AND with the type search
}
