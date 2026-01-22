import dotenv from 'dotenv';
import { createApp } from './app.js';
import { WeatherClient } from './weatherClient.js';
import { Cache } from './cache.js';
import type { WeatherResponse } from './types.js';

// Load environment variables
dotenv.config({ path: '../.env' });

// Fail fast if API key is not configured
const apiKey = process.env.WEATHER_API_KEY;
if (!apiKey) {
  console.error('ERROR: WEATHER_API_KEY environment variable is not set.');
  console.error('Please create a .env file in the project root with your API key.');
  console.error('See .env.example for the required format.');
  console.error('');
  console.error('Get a free API key at: https://www.weatherapi.com/');
  process.exit(1);
}

// Create cache with 10 minute TTL
const cache = new Cache<WeatherResponse>(10 * 60 * 1000);

// Create weather client
const weatherClient = new WeatherClient(apiKey, cache);

// Create and start the app
const app = createApp(weatherClient);

const port = parseInt(process.env.PORT ?? '3000', 10);

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
  console.log(`Weather API: http://localhost:${port}/api/weather?city=Boston`);
});
