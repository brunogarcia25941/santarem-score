import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { Match } from '@/types';
import { brand, getTheme } from '@/constants/theme';

export interface LineupRow {
  id: string;
  club_id: string;
  shirt_number: number | null;
  player_name: string | null;
  sort_order: number;
}

interface Props {
  match: Match;
  lineups: LineupRow[];
}

/**
 * Onze inicial: casa à esquerda, visitante à direita (como os acontecimentos).
 * Cada jogador pode ter só número, só nome, ou ambos — depende do que o
 * delegado soube registar.
 */
export function LineupCard({ match, lineups }: Props) {
  const isDark = useColorScheme() === 'dark';
  const t = getTheme(isDark);

  const forClub = (clubId: string) =>
    lineups.filter((l) => l.club_id === clubId).sort((a, b) => a.sort_order - b.sort_order);
  const home = forClub(match.homeClub.id);
  const away = forClub(match.awayClub.id);

  const column = (rows: LineupRow[], align: 'left' | 'right', clubName: string) => (
    <View style={styles.column}>
      <Text style={[styles.clubName, { color: t.textMuted, textAlign: align }]} numberOfLines={1}>
        {clubName}
      </Text>
      {rows.length === 0 ? (
        <Text style={[styles.empty, { color: t.textFaint, textAlign: align }]}>Por indicar</Text>
      ) : (
        rows.map((p) => {
          const number = (
            <Text style={[styles.number, { color: brand.amber, textAlign: align }]}>
              {p.shirt_number ?? ''}
            </Text>
          );
          const name = (
            <Text style={[styles.name, { color: t.text, textAlign: align }]} numberOfLines={1}>
              {p.player_name ?? ''}
            </Text>
          );
          return (
            <View key={p.id} style={styles.row}>
              {align === 'left' ? (
                <>
                  {number}
                  {name}
                </>
              ) : (
                <>
                  {name}
                  {number}
                </>
              )}
            </View>
          );
        })
      )}
    </View>
  );

  return (
    <View style={[styles.card, { backgroundColor: t.surface }]}>
      <Text style={[styles.title, { color: t.text }]}>Onze inicial</Text>
      <View style={styles.columns}>
        {column(home, 'left', match.homeClub.shortName)}
        {column(away, 'right', match.awayClub.shortName)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, marginBottom: 16 },
  title: { fontSize: 15, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  columns: { flexDirection: 'row', gap: 16 },
  column: { flex: 1 },
  clubName: { fontSize: 12, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  empty: { fontSize: 12, fontStyle: 'italic' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  number: { width: 26, fontSize: 14, fontWeight: '800' },
  name: { flex: 1, fontSize: 14, fontWeight: '500' },
});
