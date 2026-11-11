import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CityResults from '../../src/components/CityResults';
import type { City } from '../../src/types/weather';

const CITIES: City[] = [
  {
    id: 1,
    name: 'Springfield',
    country: 'Estados Unidos',
    admin1: 'Illinois',
    latitude: 39.8,
    longitude: -89.6,
  },
  {
    id: 2,
    name: 'Springfield',
    country: 'Estados Unidos',
    admin1: 'Massachusetts',
    latitude: 42.1,
    longitude: -72.6,
  },
];

describe('CityResults', () => {
  it('desambigua homônimos e permite selecionar por teclado', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CityResults cities={CITIES} onSelect={onSelect} />);

    const illinois = screen.getByRole('button', {
      name: 'Springfield, Illinois, Estados Unidos',
    });
    expect(
      screen.getByRole('button', { name: 'Springfield, Massachusetts, Estados Unidos' }),
    ).toBeInTheDocument();

    await user.tab();
    expect(illinois).toHaveFocus();
    await user.keyboard('{Enter}');

    expect(onSelect).toHaveBeenCalledWith(CITIES[0]);
  });

  it('expõe cidade selecionada e bloqueia seleção durante loading', () => {
    render(<CityResults cities={CITIES} selectedCityId={2} disabled onSelect={() => {}} />);

    expect(
      screen.getByRole('button', { name: 'Springfield, Massachusetts, Estados Unidos' }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(
      screen.getByRole('button', { name: 'Springfield, Illinois, Estados Unidos' }),
    ).toBeDisabled();
  });

  it('indica quando o resultado não tem contexto geográfico', () => {
    const city: City = { ...CITIES[0], country: '', admin1: undefined };
    render(<CityResults cities={[city]} onSelect={vi.fn()} />);

    expect(screen.getByText('Localização não informada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Springfield' })).toBeInTheDocument();
  });
});
