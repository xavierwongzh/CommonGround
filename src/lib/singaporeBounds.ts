export const SINGAPORE_BOUNDS = {
  north: 1.47,
  south: 1.15,
  east: 104.13,
  west: 103.59,
};

export const SINGAPORE_CENTER = { lat: 1.2897, lng: 103.8501 };

export const SINGAPORE_MAP_OPTIONS: google.maps.MapOptions = {
  center: SINGAPORE_CENTER,
  zoom: 12,
  restriction: {
    latLngBounds: SINGAPORE_BOUNDS,
    strictBounds: false,
  },
  minZoom: 10,
  maxZoom: 18,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  zoomControlOptions: {
    position: 9, // RIGHT_CENTER
  },
};

export function isWithinSingapore(lat: number, lng: number): boolean {
  return (
    lat >= SINGAPORE_BOUNDS.south &&
    lat <= SINGAPORE_BOUNDS.north &&
    lng >= SINGAPORE_BOUNDS.west &&
    lng <= SINGAPORE_BOUNDS.east
  );
}

export function clampToSingapore(lat: number, lng: number): { lat: number; lng: number } {
  return {
    lat: Math.max(SINGAPORE_BOUNDS.south, Math.min(SINGAPORE_BOUNDS.north, lat)),
    lng: Math.max(SINGAPORE_BOUNDS.west, Math.min(SINGAPORE_BOUNDS.east, lng)),
  };
}
