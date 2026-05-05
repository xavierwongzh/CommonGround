'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { reverseGeocode } from '@/lib/geocoding';
import { SINGAPORE_CENTER } from '@/lib/singaporeBounds';
import { OVERLAP_COLOUR } from '@/lib/colours';
import { CATEGORY_MAP } from '@/lib/placesCategories';
import { IsochronePolygon, Location, OverlapResult, PlaceResult } from '@/types';
import { Legend } from './Legend';
import { cn } from './ui/cn';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

declare global {
  interface Window {
    initGoogleMaps?: () => void;
  }
}

interface MapHandles {
  map: google.maps.Map | null;
  markers: Map<string, google.maps.Marker>;
  polygons: Map<string, google.maps.Polygon[]>;
  overlapPolygons: Map<string, google.maps.Polygon>;
  placeMarkers: Map<string, google.maps.Marker>; // keyed by place.id
  infoWindow: google.maps.InfoWindow | null;
}

export function MapView() {
  const { state, addLocation, showToast, setSelectedPlace } = useApp();
  const dark = state.isDarkMode;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const handles = useRef<MapHandles>({
    map: null,
    markers: new Map(),
    polygons: new Map(),
    overlapPolygons: new Map(),
    placeMarkers: new Map(),
    infoWindow: null,
  });
  const prevLocCountRef = useRef(0);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) { setMapsLoaded(true); return; }
    if (document.getElementById('gm-script')) return;

    window.initGoogleMaps = () => setMapsLoaded(true);
    const script = document.createElement('script');
    script.id = 'gm-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&callback=initGoogleMaps&loading=async`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

  // Initialise map
  useEffect(() => {
    if (!mapsLoaded || !mapContainerRef.current || handles.current.map) return;

    const map = new google.maps.Map(mapContainerRef.current, {
      center: SINGAPORE_CENTER,
      zoom: 12,
      minZoom: 2,
      maxZoom: 18,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: dark ? DARK_MAP_STYLES : [],
    });

    handles.current.map = map;
    handles.current.infoWindow = new google.maps.InfoWindow();

    // Shift+click on map to add location (plain click is reserved for panning)
    map.addListener('click', async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      const domEvent = e.domEvent as MouseEvent;
      if (!domEvent.shiftKey) return;
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();

      try {
        const result = await reverseGeocode(lat, lng);
        addLocation({
          name: result.postalCode ? `S${result.postalCode}` : 'Pinned Location',
          address: result.formattedAddress,
          postalCode: result.postalCode,
          lat,
          lng,
          travelMode: state.globalTravelMode,
          timeThresholds: [30],
          isVisible: true,
        });
      } catch {
        showToast('Unable to identify location. Please try again.', 'error');
      }
    });
  }, [mapsLoaded, addLocation, showToast, state.globalTravelMode, dark]);

  // Update dark mode styles
  useEffect(() => {
    if (!handles.current.map) return;
    handles.current.map.setOptions({ styles: dark ? DARK_MAP_STYLES : [] });
  }, [dark]);

  // Auto-pan / fit bounds when locations are added
  useEffect(() => {
    if (!handles.current.map || !mapsLoaded) return;
    const map = handles.current.map;
    const visibleLocs = state.locations.filter((l) => l.isVisible);
    const count = visibleLocs.length;

    // Only act when a location was just added (count went up)
    if (count === 0 || count <= prevLocCountRef.current) {
      prevLocCountRef.current = count;
      return;
    }
    prevLocCountRef.current = count;

    if (count === 1) {
      map.panTo({ lat: visibleLocs[0].lat, lng: visibleLocs[0].lng });
      map.setZoom(13);
      return;
    }

    // 2+ locations: fit bounds to all pins + any isochrones already on map
    fitMapToContent(map, state.locations, state.isochrones);
  }, [state.locations, mapsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-fit when isochrones are generated (so the polygon area is fully visible)
  useEffect(() => {
    if (!handles.current.map || !mapsLoaded || state.locations.length < 1) return;
    // Only re-fit when isochrones exist for more than one location (multi-location view)
    const locationIds = new Set(state.isochrones.map((i) => i.locationId));
    if (locationIds.size < 2) return;
    fitMapToContent(handles.current.map, state.locations, state.isochrones);
  }, [state.isochrones.length, mapsLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync location markers
  useEffect(() => {
    if (!handles.current.map || !mapsLoaded) return;
    const { map, markers } = handles.current;

    // Remove markers for deleted locations
    const currentIds = new Set(state.locations.map((l: Location) => l.id));
    markers.forEach((marker, id) => {
      if (!currentIds.has(id)) { marker.setMap(null); markers.delete(id); }
    });

    // Add/update markers
    state.locations.forEach((loc: Location) => {
      if (markers.has(loc.id)) {
        const m = markers.get(loc.id)!;
        m.setVisible(loc.isVisible);
        return;
      }

      const marker = new google.maps.Marker({
        position: { lat: loc.lat, lng: loc.lng },
        map: map!,
        title: loc.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: loc.colour,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2.5,
        },
        visible: loc.isVisible,
        animation: google.maps.Animation.DROP,
      });

      marker.addListener('click', () => {
        handles.current.infoWindow?.setContent(`
          <div style="padding:8px;max-width:200px;font-family:system-ui">
            <p style="font-weight:600;margin:0 0 4px">${loc.name}</p>
            <p style="font-size:12px;color:#666;margin:0">${loc.address}</p>
            ${loc.postalCode ? `<p style="font-size:11px;color:#888;margin:4px 0 0">S${loc.postalCode}</p>` : ''}
          </div>
        `);
        handles.current.infoWindow?.open(map!, marker);
      });

      markers.set(loc.id, marker);
    });
  }, [state.locations, mapsLoaded]);

  // Sync isochrone polygons
  useEffect(() => {
    if (!handles.current.map || !mapsLoaded) return;
    const { map, polygons } = handles.current;

    // Clear all existing
    polygons.forEach((polys) => polys.forEach((p) => p.setMap(null)));
    polygons.clear();

    state.isochrones.forEach((iso: IsochronePolygon) => {
      const loc = state.locations.find((l: Location) => l.id === iso.locationId);
      if (!loc?.isVisible) return;

      const paths = geojsonToPaths(iso.polygon);
      const polys = paths.map((path) =>
        new google.maps.Polygon({
          paths: path,
          map: map!,
          fillColor: iso.colour,
          fillOpacity: iso.opacity,
          strokeColor: iso.colour,
          strokeOpacity: 0.8,
          strokeWeight: 1.5,
          clickable: false,
        })
      );
      polygons.set(iso.id, polys);
    });
  }, [state.isochrones, state.locations, mapsLoaded]);

  // Sync overlap polygons
  useEffect(() => {
    if (!handles.current.map || !mapsLoaded) return;
    const { map, overlapPolygons } = handles.current;

    overlapPolygons.forEach((p) => p.setMap(null));
    overlapPolygons.clear();

    if (!state.showOverlap) return;

    state.overlapResults.forEach((overlap: OverlapResult) => {
      if (!overlap.polygon) return;
      const paths = geojsonToPaths(overlap.polygon);
      paths.forEach((path, i) => {
        const poly = new google.maps.Polygon({
          paths: path,
          map: map!,
          fillColor: OVERLAP_COLOUR,
          fillOpacity: 0.35,
          strokeColor: OVERLAP_COLOUR,
          strokeOpacity: 0.9,
          strokeWeight: 2,
          clickable: false,
        });
        overlapPolygons.set(`${overlap.id}-${i}`, poly);
      });
    });
  }, [state.overlapResults, state.showOverlap, mapsLoaded]);

  // Sync place markers
  useEffect(() => {
    if (!handles.current.map || !mapsLoaded) return;
    const { map, placeMarkers, infoWindow } = handles.current;

    placeMarkers.forEach((m) => m.setMap(null));
    handles.current.placeMarkers = new Map();

    state.places.forEach((place: PlaceResult) => {
      const marker = new google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map: map!,
        title: place.name,
        icon: placeIcon(
          CATEGORY_MAP[place.category as keyof typeof CATEGORY_MAP]?.icon ?? '📍',
          place.insideOverlap
        ),
      });

      marker.addListener('click', () => {
        setSelectedPlace(place.id);
        openPlaceInfoWindow(place, marker, map!, infoWindow);
      });

      handles.current.placeMarkers.set(place.id, marker);
    });
  }, [state.places, mapsLoaded, setSelectedPlace]);

  // Sidebar click → pan map and open info window for the selected place
  useEffect(() => {
    if (!mapsLoaded || !state.selectedPlaceId) return;
    const { map, placeMarkers, infoWindow } = handles.current;
    const marker = placeMarkers.get(state.selectedPlaceId);
    if (!marker || !map) return;

    const place = state.places.find((p) => p.id === state.selectedPlaceId);
    if (!place) return;

    map.panTo({ lat: place.lat, lng: place.lng });
    openPlaceInfoWindow(place, marker, map, infoWindow);
  }, [state.selectedPlaceId, mapsLoaded, state.places]);

  return (
    <div className="relative flex-1 overflow-hidden" id="google-map-container">
      <div ref={mapContainerRef} className="absolute inset-0" />

      {!mapsLoaded && (
        <div className={cn(
          'absolute inset-0 flex flex-col items-center justify-center gap-3',
          dark ? 'bg-gray-900' : 'bg-gray-100'
        )}>
          <div className="w-10 h-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          <p className={cn('text-sm', dark ? 'text-gray-400' : 'text-gray-500')}>
            {GOOGLE_MAPS_API_KEY ? 'Loading map…' : 'Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local'}
          </p>
        </div>
      )}

      {mapsLoaded && <Legend />}

      {/* Shift+click hint */}
      {mapsLoaded && (
        <div className={cn(
          'absolute bottom-4 right-4 text-[11px] px-2.5 py-1.5 rounded-lg border pointer-events-none',
          dark
            ? 'bg-gray-900/80 border-gray-700 text-gray-400'
            : 'bg-white/80 border-gray-200 text-gray-500'
        )}>
          ⇧ Shift+click anywhere to pin
        </div>
      )}
    </div>
  );
}

