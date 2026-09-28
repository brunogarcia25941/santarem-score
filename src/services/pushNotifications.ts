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
 * próprio token (RLS deixa qualquer um escrever a sua, sem SELECT público —
 * ver migração `push_tokens_rls_e_pg_net`).
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
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

  const { error } = await supabase.from('push_tokens').upsert(
    {
      expo_push_token: token,
      club_ids: favoriteClubIds,
      platform: Platform.OS,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' }
  );

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
  await supabase.from('push_tokens').delete().eq('expo_push_token', token);
}
