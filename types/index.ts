// Types for the heart rate data and zones
export interface HeartRateData {
  timestamp: string;
  bpm: number;
  source?: string;
}

export interface HeartRateZone {
  name: string;
  min: number;
  max: number;
  color: string;
}

// Additional types for the app
export interface HeartRateStats {
  avg: number;
  min: number;
  max: number;
}

export interface ZoneDistribution {
  zoneName: string;
  percentage: number;
  color: string;
}