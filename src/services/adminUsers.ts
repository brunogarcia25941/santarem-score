import { supabase } from '@/services/supabase';

export interface ManagedUser {
  id: string;
  email: string | null;
  role: 'user' | 'collaborator' | 'admin';
  club_id: string | null;
  created_at: string;
  last_sign_in_at: string | null;
}

type Result<T> = { data: T; error: null } | { data: null; error: string };

/**
 * Chama a Edge Function `admin-manage-users`. É lá que se confirma que quem chama é admin e se
 * usa a chave de serviço — nunca na app. Nos erros HTTP (400/403/409...) o supabase-js devolve
 * um FunctionsHttpError e a mensagem útil vem no corpo da resposta.
 */
async function call<T>(body: Record<string, unknown>): Promise<Result<T>> {
  const { data, error } = await supabase.functions.invoke('admin-manage-users', { body });
  if (error) {
    try {
      const payload = await (error as any).context?.json?.();
      if (payload?.error) return { data: null, error: String(payload.error) };
    } catch {
      // sem corpo legível: usa a mensagem genérica
    }
    return { data: null, error: error.message || 'Não foi possível contactar o servidor.' };
  }
  if ((data as any)?.error) return { data: null, error: String((data as any).error) };
  return { data: data as T, error: null };
}

export const adminUsers = {
  list: () => call<{ users: ManagedUser[] }>({ action: 'list' }),
  create: (email: string, password: string, clubId: string) =>
    call<{ ok: true; user_id: string }>({ action: 'create', email, password, club_id: clubId }),
  /** clubId null = retirar o acesso de colaborador. */
  setClub: (userId: string, clubId: string | null) =>
    call<{ ok: true }>({ action: 'set_club', user_id: userId, club_id: clubId }),
  resetPassword: (userId: string, password: string) =>
    call<{ ok: true }>({ action: 'reset_password', user_id: userId, password }),
};

/** Palavra-passe temporária legível (sem caracteres que se confundem: 0/O, 1/l/I). */
export function generatePassword(length = 10): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const cryptoObj = (globalThis as any).crypto;
  const bytes = new Uint8Array(length);
  if (cryptoObj?.getRandomValues) cryptoObj.getRandomValues(bytes);
  else for (let i = 0; i < length; i++) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}
