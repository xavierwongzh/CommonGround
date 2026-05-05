// TravelTime API integration
// Docs: https://docs.traveltime.com/api/reference/isochrones
import { IsochronePolygon, Location, TimeThreshold, TravelMode } from '@/types';
import { generateMockIsochrone } from './mockIsochrones';

const TRAVELTIME_BASE = 'https://api.traveltimeapp.com';

// Thrown when the API has no transit data for the requested location/mode.
// Caught in generateIsochrone to mark the mode as unavailable on the location.
export class TransitUnavailableError extends Error {
  constructor(msg = 'Public transport data is not available for this location.') {
    super(msg);
    this.name = 'TransitUnavailableError';
  }
}

export async function fetchIsochrone(
  location: Location,
  travelMode: TravelMode,
  timeThreshold: TimeThreshold
): Promise<IsochronePolygon> {

  const appId = process.env.NEXT_PUBLIC_TRAVELTIME_APP_ID;
  const apiKey = process.env.NEXT_PUBLIC_TRAVELTIME_API_KEY;

  if (!appId || !apiKey) {
    console.warn('[traveltime] API keys not set — using mock isochrone');
    return generateMockIsochrone(location, travelMode, timeThreshold);
  }

  const body = {
    departure_searches: [
      {
        id: `${location.id}-${travelMode}-${timeThreshold}`,
        coords: { lat: location.lat, lng: location.lng },
        transportation: { type: travelMode },
        departure_time: new Date().toISOString(),
        travel_time: timeThreshold * 60,
        properties: ['is_only_walking'],
      },
    ],
  };

  const res = await fetch(`${TRAVELTIME_BASE}/v4/time-map`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Application-Id': appId,
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errMsg = `TravelTime API error: ${res.status}`;
    try {
      const errData = await res.json();
      errMsg = errData.description ?? errData.message ?? errMsg;
    } catch { /* ignore parse error */ }

    // 422 or messages about missing transit data → mark as unavailable
    if (
      res.status === 422 ||
      errMsg.toLowerCase().includes('transport') ||
      errMsg.toLowerCase().includes('no data') ||
      errMsg.toLowerCase().includes('not supported')
    ) {
      throw new TransitUnavailableError(errMsg);
    }

    throw new Error(errMsg);
  }

  const data = await res.json();
  const search = data.results?.[0];

  // Empty shapes array = API has no transit coverage here
  if (!search || !search.shapes || search.shapes.length === 0) {
    if (travelMode === 'public_transport') {
      throw new TransitUnavailableError();
    }
    throw new Error('TravelTime returned an empty isochrone.');
  }

  const geojson: GeoJSON.Feature<GeoJSON.MultiPolygon> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiPolygon',
      coordinates: search.shapes.map(
        (s: { shell: { lat: number; lng: number }[]; holes: { lat: number; lng: number }[][] }) => {
          const shell = s.shell.map((p: { lat: number; lng: number }) => [p.lng, p.lat]);
          const holes = (s.holes || []).map((h: { lat: number; lng: number }[]) =>
            h.map((p: { lat: number; lng: number }) => [p.lng, p.lat])
          );
          return [shell, ...holes];
        }
      ),
    },
  };

  const opacityMap: Record<TimeThreshold, number> = {
    10: 0.45, 15: 0.38, 30: 0.28, 45: 0.2, 60: 0.14, 90: 0.11, 120: 0.09, 180: 0.07,
  };

  return {
    id: `iso-${location.id}-${travelMode}-${timeThreshold}`,
    locationId: location.id,
    travelMode,
    timeThreshold,
    polygon: geojson,
    colour: location.colour,
    opacity: opacityMap[timeThreshold],
  };
}
