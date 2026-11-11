import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ForecastCard from '../../src/components/ForecastCard';
import type { ForecastDay } from '../../src/types/weather';

const DAY: ForecastDay = {
  date: '2026-06-18',
  min: 10,
  max: 20,
  weatherCode: 61,
  precipitationProbability: 40,
};

describe('ForecastCard', () => {
  it('apresenta data, condição, temperaturas e precipitação na unidade selecionada', () => {
    render(
      <ForecastCard
        day={DAY}
        index={2}
        unit="fahrenheit"
        isExpanded={false}
        onToggle={() => {}}
      />,
    );

    expect(screen.getByText('Qui')).toBeInTheDocument();
    expect(screen.getByText('18 Jun')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Chuva fraca' })).toBeInTheDocument();
    expect(screen.getByText('68°')).toBeInTheDocument();
    expect(screen.getByText('50°')).toBeInTheDocument();
    expect(screen.getByText(/40%/)).toBeInTheDocument();
  });

  it('distingue probabilidade indisponível de uma chance real de zero', () => {
    const { rerender } = render(
      <ForecastCard
        day={{ ...DAY, precipitationProbability: null }}
        index={2}
        unit="celsius"
        isExpanded={false}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByText('—')).toBeInTheDocument();

    rerender(
      <ForecastCard
        day={{ ...DAY, precipitationProbability: 0 }}
        index={2}
        unit="celsius"
        isExpanded={false}
        onToggle={() => {}}
      />,
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
