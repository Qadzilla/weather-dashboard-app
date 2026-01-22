// Weather response types (matching backend normalized response)
export interface CurrentWeather {
  tempC: number;
  tempF: number;
  condition: string;
  conditionIcon: string;
  windKph: number;
  humidity: number;
  feelsLikeC: number;
}

export interface ForecastDay {
  date: string;
  minC: number;
  maxC: number;
  minF: number;
  maxF: number;
  condition: string;
  conditionIcon: string;
  precipChance: number;
}

export interface WeatherResponse {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  current: CurrentWeather;
  forecast: ForecastDay[];
}

export interface ErrorResponse {
  error: string;
}

// UI State types
export type UIState = 'idle' | 'loading' | 'success' | 'error';

export interface AppState {
  uiState: UIState;
  weatherData: WeatherResponse | null;
  errorMessage: string | null;
  lastSearchedCity: string | null;
}
