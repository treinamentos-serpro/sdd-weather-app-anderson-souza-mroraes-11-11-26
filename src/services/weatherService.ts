import type {
  City,
  CurrentWeather,
  ForecastDay,
  ForecastHour,
  WeatherData,
} from '../types/weather';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;

/** Erro tipado da camada de dados, com mensagem amigável ao usuário. */
export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

interface JsonResponse {
  response: Response;
  data: unknown;
}

/** Mantém o timeout ativo até a leitura completa do corpo da resposta. */
async function fetchJsonWithTimeout(
  url: string,
  invalidResponseMessage: string,
): Promise<JsonResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
    } catch (err) {
      if (isAbortError(err)) {
        throw new WeatherServiceError('A requisição demorou demais. Tente novamente.');
      }
      throw new WeatherServiceError('Falha de rede. Verifique sua conexão.');
    }

    if (!response.ok) return { response, data: null };

    try {
      return { response, data: await response.json() };
    } catch (err) {
      if (isAbortError(err)) {
        throw new WeatherServiceError('A requisição demorou demais. Tente novamente.');
      }
      throw new WeatherServiceError(invalidResponseMessage);
    }
  } finally {
    clearTimeout(timeout);
  }
}

function isAbortError(err: unknown): boolean {
  return (err instanceof DOMException || err instanceof Error) && err.name === 'AbortError';
}

interface GeocodingResult {
  id: number;
  name: string;
  country?: string | null;
  admin1?: string | null;
  latitude: number;
  longitude: number;
}

function isGeocodingResult(value: unknown): value is GeocodingResult {
  return (
    isRecord(value) &&
    Number.isInteger(value.id) &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    isFiniteNumber(value.latitude) &&
    isFiniteNumber(value.longitude) &&
    (value.country === undefined || value.country === null || typeof value.country === 'string') &&
    (value.admin1 === undefined || value.admin1 === null || typeof value.admin1 === 'string')
  );
}

/**
 * Busca cidades por nome (geocoding). Retorna lista vazia quando não há
 * resultados — o estado "vazio" é tratado pela camada de UI.
 */
