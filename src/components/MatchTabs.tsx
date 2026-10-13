import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Match } from '@/types';
import { MatchCard } from './MatchCard';
import { brand, getTheme } from '@/constants/theme';

type Tab = 'results' | 'fixtures';

interface MatchTabsProps {
  matches: Match[];
  emptyResults?: string;
  emptyFixtures?: string;
}

/**
 * Dois separadores para uma lista de jogos: "Resultados" (terminados, os mais
 * recentes primeiro) e "Jogos" (o que falta: o jogo em direto fica no topo,
 * depois os agendados por ordem de data). Usado na ficha do clube e nos
 * Favoritos.
 */
export function MatchTabs({
  matches,
  emptyResults = 'Ainda não há resultados.',
  emptyFixtures = 'Não há jogos agendados.',
}: MatchTabsProps) {
  const isDark = useColorScheme() === 'dark';
  const t = getTheme(isDark);

  const { results, fixtures } = useMemo(() => {
    const time = (m: Match) => new Date(m.matchDate).getTime();
    const isLive = (m: Match) => m.status === 'live' || m.status === 'halftime';
    return {
      results: matches.filter((m) => m.status === 'finished').sort((a, b) => time(b) - time(a)),
      fixtures: matches
        .filter((m) => m.status !== 'finished')
        .sort((a, b) => Number(isLive(b)) - Number(isLive(a)) || time(a) - time(b)),
    };
  }, [matches]);

  // Abre no que interessa: jogos por vir (ou em direto); se não houver, resultados.
  const [tab, setTab] = useState<Tab | null>(null);
  const activeTab: Tab = tab ?? (fixtures.length > 0 ? 'fixtures' : 'results');
  const list = activeTab === 'results' ? results : fixtures;

  const pill = (id: Tab, label: string, count: number) => {
    const selected = activeTab === id;
    return (
      <TouchableOpacity
        key={id}
        style={[
          styles.pill,
          { backgroundColor: selected ? brand.forest : isDark ? '#202226' : '#e2e5e8' },
        ]}
        onPress={() => {
          Haptics.selectionAsync();
          setTab(id);
        }}
      >
        <Text style={[styles.pillText, { color: selected ? '#ffffff' : t.textMuted }]}>
          {label} ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <View style={styles.pillRow}>
        {pill('fixtures', 'Jogos', fixtures.length)}
        {pill('results', 'Resultados', results.length)}
      </View>

      {list.length === 0 ? (
        <Text style={[styles.empty, { color: t.textFaint }]}>
          {activeTab === 'results' ? emptyResults : emptyFixtures}
        </Text>
      ) : (
        list.map((m) => <MatchCard key={m.id} match={m} />)
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  pill: { flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center' },
  pillText: { fontSize: 13, fontWeight: '700' },
  empty: { textAlign: 'center', marginVertical: 20, fontSize: 13 },
});
