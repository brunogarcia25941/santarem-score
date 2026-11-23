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
let enabled = false; // só passa a true depois de o utilizador aceitar
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
    enabled = (await AsyncStorage.getItem(ENABLED_KEY)) === 'true';
  } catch {
    // sem armazenamento: usa um id só desta sessão
    deviceId = deviceId ?? uuid();
  }
  ready = true;
  // Sem consentimento nada do que se acumulou antes do arranque pode ser enviado.
  if (!enabled) queue = [];
  if (!timer) timer = setInterval(() => void flush(), FLUSH_EVERY_MS);
  if (queue.length >= FLUSH_AT) void flush();
}

/** true = aceitou, false = recusou, null = ainda não respondeu (mostra-se o aviso). */
export async function getAnalyticsConsent(): Promise<boolean | null> {
  try {
    const v = await AsyncStorage.getItem(ENABLED_KEY);
    return v === null ? null : v === 'true';
  } catch {
    return null;
  }
}

export async function getAnalyticsEnabled(): Promise<boolean> {
  return (await getAnalyticsConsent()) === true;
}

export async function setAnalyticsEnabled(value: boolean): Promise<void> {
  if (!value && enabled) {
    // Estava ligado: regista a saída antes de desligar. (Quem recusa logo no aviso inicial
    // nunca chegou a estar ligado, por isso não se envia nada.)
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
  if (value) void flush();
}

/** Ecrã atual: vai junto de todos os eventos seguintes. */
export function setScreen(name: string | undefined) {
  currentScreen = name;
}

export function newSession() {
  sessionId = uuid();
}

export function track(event: string, props?: Record<string, unknown>) {
  // Antes de arrancar guarda-se (a decisão ainda não foi lida); depois só com consentimento.
  if (ready && !enabled) return;
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
