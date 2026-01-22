import { fetchWeather, ApiError } from './api';
import {
  initializeElements,
  showLoading,
  showError,
  showWeatherData,
  hideAllStates,
} from './render';
import type { AppState } from './types';

// Application state
const state: AppState = {
  uiState: 'idle',
  weatherData: null,
  errorMessage: null,
  lastSearchedCity: null,
};

// DOM elements
let searchForm: HTMLFormElement;
let cityInput: HTMLInputElement;
let searchButton: HTMLButtonElement;
let retryButton: HTMLButtonElement;

/**
 * Initialize the application
 */
function init(): void {
  // Get form elements
  searchForm = document.getElementById('search-form') as HTMLFormElement;
  cityInput = document.getElementById('city-input') as HTMLInputElement;
  searchButton = document.getElementById('search-button') as HTMLButtonElement;
  retryButton = document.getElementById('retry-button') as HTMLButtonElement;

  // Initialize render elements
  initializeElements();

  // Set up event listeners
  searchForm.addEventListener('submit', handleSearch);
  retryButton.addEventListener('click', handleRetry);

  // Hide all states initially
  hideAllStates();

  // Focus on input
  cityInput.focus();
}

/**
 * Handle search form submission
 */
async function handleSearch(event: Event): Promise<void> {
  event.preventDefault();

  const city = cityInput.value.trim();
  if (!city) {
    cityInput.focus();
    return;
  }

  await searchWeather(city);
}

/**
 * Handle retry button click
 */
async function handleRetry(): Promise<void> {
  if (state.lastSearchedCity) {
    await searchWeather(state.lastSearchedCity);
  }
}

/**
 * Search for weather data
 */
async function searchWeather(city: string): Promise<void> {
  state.lastSearchedCity = city;
  state.uiState = 'loading';

  // Disable form while loading
  setFormDisabled(true);
  showLoading();

  try {
    const data = await fetchWeather(city);
    state.weatherData = data;
    state.uiState = 'success';
    state.errorMessage = null;
    showWeatherData(data);
  } catch (error) {
    state.uiState = 'error';
    state.weatherData = null;

    if (error instanceof ApiError) {
      state.errorMessage = error.message;
    } else {
      state.errorMessage = 'An unexpected error occurred. Please try again.';
    }

    showError(state.errorMessage);
  } finally {
    setFormDisabled(false);
    cityInput.focus();
  }
}

/**
 * Enable/disable form elements
 */
function setFormDisabled(disabled: boolean): void {
  cityInput.disabled = disabled;
  searchButton.disabled = disabled;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
