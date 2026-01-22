import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import type { WeatherResponse, ForecastDay } from '../src/types';

// Mock DOM before importing render module
function setupDOM(): Document {
  const dom = new JSDOM(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="loading-state" class="loading-state hidden"></div>
        <div id="error-state" class="error-state hidden">
          <p id="error-message"></p>
        </div>
        <div id="weather-data" class="weather-data hidden">
          <h2 id="location-name"></h2>
          <p id="location-coords"></p>
          <img id="current-icon" src="" alt="" />
          <span id="current-temp-value"></span>
          <p id="current-condition"></p>
          <p id="current-feels-like"></p>
          <p id="current-humidity"></p>
          <p id="current-wind"></p>
          <div id="forecast-list"></div>
        </div>
      </body>
    </html>
  `);

  // Set up global document and window
  global.document = dom.window.document;
  global.window = dom.window as unknown as Window & typeof globalThis;
  global.HTMLElement = dom.window.HTMLElement;

  return dom.window.document;
}

// Sample weather data for testing
const mockWeatherData: WeatherResponse = {
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
    {
      date: '2024-01-16',
      minC: 0.5,
      maxC: 6.2,
      minF: 32.9,
      maxF: 43.2,
      condition: 'Cloudy',
      conditionIcon: '//cdn.weatherapi.com/weather/64x64/day/119.png',
      precipChance: 35,
    },
  ],
};

describe('render module', () => {
  let doc: Document;

  beforeEach(() => {
    vi.resetModules();
    doc = setupDOM();
  });

  describe('showLoading', () => {
    it('should show loading state and hide others', async () => {
      const { initializeElements, showLoading } = await import('../src/render');
      initializeElements();
      showLoading();

      expect(doc.getElementById('loading-state')!.classList.contains('hidden')).toBe(false);
      expect(doc.getElementById('error-state')!.classList.contains('hidden')).toBe(true);
      expect(doc.getElementById('weather-data')!.classList.contains('hidden')).toBe(true);
    });
  });

  describe('showError', () => {
    it('should show error state with message', async () => {
      const { initializeElements, showError } = await import('../src/render');
      initializeElements();
      showError('City not found');

      expect(doc.getElementById('loading-state')!.classList.contains('hidden')).toBe(true);
      expect(doc.getElementById('error-state')!.classList.contains('hidden')).toBe(false);
      expect(doc.getElementById('weather-data')!.classList.contains('hidden')).toBe(true);
      expect(doc.getElementById('error-message')!.textContent).toBe('City not found');
    });
  });

  describe('showWeatherData', () => {
    it('should show weather data and hide others', async () => {
      const { initializeElements, showWeatherData } = await import('../src/render');
      initializeElements();
      showWeatherData(mockWeatherData);

      expect(doc.getElementById('loading-state')!.classList.contains('hidden')).toBe(true);
      expect(doc.getElementById('error-state')!.classList.contains('hidden')).toBe(true);
      expect(doc.getElementById('weather-data')!.classList.contains('hidden')).toBe(false);
    });

    it('should render location name correctly', async () => {
      const { initializeElements, showWeatherData } = await import('../src/render');
      initializeElements();
      showWeatherData(mockWeatherData);

      expect(doc.getElementById('location-name')!.textContent).toBe(
        'Boston, United States of America'
      );
    });

    it('should render current temperature', async () => {
      const { initializeElements, showWeatherData } = await import('../src/render');
      initializeElements();
      showWeatherData(mockWeatherData);

      expect(doc.getElementById('current-temp-value')!.textContent).toBe('6°C');
    });

    it('should render current condition', async () => {
      const { initializeElements, showWeatherData } = await import('../src/render');
      initializeElements();
      showWeatherData(mockWeatherData);

      expect(doc.getElementById('current-condition')!.textContent).toBe('Partly cloudy');
    });

    it('should render forecast cards', async () => {
      const { initializeElements, showWeatherData } = await import('../src/render');
      initializeElements();
      showWeatherData(mockWeatherData);

      const forecastList = doc.getElementById('forecast-list')!;
      const cards = forecastList.querySelectorAll('.forecast-card');

      expect(cards.length).toBe(2);
    });
  });

  describe('createForecastCard', () => {
    it('should create card with correct structure', async () => {
      const { createForecastCard } = await import('../src/render');

      const day: ForecastDay = {
        date: '2024-01-15',
        minC: 2.1,
        maxC: 8.5,
        minF: 35.8,
        maxF: 47.3,
        condition: 'Sunny',
        conditionIcon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
        precipChance: 25,
      };

      const card = createForecastCard(day);

      expect(card.classList.contains('forecast-card')).toBe(true);
      expect(card.querySelector('.forecast-date')).toBeTruthy();
      expect(card.querySelector('.forecast-icon')).toBeTruthy();
      expect(card.querySelector('.forecast-condition')).toBeTruthy();
      expect(card.querySelector('.forecast-temps')).toBeTruthy();
    });

    it('should show precipitation when chance > 0', async () => {
      const { createForecastCard } = await import('../src/render');

      const day: ForecastDay = {
        date: '2024-01-15',
        minC: 2,
        maxC: 8,
        minF: 35,
        maxF: 47,
        condition: 'Rain',
        conditionIcon: '//cdn.weatherapi.com/weather/64x64/day/116.png',
        precipChance: 75,
      };

      const card = createForecastCard(day);
      const precipEl = card.querySelector('.forecast-precip');

      expect(precipEl).toBeTruthy();
      expect(precipEl!.textContent).toBe('75% rain');
    });

    it('should not show precipitation when chance is 0', async () => {
      const { createForecastCard } = await import('../src/render');

      const day: ForecastDay = {
        date: '2024-01-15',
        minC: 2,
        maxC: 8,
        minF: 35,
        maxF: 47,
        condition: 'Sunny',
        conditionIcon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
        precipChance: 0,
      };

      const card = createForecastCard(day);
      const precipEl = card.querySelector('.forecast-precip');

      expect(precipEl).toBeNull();
    });

    it('should format temperatures correctly', async () => {
      const { createForecastCard } = await import('../src/render');

      const day: ForecastDay = {
        date: '2024-01-15',
        minC: -5.7,
        maxC: 10.3,
        minF: 22,
        maxF: 50,
        condition: 'Clear',
        conditionIcon: '//cdn.weatherapi.com/weather/64x64/day/113.png',
        precipChance: 0,
      };

      const card = createForecastCard(day);
      const highTemp = card.querySelector('.temp-high')!;
      const lowTemp = card.querySelector('.temp-low')!;

      expect(highTemp.textContent).toBe('10°C');
      expect(lowTemp.textContent).toBe('-6°C');
    });
  });

  describe('hideAllStates', () => {
    it('should hide all state elements', async () => {
      const { initializeElements, hideAllStates } = await import('../src/render');

      // First show some states
      doc.getElementById('loading-state')!.classList.remove('hidden');
      doc.getElementById('error-state')!.classList.remove('hidden');

      initializeElements();
      hideAllStates();

      expect(doc.getElementById('loading-state')!.classList.contains('hidden')).toBe(true);
      expect(doc.getElementById('error-state')!.classList.contains('hidden')).toBe(true);
      expect(doc.getElementById('weather-data')!.classList.contains('hidden')).toBe(true);
    });
  });
});
