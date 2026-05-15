import { Timestamp } from "firebase/firestore";

export interface PhotoLog {
  id: string;
  spotId: string;
  imageUrl: string;
  userId: string;
  displayName: string;
  isAnonymous: boolean;
  createdAt: Timestamp;
}

export interface WeatherInfo {
  description: string;
  temp: number;
  conditionCode: number;
  isRainy: boolean;
}

export interface Spot {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  wateredToday: boolean;
  plantCount: number;
  memo?: string;
  weather?: WeatherInfo;
  imageUrl?: string;
  area?: string;
}
