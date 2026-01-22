import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import {
  WeatherClient,
  WeatherApiNotFoundError,
  WeatherApiUpstreamError,
} from './weatherClient.js';
import type { ErrorResponse } from './types.js';

export function createApp(weatherClient: WeatherClient) {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // Weather endpoint
  app.get('/api/weather', async (req: Request, res: Response<ErrorResponse | object>) => {
    const city = req.query.city;

    // Validate city parameter
    if (city === undefined || typeof city !== 'string') {
      res.status(400).json({ error: 'Missing required parameter: city' });
      return;
    }

    const trimmedCity = city.trim();

    if (trimmedCity.length === 0) {
      res.status(400).json({ error: 'City parameter cannot be empty' });
      return;
    }

    if (trimmedCity.length > 100) {
      res.status(400).json({ error: 'City parameter is too long (max 100 characters)' });
      return;
    }

    // Basic sanitization: only allow letters, spaces, hyphens, apostrophes, commas, and periods
    const validCityRegex = /^[a-zA-Z\s\-',.]+$/;
    if (!validCityRegex.test(trimmedCity)) {
      res.status(400).json({ error: 'City parameter contains invalid characters' });
      return;
    }

    try {
      const weather = await weatherClient.getWeather(trimmedCity);
      res.json(weather);
    } catch (error) {
      if (error instanceof WeatherApiNotFoundError) {
        res.status(404).json({ error: 'City not found' });
        return;
      }

      if (error instanceof WeatherApiUpstreamError) {
        console.error('Upstream weather API error:', error.message);
        res.status(502).json({ error: 'Upstream weather service error' });
        return;
      }

      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