function fitMapToContent(
  map: google.maps.Map,
  locations: Location[],
  isochrones: IsochronePolygon[]
) {
  const bounds = new google.maps.LatLngBounds();
  let hasPoints = false;

  locations.forEach((loc) => {
    if (!loc.isVisible) return;
    bounds.extend({ lat: loc.lat, lng: loc.lng });
    hasPoints = true;
  });

  // Extend bounds to cover isochrone polygons
  isochrones.forEach((iso) => {
    const loc = locations.find((l) => l.id === iso.locationId);
    if (!loc?.isVisible) return;
    try {
      const coords = iso.polygon.geometry.type === 'Polygon'
        ? iso.polygon.geometry.coordinates[0]
        : iso.polygon.geometry.coordinates.flat(2);
      (coords as number[][]).forEach(([lng, lat]) => {
        bounds.extend({ lat, lng });
        hasPoints = true;
      });
    } catch { /* skip malformed */ }
  });

  if (!hasPoints) return;
  map.fitBounds(bounds, 80); // 80px padding
}

function placeIcon(emoji: string, insideOverlap: boolean): google.maps.Icon {
  const border = insideOverlap ? OVERLAP_COLOUR : '#FF9500';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="34" height="38" viewBox="0 0 34 38">
    <!-- pin body -->
    <path d="M17 0 C8 0 1 7 1 16 C1 25 17 38 17 38 C17 38 33 25 33 16 C33 7 26 0 17 0Z"
          fill="white" stroke="${border}" stroke-width="2.5"/>
    <!-- emoji -->
    <text x="17" y="22" text-anchor="middle" dominant-baseline="middle"
          font-size="15" font-family="Apple Color Emoji,Segoe UI Emoji,sans-serif">${emoji}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(34, 38) as google.maps.Size,
    anchor: new google.maps.Point(17, 38) as google.maps.Point,
  };
}

