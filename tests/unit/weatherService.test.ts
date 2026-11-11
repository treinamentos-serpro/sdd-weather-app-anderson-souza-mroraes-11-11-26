import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City } from '../../src/types/weather';

const CITY: City = {
  id: 1,
  name: 'Seattle',
  country: 'Estados Unidos',
  admin1: 'Washington',
  latitude: 47.6,
  longitude: -122.33,
};

function mockFetchOnce(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  } as Response);
}

describe('weatherService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('searchCities', () => {
    it('retorna lista vazia para input vazio sem chamar a rede', async () => {
      const fetchSpy = vi.fn();
      vi.stubGlobal('fetch', fetchSpy);
      const result = await searchCities('   ');
      expect(result).toEqual([]);
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('mapeia resultados de geocoding', async () => {
      const fetchSpy = mockFetchOnce({
        results: [
          {
            id: 1,
            name: 'Seattle',
            country: 'Estados Unidos',
            admin1: 'Washington',
            latitude: 47.6,
            longitude: -122.33,
          },
        ],
      });
      vi.stubGlobal('fetch', fetchSpy);
      const result = await searchCities('Seattle');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Seattle');

      const requestUrl = new URL(String(fetchSpy.mock.calls[0]?.[0]));
      expect(requestUrl.origin + requestUrl.pathname).toBe(
        'https://geocoding-api.open-meteo.com/v1/search',
      );
      expect(requestUrl.searchParams.get('name')).toBe('Seattle');
      expect(requestUrl.searchParams.get('count')).toBe('5');
      expect(requestUrl.searchParams.get('language')).toBe('pt');
      expect(requestUrl.searchParams.get('format')).toBe('json');
    });

    it('retorna vazio quando não há results', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({}));
      expect(await searchCities('xyzxyz')).toEqual([]);
    });

    it('mantém país vazio quando a resposta de geocoding não o informa', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          results: [{ id: 2, name: 'Springfield', latitude: 39.8, longitude: -89.6 }],
        }),
      );

      await expect(searchCities('Springfield')).resolves.toMatchObject([
        { name: 'Springfield', country: '' },
      ]);
    });

    it('codifica corretamente nomes com acentos e caracteres especiais', async () => {
      const fetchSpy = mockFetchOnce({});
      vi.stubGlobal('fetch', fetchSpy);
      await searchCities('São Paulo & região');
      const requestUrl = new URL(String(fetchSpy.mock.calls[0]?.[0]));
      expect(requestUrl.searchParams.get('name')).toBe('São Paulo & região');
    });

    it('lança erro tipado em resposta não-ok', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({}, false));
      await expect(searchCities('Seattle')).rejects.toBeInstanceOf(WeatherServiceError);
    });

    it('inclui mensagem amigável quando a busca retorna erro HTTP', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({}, false));
      await expect(searchCities('Seattle')).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Não foi possível buscar a cidade. Tente novamente.',
      });
    });

    it('converte falha de rede em erro amigável', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
      await expect(searchCities('Seattle')).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Falha de rede. Verifique sua conexão.',
      });
    });

    it('rejeita resultados de geocoding malformados como erro tipado', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({ results: [{ id: 'invalid', name: '', latitude: null, longitude: 0 }] }),
      );

      await expect(searchCities('Seattle')).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Resposta de busca inválida. Tente novamente.',
      });
    });

    it('rejeita payload geocoding que não seja um objeto', async () => {
      vi.stubGlobal('fetch', mockFetchOnce(null));

      await expect(searchCities('Seattle')).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Resposta de busca inválida. Tente novamente.',
      });
    });

    it('converte timeout em erro recuperável', async () => {
      vi.useFakeTimers();
      const fetchSpy = vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(new DOMException('Aborted', 'AbortError'));
            });
          }),
      );
      vi.stubGlobal('fetch', fetchSpy);
      const pendingSearch = searchCities('Seattle');
      const rejection = expect(pendingSearch).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'A requisição demorou demais. Tente novamente.',
      });

      await vi.advanceTimersByTimeAsync(10_000);

      await rejection;
    });

    it('reconhece AbortError baseado em Error em runtimes sem DOMException', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError));
      await expect(searchCities('Seattle')).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'A requisição demorou demais. Tente novamente.',
      });
    });

    it('mantém o timeout ativo enquanto lê o corpo da resposta', async () => {
      vi.useFakeTimers();
      const fetchSpy = vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          Promise.resolve({
            ok: true,
            json: () =>
              new Promise((_resolve, reject) => {
                init?.signal?.addEventListener('abort', () => {
                  reject(new DOMException('Aborted', 'AbortError'));
                });
              }),
          }) as Promise<Response>,
      );
      vi.stubGlobal('fetch', fetchSpy);
      const pendingSearch = searchCities('Seattle');
      const rejection = expect(pendingSearch).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'A requisição demorou demais. Tente novamente.',
      });

      await vi.advanceTimersByTimeAsync(10_000);

      await rejection;
    });
  });

  describe('getWeather', () => {
    it('mapeia current e daily para WeatherData', async () => {
      const fetchSpy = mockFetchOnce({
        current: {
          time: '2026-06-16T12:00',
          temperature_2m: 18,
          relative_humidity_2m: 80,
          wind_speed_10m: 10,
          surface_pressure: 1015,
          precipitation: 0,
          weather_code: 3,
        },
        daily: {
          time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
          weather_code: [3, 61, 80, 1, 0],
          temperature_2m_max: [20, 19, 22, 24, 25],
          temperature_2m_min: [12, 11, 13, 14, 15],
          precipitation_probability_max: [20, 90, 70, 10, null],
        },
        hourly: {
          time: ['2026-06-16T06:00', '2026-06-17T00:00'],
          temperature_2m: [9, 12],
          relative_humidity_2m: [60, null],
          precipitation_probability: [0, null],
          precipitation: [0, null],
          wind_speed_10m: [4, null],
          weather_code: [0, 1],
        },
      });
      vi.stubGlobal('fetch', fetchSpy);

      const data = await getWeather(CITY);
      expect(data.current.temperature).toBe(18);
      expect(data.forecast).toHaveLength(5);
      const requestUrl = new URL(String(fetchSpy.mock.calls[0]?.[0]));
      expect(requestUrl.origin + requestUrl.pathname).toBe(
        'https://api.open-meteo.com/v1/forecast',
      );
      expect(requestUrl.searchParams.get('latitude')).toBe(String(CITY.latitude));
      expect(requestUrl.searchParams.get('longitude')).toBe(String(CITY.longitude));
      expect(requestUrl.searchParams.get('current')).toBe(
        'temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure,precipitation,weather_code',
      );
      expect(requestUrl.searchParams.get('daily')).toBe(
        'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
      );
      expect(requestUrl.searchParams.get('hourly')).toBe(
        'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,wind_speed_10m,weather_code',
      );
      expect(requestUrl.searchParams.get('forecast_days')).toBe('5');
      expect(requestUrl.searchParams.get('timezone')).toBe('auto');
      expect(data.current.precipitation).toBe(0);
      expect(data.forecast[4].precipitationProbability).toBeNull();
      expect(data.hourlyForecast).toEqual([
        {
          time: '2026-06-16T06:00',
          temperature: 9,
          weatherCode: 0,
          humidity: 60,
          precipitationProbability: 0,
          precipitation: 0,
          windSpeed: 4,
        },
        {
          time: '2026-06-17T00:00',
          temperature: 12,
          weatherCode: 1,
          humidity: null,
          precipitationProbability: null,
          precipitation: null,
          windSpeed: null,
        },
      ]);
    });

    it('mantém campos opcionais ausentes como indisponíveis', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          current: { time: '2026-06-16T12:00', temperature_2m: 18, weather_code: 3 },
          daily: {
            time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
            weather_code: [3, 61, 80, 1, 0],
            temperature_2m_max: [20, 19, 22, 24, 25],
            temperature_2m_min: [12, 11, 13, 14, 15],
          },
        }),
      );

      const data = await getWeather(CITY);

      expect(data.current).toMatchObject({
        humidity: null,
        windSpeed: null,
        pressure: null,
        precipitation: null,
      });
      expect(data.forecast[0].precipitationProbability).toBeNull();
      expect(data.hourlyForecast).toEqual([]);
    });

    it('omite séries horárias inválidas sem descartar a previsão diária', async () => {
      const current = { time: '2026-06-16T12:00', temperature_2m: 18, weather_code: 3 };
      const daily = {
        time: ['2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
        weather_code: [3, 61, 80, 1, 0],
        temperature_2m_max: [20, 19, 22, 24, 25],
        temperature_2m_min: [12, 11, 13, 14, 15],
      };
      const invalidHourlySeries = [
        {
          time: [null],
          temperature_2m: [16],
          weather_code: [0],
        },
        {
          time: ['invalid-time'],
          temperature_2m: [16],
          weather_code: [0],
        },
        {
          time: ['2026-06-16T12:00'],
          temperature_2m: [16],
          weather_code: [0],
          precipitation: [0, 1],
        },
      ];

      for (const hourly of invalidHourlySeries) {
        vi.stubGlobal('fetch', mockFetchOnce({ current, daily, hourly }));
        const data = await getWeather(CITY);
        expect(data.hourlyForecast).toEqual([]);
        expect(data.forecast).toHaveLength(5);
      }
    });

    it('rejeita séries diárias desalinhadas como payload inválido', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          current: { time: '2026-06-16T12:00', temperature_2m: 18, weather_code: 3 },
          daily: {
            time: ['2026-06-16', '2026-06-17'],
            weather_code: [3],
            temperature_2m_max: [20, 21],
            temperature_2m_min: [12, 13],
          },
        }),
      );

      await expect(getWeather(CITY)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Resposta de clima incompleta. Tente novamente.',
      });
    });

    it('rejeita forecast sem temperatura atual essencial ou sem dias', async () => {
      const daily = {
        time: ['2026-06-16'],
        weather_code: [3],
        temperature_2m_max: [20],
        temperature_2m_min: [12],
      };
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          current: { time: '2026-06-16T12:00', weather_code: 3 },
          daily,
        }),
      );
      await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);

      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          current: { time: '2026-06-16T12:00', temperature_2m: 18, weather_code: 3 },
          daily: null,
        }),
      );
      await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);

      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          current: { time: '2026-06-16T12:00', temperature_2m: 18, weather_code: 3 },
          daily: {
            time: [],
            weather_code: [],
            temperature_2m_max: [],
            temperature_2m_min: [],
          },
        }),
      );
      await expect(getWeather(CITY)).rejects.toBeInstanceOf(WeatherServiceError);
    });

    it('rejeita previsão diária que não cobre os cinco dias', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          current: { time: '2026-06-16T12:00', temperature_2m: 18, weather_code: 3 },
          daily: {
            time: ['2026-06-16'],
            weather_code: [3],
            temperature_2m_max: [20],
            temperature_2m_min: [12],
          },
        }),
      );

      await expect(getWeather(CITY)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Resposta de clima incompleta. Tente novamente.',
      });
    });

    it('rejeita datas repetidas, com lacunas ou que não começam no dia local atual', async () => {
      const current = { time: '2026-06-16T12:00', temperature_2m: 18, weather_code: 3 };
      const datesWithDuplicate = [
        '2026-06-16',
        '2026-06-17',
        '2026-06-17',
        '2026-06-19',
        '2026-06-20',
      ];
      const datesWithGap = ['2026-06-16', '2026-06-17', '2026-06-19', '2026-06-20', '2026-06-21'];
      const datesStartingTomorrow = [
        '2026-06-17',
        '2026-06-18',
        '2026-06-19',
        '2026-06-20',
        '2026-06-21',
      ];
      const invalidWindows = [datesWithDuplicate, datesWithGap, datesStartingTomorrow];

      for (const time of invalidWindows) {
        vi.stubGlobal(
          'fetch',
          mockFetchOnce({
            current,
            daily: {
              time,
              weather_code: [3, 61, 80, 1, 0],
              temperature_2m_max: [20, 19, 22, 24, 25],
              temperature_2m_min: [12, 11, 13, 14, 15],
            },
          }),
        );

        await expect(getWeather(CITY)).rejects.toMatchObject({
          name: 'WeatherServiceError',
          message: 'Resposta de clima incompleta. Tente novamente.',
        });
      }
    });

    it('converte JSON de forecast ilegível em erro tipado', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => {
            throw new SyntaxError();
          },
        }),
      );

      await expect(getWeather(CITY)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Resposta de clima inválida. Tente novamente.',
      });
    });

    it('lança erro quando a resposta está incompleta', async () => {
      vi.stubGlobal('fetch', mockFetchOnce(null));
      await expect(getWeather(CITY)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Resposta de clima incompleta. Tente novamente.',
      });

      vi.stubGlobal('fetch', mockFetchOnce({ current: null, daily: null }));
      await expect(getWeather(CITY)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Resposta de clima incompleta. Tente novamente.',
      });
    });

    it('rejeita data que não existe no calendário', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          current: { time: '2026-02-28T12:00', temperature_2m: 18, weather_code: 3 },
          daily: {
            time: ['2026-02-28', '2026-02-31', '2026-03-02', '2026-03-03', '2026-03-04'],
            weather_code: [3, 61, 80, 1, 0],
            temperature_2m_max: [20, 19, 22, 24, 25],
            temperature_2m_min: [12, 11, 13, 14, 15],
          },
        }),
      );

      await expect(getWeather(CITY)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Resposta de clima incompleta. Tente novamente.',
      });
    });

    it('rejeita timestamp diário que não seja uma string', async () => {
      vi.stubGlobal(
        'fetch',
        mockFetchOnce({
          current: { time: '2026-06-16T12:00', temperature_2m: 18, weather_code: 3 },
          daily: {
            time: [null, '2026-06-17', '2026-06-18', '2026-06-19', '2026-06-20'],
            weather_code: [3, 61, 80, 1, 0],
            temperature_2m_max: [20, 19, 22, 24, 25],
            temperature_2m_min: [12, 11, 13, 14, 15],
          },
        }),
      );

      await expect(getWeather(CITY)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Resposta de clima incompleta. Tente novamente.',
      });
    });

    it('lança erro amigável quando a API de previsão retorna erro HTTP', async () => {
      vi.stubGlobal('fetch', mockFetchOnce({}, false));
      await expect(getWeather(CITY)).rejects.toMatchObject({
        name: 'WeatherServiceError',
        message: 'Não foi possível carregar o clima. Tente novamente.',
      });
    });
  });
});