export async function searchCities(name: string): Promise<City[]> {
  const query = name.trim();
  if (!query) return [];

  const url = `${GEOCODING_URL}?name=${encodeURIComponent(query)}&count=5&language=pt&format=json`;
  const { response: res, data } = await fetchJsonWithTimeout(
    url,
    'Resposta de busca inválida. Tente novamente.',
  );
  if (!res.ok) {
    throw new WeatherServiceError('Não foi possível buscar a cidade. Tente novamente.');
  }

  if (!isRecord(data)) {
    throw new WeatherServiceError('Resposta de busca inválida. Tente novamente.');
  }
  if (data.results === undefined || data.results === null) return [];
  if (!Array.isArray(data.results) || !data.results.every(isGeocodingResult)) {
    throw new WeatherServiceError('Resposta de busca inválida. Tente novamente.');
  }

  return data.results.map((r) => ({
    id: r.id,
    name: r.name,
    country: r.country ?? '',
    admin1: r.admin1 ?? undefined,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}

interface ForecastCurrentResponse {
  time: string;
  temperature_2m: number;
  relative_humidity_2m?: number | null;
  wind_speed_10m?: number | null;
  surface_pressure?: number | null;
  precipitation?: number | null;
  weather_code: number;
}

interface ForecastDailyResponse {
  time: string[];
  weather_code: number[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max?: (number | null)[];
}

interface ForecastHourlyResponse {
  time: string[];
  temperature_2m: number[];
  weather_code: number[];
  relative_humidity_2m?: (number | null)[];
  precipitation_probability?: (number | null)[];
  precipitation?: (number | null)[];
  wind_speed_10m?: (number | null)[];
}

interface ValidForecastResponse {
  current: ForecastCurrentResponse;
  daily: ForecastDailyResponse;
  hourly?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isNullableNumber(value: unknown): value is number | null | undefined {
  return value === undefined || value === null || isFiniteNumber(value);
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(isFiniteNumber);
}

function isNullableNumberArray(value: unknown): value is (number | null)[] {
  return Array.isArray(value) && value.every((item) => item === null || isFiniteNumber(item));
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isIsoDateTime(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return false;
  return isIsoDate(match[1]) && Number(match[2]) < 24 && Number(match[3]) < 60;
}

function isForecastCurrent(value: unknown): value is ForecastCurrentResponse {
  return (
    isRecord(value) &&
    isIsoDateTime(value.time) &&
    isFiniteNumber(value.temperature_2m) &&
    isFiniteNumber(value.weather_code) &&
    isNullableNumber(value.relative_humidity_2m) &&
    isNullableNumber(value.wind_speed_10m) &&
    isNullableNumber(value.surface_pressure) &&
    isNullableNumber(value.precipitation)
  );
}

function isForecastDaily(value: unknown): value is ForecastDailyResponse {
  if (!isRecord(value)) return false;
  const { time, weather_code, temperature_2m_max, temperature_2m_min } = value;
  const probability = value.precipitation_probability_max;
  if (
    !Array.isArray(time) ||
    time.length !== 5 ||
    !time.every(isIsoDate) ||
    !isNumberArray(weather_code) ||
    !isNumberArray(temperature_2m_max) ||
    !isNumberArray(temperature_2m_min)
  ) {
    return false;
  }

  const aligned = [weather_code, temperature_2m_max, temperature_2m_min].every(
    (series) => series.length === time.length,
  );
  const optionalProbabilityIsValid =
    probability === undefined ||
    (isNullableNumberArray(probability) && probability.length === time.length);

  return aligned && optionalProbabilityIsValid;
}

function isForecastResponse(value: unknown): value is ValidForecastResponse {
  if (!isRecord(value)) return false;
  const { current, daily } = value;
  if (!isForecastCurrent(current) || !isForecastDaily(daily)) return false;

  return (
    daily.time[0] === current.time.slice(0, 10) &&
    daily.time.every((date, index) => {
      if (index === 0) return true;
      const previousDate = daily.time[index - 1];
      return (
        Date.parse(`${date}T00:00:00Z`) - Date.parse(`${previousDate}T00:00:00Z`) === 86_400_000
      );
    })
  );
}

function isForecastHourly(value: unknown): value is ForecastHourlyResponse {
  if (!isRecord(value)) return false;
  const { time, temperature_2m, weather_code } = value;
  if (
    !Array.isArray(time) ||
    !time.every(isIsoDateTime) ||
    !isNumberArray(temperature_2m) ||
    !isNumberArray(weather_code) ||
    temperature_2m.length !== time.length ||
    weather_code.length !== time.length
  ) {
    return false;
  }

  return [
    value.relative_humidity_2m,
    value.precipitation_probability,
    value.precipitation,
    value.wind_speed_10m,
  ].every(
    (series) =>
      series === undefined || (isNullableNumberArray(series) && series.length === time.length),
  );
}

function mapCurrent(c: ForecastCurrentResponse): CurrentWeather {
  return {
    time: c.time,
    temperature: c.temperature_2m,
    humidity: c.relative_humidity_2m ?? null,
    windSpeed: c.wind_speed_10m ?? null,
    pressure: c.surface_pressure ?? null,
    precipitation: c.precipitation ?? null,
    weatherCode: c.weather_code,
  };
}

function mapForecast(d: ForecastDailyResponse): ForecastDay[] {
  return d.time.map((date, i) => ({
    date,
    weatherCode: d.weather_code[i],
    max: d.temperature_2m_max[i],
    min: d.temperature_2m_min[i],
    precipitationProbability: d.precipitation_probability_max?.[i] ?? null,
  }));
}

function mapHourly(value: unknown): ForecastHour[] {
  if (!isForecastHourly(value)) return [];

  return value.time.map((time, index) => ({
    time,
    temperature: value.temperature_2m[index],
    weatherCode: value.weather_code[index],
    humidity: value.relative_humidity_2m?.[index] ?? null,
    precipitationProbability: value.precipitation_probability?.[index] ?? null,
    precipitation: value.precipitation?.[index] ?? null,
    windSpeed: value.wind_speed_10m?.[index] ?? null,
  }));
}

/**
 * Busca o clima atual e a previsão de 5 dias para uma cidade.
 * Temperaturas retornam em Celsius (conversão fica na UI).
 */
export async function getWeather(city: City): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,precipitation,weather_code',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    hourly:
      'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code',
    forecast_days: '5',
    timezone: 'auto',
  });

  const { response: res, data } = await fetchJsonWithTimeout(
    `${FORECAST_URL}?${params.toString()}`,
    'Resposta de clima inválida. Tente novamente.',
  );
  if (!res.ok) {
    throw new WeatherServiceError('Não foi possível carregar o clima. Tente novamente.');
  }

  if (!isForecastResponse(data)) {
    throw new WeatherServiceError('Resposta de clima incompleta. Tente novamente.');
  }

  return {
    city,
    current: mapCurrent(data.current),
    forecast: mapForecast(data.daily),
    hourlyForecast: mapHourly(data.hourly),
  };
}
