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
  matchDate: string;
}