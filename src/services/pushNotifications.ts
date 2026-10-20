import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

const PUSH_PREFS_KEY = '@santarem_score:push_prefs';
const LEGACY_PUSH_ENABLED_KEY = '@santarem_score:push_enabled'; // versão antiga: um só switch (golos)

/** O que o utilizador quer receber (independente da permissão do sistema). */
export interface PushPrefs {
  goals: boolean; // golos, autogolos e cartões
  start: boolean; // início de jogo
  end: boolean; // fim de jogo
}

const NO_PREFS: PushPrefs = { goals: false, start: false, end: false };

export const anyPushEnabled = (p: PushPrefs) => p.goals || p.start || p.end;

export async function getPushPrefs(): Promise<PushPrefs> {
  const raw = await AsyncStorage.getItem(PUSH_PREFS_KEY);
  if (raw) {
    try {
      return { ...NO_PREFS, ...JSON.parse(raw) };
    } catch {
      return NO_PREFS;
    }
  }
  // Migração: quem tinha o switch antigo ligado mantém os golos.
  const legacy = await AsyncStorage.getItem(LEGACY_PUSH_ENABLED_KEY);
  return legacy === 'true' ? { ...NO_PREFS, goals: true } : NO_PREFS;
}

export async function setPushPrefs(prefs: PushPrefs): Promise<void> {
  await AsyncStorage.setItem(PUSH_PREFS_KEY, JSON.stringify(prefs));
}

/**
 * Push (golos dos clubes favoritos). Só funciona numa build real (EAS) —
 * o Expo Go não tem os módulos nativos de push desta app. `push_tokens` não
 * está ligada a uma conta: cada aparelho tem a sua linha, identificada pelo
 * próprio token; a escrita passa por register_push_token (a tabela é
 * ilegível/inescrevível diretamente — ver migração `push_tokens_via_funcoes`).
 */

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Com a app aberta o RealtimeGoalWatcher já mostra o seu próprio banner para
    // golos e cartões (mostrar também o do sistema duplicava o aviso). Início e
    // fim de jogo não têm banner próprio, por isso esses aparecem pelo sistema.
    const type = notification.request.content.data?.type;
    const show = type === 'MATCH_START' || type === 'MATCH_END';
    return {
      shouldShowAlert: show,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: show,
      shouldShowList: show,
    };
  },
});

let cachedToken: string | null = null;

async function getExpoPushToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  if (!Device.isDevice) return null; // emuladores não têm push

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) return null; // build sem EAS configurado (ex.: Expo Go)

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    cachedToken = data;
    return data;
  } catch (err) {
    console.error('Erro a obter o push token:', err);
    return null;
  }
}

/**
 * Pede permissão (se preciso) e sincroniza o token com os clubes favoritos
 * atuais. Chamado no arranque e sempre que os favoritos mudam.
 */
export async function syncPushToken(favoriteClubIds: string[], prefs: PushPrefs): Promise<boolean> {
  const token = await getExpoPushToken();
  if (!token) return false;

  // Escrita via função SECURITY DEFINER: um upsert direto exigiria política
  // de SELECT, que deixaria qualquer app listar os tokens de todos.
  const { error } = await supabase.rpc('register_push_token', {
    p_token: token,
    p_club_ids: favoriteClubIds,
    p_platform: Platform.OS,
    p_notify_goals: prefs.goals,
    p_notify_start: prefs.start,
    p_notify_end: prefs.end,
  });

  if (error) {
    console.error('Erro a sincronizar push token:', error);
    return false;
  }
  return true;
}

/** Estado atual da permissão, sem pedir nada ao utilizador. */
export async function getPushPermissionStatus(): Promise<Notifications.PermissionStatus | 'unsupported'> {
  if (!Device.isDevice) return 'unsupported';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/** Remove o token deste aparelho (utilizador desligou as notificações). */
export async function disablePushToken(): Promise<void> {
  const token = cachedToken ?? (await Notifications.getExpoPushTokenAsync().catch(() => null))?.data;
  if (!token) return;
  await supabase.rpc('unregister_push_token', { p_token: token });
}
