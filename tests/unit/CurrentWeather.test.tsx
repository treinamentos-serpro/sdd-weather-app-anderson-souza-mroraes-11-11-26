import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import type { City, CurrentWeather as CurrentWeatherData } from '../../src/types/weather';

const CURRENT: CurrentWeatherData = {
  time: '2026-06-16T12:00',
  temperature: 0,
  weatherCode: 3,
  humidity: 55.6,
  windSpeed: 12.4,
  pressure: 1015.4,
  precipitation: 0,
};

describe('CurrentWeather', () => {
  it('apresenta local, condições e métricas atuais', () => {
    const city: City = {
      id: 1,
      name: 'Seattle',
      country: 'Estados Unidos',
      admin1: 'Washington',
      latitude: 47.6,
      longitude: -122.33,
    };
    render(<CurrentWeather city={city} current={CURRENT} unit="celsius" />);

    expect(screen.getByRole('region', { name: /clima atual/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Seattle' })).toBeInTheDocument();
    expect(screen.getByText('Washington, Estados Unidos')).toBeInTheDocument();
    expect(screen.getByText('Nublado')).toBeInTheDocument();
    expect(screen.getByText('0°')).toBeInTheDocument();
    expect(screen.getByText('56%')).toBeInTheDocument();
    expect(screen.getByText('12 km/h')).toBeInTheDocument();
    expect(screen.getByText('0 mm')).toBeInTheDocument();
    expect(screen.getByText('1015 hPa')).toBeInTheDocument();
  });

  it('converte temperatura e omite o contexto quando não há localização', () => {
    const city: City = {
      id: 2,
      name: 'Cidade sem contexto',
      country: '',
      latitude: 0,
      longitude: 0,
    };
    render(<CurrentWeather city={city} current={CURRENT} unit="fahrenheit" />);

    expect(screen.getByText('32°')).toBeInTheDocument();
    expect(screen.queryByText(/Estados Unidos|Washington/)).not.toBeInTheDocument();
  });

  it('exibe indisponibilidade nas métricas sem ocultar dados disponíveis', () => {
    const city: City = {
      id: 3,
      name: 'Lisboa',
      country: 'Portugal',
      latitude: 38.72,
      longitude: -9.14,
    };
    render(
      <CurrentWeather
        city={city}
        current={{
          ...CURRENT,
          humidity: null,
          windSpeed: null,
          pressure: null,
          precipitation: null,
        }}
        unit="celsius"
      />,
    );

    expect(screen.getByRole('heading', { name: 'Lisboa' })).toBeInTheDocument();
    expect(screen.getByText('0°')).toBeInTheDocument();
    expect(screen.getAllByText('—')).toHaveLength(4);
  });

  it('formata precipitação decimal usando vírgula pt-BR', () => {
    const city: City = {
      id: 4,
      name: 'Lisboa',
      country: 'Portugal',
      latitude: 38.72,
      longitude: -9.14,
    };
    render(
      <CurrentWeather
        city={city}
        current={{ ...CURRENT, precipitation: 0.1 }}
        unit="celsius"
      />,
    );

    expect(screen.getByText('0,1 mm')).toBeInTheDocument();
  });
});
