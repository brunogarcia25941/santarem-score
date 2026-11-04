export interface Club {
  id: string;
  name: string;
  shortName: string;
  initials: string;
  division: '1_divisao' | '2_divisao_a' | '2_divisao_b';
  primaryColor: string;
  secondaryColor: string;
  stadiumName: string;
  latitude: number;
  longitude: number;
  badgeUrl?: string;
}

export interface Match {
  id: string;
  competition: string;
  round: string;
  homeClub: Club;
  awayClub: Club;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'live' | 'halftime' | 'finished' | 'postponed' | 'interrupted';
  minute?: number;
  /** Quando a parte atual começou (hora do servidor); null fora de jogo. */
  periodStartedAt?: string | null;
  /** Minuto de onde a parte atual parte: 0 na 1.ª parte, 45 na 2.ª. */
  minuteOffset?: number;
  /** Hora (servidor) a que o jogo terminou; null em jogos terminados à mão. */
  finishedAt?: string | null;
  matchDate: string;
}