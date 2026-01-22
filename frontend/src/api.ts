import type { WeatherResponse, ErrorResponse } from './types';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchWeather(city: string): Promise<WeatherResponse> {
  const trimmedCity = city.trim();

  if (!trimmedCity) {
    throw new ApiError('Please enter a city name', 400);
  }

  const url = `/api/weather?city=${encodeURIComponent(trimmedCity)}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new ApiError('Unable to connect to the weather service. Please check your connection.', 0);
  }

  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as ErrorResponse | null;

    if (response.status === 400) {
      throw new ApiError(errorData?.error ?? 'Invalid request', 400);
    }

    if (response.status === 404) {
      throw new ApiError(
        `City "${trimmedCity}" not found. Please check the spelling and try again.`,
        404
      );
    }

    if (response.status === 502) {
      throw new ApiError(
        'The weather service is temporarily unavailable. Please try again later.',
        502
      );
    }

    throw new ApiError(
      errorData?.error ?? 'An unexpected error occurred',
      response.status
    );
  }

  const data = (await response.json()) as WeatherResponse;
  return data;
}
