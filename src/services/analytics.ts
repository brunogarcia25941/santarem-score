import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { supabase } from './supabase';

/**
 * Registo de utilização. Cada aparelho tem um identificador aleatório (não é o IMEI nem nada
 * do aparelho; apaga-se ao desinstalar) e envia eventos em lotes para `log_app_events`. Quando
 * há sessão de delegado, o servidor associa o utilizador pelo token (nunca vem do cliente).
 * Pode ser desligado no Perfil (`setAnalyticsEnabled(false)`): nesse caso nada é enviado.
 *
 * Nunca pode partir a app: tudo aqui apanha os próprios erros.
 */

const DEVICE_KEY = '@santarem_score:device_id';
const ENABLED_KEY = '@santarem_score:analytics_enabled';
const FLUSH_EVERY_MS = 30_000;
const FLUSH_AT = 20;
const MAX_QUEUE = 300;
const BATCH = 50;

interface QueuedEvent {
  event: string;
  t: number;
  screen?: string;
  props?: Record<string, unknown>;
}

function uuid(): string {
  const c = (globalThis as any).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = Math.floor(Math.random() * 16);
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

let deviceId: string | null = null;
let sessionId = uuid();
let enabled = true;
let ready = false;
let queue: QueuedEvent[] = [];
let currentScreen: string | undefined;
let timer: ReturnType<typeof setInterval> | null = null;
let flushing = false;

export async function initAnalytics(): Promise<void> {
  if (ready) return;
  try {
    deviceId = await AsyncStorage.getItem(DEVICE_KEY);
    if (!deviceId) {
      deviceId = uuid();
      await AsyncStorage.setItem(DEVICE_KEY, deviceId);
    }
    enabled = (await AsyncStorage.getItem(ENABLED_KEY)) !== 'false';
  } catch {
    // sem armazenamento: usa um id só desta sessão
    deviceId = deviceId ?? uuid();
  }
  ready = true;
  if (!timer) timer = setInterval(() => void flush(), FLUSH_EVERY_MS);
  if (queue.length >= FLUSH_AT) void flush();
}

export async function getAnalyticsEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ENABLED_KEY)) !== 'false';
  } catch {
    return true;
  }
}

export async function setAnalyticsEnabled(value: boolean): Promise<void> {
  if (!value) {
    // regista o pedido antes de desligar, para ficar escrito que o utilizador optou por sair
    track('analytics.opt_out');
    await flush();
  }
  enabled = value;
  if (!value) queue = [];
  try {
    await AsyncStorage.setItem(ENABLED_KEY, value ? 'true' : 'false');
  } catch {
    // ignora
  }
  if (value) track('analytics.opt_in');
}

/** Ecrã atual: vai junto de todos os eventos seguintes. */
export function setScreen(name: string | undefined) {
  currentScreen = name;
}

export function newSession() {
  sessionId = uuid();
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!enabled) return;
  queue.push({ event, t: Date.now(), screen: currentScreen, props });
  if (queue.length > MAX_QUEUE) queue = queue.slice(queue.length - MAX_QUEUE);
  if (ready && queue.length >= FLUSH_AT) void flush();
}

/** Erros apanhados (rede, base de dados...) com o contexto onde aconteceram. */
export function trackError(context: string, err: unknown, extra?: Record<string, unknown>) {
  const e: any = err;
  track('error.caught', {
    context,
    message: String(e?.message ?? e ?? '').slice(0, 300),
    code: e?.code ?? undefined,
    ...extra,
  });
}

export async function flush(): Promise<void> {
  if (!enabled || !ready || !deviceId || flushing || queue.length === 0) return;
  flushing = true;
  const batch = queue.slice(0, BATCH);
  queue = queue.slice(batch.length);
  try {
    const { error } = await supabase.rpc('log_app_events', {
      p_device_id: deviceId,
      p_session_id: sessionId,
      p_app_version: Constants.expoConfig?.version ?? null,
      p_platform: Platform.OS,
      p_os_version: String(Platform.Version ?? ''),
      p_events: batch,
    });
    if (error) throw error;
  } catch {
    // sem rede: volta para a fila (limitada) e tenta no próximo ciclo
    queue = [...batch, ...queue].slice(0, MAX_QUEUE);
  } finally {
    flushing = false;
  }
}
