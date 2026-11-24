import { brand } from '@/constants/theme';

/**
 * Zonas da classificação (faixa de cor à esquerda de cada linha):
 *  - 1.ª Divisão: o 1.º sobe; os 2 últimos descem (em princípio).
 *  - 2.ª Divisão (cada série): os 3 primeiros vão ao apuramento de campeão.
 * Valores dados pelo Bruno; dependem do regulamento da prova, por isso a legenda avisa.
 */
export type Zone = 'promotion' | 'playoff' | 'relegation';

export const ZONE_COLORS: Record<Zone, string> = {
  promotion: brand.forest,
  playoff: brand.amber,
  relegation: brand.red,
};

export const ZONE_LABELS: Record<Zone, string> = {
  promotion: 'Subida',
  playoff: 'Apuramento de campeão',
  relegation: 'Descida',
};

/** Zona de um lugar (posição a partir de 1) numa tabela com `total` equipas. */
export function zoneFor(division: string, position: number, total: number): Zone | null {
  if (division === '1_divisao') {
    if (position === 1) return 'promotion';
    // Só marca a descida com a tabela já "composta" (evita pintar tudo no início da época).
    if (total >= 6 && position > total - 2) return 'relegation';
    return null;
  }
  if (division === '2_divisao_a' || division === '2_divisao_b') {
    return position <= 3 ? 'playoff' : null;
  }
  return null;
}

/** Zonas que existem numa divisão, pela ordem em que aparecem na legenda. */
export function zonesOf(division: string): Zone[] {
  return division === '1_divisao' ? ['promotion', 'relegation'] : ['playoff'];
}
