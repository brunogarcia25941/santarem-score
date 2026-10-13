import { Match } from '@/types';

type ClockMatch = Pick<Match, 'status' | 'minute' | 'periodStartedAt' | 'minuteOffset'>;

/**
 * Minuto de jogo a mostrar. Com o jogo a decorrer calcula-se a partir de
 * quando a parte começou (hora do servidor, definida em `set_match_period`),
 * por isso o relógio anda sozinho em todos os aparelhos sem ninguém ter de o
 * atualizar. Convenção do futebol: 0:00–0:59 é o minuto 1. Acréscimos
 * continuam a contar (47', 93'...).
 *
 * Jogos "ao vivo" antigos, sem `periodStartedAt`, usam o minuto guardado.
 */
export function currentMinute(match: ClockMatch, now: number = Date.now()): number | undefined {
  if (match.status === 'halftime') return 45;
  if (match.status !== 'live') return match.minute;

  if (!match.periodStartedAt) return match.minute;
  const started = Date.parse(match.periodStartedAt);
  if (Number.isNaN(started)) return match.minute;

  const elapsedMinutes = Math.max(0, Math.floor((now - started) / 60000));
  return (match.minuteOffset ?? 0) + elapsedMinutes + 1;
}
