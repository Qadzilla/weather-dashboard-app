import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  WeatherClient,
  WeatherApiNotFoundError,
  WeatherApiUpstreamError,
} from '../src/weatherClient.js';
import { Cache } from '../src/cache.js';
import type { WeatherResponse, WeatherApiResponse } from '../src/types.js';

// Mock WeatherAPI response
const mockApiResponse: WeatherApiResponse = {
  location: {
    name: 'Boston',
    region: 'Massachusetts',
    country: 'United States of America',
    lat: 42.36,
    lon: -71.06,
    tz_id: 'America/New_York',
    localtime_epoch: 1700000000,
    localtime: '2024-01-15 10:00',
  },
  current: {
    last_updated_epoch: 1700000000,
    last_updated: '2024-01-15 10:00',
    temp_c: 5.5,
    temp_f: 41.9,
    is_day: 1,
    condition: {
      text: 'Partly cloudy',
      icon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
      code: 1003,
    },
    wind_mph: 12.5,
    wind_kph: 20.1,
    wind_degree: 180,
    wind_dir: 'S',
    pressure_mb: 1015,
    pressure_in: 29.97,
    precip_mm: 0,
    precip_in: 0,
    humidity: 65,
    cloud: 25,
    feelslike_c: 2.5,
    feelslike_f: 36.5,
    vis_km: 16,
    vis_miles: 9,
    uv: 2,
    gust_mph: 18.1,
    gust_kph: 29.2,
  },
  forecast: {
    forecastday: [
      {
        date: '2024-01-15',
        date_epoch: 1705276800,
        day: {
          maxtemp_c: 8.5,
          maxtemp_f: 47.3,
          mintemp_c: 2.1,
          mintemp_f: 35.8,
          avgtemp_c: 5.3,
          avgtemp_f: 41.5,
          maxwind_mph: 15.2,
          maxwind_kph: 24.5,
          totalprecip_mm: 0.5,
          totalprecip_in: 0.02,
          totalsnow_cm: 0,
          avgvis_km: 10,
          avgvis_miles: 6,
          avghumidity: 70,
          daily_will_it_rain: 1,
          daily_chance_of_rain: 35,
          daily_will_it_snow: 0,
          daily_chance_of_snow: 10,
          condition: {
            text: 'Patchy rain possible',
            icon: '//cdn.weatherapi.com/weather/64x64/day/176.png',
            code: 1063,
          },
          uv: 2,
        },
        astro: {
          sunrise: '07:10 AM',
          sunset: '04:35 PM',
          moonrise: '12:30 PM',
          moonset: '02:15 AM',
          moon_phase: 'Waxing Crescent',
          moon_illumination: 25,
        },
        hour: [],
      },
      {
        date: '2024-01-16',
        date_epoch: 1705363200,
        day: {
          maxtemp_c: 6.2,
          maxtemp_f: 43.2,
          mintemp_c: 0.5,
          mintemp_f: 32.9,
          avgtemp_c: 3.4,
          avgtemp_f: 38.1,
          maxwind_mph: 12.1,
          maxwind_kph: 19.5,
          totalprecip_mm: 0,
          totalprecip_in: 0,
          totalsnow_cm: 0,
          avgvis_km: 10,
          avgvis_miles: 6,
          avghumidity: 60,
          daily_will_it_rain: 0,
          daily_chance_of_rain: 5,
          daily_will_it_snow: 0,
          daily_chance_of_snow: 0,
          condition: {
            text: 'Sunny',
            icon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
            code: 1000,
          },
          uv: 3,
        },
        astro: {
          sunrise: '07:10 AM',
          sunset: '04:36 PM',
          moonrise: '01:20 PM',
          moonset: '03:05 AM',
          moon_phase: 'Waxing Crescent',
          moon_illumination: 32,
        },
        hour: [],
      },
    ],
  },
};

