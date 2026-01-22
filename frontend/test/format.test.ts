import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatTemperature,
  formatDate,
  formatDayOfWeek,
  formatWindSpeed,
  formatHumidity,
  formatPrecipChance,
  formatCoordinates,
  formatLocation,
  getIconUrl,
} from '../src/format';

describe('format utilities', () => {
  describe('formatTemperature', () => {
    it('should format Celsius temperature', () => {
      expect(formatTemperature(20.5)).toBe('21°C');
      expect(formatTemperature(-5.2)).toBe('-5°C');
      expect(formatTemperature(0)).toBe('0°C');
    });

    it('should round to nearest integer', () => {
      expect(formatTemperature(20.4)).toBe('20°C');
      expect(formatTemperature(20.6)).toBe('21°C');
      expect(formatTemperature(-0.4)).toBe('0°C');
    });

    it('should format Fahrenheit when unit is F', () => {
      expect(formatTemperature(20, 68, 'F')).toBe('68°F');
      expect(formatTemperature(-5, 23, 'F')).toBe('23°F');
    });

    it('should fall back to Celsius if Fahrenheit not provided', () => {
      expect(formatTemperature(20, undefined, 'F')).toBe('20°C');
    });
  });

  describe('formatDate', () => {
    it('should format date with default options', () => {
      const result = formatDate('2024-01-15');
      // Format varies by locale, but should contain key parts
      expect(result).toContain('15');
      expect(result).toContain('Jan');
    });

    it('should accept custom format options', () => {
      const result = formatDate('2024-01-15', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      expect(result).toContain('2024');
      expect(result).toContain('January');
    });
  });

  describe('formatDayOfWeek', () => {
    let realDate: DateConstructor;

    beforeEach(() => {
      realDate = global.Date;
      // Mock Date to be January 15, 2024 (a Monday)
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-15T12:00:00'));
    });

    afterEach(() => {
      vi.useRealTimers();
      global.Date = realDate;
    });

    it('should return "Today" for today\'s date', () => {
      expect(formatDayOfWeek('2024-01-15')).toBe('Today');
    });

    it('should return "Tomorrow" for tomorrow\'s date', () => {
      expect(formatDayOfWeek('2024-01-16')).toBe('Tomorrow');
    });

    it('should return abbreviated day name for other dates', () => {
      expect(formatDayOfWeek('2024-01-17')).toBe('Wed');
      expect(formatDayOfWeek('2024-01-20')).toBe('Sat');
    });
  });

  describe('formatWindSpeed', () => {
    it('should format wind speed in km/h', () => {
      expect(formatWindSpeed(25.5)).toBe('26 km/h');
      expect(formatWindSpeed(0)).toBe('0 km/h');
      expect(formatWindSpeed(100)).toBe('100 km/h');
    });

    it('should round to nearest integer', () => {
      expect(formatWindSpeed(25.4)).toBe('25 km/h');
      expect(formatWindSpeed(25.6)).toBe('26 km/h');
    });
  });

  describe('formatHumidity', () => {
    it('should format humidity as percentage', () => {
      expect(formatHumidity(65)).toBe('65%');
      expect(formatHumidity(0)).toBe('0%');
      expect(formatHumidity(100)).toBe('100%');
    });
  });

  describe('formatPrecipChance', () => {
    it('should format precipitation chance', () => {
      expect(formatPrecipChance(50)).toBe('50% rain');
      expect(formatPrecipChance(10)).toBe('10% rain');
    });

    it('should return empty string for 0% chance', () => {
      expect(formatPrecipChance(0)).toBe('');
    });
  });

  describe('formatCoordinates', () => {
    it('should format positive coordinates', () => {
      expect(formatCoordinates(42.36, -71.06)).toBe('42.36°N, 71.06°W');
      expect(formatCoordinates(51.51, -0.13)).toBe('51.51°N, 0.13°W');
    });

    it('should format negative latitude as South', () => {
      expect(formatCoordinates(-33.87, 151.21)).toBe('33.87°S, 151.21°E');
    });

    it('should format coordinates with proper precision', () => {
      expect(formatCoordinates(42.3601, -71.0589)).toBe('42.36°N, 71.06°W');
    });
  });

  describe('formatLocation', () => {
    it('should format city and country', () => {
      expect(formatLocation('Boston', 'United States')).toBe(
        'Boston, United States'
      );
      expect(formatLocation('London', 'United Kingdom')).toBe(
        'London, United Kingdom'
      );
    });
  });

  describe('getIconUrl', () => {
    it('should prepend https to protocol-relative URLs', () => {
      expect(getIconUrl('//cdn.weatherapi.com/weather/64x64/day/116.png')).toBe(
        'https://cdn.weatherapi.com/weather/64x64/day/116.png'
      );
    });

    it('should return http/https URLs unchanged', () => {
      expect(getIconUrl('https://example.com/icon.png')).toBe(
        'https://example.com/icon.png'
      );
      expect(getIconUrl('http://example.com/icon.png')).toBe(
        'http://example.com/icon.png'
      );
    });

    it('should construct full URL for bare icon names', () => {
      expect(getIconUrl('116.png')).toBe(
        'https://cdn.weatherapi.com/weather/64x64/day/116.png'
      );
    });
  });
});
