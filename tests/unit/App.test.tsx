import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../src/App';
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

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renderiza a marca e o estado inicial de busca', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: 'WeatherView', level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/busque uma cidade para começar/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'São Paulo' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open-Meteo' })).toHaveAttribute(
      'href',
      'https://open-meteo.com/',
    );
  });

  it('mostra a barra de busca e o alternador de unidade', () => {
    render(<App />);
    expect(screen.getByLabelText(/buscar cidade/i)).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /unidade de temperatura/i })).toBeInTheDocument();
  });

  it('oferece um link de salto acessível por teclado', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.tab();

    const skipLink = screen.getByRole('link', { name: 'Pular para o conteúdo' });
    expect(skipLink).toHaveFocus();
    expect(skipLink).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1');
  });

  it('comunica loading e depois o estado sem resultados', async () => {
    let resolveSearch: (cities: City[]) => void = () => {};
    vi.mocked(searchCities).mockReturnValue(
      new Promise((resolve) => {
        resolveSearch = resolve;
      }),
    );
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'xyz');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByLabelText(/buscar cidade/i)).toBeDisabled();

    await act(async () => {
      resolveSearch([]);
    });

    expect(screen.getByText(/nenhuma cidade encontrada para "xyz"/i)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Nenhuma cidade encontrada');
  });

  it('permite tentar novamente uma busca que falhou', async () => {
    vi.mocked(searchCities)
      .mockRejectedValueOnce(new WeatherServiceError('Falha na busca'))
      .mockResolvedValue([CITY]);
    vi.mocked(getWeather).mockResolvedValue(WEATHER);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'Lisboa');
    await user.click(screen.getByRole('button', { name: /buscar/i }));
    expect(screen.getByRole('alert')).toHaveTextContent('Falha na busca');

    await user.click(screen.getByRole('button', { name: /tentar novamente/i }));

    expect(
      await screen.findByRole('region', { name: 'Resultados de cidades' }),
    ).toBeInTheDocument();
    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(getWeather).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Lisboa, Portugal' }));
    expect(await screen.findByRole('heading', { name: 'Lisboa' })).toBeInTheDocument();
  });

  it('renderiza clima e previsão após a busca bem-sucedida', async () => {
    vi.mocked(searchCities).mockResolvedValue([CITY]);
    vi.mocked(getWeather).mockResolvedValue(WEATHER);
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText(/buscar cidade/i), 'Lisboa');
    await user.click(screen.getByRole('button', { name: /buscar/i }));

    expect(
      await screen.findByRole('region', { name: 'Resultados de cidades' }),
    ).toBeInTheDocument();
    expect(getWeather).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Lisboa, Portugal' }));

    expect(await screen.findByRole('region', { name: /clima atual/i })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: /previsão de 5 dias/i })).toBeInTheDocument();
    expect(screen.getByText('20°')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '°F' }));
    expect(screen.getByText('68°')).toBeInTheDocument();
    expect(screen.getByText('72°')).toBeInTheDocument();
  });
});
