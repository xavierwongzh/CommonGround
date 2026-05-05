import * as turf from '@turf/turf';
import { IsochronePolygon, OverlapResult, PlaceResult, TimeThreshold, TravelMode } from '@/types';

export function calculateOverlap(
  isochrones: IsochronePolygon[],
  locationIds: string[],
  travelMode: TravelMode,
  timeThreshold: TimeThreshold
): OverlapResult | null {
  const relevant = isochrones.filter(
    (iso) =>
      locationIds.includes(iso.locationId) &&
      iso.travelMode === travelMode &&
      iso.timeThreshold === timeThreshold
  );

  if (relevant.length < 2) return null;

  try {
    let intersection: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null =
      relevant[0].polygon as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;

    for (let i = 1; i < relevant.length; i++) {
      if (!intersection) break;
      const next = relevant[i].polygon as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
      const result: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null = turf.intersect(
        turf.featureCollection([intersection, next])
      ) as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null;
      intersection = result ?? null;
    }

    if (!intersection) return null;

    const areaSqM = turf.area(intersection);
    const areaSqKm = areaSqM / 1_000_000;

    return {
      id: `overlap-${locationIds.join('-')}-${travelMode}-${timeThreshold}`,
      locationIds,
      travelMode,
      timeThreshold,
      polygon: intersection,
      areaSqKm,
      placeIdsInside: [],
    };
  } catch {
    return null;
  }
}

export function filterPlacesInsidePolygon(
  places: PlaceResult[],
  polygon: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
): PlaceResult[] {
  return places.filter((place) => {
    const point = turf.point([place.lng, place.lat]);
    try {
      return turf.booleanPointInPolygon(point, polygon);
    } catch {
      return false;
    }
  });
}

export function enrichPlacesWithIsochrones(
  places: PlaceResult[],
  isochrones: IsochronePolygon[]
): PlaceResult[] {
  return places.map((place) => {
    const point = turf.point([place.lng, place.lat]);
    const insideIsochroneIds: string[] = [];

    for (const iso of isochrones) {
      try {
        if (turf.booleanPointInPolygon(point, iso.polygon)) {
          insideIsochroneIds.push(iso.id);
        }
      } catch {
        // skip malformed polygon
      }
    }

    return { ...place, insideIsochroneIds };
  });
}

export function computeUnion(
  isochrones: IsochronePolygon[]
): GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null {
  if (isochrones.length === 0) return null;

  try {
    const features = isochrones.map(
      (iso) => iso.polygon as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
    );
    const collection = turf.featureCollection(features);
    return turf.union(collection);
  } catch {
    return null;
  }
}

export function polygonAreaSqKm(
  polygon: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
): number {
  return turf.area(polygon) / 1_000_000;
}
