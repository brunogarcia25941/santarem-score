import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

export interface StandingRow {
  club_id: string;
  division: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

/**
 * Vai buscar a view `standings` inteira (todas as divisões) para se
 * poder calcular a posição de qualquer clube na tabela sem uma
 * chamada por clube. Ordenada tal como a view já devolve (pontos,
 * depois diferença de golos, depois golos marcados).
 */
export function useStandings() {
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('standings').select('*');
    if (!error && data) {
      setStandings(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function getClubStanding(clubId: string, division: string) {
    const divisionRows = standings.filter((r) => r.division === division);
    const index = divisionRows.findIndex((r) => r.club_id === clubId);
    if (index === -1) return null;
    return { position: index + 1, total: divisionRows.length, row: divisionRows[index] };
  }

  return { standings, loading, refresh: load, getClubStanding };
}
