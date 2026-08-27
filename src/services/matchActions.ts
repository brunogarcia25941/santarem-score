import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const QUEUE_KEY = '@santarem_score:offline_events';

export async function submitMatchEvent(event: {
  matchId: string;
  clubId: string;
  eventType: 'GOAL' | 'OWN_GOAL' | 'YELLOW_CARD' | 'RED_CARD';
  minute: number;
  playerName?: string;
  isPenalty?: boolean;
}) {
  try {
    const { error } = await supabase.from('match_events').insert({
      match_id: event.matchId,
      club_id: event.clubId,
      event_type: event.eventType,
      minute: event.minute,
      player_name: event.playerName,
      is_penalty: event.isPenalty,
    });

    if (error) throw error;
  } catch (err) {
    // Guarda na fila local se não houver ligação
    const queue = JSON.parse((await AsyncStorage.getItem(QUEUE_KEY)) || '[]');
    queue.push(event);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }
}