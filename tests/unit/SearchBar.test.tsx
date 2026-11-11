import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

describe('SearchBar', () => {
  it('não dispara busca com input vazio', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('ignora submit manual quando o campo contém apenas espaços', () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    fireEvent.change(screen.getByLabelText(/buscar cidade/i), { target: { value: '   ' } });
    fireEvent.submit(screen.getByRole('search'));
    expect(onSearch).not.toHaveBeenCalled();
  });

  it('dispara busca com o termo digitado', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await userEvent.type(screen.getByLabelText(/buscar cidade/i), 'Lisboa');
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(onSearch).toHaveBeenCalledWith('Lisboa');
  });

  it('remove espaços externos antes de buscar', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    await userEvent.type(screen.getByLabelText(/buscar cidade/i), '  São Paulo  ');
    await userEvent.click(screen.getByRole('button', { name: /buscar/i }));
    expect(onSearch).toHaveBeenCalledWith('São Paulo');
  });

  it('desabilita o campo e o envio enquanto carrega', () => {
    render(<SearchBar onSearch={vi.fn()} disabled />);
    expect(screen.getByLabelText(/buscar cidade/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /buscar/i })).toBeDisabled();
  });
});
