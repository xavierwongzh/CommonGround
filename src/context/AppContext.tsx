'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  AppState, IsochronePolygon, Location, OverlapResult,
  PlaceResult, TimeThreshold, TravelMode,
} from '@/types';
import * as turf from '@turf/turf';
import { getNextColour } from '@/lib/colours';
import { fetchIsochrone, TransitUnavailableError } from '@/lib/traveltime';
import { calculateOverlap } from '@/lib/polygonUtils';
import { PLACE_CATEGORIES } from '@/lib/placesCategories';

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface AppContextValue {
  state: AppState;
  toasts: Toast[];
  loadingIds: Set<string>;
  addLocation: (loc: Omit<Location, 'id' | 'colour'>) => void;
  removeLocation: (id: string) => void;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  toggleLocationVisibility: (id: string) => void;
  generateIsochrone: (locationId: string) => Promise<void>;
  clearAllLocations: () => void;
  setShowOverlap: (show: boolean) => void;
  setGlobalTravelMode: (mode: TravelMode) => void;
  setUseGlobalMode: (use: boolean) => void;
  setSelectedPlace: (id: string | null) => void;
  setSelectedCategory: (cat: string) => void;
  searchPlaces: (category: string, keyword?: string) => void;
  clearPlaces: () => void;
  toggleDarkMode: () => void;
  showToast: (message: string, type?: Toast['type']) => void;
  dismissToast: (id: string) => void;
}

const initialState: AppState = {
  locations: [],
  isochrones: [],
  overlapResults: [],
  places: [],
  selectedPlaceId: null,
  selectedCategory: 'food',
  showOverlap: true,
  globalTravelMode: 'public_transport',
  useGlobalMode: true,
  isDarkMode: false,
};

function recomputeOverlaps(
  isochrones: IsochronePolygon[],
  locationIds: string[]
): OverlapResult[] {
  if (locationIds.length < 2) return [];
  const results: OverlapResult[] = [];
  const modes = [...new Set(isochrones.map((i) => i.travelMode))];
  const thresholds = [...new Set(isochrones.map((i) => i.timeThreshold))];
  for (const m of modes) {
    for (const t of thresholds) {
      const overlap = calculateOverlap(isochrones, locationIds, m, t);
      if (overlap) results.push(overlap);
    }
  }
  return results;
}

const STORAGE_KEY = 'isochrone-explorer-sg';

interface PersistedState {
  locations: Location[];
  globalTravelMode: TravelMode;
  useGlobalMode: boolean;
  showOverlap: boolean;
  isDarkMode: boolean;
  selectedCategory: string;
}

