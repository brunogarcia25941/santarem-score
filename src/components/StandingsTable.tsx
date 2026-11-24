import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { ClubBadge } from '@/components/ClubBadge';
import { useFavorites } from '@/context/FavoritesContext';
import { brand, getTheme } from '@/constants/theme';
import { Zone, ZONE_COLORS, ZONE_LABELS, zoneFor, zonesOf } from '@/utils/standingsZones';

export interface StandingTableRow {
  club_id: string;
  short_name: string;
  initials: string;
  primary_color: string | null;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goal_difference: number;
  points: number;
}

interface StandingsTableProps {
  rows: StandingTableRow[];
  /** '1_divisao' | '2_divisao_a' | '2_divisao_b' — define as faixas de cor. */
  division: string;
  badgeById: Record<string, string | undefined>;
  /** Clubes a destacar (por exemplo, as duas equipas do jogo que se está a ver). */
  highlightIds?: string[];
  showLegend?: boolean;
}

/**
 * Tabela de classificação com faixa de cor por zona (subida / apuramento / descida), os clubes
 * favoritos do utilizador destacados (fundo verde suave + estrela) e legenda por baixo.
 * Usada em Competições e no separador "Tabela" do jogo.
 */
export function StandingsTable({ rows, division, badgeById, highlightIds = [], showLegend = true }: StandingsTableProps) {
  const router = useRouter();
  const t = getTheme(useColorScheme() === 'dark');
  const { isFavorite } = useFavorites();
  const zones = zonesOf(division);

  return (
    <View style={[styles.card, { backgroundColor: t.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.colPos, styles.headerText]}>#</Text>
        <Text style={[styles.colClub, styles.headerText]}>Clube</Text>
        <Text style={[styles.colStat, styles.headerText]}>J</Text>
        <Text style={[styles.colStat, styles.headerText]}>V</Text>
        <Text style={[styles.colStat, styles.headerText]}>E</Text>
        <Text style={[styles.colStat, styles.headerText]}>D</Text>
        <Text style={[styles.colStat, styles.headerText]}>DG</Text>
        <Text style={[styles.colPoints, styles.headerText, { color: brand.forest }]}>PTS</Text>
      </View>

      {rows.map((row, index) => {
        const position = index + 1;
        const zone: Zone | null = zoneFor(division, position, rows.length);
        const favorite = isFavorite(row.club_id);
        const highlighted = highlightIds.includes(row.club_id);
        const background = highlighted ? brand.amberGlow : favorite ? brand.forestMuted : 'transparent';

        return (
          <View
            key={row.club_id}
            style={[
              styles.row,
              {
                borderTopColor: t.border,
                borderLeftColor: zone ? ZONE_COLORS[zone] : 'transparent',
                backgroundColor: background,
              },
            ]}
          >
            <Text style={[styles.colPos, { color: zone ? ZONE_COLORS[zone] : t.textMuted, fontWeight: '800' }]}>{position}</Text>

            <TouchableOpacity
              style={styles.colClub}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/club/${row.club_id}`);
              }}
            >
              <ClubBadge
                club={{
                  id: row.club_id,
                  name: row.short_name,
                  shortName: row.short_name,
                  initials: row.initials,
                  division: division as any,
                  primaryColor: row.primary_color || brand.forest,
                  secondaryColor: '#ffffff',
                  stadiumName: '',
                  latitude: 0,
                  longitude: 0,
                  badgeUrl: badgeById[row.club_id],
                }}
                size={22}
              />
              <Text
                style={[styles.clubName, { color: t.text, fontWeight: highlighted || favorite ? '800' : '600' }]}
                numberOfLines={1}
              >
                {row.short_name}
              </Text>
              {favorite && <Ionicons name="star" size={12} color="#eab308" style={{ marginLeft: 5 }} />}
            </TouchableOpacity>

            <Text style={[styles.colStat, { color: t.text }]}>{row.played}</Text>
            <Text style={[styles.colStat, { color: t.textMuted }]}>{row.won}</Text>
            <Text style={[styles.colStat, { color: t.textMuted }]}>{row.drawn}</Text>
            <Text style={[styles.colStat, { color: t.textMuted }]}>{row.lost}</Text>
            <Text style={[styles.colStat, { color: t.textMuted }]}>{row.goal_difference}</Text>
            <Text style={[styles.colPoints, { color: t.text, fontWeight: '800' }]}>{row.points}</Text>
          </View>
        );
      })}

      {showLegend && rows.length > 0 && (
        <View style={[styles.legend, { borderTopColor: t.border }]}>
          <View style={styles.legendItems}>
            {zones.map((z) => (
              <View key={z} style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: ZONE_COLORS[z] }]} />
                <Text style={[styles.legendText, { color: t.textMuted }]}>{ZONE_LABELS[z]}</Text>
              </View>
            ))}
            <View style={styles.legendItem}>
              <Ionicons name="star" size={11} color="#eab308" />
              <Text style={[styles.legendText, { color: t.textMuted }]}>Os teus favoritos</Text>
            </View>
          </View>
          <Text style={[styles.legendNote, { color: t.textFaint }]}>
            Os lugares de subida, apuramento e descida dependem do regulamento da prova.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, overflow: 'hidden', paddingVertical: 6 },
  header: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, paddingLeft: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)' },
  headerText: { fontSize: 11, fontWeight: '700', color: '#71717a' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderLeftWidth: 4,
  },
  colPos: { width: 24, fontSize: 12, textAlign: 'center' },
  colClub: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  colStat: { width: 26, fontSize: 12, textAlign: 'center' },
  colPoints: { width: 34, fontSize: 13, textAlign: 'center' },
  clubName: { fontSize: 13, flexShrink: 1, marginLeft: 8 },
  legend: { borderTopWidth: 1, paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8, gap: 8 },
  legendItems: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 4, height: 14, borderRadius: 2 },
  legendText: { fontSize: 11.5, fontWeight: '600' },
  legendNote: { fontSize: 10.5, lineHeight: 15 },
});
