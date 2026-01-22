import type { WeatherResponse, ForecastDay } from './types';
import {
  formatTemperature,
  formatDayOfWeek,
  formatWindSpeed,
  formatHumidity,
  formatPrecipChance,
  formatCoordinates,
  formatLocation,
  getIconUrl,
} from './format';

// DOM element references
let elements: {
  loadingState: HTMLElement;
  errorState: HTMLElement;
  errorMessage: HTMLElement;
  weatherData: HTMLElement;
  locationName: HTMLElement;
  locationCoords: HTMLElement;
  currentIcon: HTMLImageElement;
  currentTempValue: HTMLElement;
  currentCondition: HTMLElement;
  currentFeelsLike: HTMLElement;
  currentHumidity: HTMLElement;
  currentWind: HTMLElement;
  forecastList: HTMLElement;
} | null = null;

/**
 * Initialize DOM element references
 * Must be called after DOM is ready
 */
export function initializeElements(): void {
  elements = {
    loadingState: document.getElementById('loading-state')!,
    errorState: document.getElementById('error-state')!,
    errorMessage: document.getElementById('error-message')!,
    weatherData: document.getElementById('weather-data')!,
    locationName: document.getElementById('location-name')!,
    locationCoords: document.getElementById('location-coords')!,
    currentIcon: document.getElementById('current-icon') as HTMLImageElement,
    currentTempValue: document.getElementById('current-temp-value')!,
    currentCondition: document.getElementById('current-condition')!,
    currentFeelsLike: document.getElementById('current-feels-like')!,
    currentHumidity: document.getElementById('current-humidity')!,
    currentWind: document.getElementById('current-wind')!,
    forecastList: document.getElementById('forecast-list')!,
  };
}

/**
 * Show loading state
 */
export function showLoading(): void {
  if (!elements) return;

  elements.loadingState.classList.remove('hidden');
  elements.errorState.classList.add('hidden');
  elements.weatherData.classList.add('hidden');
}

/**
 * Show error state with message
 */
export function showError(message: string): void {
  if (!elements) return;

  elements.loadingState.classList.add('hidden');
  elements.errorState.classList.remove('hidden');
  elements.weatherData.classList.add('hidden');
  elements.errorMessage.textContent = message;
}

/**
 * Show weather data
 */
export function showWeatherData(data: WeatherResponse): void {
  if (!elements) return;

  elements.loadingState.classList.add('hidden');
  elements.errorState.classList.add('hidden');
  elements.weatherData.classList.remove('hidden');

  // Render current weather
  renderCurrentWeather(data);

  // Render forecast
  renderForecast(data.forecast);
}

/**
 * Render current weather section
 */
function renderCurrentWeather(data: WeatherResponse): void {
  if (!elements) return;

  elements.locationName.textContent = formatLocation(data.city, data.country);
  elements.locationCoords.textContent = formatCoordinates(data.latitude, data.longitude);

  elements.currentIcon.src = getIconUrl(data.current.conditionIcon);
  elements.currentIcon.alt = data.current.condition;

  elements.currentTempValue.textContent = formatTemperature(
    data.current.tempC,
    data.current.tempF
  );

  elements.currentCondition.textContent = data.current.condition;

  elements.currentFeelsLike.textContent = `Feels like ${formatTemperature(
    data.current.feelsLikeC
  )}`;

  elements.currentHumidity.textContent = `Humidity: ${formatHumidity(
    data.current.humidity
  )}`;

  elements.currentWind.textContent = `Wind: ${formatWindSpeed(data.current.windKph)}`;
}

/**
 * Render forecast section
 */
function renderForecast(forecast: ForecastDay[]): void {
  if (!elements) return;

  elements.forecastList.innerHTML = '';

  forecast.forEach((day) => {
    const card = createForecastCard(day);
    elements!.forecastList.appendChild(card);
  });
}

/**
 * Create a forecast card element
 */
export function createForecastCard(day: ForecastDay): HTMLElement {
  const card = document.createElement('div');
  card.className = 'forecast-card';

  const dateEl = document.createElement('div');
  dateEl.className = 'forecast-date';
  dateEl.textContent = formatDayOfWeek(day.date);

  const iconEl = document.createElement('img');
  iconEl.className = 'forecast-icon';
  iconEl.src = getIconUrl(day.conditionIcon);
  iconEl.alt = day.condition;

  const conditionEl = document.createElement('div');
  conditionEl.className = 'forecast-condition';
  conditionEl.textContent = day.condition;

  const tempsEl = document.createElement('div');
  tempsEl.className = 'forecast-temps';

  const highEl = document.createElement('span');
  highEl.className = 'temp-high';
  highEl.textContent = formatTemperature(day.maxC, day.maxF);

  const lowEl = document.createElement('span');
  lowEl.className = 'temp-low';
  lowEl.textContent = formatTemperature(day.minC, day.minF);

  tempsEl.appendChild(highEl);
  tempsEl.appendChild(lowEl);

  card.appendChild(dateEl);
  card.appendChild(iconEl);
  card.appendChild(conditionEl);
  card.appendChild(tempsEl);

  const precipText = formatPrecipChance(day.precipChance);
  if (precipText) {
    const precipEl = document.createElement('div');
    precipEl.className = 'forecast-precip';
    precipEl.textContent = precipText;
    card.appendChild(precipEl);
  }

  return card;
}

/**
 * Hide all weather states (for initial state)
 */
export function hideAllStates(): void {
  if (!elements) return;

  elements.loadingState.classList.add('hidden');
  elements.errorState.classList.add('hidden');
  elements.weatherData.classList.add('hidden');
}
