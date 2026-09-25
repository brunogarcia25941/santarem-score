import { Match } from '@/types';

export interface MatchGroup {
  key: string;
  label: string;
  matches: Match[];
  firstDate: number;
  lastDate: number;
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

// Um jogo dura cerca de 2h; damos folga para ainda contar como "jornada atual" depois do apito final.
const GRACE_MS = 3 * 60 * 60 * 1000;

function weekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // segunda-feira
  return d;
}

/**
 * Agrupa jogos para a lista do Início. Numa competição concreta agrupa por
 * jornada; em "Todas" agrupa por semana, porque cada divisão tem as suas
 * jornadas em datas diferentes e "Jornada 3" não quer dizer o mesmo em todas.
 * Devolve os grupos por ordem cronológica.
 */
export function groupMatches(matches: Match[], byWeek: boolean): MatchGroup[] {
  const map = new Map<string, MatchGroup>();

  for (const m of matches) {
    const time = new Date(m.matchDate).getTime();
    const start = weekStart(new Date(m.matchDate));
    const key = byWeek ? start.toISOString() : m.round;
    const label = byWeek ? `Semana de ${start.getDate()} ${MONTHS[start.getMonth()]}` : m.round;

    const group = map.get(key);
    if (group) {
      group.matches.push(m);
      group.firstDate = Math.min(group.firstDate, time);
      group.lastDate = Math.max(group.lastDate, time);
    } else {
      map.set(key, { key, label, matches: [m], firstDate: time, lastDate: time });
    }
  }

  return [...map.values()].sort((a, b) => a.firstDate - b.firstDate);
}

/** Primeiro grupo que ainda não terminou; se todos já passaram, o último. */
export function defaultGroupIndex(groups: MatchGroup[], now: number = Date.now()): number {
  const index = groups.findIndex((g) => g.lastDate + GRACE_MS >= now);
  return index === -1 ? Math.max(groups.length - 1, 0) : index;
}
