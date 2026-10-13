import { useEffect, useState } from 'react';

/**
 * Devolve a hora atual e volta a renderizar a cada `intervalMs` enquanto
 * `active` — usado para o relógio de jogo andar nos jogos em direto sem
 * gastar nada nos restantes.
 */
export function useNow(active: boolean, intervalMs: number = 15000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);

  return now;
}
