import { useCallback, useEffect, useState } from 'react';
import { fetchClubs } from '@/services/clubs';
import { Club } from '@/types';

/**
 * Fonte única de verdade para os clubes da AF Santarém: vai buscá-los
 * ao Supabase (tabela `clubs`, incluindo `badge_url`). Substitui a
 * antiga lista fixa em src/constants/clubs.ts.
 */
export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchClubs();
      setClubs(data);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar clubes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { clubs, loading, error, refresh: load };
}
