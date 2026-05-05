export const LOCATION_COLOURS = [
  '#3B82F6', // blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#8B5CF6', // violet
  '#EF4444', // red
  '#06B6D4', // cyan
  '#F97316', // orange
  '#84CC16', // lime
  '#EC4899', // pink
  '#6366F1', // indigo
];

export function getNextColour(usedColours: string[]): string {
  const available = LOCATION_COLOURS.filter((c) => !usedColours.includes(c));
  return available[0] ?? LOCATION_COLOURS[usedColours.length % LOCATION_COLOURS.length];
}

export const TRAVEL_MODE_COLOURS: Record<string, string> = {
  public_transport: '#3B82F6',
  walking: '#10B981',
  cycling: '#F59E0B',
  driving: '#8B5CF6',
};

export const OVERLAP_COLOUR = '#FF6B6B';
