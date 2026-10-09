import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { supabase } from './supabase';

const PUSH_ENABLED_KEY = '@santarem_score:push_enabled';

/** Preferência local (independente da permissão do sistema): o utilizador pediu para receber golos dos favoritos. */
export async function isPushEnabledLocally(): Promise<boolean> {
  return (await AsyncStorage.getItem(PUSH_ENABLED_KEY)) === 'true';
}

export async function setPushEnabledLocally(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(PUSH_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Push (golos dos clubes favoritos). Só funciona numa build real (EAS) —
 * o Expo Go não tem os módulos nativos de push desta app. `push_tokens` não
 * está ligada a uma conta: cada aparelho tem a sua linha, identificada pelo
 * próprio token; a escrita passa por register_push_token (a tabela é
 * ilegível/inescrevível diretamente — ver migração `push_tokens_via_funcoes`).
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // Com a app aberta o RealtimeGoalWatcher já mostra o seu próprio banner;
    // mostrar também o do sistema duplicava o aviso.
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
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
export async function syncPushToken(favoriteClubIds: string[]): Promise<boolean> {
  const token = await getExpoPushToken();
  if (!token) return false;

  // Escrita via função SECURITY DEFINER: um upsert direto exigiria política
  // de SELECT, que deixaria qualquer app listar os tokens de todos.
  const { error } = await supabase.rpc('register_push_token', {
    p_token: token,
    p_club_ids: favoriteClubIds,
    p_platform: Platform.OS,
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
