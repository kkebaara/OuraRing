import { HeartRateZone } from '../types';

export const HR_ZONES: HeartRateZone[] = [
  { name: 'Rest', min: 0, max: 60, color: '#6BB5B5' },  // Teal
  { name: 'Light', min: 61, max: 100, color: '#6CB56D' }, // Light Green
  { name: 'Moderate', min: 101, max: 130, color: '#B5B56C' }, // Yellow
  { name: 'Intense', min: 131, max: 160, color: '#B5896C' }, // Orange
  { name: 'Peak', min: 161, max: 999, color: '#B56C6C' }, // Red
];

export const determineHeartRateZone = (hr: number): HeartRateZone => {
  for (const zone of HR_ZONES) {
    if (hr >= zone.min && hr <= zone.max) {
      return zone;
    }
  }
  return HR_ZONES[0]; // Default to Rest zone if no match
};