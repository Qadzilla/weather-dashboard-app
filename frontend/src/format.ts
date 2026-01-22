/**
 * Format temperature with unit
 */
export function formatTemperature(
  tempC: number,
  tempF?: number,
  unit: 'C' | 'F' = 'C'
): string {
  if (unit === 'F' && tempF !== undefined) {
    return `${Math.round(tempF)}°F`;
  }
  return `${Math.round(tempC)}°C`;
}

/**
 * Format a date string (YYYY-MM-DD) to a human-readable format
 */
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateString + 'T00:00:00');

  const defaultOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };

  return date.toLocaleDateString('en-US', options ?? defaultOptions);
}

/**
 * Format date as day of week only
 */
export function formatDayOfWeek(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Check if the date is today
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  // Check if the date is tomorrow
  if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  }

  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/**
 * Format wind speed
 */
export function formatWindSpeed(kph: number): string {
  return `${Math.round(kph)} km/h`;
}

/**
 * Format humidity
 */
export function formatHumidity(percent: number): string {
  return `${percent}%`;
}

/**
 * Format precipitation chance
 */
export function formatPrecipChance(percent: number): string {
  if (percent === 0) {
    return '';
  }
  return `${percent}% rain`;
}

/**
 * Format coordinates
 */
export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`;
}

/**
 * Get full icon URL from weather API icon path
 */
export function getIconUrl(iconPath: string): string {
  // WeatherAPI returns paths like //cdn.weatherapi.com/weather/64x64/day/116.png
  if (iconPath.startsWith('//')) {
    return `https:${iconPath}`;
  }
  if (iconPath.startsWith('http')) {
    return iconPath;
  }
  return `https://cdn.weatherapi.com/weather/64x64/day/${iconPath}`;
}

/**
 * Format location string (city, country)
 */
export function formatLocation(city: string, country: string): string {
  return `${city}, ${country}`;
}
