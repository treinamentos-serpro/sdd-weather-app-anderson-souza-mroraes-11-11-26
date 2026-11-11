import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import ForecastList from '../../src/components/ForecastList';
import type { ForecastDay, ForecastHour } from '../../src/types/weather';

const FORECAST: ForecastDay[] = [
  { date: '2026-06-16', min: 10, max: 20, weatherCode: 0, precipitationProbability: 10 },
  { date: '2026-06-17', min: 11, max: 21, weatherCode: 1, precipitationProbability: 20 },
  { date: '2026-06-18', min: 12, max: 22, weatherCode: 2, precipitationProbability: 30 },
  { date: '2026-06-19', min: 13, max: 23, weatherCode: 3, precipitationProbability: 40 },
  { date: '2026-06-20', min: 14, max: 24, weatherCode: 61, precipitationProbability: 50 },
];

const HOURLY_FORECAST: ForecastHour[] = [
  {
    time: '2026-06-16T06:00',
    temperature: 9,
    weatherCode: 0,
    precipitationProbability: 0,
    precipitation: 0,
    windSpeed: 4,
    humidity: 60,
  },
  {
    time: '2026-06-17T00:00',
    temperature: 12,
    weatherCode: 1,
    precipitationProbability: null,
    precipitation: null,
    windSpeed: null,
    humidity: null,
  },
  {
    time: '2026-06-17T12:00',
    temperature: 18,
    weatherCode: 3,
    precipitationProbability: 20,
    precipitation: 0.1,
    windSpeed: 8,
    humidity: 72,
  },
];

describe('ForecastList', () => {
  it('apresenta os cinco dias e suas temperaturas na unidade escolhida', () => {
    render(<ForecastList forecast={FORECAST} unit="fahrenheit" />);

    const region = screen.getByRole('region', { name: /previsão de 5 dias/i });
    expect(within(region).getAllByRole('listitem')).toHaveLength(5);
    expect(within(region).getByText('68°')).toBeInTheDocument();
    expect(within(region).getByText('50°')).toBeInTheDocument();
  });

  it('renderiza uma previsão vazia sem lançar erro', () => {
    render(<ForecastList forecast={[]} unit="celsius" />);
    expect(screen.getByRole('region', { name: /previsão de 5 dias/i })).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('expande por teclado somente as horas da data selecionada', async () => {
    const user = userEvent.setup();
    render(<ForecastList forecast={FORECAST} hourlyForecast={HOURLY_FORECAST} unit="celsius" />);

    await user.tab();
    await user.tab();
    const tomorrowButton = screen.getByRole('button', { name: /ver horários de amanhã/i });
    expect(tomorrowButton).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(tomorrowButton).toHaveAttribute('aria-expanded', 'true');
    const hourlyRegion = screen.getByRole('region', { name: /previsão horária de amanhã/i });
    expect(within(hourlyRegion).getByText('00:00')).toBeInTheDocument();
    expect(within(hourlyRegion).getByText('12:00')).toBeInTheDocument();
    expect(within(hourlyRegion).queryByText('06:00')).not.toBeInTheDocument();
    expect(within(hourlyRegion).getAllByText('—')).toHaveLength(4);
  });

  it('informa quando o dia selecionado não tem dados horários', async () => {
    const user = userEvent.setup();
    render(<ForecastList forecast={FORECAST} hourlyForecast={[]} unit="celsius" />);

    await user.click(screen.getByRole('button', { name: /ver horários de hoje/i }));

    expect(screen.getByRole('region', { name: /previsão horária de hoje/i })).toHaveTextContent(
      'Sem dados horários disponíveis.',
    );
  });

  it('mantém um dia aberto por vez e permite recolhê-lo', async () => {
    const user = userEvent.setup();
    render(<ForecastList forecast={FORECAST} hourlyForecast={HOURLY_FORECAST} unit="celsius" />);
    const todayButton = screen.getByRole('button', { name: /ver horários de hoje/i });
    const tomorrowButton = screen.getByRole('button', { name: /ver horários de amanhã/i });

    await user.click(todayButton);
    expect(todayButton).toHaveAttribute('aria-expanded', 'true');

    await user.click(tomorrowButton);
    expect(todayButton).toHaveAttribute('aria-expanded', 'false');
    expect(tomorrowButton).toHaveAttribute('aria-expanded', 'true');

    await user.click(screen.getByRole('button', { name: /ocultar horários de amanhã/i }));
    expect(screen.queryByRole('region', { name: /previsão horária de amanhã/i })).toBeNull();
  });
});
