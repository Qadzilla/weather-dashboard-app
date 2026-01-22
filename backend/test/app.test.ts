import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import {
  WeatherClient,
  WeatherApiNotFoundError,
  WeatherApiUpstreamError,
} from '../src/weatherClient.js';
import type { WeatherResponse } from '../src/types.js';

describe('App endpoints', () => {
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
    forecast: [
      {
        date: '2024-01-15',
        minC: 2.1,
        maxC: 8.5,
        minF: 35.8,
        maxF: 47.3,
        condition: 'Sunny',
        conditionIcon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
        precipChance: 10,
      },
    ],
  };

  let mockWeatherClient: WeatherClient;

  beforeEach(() => {
    mockWeatherClient = {
      getWeather: vi.fn(),
      clearCache: vi.fn(),
      getCacheSize: vi.fn(),
      normalizeResponse: vi.fn(),
    } as unknown as WeatherClient;
  });

  describe('GET /health', () => {
    it('should return ok: true', async () => {
      const app = createApp(mockWeatherClient);
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
    });
  });

  describe('GET /api/weather', () => {
    it('should return weather data for valid city', async () => {
      vi.mocked(mockWeatherClient.getWeather).mockResolvedValueOnce(
        mockWeatherResponse
      );

      const app = createApp(mockWeatherClient);
      const response = await request(app).get('/api/weather?city=Boston');

      expect(response.status).toBe(200);
      expect(response.body.city).toBe('Boston');
      expect(response.body.current.tempC).toBe(5.5);
    });

    it('should return 400 for missing city parameter', async () => {
      const app = createApp(mockWeatherClient);
      const response = await request(app).get('/api/weather');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing required parameter: city');
    });

    it('should return 400 for empty city parameter', async () => {
      const app = createApp(mockWeatherClient);
      const response = await request(app).get('/api/weather?city=');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('City parameter cannot be empty');
    });

    it('should return 400 for city with invalid characters', async () => {
      const app = createApp(mockWeatherClient);
      const response = await request(app).get(
        '/api/weather?city=Boston<script>'
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('City parameter contains invalid characters');
    });

    it('should return 400 for city that is too long', async () => {
      const app = createApp(mockWeatherClient);
      const longCity = 'a'.repeat(101);
      const response = await request(app).get(`/api/weather?city=${longCity}`);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('City parameter is too long (max 100 characters)');
    });

    it('should return 404 for city not found', async () => {
      vi.mocked(mockWeatherClient.getWeather).mockRejectedValueOnce(
        new WeatherApiNotFoundError('City not found')
      );

      const app = createApp(mockWeatherClient);
      const response = await request(app).get('/api/weather?city=NotARealCity');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('City not found');
    });

    it('should return 502 for upstream errors', async () => {
      vi.mocked(mockWeatherClient.getWeather).mockRejectedValueOnce(
        new WeatherApiUpstreamError('Rate limit exceeded')
      );

      const app = createApp(mockWeatherClient);
      const response = await request(app).get('/api/weather?city=Boston');

      expect(response.status).toBe(502);
      expect(response.body.error).toBe('Upstream weather service error');
    });

    it('should return 500 for unexpected errors', async () => {
      vi.mocked(mockWeatherClient.getWeather).mockRejectedValueOnce(
        new Error('Unexpected error')
      );

      const app = createApp(mockWeatherClient);
      const response = await request(app).get('/api/weather?city=Boston');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });

    it('should accept city names with spaces', async () => {
      vi.mocked(mockWeatherClient.getWeather).mockResolvedValueOnce({
        ...mockWeatherResponse,
        city: 'New York',
      });

      const app = createApp(mockWeatherClient);
      const response = await request(app).get('/api/weather?city=New%20York');

      expect(response.status).toBe(200);
      expect(response.body.city).toBe('New York');
    });

    it('should accept city names with hyphens', async () => {
      vi.mocked(mockWeatherClient.getWeather).mockResolvedValueOnce({
        ...mockWeatherResponse,
        city: 'Winston-Salem',
      });

      const app = createApp(mockWeatherClient);
      const response = await request(app).get('/api/weather?city=Winston-Salem');

      expect(response.status).toBe(200);
    });

    it('should accept city names with apostrophes', async () => {
      vi.mocked(mockWeatherClient.getWeather).mockResolvedValueOnce({
        ...mockWeatherResponse,
        city: "O'Fallon",
      });

      const app = createApp(mockWeatherClient);
      const response = await request(app).get("/api/weather?city=O'Fallon");

      expect(response.status).toBe(200);
    });

    it('should trim whitespace from city parameter', async () => {
      vi.mocked(mockWeatherClient.getWeather).mockResolvedValueOnce(
        mockWeatherResponse
      );

      const app = createApp(mockWeatherClient);
      await request(app).get('/api/weather?city=%20Boston%20');

      expect(mockWeatherClient.getWeather).toHaveBeenCalledWith('Boston');
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      const app = createApp(mockWeatherClient);
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Not found');
    });
  });
});
