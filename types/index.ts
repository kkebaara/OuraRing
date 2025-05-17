// In types.ts
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


export interface OuraApiResponse {
  data: HeartRateData[];
  next_token?: string;
}
