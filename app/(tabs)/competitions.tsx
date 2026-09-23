import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { supabase } from '@/services/supabase';
import { useClubs } from '@/hooks/useClubs';
import { ClubBadge } from '@/components/ClubBadge';
import { SafeAreaView } from 'react-native-safe-area-context';

interface StandingRow {
  club_id: string;
  short_name: string;
  initials: string;
  primary_color: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

const DIVISIONS = [
  { id: '1_divisao', label: '1.ª Divisão' },
  { id: '2_divisao_a', label: '2.ª Divisão (Série A)' },
  { id: '2_divisao_b', label: '2.ª Divisão (Série B)' },
];

export default function CompetitionsScreen() {
  const isDark = useColorScheme() === 'dark';
  const [selectedDivision, setSelectedDivision] = useState('1_divisao');
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { clubs } = useClubs();

  const badgeById = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    clubs.forEach((c) => {
      map[c.id] = c.badgeUrl;
    });
    return map;
  }, [clubs]);

  async function fetchStandings() {
    setLoading(true);
    const { data, error } = await supabase
      .from('standings')
      .select('*')
      .eq('division', selectedDivision);

    if (!error && data) {
      setStandings(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchStandings();
  }, [selectedDivision]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090b' : '#f4f4f5' }]}>
      {/* Seletor de Divisões */}
      <View style={styles.selectorContainer}>
        {DIVISIONS.map((div) => {
          const isSelected = selectedDivision === div.id;
          return (
            <TouchableOpacity
              key={div.id}
              style={[
                styles.tabPill,
                { backgroundColor: isSelected ? '#16a34a' : isDark ? '#18181b' : '#e4e4e7' },
              ]}
              onPress={() => setSelectedDivision(div.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isSelected ? '#ffffff' : isDark ? '#a1a1aa' : '#52525b', fontWeight: isSelected ? '700' : '500' },
                ]}
              >
                {div.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabeçalho da Tabela */}
        <View style={[styles.tableCard, { backgroundColor: isDark ? '#18181b' : '#ffffff' }]}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colPos, styles.headerText]}>#</Text>
            <Text style={[styles.colClub, styles.headerText]}>Clube</Text>
            <Text style={[styles.colStat, styles.headerText]}>J</Text>
            <Text style={[styles.colStat, styles.headerText]}>V</Text>
            <Text style={[styles.colStat, styles.headerText]}>E</Text>
            <Text style={[styles.colStat, styles.headerText]}>D</Text>
            <Text style={[styles.colStat, styles.headerText]}>DG</Text>
            <Text style={[styles.colPoints, styles.headerText, { color: '#16a34a' }]}>PTS</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color="#16a34a" style={{ marginVertical: 20 }} />
          ) : standings.length === 0 ? (
            <Text style={styles.emptyText}>Sem jogos registados para esta divisão.</Text>
          ) : (
            standings.map((row, index) => (
              <View
                key={row.club_id}
                style={[
                  styles.tableRow,
                  { borderTopColor: isDark ? '#27272a' : '#f4f4f5' },
                ]}
              >
                <Text style={[styles.colPos, { color: index < 2 ? '#16a34a' : isDark ? '#a1a1aa' : '#71717a', fontWeight: '700' }]}>
                  {index + 1}
                </Text>

                <View style={styles.colClub}>
                  <ClubBadge
                    club={{
                      id: row.club_id,
                      name: row.short_name,
                      shortName: row.short_name,
                      initials: row.initials,
                      division: selectedDivision as any,
                      primaryColor: row.primary_color || '#16a34a',
                      secondaryColor: '#ffffff',
                      stadiumName: '',
                      latitude: 0,
                      longitude: 0,
                      badgeUrl: badgeById[row.club_id],
                    }}
                    size={22}
                  />
                  <Text style={[styles.clubName, { color: isDark ? '#f4f4f5' : '#09090b', marginLeft: 8 }]} numberOfLines={1}>
                    {row.short_name}
                  </Text>
                </View>

                <Text style={[styles.colStat, { color: isDark ? '#f4f4f5' : '#09090b' }]}>{row.played}</Text>
                <Text style={[styles.colStat, { color: isDark ? '#a1a1aa' : '#71717a' }]}>{row.won}</Text>
                <Text style={[styles.colStat, { color: isDark ? '#a1a1aa' : '#71717a' }]}>{row.drawn}</Text>
                <Text style={[styles.colStat, { color: isDark ? '#a1a1aa' : '#71717a' }]}>{row.lost}</Text>
                <Text style={[styles.colStat, { color: isDark ? '#a1a1aa' : '#71717a' }]}>{row.goal_difference}</Text>
                <Text style={[styles.colPoints, { color: isDark ? '#f4f4f5' : '#09090b', fontWeight: '800' }]}>
                  {row.points}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  selectorContainer: { flexDirection: 'row', padding: 16, gap: 8 },
  tabPill: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  tabText: { fontSize: 12 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 30 },
  tableCard: { borderRadius: 14, overflow: 'hidden', paddingVertical: 6 },
  tableHeader: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(150,150,150,0.1)' },
  headerText: { fontSize: 11, fontWeight: '700', color: '#71717a' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderTopWidth: 1 },
  colPos: { width: 24, fontSize: 12, textAlign: 'center' },
  colClub: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6 },
  colStat: { width: 26, fontSize: 12, textAlign: 'center' },
  colPoints: { width: 34, fontSize: 13, textAlign: 'center' },
  clubName: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  emptyText: { textAlign: 'center', paddingVertical: 20, color: '#71717a', fontSize: 13 },
});
