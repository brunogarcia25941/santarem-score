import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';
import { track } from './analytics';

const PUSH_PREFS_KEY = '@santarem_score:push_prefs';
const LEGACY_PUSH_ENABLED_KEY = '@santarem_score:push_enabled'; // versão antiga: um só switch (golos)
const ASKED_KEY = '@santarem_score:push_asked'; // já se pediu a permissão na 1.ª abertura

/** O que o utilizador quer receber (independente da permissão do sistema). */
export interface PushPrefs {
  goals: boolean; // golos, autogolos e cartões
  start: boolean; // início de jogo
  end: boolean; // fim de jogo
}

const NO_PREFS: PushPrefs = { goals: false, start: false, end: false };
/** Por predefinição os três avisos vêm ligados (só chegam se o telemóvel der permissão). */
export const DEFAULT_PREFS: PushPrefs = { goals: true, start: true, end: true };

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
  // Quem tinha desligado o switch antigo continua sem avisos; os restantes ficam com tudo ligado.
  const legacy = await AsyncStorage.getItem(LEGACY_PUSH_ENABLED_KEY);
  return legacy === 'false' ? NO_PREFS : DEFAULT_PREFS;
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
    track('notification.received', { type: type ?? null, foreground: true });
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

/**
 * No Android 13+ o pedido de permissão do sistema só aparece depois de existir pelo menos um
 * canal de notificações, por isso o canal cria-se ANTES de pedir.
 */
async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.HIGH,
  });
}

/**
 * Pede a permissão com a janela do próprio telemóvel. `canAskAgain: false` quer dizer que o
 * sistema já não volta a mostrar a janela (foi recusada antes): só dá para mudar nas definições.
 */
export async function requestPushPermission(): Promise<{ granted: boolean; canAskAgain: boolean }> {
  if (!Device.isDevice) return { granted: false, canAskAgain: false };
  try {
    await ensureAndroidChannel();
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return { granted: true, canAskAgain: true };
    if (current.canAskAgain === false) return { granted: false, canAskAgain: false };
    const answer = await Notifications.requestPermissionsAsync();
    track('push.permission', { status: answer.status });
    return { granted: answer.status === 'granted', canAskAgain: answer.canAskAgain !== false };
  } catch (err) {
    console.error('Erro a pedir permissão de notificações:', err);
    return { granted: false, canAskAgain: false };
  }
}

/**
 * Na primeira abertura da app pede logo a permissão (sem janela própria antes). Só uma vez:
 * depois, quem quiser usa "Não estás a receber notificações?" no Perfil.
 */
export async function askPushPermissionOnFirstLaunch(favoriteClubIds: string[]): Promise<void> {
  if (await AsyncStorage.getItem(ASKED_KEY)) return;
  await AsyncStorage.setItem(ASKED_KEY, 'true');
  const { granted } = await requestPushPermission();
  if (!granted) return;
  const prefs = await getPushPrefs();
  await setPushPrefs(prefs);
  if (anyPushEnabled(prefs)) await syncPushToken(favoriteClubIds, prefs);
}

/** Token deste aparelho. Nunca pede permissão: sem ela devolve null. */
async function getExpoPushToken(): Promise<string | null> {
  if (cachedToken) return cachedToken;
  if (!Device.isDevice) return null; // emuladores não têm push

  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;
  await ensureAndroidChannel();

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
 * Sincroniza o token com os clubes favoritos e as preferências. Não pede permissão (para
 * isso há `requestPushPermission`). Chamado no arranque, quando os favoritos mudam e depois
 * de se dar permissão.
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
    track('push.register', { ok: false, code: (error as any).code ?? null });
    return false;
  }
  track('push.register', { ok: true, favorites: favoriteClubIds.length, goals: prefs.goals, start: prefs.start, end: prefs.end });
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
  track('push.unregister');
}
