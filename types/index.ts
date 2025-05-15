export interface HeartRateZone {
    name: string;
    min: number;
    max: number;
    color: string;
  }
  
  export interface HeartRateData {
    bpm: number;
    timestamp: string;
    source?: string;
  }
  
  export interface OuraApiResponse {
    data: HeartRateData[];
    next_token?: string;
  }