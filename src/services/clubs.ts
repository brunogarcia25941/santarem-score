import { supabase } from './supabase';
import { Club } from '@/types';

/**
 * Normaliza uma linha vinda do Supabase (snake_case) para o tipo Club
 * usado em toda a aplicação (camelCase). Partilhado por todos os
 * ecrãs/hooks que precisam de dados de clubes.
 */
export function mapClub(raw: any): Club {
  if (!raw) {
    return {
      id: '',
      name: 'Desconhecido',
      shortName: 'Desc.',
      initials: '?',
      division: '1_divisao',
      primaryColor: '#71717a',
      secondaryColor: '#ffffff',
      stadiumName: 'Estádio',
      latitude: 0,
      longitude: 0,
      badgeUrl: undefined,
    };
  }

  return {
    id: raw.id,
    name: raw.name,
    shortName: raw.short_name || raw.shortName || raw.name,
    initials: raw.initials || '?',
    division: raw.division,
    primaryColor: raw.primary_color || raw.primaryColor || '#16a34a',
    secondaryColor: raw.secondary_color || raw.secondaryColor || '#ffffff',
    stadiumName: raw.stadium_name || raw.stadiumName || '',
    latitude: raw.latitude || 0,
    longitude: raw.longitude || 0,
    badgeUrl: raw.badge_url || raw.badgeUrl || undefined,
  };
}

export async function fetchClubs(): Promise<Club[]> {
  const { data, error } = await supabase.from('clubs').select('*').order('name', { ascending: true });

  if (error) {
    console.error('Erro ao carregar clubes do Supabase:', error);
    throw error;
  }

  return (data || []).map(mapClub);
}
