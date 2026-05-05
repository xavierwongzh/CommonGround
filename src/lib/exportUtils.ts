import { Location, PlaceResult } from '@/types';

export function exportLocationsJSON(locations: Location[]): void {
  const data = JSON.stringify(locations, null, 2);
  downloadFile(data, 'isochrone-locations.json', 'application/json');
}

export function exportPlacesCSV(places: PlaceResult[], locations: Location[]): void {
  const locationMap = Object.fromEntries(locations.map((l) => [l.id, l]));

  const header = [
    'Name', 'Category', 'Address', 'Rating', 'Reviews',
    'Latitude', 'Longitude', 'Starting Location', 'Travel Mode',
    'Travel Time (min)', 'Inside Overlap',
  ].join(',');

  const rows = places.map((p) => {
    const isoLocation = p.insideIsochroneIds[0]
      ? locationMap[p.insideIsochroneIds[0]?.split('-')[1]] // locationId from isoId
      : null;

    return [
      csvEscape(p.name),
      csvEscape(p.category),
      csvEscape(p.address),
      p.rating ?? '',
      p.reviewCount ?? '',
      p.lat,
      p.lng,
      csvEscape(isoLocation?.name ?? ''),
      csvEscape(isoLocation?.travelMode ?? ''),
      p.estimatedTravelTime ?? '',
      p.insideOverlap ? 'Yes' : 'No',
    ].join(',');
  });

  const csv = [header, ...rows].join('\n');
  downloadFile(csv, 'isochrone-places.csv', 'text/csv');
}

export async function exportMapImage(): Promise<void> {
  // Use browser print dialog as a simple export — Google Maps canvas is cross-origin so
  // screenshot libraries cannot capture it without a Static Maps API fallback.
  alert(
    'To save the map, use your browser\'s screenshot tool or right-click → "Save image as" on the map area.'
  );
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
