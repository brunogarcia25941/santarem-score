import { RefObject } from 'react';
import { View } from 'react-native';
import { Match } from '@/types';

export interface Origin {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MatchTransitionOrigin {
  scoreboard?: Origin;
  homeBadge?: Origin;
  awayBadge?: Origin;
  // Cópia dos dados do jogo já disponíveis na lista, para o ecrã de
  // detalhe poder desenhar-se de imediato (placar, emblemas, nomes) em
  // vez de mostrar um spinner de página inteira enquanto vai buscar os
  // mesmos dados outra vez ao Supabase — isso é o que estava a atrasar
  // (e a estragar o efeito de) a animação FLIP.
  initialMatch?: Match;
}

// Guarda temporariamente as posições medidas na Home/lista, para o ecrã
// do jogo poder "continuar" a animação a partir delas (técnica FLIP),
// em vez de usar shared element transitions — que não são fiáveis com o
// native-stack do expo-router e estragariam o gesto nativo de deslizar
// para trás no iOS.
let pending: MatchTransitionOrigin | null = null;

export function setMatchTransitionOrigin(origin: MatchTransitionOrigin) {
  pending = origin;
}

// Consome (lê e limpa) a origem guardada. Só deve ser chamado uma vez,
// à entrada do ecrã do jogo — se o utilizador voltar atrás e abrir outro
// jogo, uma nova origem terá sido guardada antes de lá chegar.
export function consumeMatchTransitionOrigin(): MatchTransitionOrigin | null {
  const value = pending;
  pending = null;
  return value;
}

// Mede a posição absoluta (no ecrã) de uma View referenciada, devolvendo
// uma Promise para poder ser usada com Promise.all antes de navegar.
export function measureView(ref: RefObject<View | null>): Promise<Origin | undefined> {
  return new Promise((resolve) => {
    if (!ref.current) {
      resolve(undefined);
      return;
    }
    ref.current.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0) {
        resolve(undefined);
        return;
      }
      resolve({ x, y, width, height });
    });
  });
}