function openPlaceInfoWindow(
  place: PlaceResult,
  marker: google.maps.Marker,
  map: google.maps.Map,
  infoWindow: google.maps.InfoWindow | null
) {
  const mapsUrl = place.googlePlaceId
    ? `https://www.google.com/maps/place/?q=place_id:${place.googlePlaceId}`
    : `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

  infoWindow?.setContent(`
    <div style="font-family:system-ui;width:240px;overflow:hidden;border-radius:4px">
      ${place.photoUrl
        ? `<img src="${place.photoUrl}" alt="${place.name}"
               style="width:100%;height:130px;object-fit:cover;display:block;margin-bottom:8px;border-radius:4px 4px 0 0" />`
        : ''}
      <div style="padding:${place.photoUrl ? '0 8px 8px' : '8px'}">
        <p style="font-weight:600;margin:0 0 3px;font-size:13px">${place.name}</p>
        <p style="font-size:11px;color:#888;margin:0 0 3px;text-transform:capitalize">${place.category.replace('_', ' ')}</p>
        <p style="font-size:11px;color:#666;margin:0 0 4px">${place.address}</p>
        ${place.rating ? `<p style="font-size:11px;margin:0 0 6px">⭐ ${place.rating.toFixed(1)} <span style="color:#999">(${(place.reviewCount ?? 0).toLocaleString()} reviews)</span></p>` : ''}
        ${place.insideOverlap ? '<p style="font-size:10px;color:#FF6B6B;margin:0 0 6px">✦ Inside overlap zone</p>' : ''}
        <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer"
           style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#1a73e8;text-decoration:none;padding:4px 8px;border:1px solid #1a73e8;border-radius:6px">
          ↗ Open in Google Maps
        </a>
      </div>
    </div>
  `);
  infoWindow?.open(map, marker);
}

function geojsonToPaths(
  feature: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>
): google.maps.LatLngLiteral[][] {
  const { geometry } = feature;
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map((ring) =>
      ring.map(([lng, lat]) => ({ lat, lng }))
    );
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flatMap((poly) =>
      poly.map((ring) => ring.map(([lng, lat]) => ({ lat, lng })))
    );
  }
  return [];
}

const DARK_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a1a2e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2d44' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'transit.station', elementType: 'labels.icon', stylers: [{ visibility: 'on' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2e1a' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#6b7a8d' }] },
];
