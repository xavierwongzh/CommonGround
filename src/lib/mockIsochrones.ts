// MOCK DATA - Replace with real TravelTime API calls in production
import { IsochronePolygon, Location, TimeThreshold, TravelMode } from '@/types';

const LOCATION_COLOURS: Record<string, string[]> = {
  public_transport: ['#3B82F6', '#1D4ED8'],
  walking: ['#10B981', '#047857'],
  cycling: ['#F59E0B', '#B45309'],
  driving: ['#8B5CF6', '#5B21B6'],
};

// Creates a rough polygon around a center point scaled by minutes
function createMockPolygon(
  centerLat: number,
  centerLng: number,
  minutes: TimeThreshold,
  mode: TravelMode
): GeoJSON.Feature<GeoJSON.Polygon> {
  const speedFactor: Record<TravelMode, number> = {
    walking: 0.004,
    cycling: 0.008,
    driving: 0.018,
    public_transport: 0.012,
  };

  const base = speedFactor[mode] * minutes;
  // Slightly irregular polygon (12 points) to look realistic
  const offsets = [
    [0, 1], [0.35, 0.93], [0.71, 0.71], [0.93, 0.35],
    [1, 0], [0.93, -0.35], [0.71, -0.71], [0.35, -0.93],
    [0, -1], [-0.35, -0.93], [-0.71, -0.71], [-0.93, -0.35],
    [-1, 0], [-0.93, 0.35], [-0.71, 0.71], [-0.35, 0.93],
    [0, 1],
  ];

  // Add jitter for realism
  const jitter = () => (Math.random() - 0.5) * base * 0.25;

  const coordinates = offsets.map(([dx, dy]) => [
    centerLng + dx * base * 1.4 + jitter(),
    centerLat + dy * base + jitter(),
  ]);

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
  };
}

export function generateMockIsochrone(
  location: Location,
  travelMode: TravelMode,
  timeThreshold: TimeThreshold
): IsochronePolygon {
  const polygon = createMockPolygon(location.lat, location.lng, timeThreshold, travelMode);

  const opacityMap: Record<TimeThreshold, number> = {
    10: 0.45, 15: 0.38, 30: 0.28, 45: 0.2, 60: 0.14, 90: 0.11, 120: 0.09, 180: 0.07,
  };

  return {
    id: `iso-${location.id}-${travelMode}-${timeThreshold}`,
    locationId: location.id,
    travelMode,
    timeThreshold,
    polygon,
    colour: location.colour,
    opacity: opacityMap[timeThreshold],
    isMock: true,
  };
}

// Mock starting locations for demo
export const MOCK_LOCATIONS: Omit<Location, 'id'>[] = [
  {
    name: 'SUTD',
    address: '8 Somapah Road, Singapore 487372',
    postalCode: '487372',
    lat: 1.3415,
    lng: 103.9636,
    colour: '#3B82F6',
    travelMode: 'public_transport',
    timeThresholds: [15, 30],
    isVisible: true,
  },
  {
    name: 'Tanjong Pagar MRT',
    address: 'Tanjong Pagar MRT Station, Singapore',
    postalCode: '088540',
    lat: 1.2763,
    lng: 103.8456,
    colour: '#10B981',
    travelMode: 'public_transport',
    timeThresholds: [15, 30],
    isVisible: true,
  },
  {
    name: 'Jurong East MRT',
    address: 'Jurong East MRT Station, Singapore',
    postalCode: '609731',
    lat: 1.3332,
    lng: 103.7423,
    colour: '#F59E0B',
    travelMode: 'public_transport',
    timeThresholds: [30],
    isVisible: true,
  },
];

export const MOCK_PLACES = [
  {
    id: 'p1', name: 'Tanjong Pagar Plaza Market', category: 'food',
    address: '6 Tanjong Pagar Plaza, Singapore 081006',
    lat: 1.2769, lng: 103.8444, rating: 4.2, reviewCount: 312,
    googlePlaceId: 'mock-p1', insideIsochroneIds: [], insideOverlap: false,
  },
  {
    id: 'p2', name: 'Gymmboxx Tanjong Pagar', category: 'gym',
    address: '1 Tanjong Pagar Plaza, Singapore 082001',
    lat: 1.2757, lng: 103.8451, rating: 4.5, reviewCount: 189,
    googlePlaceId: 'mock-p2', insideIsochroneIds: [], insideOverlap: false,
  },
  {
    id: 'p3', name: 'Fairprice Finest Tanjong Pagar', category: 'supermarket',
    address: '1 Wallich Street, Singapore 078881',
    lat: 1.2759, lng: 103.8435, rating: 4.0, reviewCount: 542,
    googlePlaceId: 'mock-p3', insideIsochroneIds: [], insideOverlap: false,
  },
  {
    id: 'p4', name: 'East Coast Park', category: 'park',
    address: 'East Coast Park Service Road, Singapore',
    lat: 1.3006, lng: 103.9296, rating: 4.6, reviewCount: 2841,
    googlePlaceId: 'mock-p4', insideIsochroneIds: [], insideOverlap: false,
  },
  {
    id: 'p5', name: 'The Coffee Bean & Tea Leaf', category: 'cafe',
    address: '1 Raffles Place, Singapore 048616',
    lat: 1.2840, lng: 103.8514, rating: 4.1, reviewCount: 203,
    googlePlaceId: 'mock-p5', insideIsochroneIds: [], insideOverlap: false,
  },
];
