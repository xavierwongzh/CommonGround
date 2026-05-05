import { PlaceCategoryOption } from '@/types';

export const PLACE_CATEGORIES: PlaceCategoryOption[] = [
  { value: 'food',         label: 'Food & Dining',    icon: '🍜', googleType: 'restaurant' },
  { value: 'cafe',         label: 'Cafes',            icon: '☕', googleType: 'cafe' },
  { value: 'supermarket',  label: 'Supermarkets',     icon: '🛒', googleType: 'supermarket' },
  { value: 'gym',          label: 'Gyms',             icon: '💪', googleType: 'gym' },
  { value: 'shopping_mall',label: 'Malls',            icon: '🛍️', googleType: 'shopping_mall' },
  { value: 'park',         label: 'Parks',            icon: '🌳', googleType: 'park' },
  { value: 'library',      label: 'Libraries',        icon: '📚', googleType: 'library' },
  // keyword:'hotel' filters out serviced apartments / condos that Google tags as lodging
  { value: 'hotel',        label: 'Hotels',           icon: '🏨', googleType: 'lodging', keyword: 'hotel' },
];

export const CATEGORY_MAP = Object.fromEntries(
  PLACE_CATEGORIES.map((c) => [c.value, c])
);
