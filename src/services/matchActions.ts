import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const QUEUE_KEY = '@santarem_score:offline_events';

type MatchEventInput = {
  matchId: string;
  clubId: string;
  eventType: 'GOAL' | 'OWN_GOAL' | 'YELLOW_CARD' | 'RED_CARD';
  minute: number;
  playerName?: string;
  isPenalty?: boolean;
};

async function insertEvent(event: MatchEventInput) {
  const { data, error } = await supabase
    .from('match_events')
    .insert({
      match_id: event.matchId,
      club_id: event.clubId,
      event_type: event.eventType,
      minute: Number(event.minute) || 0,
      player_name: event.playerName || null,
      is_penalty: Boolean(event.isPenalty),
    })
    .select();

  if (error) throw error;
  return data;
}

async function getQueue(): Promise<MatchEventInput[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function setQueue(queue: MatchEventInput[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function submitMatchEvent(event: MatchEventInput) {
  try {
    const data = await insertEvent(event);
    // Se a submissão direta funcionou e havia eventos antigos em fila,
    // aproveita para tentar despachá-los também.
    syncOfflineQueue().catch(() => {});
    return data;
  } catch (err) {
    console.error('Erro na submissão do evento, a guardar localmente:', err);
    const queue = await getQueue();
    queue.push(event);
    await setQueue(queue);
    throw err;
  }
}

/**
 * Tenta reenviar todos os eventos que ficaram presos no AsyncStorage
 * por falha de rede. Eventos que voltam a falhar mantêm-se na fila
 * para a próxima tentativa; os que forem bem sucedidos saem dela.
 * Seguro para chamar várias vezes seguidas (é idempotente ao nível da fila).
 */
export async function syncOfflineQueue(): Promise<{ synced: number; remaining: number }> {
  const queue = await getQueue();
  if (queue.length === 0) {
    return { synced: 0, remaining: 0 };
  }

  const stillPending: MatchEventInput[] = [];
  let synced = 0;

  for (const event of queue) {
    try {
      await insertEvent(event);
      synced++;
    } catch (err) {
      stillPending.push(event);
    }
  }

  await setQueue(stillPending);

  if (synced > 0) {
    console.log(`[offline-sync] ${synced} evento(s) sincronizado(s), ${stillPending.length} ainda pendente(s).`);
  }

  return { synced, remaining: stillPending.length };
}

export async function getPendingEventCount(): Promise<number> {
  const queue = await getQueue();
  return queue.length;
}
