import { useEffect } from 'react';
import { track } from '@/services/analytics';

/**
 * Regista o que se pesquisou, mas só depois de o utilizador parar de escrever (1 s), para não
 * guardar uma linha por letra. Só pesquisas com 2+ caracteres; o texto é cortado aos 40.
 */
export function useTrackSearch(query: string, results: number, source: string) {
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) return;
    const t = setTimeout(() => track('search', { q: q.slice(0, 40), results, source }), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);
}
