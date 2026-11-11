import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import EmptyState from '../../src/components/states/EmptyState';
import ErrorState from '../../src/components/states/ErrorState';
import LoadingState from '../../src/components/states/LoadingState';

describe('estados da interface', () => {
  it('renderiza o estado vazio com ou sem orientação', () => {
    const { rerender } = render(<EmptyState title="Nenhum resultado" hint="Tente outra busca." />);
    expect(screen.getByText('Nenhum resultado')).toBeInTheDocument();
    expect(screen.getByText('Tente outra busca.')).toBeInTheDocument();

    rerender(<EmptyState title="Ainda sem busca" />);
    expect(screen.getByText('Ainda sem busca')).toBeInTheDocument();
    expect(screen.queryByText('Tente outra busca.')).not.toBeInTheDocument();
  });

  it('expõe carregamento como status ao vivo', () => {
    render(<LoadingState />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText(/carregando o clima/i)).toBeInTheDocument();
  });

  it('expõe erro e aciona nova tentativa', async () => {
    const onRetry = vi.fn();
    render(<ErrorState message="Falha de rede" onRetry={onRetry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede');

    await userEvent.click(screen.getByRole('button', { name: /tentar novamente/i }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
