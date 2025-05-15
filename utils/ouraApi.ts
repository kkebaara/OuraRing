import axios from 'axios';
import { HeartRateData, OuraApiResponse } from '../types';

const BASE_URL = 'https://api.ouraring.com/v2';

export const fetchLatestHeartRate = async (token: string): Promise<number | null> => {
  try {
    const response = await axios.get<OuraApiResponse>(`${BASE_URL}/usercollection/heartrate`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params: {
        start_datetime: new Date(Date.now() - 60000).toISOString(), // Last minute
        end_datetime: new Date().toISOString(),
      }
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      // Sort by timestamp descending to get the most recent
      const sortedData = response.data.data.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      return sortedData[0].bpm;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching heart rate from Oura API:', error);
    throw error;
  }
};

export const fetchHeartRateHistory = async (token: string, minutes: number = 60): Promise<HeartRateData[]> => {
  try {
    const response = await axios.get<OuraApiResponse>(`${BASE_URL}/usercollection/heartrate`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      params: {
        start_datetime: new Date(Date.now() - (minutes * 60000)).toISOString(),
        end_datetime: new Date().toISOString(),
      }
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      // Sort by timestamp ascending for chart display
      return response.data.data.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching heart rate history from Oura API:', error);
    throw error;
  }
};