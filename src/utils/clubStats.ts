import { Match } from '@/types';

export type FormResult = 'V' | 'E' | 'D';

export interface SplitRecord {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface ClubStats {
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
  /** Últimos jogos, do mais antigo para o mais recente (máx. 5). */
  form: { result: FormResult; match: Match }[];
  home: SplitRecord;
  away: SplitRecord;
  cleanSheets: number;
  failedToScore: number;
  biggestWin: Match | null;
  biggestLoss: Match | null;
}

const emptySplit = (): SplitRecord => ({ played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0 });

/**
 * Estatísticas de um clube calculadas a partir dos jogos terminados. Calcula-se no
 * cliente porque a lista de jogos já está carregada (useLiveMatches) e assim os
 * números nunca divergem dos resultados que o utilizador vê no ecrã.
 */
export function computeClubStats(clubId: string, matches: Match[]): ClubStats {
  const finished = matches
    .filter((m) => m.status === 'finished' && (m.homeClub.id === clubId || m.awayClub.id === clubId))
    .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

  const stats: ClubStats = {
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    points: 0,
    form: [],
    home: emptySplit(),
    away: emptySplit(),
    cleanSheets: 0,
    failedToScore: 0,
    biggestWin: null,
    biggestLoss: null,
  };

  let bestDiff = 0;
  let worstDiff = 0;

  for (const m of finished) {
    const isHome = m.homeClub.id === clubId;
    const gf = isHome ? m.homeScore : m.awayScore;
    const ga = isHome ? m.awayScore : m.homeScore;
    const result: FormResult = gf > ga ? 'V' : gf === ga ? 'E' : 'D';
    const split = isHome ? stats.home : stats.away;

    for (const s of [stats, split]) {
      s.played += 1;
      s.goalsFor += gf;
      s.goalsAgainst += ga;
      if (result === 'V') s.won += 1;
      else if (result === 'E') s.drawn += 1;
      else s.lost += 1;
    }

    if (ga === 0) stats.cleanSheets += 1;
    if (gf === 0) stats.failedToScore += 1;
    if (gf - ga > bestDiff) {
      bestDiff = gf - ga;
      stats.biggestWin = m;
    }
    if (ga - gf > worstDiff) {
      worstDiff = ga - gf;
      stats.biggestLoss = m;
    }
    stats.form.push({ result, match: m });
  }

  stats.points = stats.won * 3 + stats.drawn;
  stats.form = stats.form.slice(-5);
  return stats;
}
