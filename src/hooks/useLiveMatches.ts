import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { mapClub } from '@/services/clubs';
import { Match } from '@/types';

export function useLiveMatches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
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
        homeClub: mapClub(Array.isArray(m.home_club) ? m.home_club[0] : m.home_club),
        awayClub: mapClub(Array.isArray(m.away_club) ? m.away_club[0] : m.away_club),
        homeScore: m.home_score,
        awayScore: m.away_score,
        status: m.status,
        minute: m.minute,
        matchDate: m.match_date,
      }));
      setMatches(formatted);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMatches();

    // Cria um identificador único para o canal evitar colisões no mount/unmount do React
    const channelId = `live-matches-${Math.random().toString(36).substring(2, 9)}`;
    const channel = supabase.channel(channelId);

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches' },
        () => {
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMatches]);

  return { matches, loading, refresh: fetchMatches };
}
