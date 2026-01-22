import type {
  WeatherResponse,
  WeatherApiResponse,
  WeatherApiError,
  ForecastDay,
  CurrentWeather,
} from './types.js';
import { Cache } from './cache.js';

const WEATHER_API_BASE = 'https://api.weatherapi.com/v1';

export class WeatherApiNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherApiNotFoundError';
  }
}

export class WeatherApiUpstreamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherApiUpstreamError';
  }
}

export class WeatherClient {
  private apiKey: string;
  private cache: Cache<WeatherResponse>;
  private fetchFn: typeof fetch;

  constructor(
    apiKey: string,
    cache?: Cache<WeatherResponse>,
    fetchFn?: typeof fetch
  ) {
    this.apiKey = apiKey;
    this.cache = cache ?? new Cache<WeatherResponse>();
    this.fetchFn = fetchFn ?? fetch;
  }

  async getWeather(city: string): Promise<WeatherResponse> {
    // Check cache first
    const cached = this.cache.get(city);
    if (cached) {
      return cached;
    }

    // Fetch from API
    const url = new URL(`${WEATHER_API_BASE}/forecast.json`);
    url.searchParams.set('key', this.apiKey);
    url.searchParams.set('q', city);
    url.searchParams.set('days', '7');
    url.searchParams.set('aqi', 'no');
    url.searchParams.set('alerts', 'no');

    let response: Response;
    try {
      response = await this.fetchFn(url.toString());
    } catch (error) {
      throw new WeatherApiUpstreamError(
        `Failed to connect to weather service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    if (!response.ok) {
      const errorData = (await response.json().catch(() => null)) as WeatherApiError | null;

      // WeatherAPI error codes:
      // 1006 = No matching location found
      // 2006 = API key not provided
      // 2007 = API key exceeded monthly calls
      // 2008 = API key disabled
      if (errorData?.error?.code === 1006) {
        throw new WeatherApiNotFoundError('City not found');
      }

      if (response.status === 401 || response.status === 403) {
        throw new WeatherApiUpstreamError('Invalid API key');
      }

      if (response.status === 429) {
        throw new WeatherApiUpstreamError('Rate limit exceeded');
      }

      throw new WeatherApiUpstreamError(
        errorData?.error?.message ?? `Weather API error: ${response.status}`
      );
    }

    const data = (await response.json()) as WeatherApiResponse;
    const normalized = this.normalizeResponse(data);

    // Cache the result
    this.cache.set(city, normalized);

    return normalized;
  }

  normalizeResponse(data: WeatherApiResponse): WeatherResponse {
    const current: CurrentWeather = {
      tempC: data.current.temp_c,
      tempF: data.current.temp_f,
      condition: data.current.condition.text,
      conditionIcon: data.current.condition.icon,
      windKph: data.current.wind_kph,
      humidity: data.current.humidity,
      feelsLikeC: data.current.feelslike_c,
    };

    const forecast: ForecastDay[] = data.forecast.forecastday.map((day) => ({
      date: day.date,
      minC: day.day.mintemp_c,
      maxC: day.day.maxtemp_c,
      minF: day.day.mintemp_f,
      maxF: day.day.maxtemp_f,
      condition: day.day.condition.text,
      conditionIcon: day.day.condition.icon,
      precipChance: Math.max(
        day.day.daily_chance_of_rain,
        day.day.daily_chance_of_snow
      ),
    }));

    return {
      city: data.location.name,
      country: data.location.country,
      latitude: data.location.lat,
      longitude: data.location.lon,
      timezone: data.location.tz_id,
      current,
      forecast,
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  getCacheSize(): number {
    return this.cache.size();
  }
}
