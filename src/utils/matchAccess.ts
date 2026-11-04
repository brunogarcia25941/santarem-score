import { Match } from '@/types';

/** Depois do fim do jogo o delegado ainda pode corrigir durante este tempo; o admin, sempre. */
export const CORRECTION_WINDOW_MS = 60 * 60 * 1000;

/**
 * Espelho de `moderator_window_open` na base de dados (que é quem garante a
 * regra; isto só decide o que mostrar). Jogo por terminar → aberta; terminado
 * → só na hora a seguir ao fim. Jogos terminados sem `finishedAt` (registados
 * à mão antes desta regra) ficam fechados para delegados.
 */
export function withinCorrectionWindow(match: Pick<Match, 'status' | 'finishedAt'>, now: number = Date.now()): boolean {
  if (match.status !== 'finished') return true;
  if (!match.finishedAt) return false;
  return now - Date.parse(match.finishedAt) < CORRECTION_WINDOW_MS;
}

interface Role {
  isAdmin: boolean;
  /** Delegado de uma das duas equipas do jogo. */
  isDelegate: boolean;
}

/** O painel do delegado (e tudo o que está lá dentro) está disponível? */
export function canUsePanel(match: Pick<Match, 'status' | 'finishedAt'>, role: Role, now?: number): boolean {
  if (role.isAdmin) return true;
  return role.isDelegate && withinCorrectionWindow(match, now);
}

/**
 * "Registar/Corrigir resultado": admin em qualquer jogo, sempre; delegado só
 * num jogo terminado há menos de 1 hora.
 */
export function canEditResult(match: Pick<Match, 'status' | 'finishedAt'>, role: Role, now?: number): boolean {
  if (role.isAdmin) return true;
  return role.isDelegate && match.status === 'finished' && withinCorrectionWindow(match, now);
}