describe('WeatherClient', () => {
  let cache: Cache<WeatherResponse>;
  let mockFetch: ReturnType<typeof vi.fn>;
  let client: WeatherClient;

  beforeEach(() => {
    cache = new Cache<WeatherResponse>(60000);
    mockFetch = vi.fn();
    client = new WeatherClient('test-api-key', cache, mockFetch);
  });

  describe('normalizeResponse', () => {
    it('should correctly normalize API response', () => {
      const normalized = client.normalizeResponse(mockApiResponse);

      expect(normalized).toEqual({
        city: 'Boston',
        country: 'United States of America',
        latitude: 42.36,
        longitude: -71.06,
        timezone: 'America/New_York',
        current: {
          tempC: 5.5,
          tempF: 41.9,
          condition: 'Partly cloudy',
          conditionIcon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
          windKph: 20.1,
          humidity: 65,
          feelsLikeC: 2.5,
        },
        forecast: [
          {
            date: '2024-01-15',
            minC: 2.1,
            maxC: 8.5,
            minF: 35.8,
            maxF: 47.3,
            condition: 'Patchy rain possible',
            conditionIcon: '//cdn.weatherapi.com/weather/64x64/day/176.png',
            precipChance: 35,
          },
          {
            date: '2024-01-16',
            minC: 0.5,
            maxC: 6.2,
            minF: 32.9,
            maxF: 43.2,
            condition: 'Sunny',
            conditionIcon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
            precipChance: 5,
          },
        ],
      });
    });

    it('should use the higher of rain/snow chance for precipChance', () => {
      const responseWithSnow = {
        ...mockApiResponse,
        forecast: {
          forecastday: [
            {
              ...mockApiResponse.forecast.forecastday[0],
              day: {
                ...mockApiResponse.forecast.forecastday[0].day,
                daily_chance_of_rain: 10,
                daily_chance_of_snow: 45,
              },
            },
          ],
        },
      };

      const normalized = client.normalizeResponse(responseWithSnow);
      expect(normalized.forecast[0].precipChance).toBe(45);
    });
  });

  describe('getWeather', () => {
    it('should fetch weather data and cache it', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      const result = await client.getWeather('Boston');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.city).toBe('Boston');
      expect(result.current.tempC).toBe(5.5);

      // Verify it's cached
      expect(cache.get('Boston')).not.toBeNull();
    });

    it('should return cached data without fetching', async () => {
      // First call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      await client.getWeather('Boston');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result = await client.getWeather('Boston');
      expect(mockFetch).toHaveBeenCalledTimes(1); // Still 1
      expect(result.city).toBe('Boston');
    });

    it('should handle cache key case-insensitively', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      await client.getWeather('BOSTON');
      const result = await client.getWeather('boston');

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.city).toBe('Boston');
    });

    it('should throw WeatherApiNotFoundError for unknown city', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: {
              code: 1006,
              message: 'No matching location found.',
            },
          }),
      });

      await expect(client.getWeather('NotARealCity123')).rejects.toThrow(
        WeatherApiNotFoundError
      );
    });

    it('should throw WeatherApiUpstreamError for rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: { message: 'Rate limit exceeded' } }),
      });

      await expect(client.getWeather('Boston')).rejects.toThrow(
        WeatherApiUpstreamError
      );
    });

    it('should throw WeatherApiUpstreamError for invalid API key', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { message: 'Invalid API key' } }),
      });

      await expect(client.getWeather('Boston')).rejects.toThrow(
        WeatherApiUpstreamError
      );
    });

    it('should throw WeatherApiUpstreamError for network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.getWeather('Boston')).rejects.toThrow(
        WeatherApiUpstreamError
      );
    });

    it('should construct correct API URL', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      await client.getWeather('New York');

      const calledUrl = mockFetch.mock.calls[0][0] as string;
      expect(calledUrl).toContain('api.weatherapi.com');
      expect(calledUrl).toContain('key=test-api-key');
      expect(calledUrl).toContain('q=New+York');
      expect(calledUrl).toContain('days=7');
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse),
      });

      await client.getWeather('Boston');
      expect(client.getCacheSize()).toBe(1);

      client.clearCache();
      expect(client.getCacheSize()).toBe(0);
    });
  });
});