function loadFromStorage(): PersistedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    // Enforce single time band per location (sanitise pre-single-select saved data)
    if (Array.isArray(parsed.locations)) {
      parsed.locations = parsed.locations.map((loc) => ({
        ...loc,
        timeThresholds: Array.isArray(loc.timeThresholds) && loc.timeThresholds.length > 0
          ? [loc.timeThresholds[0]]
          : [30],
      }));
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(s: AppState) {
  if (typeof window === 'undefined') return;
  const persisted: PersistedState = {
    locations: s.locations,
    globalTravelMode: s.globalTravelMode,
    useGlobalMode: s.useGlobalMode,
    showOverlap: s.showOverlap,
    isDarkMode: s.isDarkMode,
    selectedCategory: s.selectedCategory,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  // Always-current ref so callbacks don't close over stale state
  const stateRef = useRef<AppState>(initialState);
  stateRef.current = state;

  // Debounce per-location to avoid firing on every rapid threshold toggle
  const debounceRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Monotonically increasing ID — stale place-search callbacks check this before writing state
  const searchIdRef = useRef(0);

  // Restore from localStorage on mount, then re-generate all isochrones
  useEffect(() => {
    const saved = loadFromStorage();
    if (!saved) return;
    const merged: AppState = { ...initialState, ...saved };
    stateRef.current = merged;
    setState(merged);
    if (saved.locations.length > 0) {
      // generateIsochrone is defined below but stable — schedule after render
      setTimeout(() => {
        saved.locations.forEach((loc) => generateIsochrone(loc.id));
      }, 0);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist relevant state whenever it changes
  useEffect(() => {
    saveToStorage(state);
  }, [
    state.locations,
    state.globalTravelMode,
    state.useGlobalMode,
    state.showOverlap,
    state.isDarkMode,
    state.selectedCategory,
  ]);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Core generation — reads from stateRef so it's never stale
  const generateIsochrone = useCallback(async (locationId: string) => {
    const s = stateRef.current;
    const loc = s.locations.find((l) => l.id === locationId);
    if (!loc) return;

    const mode = s.useGlobalMode ? s.globalTravelMode : loc.travelMode;
    const thresholds: TimeThreshold[] = loc.timeThresholds.length > 0 ? loc.timeThresholds : [30];
    const loadKey = `${locationId}-generating`;

    setLoadingIds((prev) => new Set(prev).add(loadKey));

    try {
      const newIsochrones = await Promise.all(
        thresholds.map((t) => fetchIsochrone(loc, mode, t))
      );

      setState((prev) => {
        // Remove ALL isochrones for this location, then add fresh ones
        const filtered = prev.isochrones.filter((iso) => iso.locationId !== locationId);
        const combined = [...filtered, ...newIsochrones];
        const overlapResults = recomputeOverlaps(combined, prev.locations.map((l) => l.id));
        return { ...prev, isochrones: combined, overlapResults };
      });
    } catch (err) {
      if (err instanceof TransitUnavailableError) {
        // Mark public_transport as unavailable for this location so the UI can reflect it
        setState((prev) => ({
          ...prev,
          locations: prev.locations.map((l) =>
            l.id === locationId
              ? {
                  ...l,
                  unavailableModes: [...new Set([...(l.unavailableModes ?? []), 'public_transport' as const])],
                  // Auto-switch to walking if they were on public_transport
                  travelMode: l.travelMode === 'public_transport' ? 'walking' : l.travelMode,
                }
              : l
          ),
        }));
        showToast('Public transport data is not available for this location.', 'info');
      } else {
        showToast(
          err instanceof Error ? err.message : 'Unable to generate isochrone. Please try again.',
          'error'
        );
      }
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(loadKey);
        return next;
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // ↑ intentionally empty — we read stateRef, not closed-over state

  // Debounced wrapper (used for threshold toggles)
  const scheduleGeneration = useCallback((locationId: string, delayMs = 500) => {
    const existing = debounceRef.current.get(locationId);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      debounceRef.current.delete(locationId);
      generateIsochrone(locationId);
    }, delayMs);
    debounceRef.current.set(locationId, t);
  }, [generateIsochrone]);

  const addLocation = useCallback((loc: Omit<Location, 'id' | 'colour'>) => {
    const id = `loc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const colour = getNextColour(stateRef.current.locations.map((l) => l.colour));
    const newLoc: Location = { ...loc, id, colour };

    // Optimistically update ref so generateIsochrone can read the new location immediately
    stateRef.current = {
      ...stateRef.current,
      locations: [...stateRef.current.locations, newLoc],
    };
    setState((prev) => ({ ...prev, locations: [...prev.locations, newLoc] }));

    // Auto-generate right away (no debounce on add)
    generateIsochrone(id);
  }, [generateIsochrone]);

  const removeLocation = useCallback((id: string) => {
    // Cancel any pending debounced generation
    const pending = debounceRef.current.get(id);
    if (pending) { clearTimeout(pending); debounceRef.current.delete(id); }

    // Invalidate any in-flight place search so its callback won't write stale results
    searchIdRef.current += 1;

    setState((prev) => {
      const newLocations = prev.locations.filter((l) => l.id !== id);
      const newIsochrones = prev.isochrones.filter((iso) => iso.locationId !== id);
      return {
        ...prev,
        locations: newLocations,
        isochrones: newIsochrones,
        overlapResults: recomputeOverlaps(newIsochrones, newLocations.map((l) => l.id)),
        places: [],
      };
    });
  }, []);

  const updateLocation = useCallback((id: string, updates: Partial<Location>) => {
    // Optimistically update ref so generateIsochrone sees latest values
    stateRef.current = {
      ...stateRef.current,
      locations: stateRef.current.locations.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    };
    setState((prev) => ({
      ...prev,
      locations: prev.locations.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));

    // Re-generate when mode or time bands change (debounced for rapid toggles)
    if (updates.travelMode !== undefined || updates.timeThresholds !== undefined) {
      scheduleGeneration(id);
    }
  }, [scheduleGeneration]);

  const toggleLocationVisibility = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      locations: prev.locations.map((l) =>
        l.id === id ? { ...l, isVisible: !l.isVisible } : l
      ),
    }));
  }, []);

  const clearAllLocations = useCallback(() => {
    debounceRef.current.forEach(clearTimeout);
    debounceRef.current.clear();
    setState((prev) => ({ ...prev, locations: [], isochrones: [], overlapResults: [], places: [] }));
  }, []);

  const setShowOverlap = useCallback((show: boolean) => {
    setState((prev) => ({ ...prev, showOverlap: show }));
  }, []);

  const setGlobalTravelMode = useCallback((mode: TravelMode) => {
    // Update ref before triggering generation
    stateRef.current = { ...stateRef.current, globalTravelMode: mode };
    setState((prev) => ({ ...prev, globalTravelMode: mode }));

    // Re-generate all visible locations when in global mode
    if (stateRef.current.useGlobalMode) {
      stateRef.current.locations.forEach((loc) => {
        if (loc.isVisible && loc.timeThresholds.length > 0) {
          generateIsochrone(loc.id);
        }
      });
    }
  }, [generateIsochrone]);

  const setUseGlobalMode = useCallback((use: boolean) => {
    stateRef.current = { ...stateRef.current, useGlobalMode: use };
    setState((prev) => ({ ...prev, useGlobalMode: use }));

    // Re-generate all with the newly active mode settings
    stateRef.current.locations.forEach((loc) => {
      if (loc.isVisible && loc.timeThresholds.length > 0) {
        generateIsochrone(loc.id);
      }
    });
  }, [generateIsochrone]);

  const setSelectedPlace = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, selectedPlaceId: id }));
  }, []);

  const setSelectedCategory = useCallback((cat: string) => {
    setState((prev) => ({ ...prev, selectedCategory: cat }));
  }, []);

  const searchPlaces = useCallback((category: string, keyword?: string) => {
    if (typeof window === 'undefined' || !window.google?.maps?.places) {
      showToast('Google Maps not ready yet.', 'error');
      return;
    }

    // Stamp this search — any callback that sees a different stamp is stale and must not write state
    const mySearchId = ++searchIdRef.current;
    const isStale = () => searchIdRef.current !== mySearchId;

    const s = stateRef.current;
    const visibleIsochrones = s.isochrones.filter((iso) => {
      const loc = s.locations.find((l) => l.id === iso.locationId);
      return loc?.isVisible;
    });

    if (visibleIsochrones.length === 0) {
      showToast('Generate isochrones first to search for places.', 'info');
      return;
    }

    // Determine the spatial filter polygon
    // 1 location → use its isochrone
    // 2+ locations → use overlap + 300m buffer
    let searchPolygon: GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon> | null = null;
    const multiLocation = s.locations.filter((l) => l.isVisible).length >= 2;

    if (!multiLocation) {
      searchPolygon = visibleIsochrones[0].polygon as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
    } else {
      const overlap = s.overlapResults[0];
      if (!overlap?.polygon) {
        showToast('No overlap area found. Make sure both locations have isochrones.', 'info');
        return;
      }
      try {
        searchPolygon = turf.buffer(
          overlap.polygon as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>,
          0.3,
          { units: 'kilometers' }
        ) as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
      } catch {
        searchPolygon = overlap.polygon as GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon>;
      }
    }

    if (!searchPolygon) return;

    // Derive center + radius for the Places nearbySearch call
    const centroid = turf.centroid(searchPolygon);
    const bbox = turf.bbox(searchPolygon);
    const diagKm = turf.distance(
      turf.point([bbox[0], bbox[1]]),
      turf.point([bbox[2], bbox[3]])
    );
    const radiusM = Math.min((diagKm / 2) * 1000 * 1.3, 5000);

    const catOption = PLACE_CATEGORIES.find((c) => c.value === category);
    const googleType = catOption?.googleType ?? 'establishment';

    const service = new google.maps.places.PlacesService(document.createElement('div'));
    setState((prev) => ({ ...prev, places: [] }));

    const poly = searchPolygon;
    const seenIds = new Set<string>();
    const accumulated: google.maps.places.PlaceResult[] = [];

    const searchBase = {
      location: {
        lat: centroid.geometry.coordinates[1],
        lng: centroid.geometry.coordinates[0],
      },
      radius: radiusM,
    };

    const filterAndCommit = () => {
      if (isStale()) return; // a newer search has started — discard these results
      const filtered: PlaceResult[] = accumulated
        .filter((place) => {
          if (!place.geometry?.location) return false;
          // Type-guard: ensure this place's primary types include the requested type
          // (prevents interior design / unrelated places appearing under 'food')
          // Skip strict type guard when user supplied a free-text keyword
          if (!keyword && place.types && googleType !== 'establishment') {
            if (category === 'food') {
              const foodTypes = ['restaurant','food','meal_takeaway','meal_delivery','cafe','bakery','bar'];
              if (!place.types.some((t) => foodTypes.includes(t))) return false;
            } else {
              if (!place.types.includes(googleType)) return false;
            }
          }
          const pt = turf.point([
            place.geometry.location.lng(),
            place.geometry.location.lat(),
          ]);
          try { return turf.booleanPointInPolygon(pt, poly!); }
          catch { return true; }
        })
        .map((place) => ({
          id: place.place_id ?? Math.random().toString(36).slice(2),
          name: place.name ?? 'Unknown',
          category,
          address: place.vicinity ?? '',
          lat: place.geometry!.location!.lat(),
          lng: place.geometry!.location!.lng(),
          rating: place.rating,
          reviewCount: place.user_ratings_total,
          googlePlaceId: place.place_id ?? '',
          insideIsochroneIds: [],
          insideOverlap: multiLocation,
          photoUrl: place.photos?.[0]?.getUrl({ maxWidth: 600, maxHeight: 400 }),
        }));

      // Sort by weighted score: rating × log10(reviewCount + 10)
      // Balances quality (rating) with credibility (review volume)
      const scored = filtered.sort((a, b) => {
        const score = (r: PlaceResult) =>
          (r.rating ?? 0) * Math.log10((r.reviewCount ?? 0) + 10);
        return score(b) - score(a);
      });

      setState((prev) => ({ ...prev, places: scored }));
      if (scored.length === 0) {
        showToast('No places found inside the reachable area.', 'info');
      } else {
        showToast(`Found ${scored.length} places.`, 'success');
      }
    };

    const handlePage = (
      results: google.maps.places.PlaceResult[] | null,
      status: string,
      pagination: google.maps.places.PlaceSearchPagination | null,
      onDone?: () => void
    ) => {
      if (isStale()) return; // superseded by a newer search
      if (
        status !== google.maps.places.PlacesServiceStatus.OK &&
        status !== google.maps.places.PlacesServiceStatus.ZERO_RESULTS
      ) {
        showToast('Places search failed. Check your Google Places API key.', 'error');
        onDone?.();
        return;
      }
      if (results) {
        results.forEach((r) => {
          if (r.place_id && !seenIds.has(r.place_id)) {
            seenIds.add(r.place_id);
            accumulated.push(r);
          }
        });
      }
      if (pagination?.hasNextPage && accumulated.length < 60) {
        setTimeout(() => pagination.nextPage(), 2000);
      } else {
        onDone ? onDone() : filterAndCommit();
      }
    };

    if (keyword) {
      // Free-text keyword search — no type restriction, single pass
      service.nearbySearch(
        { ...searchBase, keyword },
        (results, status, pagination) => handlePage(results, status, pagination)
      );
    } else if (category === 'food') {
      // Two passes: restaurants first, then hawker/kopitiam keyword
      service.nearbySearch(
        { ...searchBase, type: 'restaurant' },
        (results, status, pagination) =>
          handlePage(results, status, pagination, () => {
            service.nearbySearch(
              { ...searchBase, keyword: 'hawker centre kopitiam food court' },
              (r2, s2, p2) => handlePage(r2, s2, p2)
            );
          })
      );
    } else {
      const extraKeyword = catOption?.keyword;
      service.nearbySearch(
        {
          ...searchBase,
          type: googleType,
          ...(extraKeyword ? { keyword: extraKeyword } : {}),
        },
        (results, status, pagination) => handlePage(results, status, pagination)
      );
    }
  }, [showToast]);

  const clearPlaces = useCallback(() => {
    setState((prev) => ({ ...prev, places: [] }));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setState((prev) => ({ ...prev, isDarkMode: !prev.isDarkMode }));
  }, []);

  const value: AppContextValue = {
    state, toasts, loadingIds,
    addLocation, removeLocation, updateLocation, toggleLocationVisibility,
    generateIsochrone, clearAllLocations,
    setShowOverlap, setGlobalTravelMode, setUseGlobalMode,
    setSelectedPlace, setSelectedCategory, searchPlaces, clearPlaces,
    toggleDarkMode, showToast, dismissToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
