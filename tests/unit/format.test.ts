import { describe, expect, it } from 'vitest';
import { formatNumber, getDayLabel, getShortDate } from '../../src/lib/format';

describe('format', () => {
  it('rotula o primeiro e o segundo dia', () => {
    expect(getDayLabel('2026-06-16', 0)).toBe('Hoje');
    expect(getDayLabel('2026-06-17', 1)).toBe('Amanhã');
  });

  it('usa dia da semana para os demais', () => {
    // 2026-06-18 é uma quinta-feira.
    expect(getDayLabel('2026-06-18', 2)).toBe('Qui');
  });

  it('formata data curta', () => {
    expect(getShortDate('2026-06-16')).toBe('16 Jun');
  });

  it('usa o primeiro dia do ano quando a data recebida está truncada', () => {
    expect(getShortDate('2026')).toBe('1 Jan');
  });

  it('formata números pt-BR sem alterar zeros', () => {
    expect(formatNumber(0.1)).toBe('0,1');
    expect(formatNumber(0)).toBe('0');
  });
});
