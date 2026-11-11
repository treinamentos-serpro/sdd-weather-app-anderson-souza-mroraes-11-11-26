import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../src/hooks/useWeather';
import { getWeather, searchCities, WeatherServiceError } from '../../src/services/weatherService';
import type { City, WeatherData } from '../../src/types/weather';

vi.mock('../../src/services/weatherService', () => ({
  getWeather: vi.fn(),
  searchCities: vi.fn(),
  WeatherServiceError: class WeatherServiceError extends Error {},
}));

const CITY: City = {
  id: 1,
  name: 'Lisboa',
  country: 'Portugal',
  latitude: 38.72,
  longitude: -9.14,
};

const WEATHER: WeatherData = {
  city: CITY,
  current: {
    time: '2026-06-16T12:00',
    temperature: 20,
    weatherCode: 1,
    humidity: 55,
    windSpeed: 12,
    pressure: 1015,
    precipitation: 0,
  },
  forecast: [
    {
      date: '2026-06-16',
      min: 14,
      max: 22,
      weatherCode: 1,
      precipitationProbability: 10,
    },
  ],
  hourlyForecast: [],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('useWeather', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('não consulta o serviço para uma busca vazia', async () => {
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('   ');
    });

    expect(searchCities).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
    expect(result.current.query).toBe('');
  });

  it('expõe loading e depois o estado vazio quando não há cidades', async () => {
    let resolveSearch: (cities: City[]) => void = () => {};
    vi.mocked(searchCities).mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
    );
    const { result } = renderHook(() => useWeather());
    let pendingSearch: Promise<void>;

    act(() => {
      pendingSearch = result.current.search('Lisboa');
    });
    expect(result.current.status).toBe('loading');

    await act(async () => {
      resolveSearch([]);
      await pendingSearch;
    });

    expect(result.current.status).toBe('empty');
    expect(result.current.data).toBeNull();
  });

  it('carrega o clima para a cidade encontrada', async () => {
    vi.mocked(searchCities).mockResolvedValue([CITY]);
    vi.mocked(getWeather).mockResolvedValue(WEATHER);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('  Lisboa  ');
    });

    expect(searchCities).toHaveBeenCalledWith('Lisboa');
    expect(result.current.status).toBe('results');
    expect(result.current.cities).toEqual([CITY]);
    expect(getWeather).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.selectCity(CITY);
    });

    expect(getWeather).toHaveBeenCalledWith(CITY);
    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual(WEATHER);
  });

  it('expõe erro e permite tentar novamente a última cidade', async () => {
    vi.mocked(searchCities).mockResolvedValue([CITY]);
    vi.mocked(getWeather).mockRejectedValueOnce(new Error('offline')).mockResolvedValue(WEATHER);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Lisboa');
    });
    expect(result.current.status).toBe('results');

    await act(async () => {
      await result.current.selectCity(CITY);
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Algo deu errado. Tente novamente.');

    await act(async () => {
      await result.current.retry();
    });
    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual(WEATHER);
  });

  it('preserva a mensagem do erro tipado da busca e repete a query ao tentar novamente', async () => {
    vi.mocked(searchCities)
      .mockRejectedValueOnce(new WeatherServiceError('Geocoding indisponível'))
      .mockResolvedValue([CITY]);
    vi.mocked(getWeather).mockResolvedValue(WEATHER);
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Lisboa');
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Geocoding indisponível');

    await act(async () => {
      await result.current.retry();
    });

    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(searchCities).toHaveBeenLastCalledWith('Lisboa');
    expect(result.current.status).toBe('results');
    expect(getWeather).not.toHaveBeenCalled();
  });

  it('repete a busca que falhou em vez de recarregar a cidade anterior', async () => {
    const portlandCity = { ...CITY, id: 2, name: 'Porto' };
    vi.mocked(searchCities)
      .mockResolvedValueOnce([CITY])
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce([portlandCity]);
    vi.mocked(getWeather).mockImplementation(async (city) => ({ ...WEATHER, city }));
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.search('Lisboa');
    });
    await act(async () => {
      await result.current.selectCity(CITY);
    });
    await act(async () => {
      await result.current.search('Porto');
    });
    expect(result.current.status).toBe('error');

    await act(async () => {
      await result.current.retry();
    });

    expect(searchCities).toHaveBeenLastCalledWith('Porto');

    await act(async () => {
      await result.current.selectCity(portlandCity);
    });

    expect(getWeather).toHaveBeenCalledTimes(2);
    expect(result.current.data?.city).toEqual(portlandCity);
  });

  it('ignora falha de uma busca obsoleta depois do sucesso da busca vigente', async () => {
    const olderSearch = deferred<City[]>();
    const newerSearch = deferred<City[]>();
    vi.mocked(searchCities)
      .mockReturnValueOnce(olderSearch.promise)
      .mockReturnValueOnce(newerSearch.promise);
    vi.mocked(getWeather).mockResolvedValue(WEATHER);
    const { result } = renderHook(() => useWeather());
    let olderOperation!: Promise<void>;
    let newerOperation!: Promise<void>;

    act(() => {
      olderOperation = result.current.search('Porto');
      newerOperation = result.current.search('Lisboa');
    });
    await act(async () => {
      newerSearch.resolve([CITY]);
      await newerOperation;
    });
    await act(async () => {
      olderSearch.reject(new Error('falha obsoleta'));
      await olderOperation;
    });

    expect(result.current.query).toBe('Lisboa');
    expect(result.current.status).toBe('results');
    expect(result.current.error).toBeNull();
  });

  it('não altera o estado ao tentar novamente sem consulta anterior', async () => {
    const { result } = renderHook(() => useWeather());

    await act(async () => {
      await result.current.retry();
    });

    expect(searchCities).not.toHaveBeenCalled();
    expect(getWeather).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });

  it('mantém os resultados da busca mais recente quando as respostas chegam fora de ordem', async () => {
    const olderSearch = deferred<City[]>();
    const newerSearch = deferred<City[]>();
    vi.mocked(searchCities)
      .mockReturnValueOnce(olderSearch.promise)
      .mockReturnValueOnce(newerSearch.promise);
    vi.mocked(getWeather).mockImplementation(async (city) => ({ ...WEATHER, city }));
    const { result } = renderHook(() => useWeather());
    let olderOperation!: Promise<void>;
    let newerOperation!: Promise<void>;

    act(() => {
      olderOperation = result.current.search('Porto');
      newerOperation = result.current.search('Lisboa');
    });

    await act(async () => {
      newerSearch.resolve([CITY]);
      await newerOperation;
    });
    await act(async () => {
      olderSearch.resolve([{ ...CITY, id: 2, name: 'Porto' }]);
      await olderOperation;
    });

    expect(result.current.query).toBe('Lisboa');
    expect(result.current.cities).toEqual([CITY]);
    expect(result.current.data).toBeNull();
    expect(getWeather).not.toHaveBeenCalled();
    expect(result.current.status).toBe('results');
  });

  it('mantém os dados da última cidade selecionada quando as consultas chegam fora de ordem', async () => {
    const olderWeather = deferred<WeatherData>();
    const newerWeather = deferred<WeatherData>();
    vi.mocked(getWeather)
      .mockReturnValueOnce(olderWeather.promise)
      .mockReturnValueOnce(newerWeather.promise);
    const { result } = renderHook(() => useWeather());
    const olderCity = { ...CITY, id: 2, name: 'Porto' };
    let olderOperation!: Promise<void>;
    let newerOperation!: Promise<void>;

    act(() => {
      olderOperation = result.current.selectCity(olderCity);
      newerOperation = result.current.selectCity(CITY);
    });

    await act(async () => {
      newerWeather.resolve({ ...WEATHER, city: CITY });
      await newerOperation;
    });
    await act(async () => {
      olderWeather.resolve({ ...WEATHER, city: olderCity });
      await olderOperation;
    });

    expect(result.current.data?.city).toEqual(CITY);
    expect(result.current.status).toBe('success');
  });

  it('não apresenta cancelamento de uma consulta obsoleta como falha', async () => {
    const olderWeather = deferred<WeatherData>();
    const newerWeather = deferred<WeatherData>();
    vi.mocked(getWeather)
      .mockReturnValueOnce(olderWeather.promise)
      .mockReturnValueOnce(newerWeather.promise);
    const { result } = renderHook(() => useWeather());
    let olderOperation!: Promise<void>;
    let newerOperation!: Promise<void>;

    act(() => {
      olderOperation = result.current.selectCity({ ...CITY, id: 2, name: 'Porto' });
      newerOperation = result.current.selectCity(CITY);
    });

    await act(async () => {
      newerWeather.resolve(WEATHER);
      await newerOperation;
    });
    await act(async () => {
      olderWeather.reject(new DOMException('Aborted', 'AbortError'));
      await olderOperation;
    });

    expect(result.current.status).toBe('success');
    expect(result.current.error).toBeNull();
    expect(result.current.data?.city).toEqual(CITY);
  });
});
