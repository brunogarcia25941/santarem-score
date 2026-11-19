import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Club, Match } from '@/types';
import { getTheme } from '@/constants/theme';
import { useStandings } from '@/hooks/useStandings';
import { computeClubStats, FormResult, SplitRecord } from '@/utils/clubStats';

interface ClubStatsProps {
  club: Club;
  matches: Match[];
}

const FORM_COLORS: Record<FormResult, string> = { V: '#2f6b4a', E: '#8a8e94', D: '#dc2626' };

/**
 * Estatísticas de um clube na sua ficha: posição, forma recente, casa/fora,
 * e defesa/ataque. Tudo sai dos jogos terminados que a app já tem.
 */
export function ClubStats({ club, matches }: ClubStatsProps) {
  const isDark = useColorScheme() === 'dark';
  const t = getTheme(isDark);
  const router = useRouter();
  const { getClubStanding } = useStandings();

  const stats = useMemo(() => computeClubStats(club.id, matches), [club.id, matches]);
  const standing = getClubStanding(club.id, club.division);

  const card = { backgroundColor: t.surface };
  const avg = (n: number) => (stats.played > 0 ? (n / stats.played).toFixed(1) : '–');

  const Big = ({ label, value }: { label: string; value: string | number }) => (
    <View style={styles.bigCell}>
      <Text style={[styles.bigValue, { color: t.text }]}>{value}</Text>
      <Text style={[styles.bigLabel, { color: t.textMuted }]}>{label}</Text>
    </View>
  );

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: t.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: t.text }]}>{value}</Text>
    </View>
  );

  const split = (s: SplitRecord) =>
    s.played === 0 ? '–' : `${s.won}V ${s.drawn}E ${s.lost}D · ${s.goalsFor}-${s.goalsAgainst}`;

  const matchLine = (m: Match | null) =>
    m ? `${m.homeClub.shortName} ${m.homeScore}-${m.awayScore} ${m.awayClub.shortName}` : '–';

  if (stats.played === 0) {
    return (
      <View style={[styles.card, card]}>
        <Text style={[styles.empty, { color: t.textFaint }]}>
          Ainda não há jogos terminados para calcular estatísticas.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.card, card]}>
        <Text style={[styles.cardTitle, { color: t.text }]}>
          {standing ? `${standing.position}.º de ${standing.total} na classificação` : 'Classificação'}
        </Text>
        <View style={styles.bigRow}>
          <Big label="Jogos" value={stats.played} />
          <Big label="V" value={stats.won} />
          <Big label="E" value={stats.drawn} />
          <Big label="D" value={stats.lost} />
          <Big label="Pts" value={stats.points} />
        </View>
        <View style={[styles.bigRow, { marginTop: 10 }]}>
          <Big label="Golos marcados" value={stats.goalsFor} />
          <Big label="Golos sofridos" value={stats.goalsAgainst} />
          <Big
            label="Diferença"
            value={`${stats.goalsFor - stats.goalsAgainst > 0 ? '+' : ''}${stats.goalsFor - stats.goalsAgainst}`}
          />
        </View>
      </View>

      <View style={[styles.card, card]}>
        <Text style={[styles.cardTitle, { color: t.text }]}>Forma recente</Text>
        <View style={styles.formRow}>
          {stats.form.map(({ result, match }) => (
            <TouchableOpacity
              key={match.id}
              style={[styles.formChip, { backgroundColor: FORM_COLORS[result] }]}
              onPress={() => router.push(`/match/${match.id}`)}
            >
              <Text style={styles.formText}>{result}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.hint, { color: t.textFaint }]}>Do mais antigo para o mais recente.</Text>
      </View>

      <View style={[styles.card, card]}>
        <Text style={[styles.cardTitle, { color: t.text }]}>Em casa e fora</Text>
        <Row label="Em casa" value={split(stats.home)} />
        <Row label="Fora" value={split(stats.away)} />
        <Text style={[styles.hint, { color: t.textFaint }]}>Golos marcados-sofridos à direita.</Text>
      </View>

      <View style={[styles.card, card]}>
        <Text style={[styles.cardTitle, { color: t.text }]}>Ataque e defesa</Text>
        <Row label="Golos marcados por jogo" value={avg(stats.goalsFor)} />
        <Row label="Golos sofridos por jogo" value={avg(stats.goalsAgainst)} />
        <Row label="Jogos sem sofrer golos" value={String(stats.cleanSheets)} />
        <Row label="Jogos sem marcar" value={String(stats.failedToScore)} />
        <Row label="Maior vitória" value={matchLine(stats.biggestWin)} />
        <Row label="Maior derrota" value={matchLine(stats.biggestLoss)} />
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16 },
  cardTitle: { fontSize: 14, fontWeight: '800', marginBottom: 12 },
  bigRow: { flexDirection: 'row' },
  bigCell: { flex: 1, alignItems: 'center' },
  bigValue: { fontSize: 20, fontWeight: '800' },
  bigLabel: { fontSize: 11, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  formRow: { flexDirection: 'row', gap: 8 },
  formChip: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  formText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, gap: 12 },
  rowLabel: { fontSize: 13, flexShrink: 1 },
  rowValue: { fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  hint: { fontSize: 11, marginTop: 8 },
  empty: { textAlign: 'center', fontSize: 13, paddingVertical: 8 },
});
