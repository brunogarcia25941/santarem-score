import React from 'react';
import { TouchableOpacity } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Club } from '@/types';
import { ClubBadge } from './ClubBadge';

interface ClubBadgeLinkProps {
  club: Club;
  size?: number;
}

/**
 * Emblema que leva à ficha do clube ao tocar. Usar sempre que um emblema
 * aparece fora da própria ficha (lista de jogos, página do jogo, favoritos...).
 * Dentro da ficha desse mesmo clube não faz nada, para não empilhar o mesmo
 * ecrã duas vezes.
 */
export function ClubBadgeLink({ club, size }: ClubBadgeLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const href = `/club/${club.id}` as const;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
      onPress={() => {
        if (pathname === href) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(href);
      }}
    >
      <ClubBadge club={club} size={size} />
    </TouchableOpacity>
  );
}
