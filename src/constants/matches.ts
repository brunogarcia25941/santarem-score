import { Match } from '@/types';
import { SANTARÉM_CLUBS } from './clubs';

const getClub = (id: string) => SANTARÉM_CLUBS.find((c) => c.id === id)!;

export const MOCK_MATCHES: Match[] = [
  {
    id: 'match-1',
    competition: '1.ª Divisão Distrital',
    round: 'Jornada 12',
    homeClub: getClub('uniao-tomar'),
    awayClub: getClub('torres-novas'),
    homeScore: 2,
    awayScore: 1,
    status: 'live',
    minute: 68,
    matchDate: 'Hoje, 15:00',
  },
  {
    id: 'match-2',
    competition: '1.ª Divisão Distrital',
    round: 'Jornada 12',
    homeClub: getClub('samora-correia'),
    awayClub: getClub('abrantes-benfica'),
    homeScore: 0,
    awayScore: 0,
    status: 'live',
    minute: 42,
    matchDate: 'Hoje, 15:00',
  },
  {
    id: 'match-3',
    competition: '1.ª Divisão Distrital',
    round: 'Jornada 12',
    homeClub: getClub('riachense'),
    awayClub: getClub('fatima'),
    homeScore: 1,
    awayScore: 3,
    status: 'finished',
    matchDate: 'Ontem, 16:00',
  },
  {
    id: 'match-4',
    competition: '2.ª Divisão Série B',
    round: 'Jornada 9',
    homeClub: getClub('atalaiense'),
    awayClub: getClub('ferreira-zezere'),
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
    matchDate: 'Domingo, 15:30',
  },
];