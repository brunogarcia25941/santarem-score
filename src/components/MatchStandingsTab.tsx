import React, { useMemo } from 'react';
import { Match } from '@/types';
import { useStandings } from '@/hooks/useStandings';
import { useClubs } from '@/hooks/useClubs';
import { StandingsTable, StandingTableRow } from '@/components/StandingsTable';
import { TableSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';

/**
 * Separador "Tabela" do jogo: a classificação da divisão das duas equipas, com elas em destaque.
 * Só é montado (e só pede os dados) quando o separador é aberto.
 */
export function MatchStandingsTab({ match }: { match: Match }) {
  const { standings, loading } = useStandings();
  const { clubs } = useClubs();
  const division = match.homeClub.division;

  const rows = useMemo(
    () => standings.filter((r) => r.division === division) as unknown as StandingTableRow[],
    [standings, division]
  );
  const badgeById = useMemo(() => Object.fromEntries(clubs.map((c) => [c.id, c.badgeUrl])), [clubs]);

  if (loading) return <TableSkeleton rows={8} />;
  if (rows.length === 0) {
    return <EmptyState compact icon="podium-outline" title="Sem classificação" subtitle="Ainda não há jogos terminados nesta divisão." />;
  }
  return (
    <StandingsTable rows={rows} division={division} badgeById={badgeById} highlightIds={[match.homeClub.id, match.awayClub.id]} />
  );
}
