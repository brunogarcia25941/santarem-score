import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import { Match } from '@/types';

export function useLiveMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchMatches() {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id,
        competition,
        round,
        home_score,
        away_score,
        status,
        minute,
        match_date,
        home_club:clubs!matches_home_club_id_fkey(*),
        away_club:clubs!matches_away_club_id_fkey(*)
      `)
      .order('match_date', { ascending: true });

    if (!error && data) {
      const formatted: Match[] = data.map((m: any) => ({
        id: m.id,
        competition: m.competition,
        round: m.round,
        homeClub: m.home_club,
        awayClub: m.away_club,
        homeScore: m.home_score,
        awayScore: m.away_score,
        status: m.status,
        minute: m.minute,
        matchDate: m.match_date,
      }));
      setMatches(formatted);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchMatches();

    // Subscrição em direto aos updates da tabela matches
    const subscription = supabase
      .channel('public:matches')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return { matches, loading, refresh: fetchMatches };
}