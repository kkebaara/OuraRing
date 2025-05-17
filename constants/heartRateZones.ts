import { HeartRateZone } from '../types';

// Define the heart rate zones
export const HR_ZONES: HeartRateZone[] = [
  {
    name: 'Rest',
    min: 0,
    max: 60,
    color: '#6BB5B5'
  },
  {
    name: 'Light',
    min: 61,
    max: 100,
    color: '#6BB56D'
  },
  {
    name: 'Moderate',
    min: 101,
    max: 140,
    color: '#B5B56B'
  },
  {
    name: 'Intense',
    min: 141,
    max: 170,
    color: '#B5856B'
  },
  {
    name: 'Peak',
    min: 171,
    max: 999,
    color: '#B56C6C'
  }
];

// Function to determine which zone a heart rate falls into
export const determineHeartRateZone = (heartRate: number): HeartRateZone => {
  return HR_ZONES.find(zone => heartRate >= zone.min && heartRate <= zone.max) || HR_ZONES[0];
};