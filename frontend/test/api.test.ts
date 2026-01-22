import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { fetchWeather, ApiError } from '../src/api';
import type { WeatherResponse } from '../src/types';

const mockWeatherResponse: WeatherResponse = {
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
  forecast: [],
};

describe('api module', () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('fetchWeather', () => {
    it('should fetch weather data successfully', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWeatherResponse),
      } as Response);

      const result = await fetchWeather('Boston');

      expect(global.fetch).toHaveBeenCalledWith('/api/weather?city=Boston');
      expect(result.city).toBe('Boston');
    });

    it('should encode city name in URL', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ...mockWeatherResponse, city: 'New York' }),
      } as Response);

      await fetchWeather('New York');

      expect(global.fetch).toHaveBeenCalledWith('/api/weather?city=New%20York');
    });

    it('should throw ApiError for empty city', async () => {
      await expect(fetchWeather('')).rejects.toThrow(ApiError);
      await expect(fetchWeather('   ')).rejects.toThrow(ApiError);
      await expect(fetchWeather('')).rejects.toThrow('Please enter a city name');
    });

    it('should throw ApiError with status 404 for city not found', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: 'City not found' }),
      } as Response);

      try {
        await fetchWeather('NotARealCity');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(404);
        expect((error as ApiError).message).toContain('not found');
      }
    });

    it('should throw ApiError with status 400 for invalid request', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid city parameter' }),
      } as Response);

      try {
        await fetchWeather('test');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(400);
      }
    });

    it('should throw ApiError with status 502 for upstream errors', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: () => Promise.resolve({ error: 'Upstream error' }),
      } as Response);

      try {
        await fetchWeather('Boston');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(502);
        expect((error as ApiError).message).toContain('temporarily unavailable');
      }
    });

    it('should throw ApiError for network failures', async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Network error'));

      try {
        await fetchWeather('Boston');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).statusCode).toBe(0);
        expect((error as ApiError).message).toContain('Unable to connect');
      }
    });

    it('should trim whitespace from city input', async () => {
      vi.mocked(global.fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockWeatherResponse),
      } as Response);

      await fetchWeather('  Boston  ');

      expect(global.fetch).toHaveBeenCalledWith('/api/weather?city=Boston');
    });
  });

  describe('ApiError', () => {
    it('should have correct name and properties', () => {
      const error = new ApiError('Test error', 404);

      expect(error.name).toBe('ApiError');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(404);
      expect(error instanceof Error).toBe(true);
    });
  });
});
