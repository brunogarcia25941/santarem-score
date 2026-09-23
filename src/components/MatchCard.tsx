import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Match } from '@/types';
import { ScoreboardPlate } from './ScoreboardPlate';
import { ClubBadge } from './ClubBadge';
import { formatMatchDate } from '@/utils/dateFormat';
import { setMatchTransitionOrigin, measureView } from '@/utils/matchTransitionOrigin';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const isLive = match.status === 'live' || match.status === 'halftime';

  const scoreboardRef = useRef<View>(null);
  const homeBadgeRef = useRef<View>(null);
  const awayBadgeRef = useRef<View>(null);

  const handlePress = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Guarda onde o placar e os emblemas estão neste ecrã, para o ecrã
    // do jogo poder "continuar" o movimento a partir daqui, em vez de
    // simplesmente aparecer — sem precisar de shared element transitions
    // (que não funcionam bem com o gesto nativo de voltar atrás).
    const [scoreboard, homeBadge, awayBadge] = await Promise.all([
      measureView(scoreboardRef),
      measureView(homeBadgeRef),
      measureView(awayBadgeRef),
    ]);
    setMatchTransitionOrigin({ scoreboard, homeBadge, awayBadge, initialMatch: match });

    router.push(`/match/${match.id}`);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#1a1b1e' : '#f0f2f5',
          borderColor: isDark ? '#2a2b30' : '#ffffff',
          shadowColor: isDark ? '#08080a' : '#c2c6cc',
        },
      ]}
      onPress={handlePress}
    >
      {/* Luz no topo do cartão (micro-chanfro neumórfico) */}
      <View style={[styles.topBevel, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#ffffff' }]} />

      <View style={styles.header}>
        <Text style={[styles.competition, { color: isDark ? '#8b8f97' : '#6b7280' }]} numberOfLines={1}>
          {match.competition} • {match.round}
        </Text>
        {isLive && (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>
              {match.status === 'halftime' ? 'INT' : `${match.minute}'`}
            </Text>
          </View>
        )}
        {match.status === 'finished' && (
          <Text style={[styles.statusText, { color: isDark ? '#636770' : '#9ca3af' }]}>FIM</Text>
        )}
        {match.status === 'scheduled' && (
          <Text style={[styles.statusText, { color: isDark ? '#8b8f97' : '#6b7280' }]}>{formatMatchDate(match.matchDate)}</Text>
        )}
      </View>

      <View style={styles.teamsRow}>
        {/* Equipa Visitada — emblema em cima, nome por baixo (dá espaço a nomes longos) */}
        <View style={styles.team}>
          <View ref={homeBadgeRef} collapsable={false}>
            <ClubBadge club={match.homeClub} size={36} />
          </View>
          <Text style={[styles.teamName, { color: isDark ? '#e4e6eb' : '#111827' }]} numberOfLines={2}>
            {match.homeClub.shortName}
          </Text>
        </View>

        {/* Placar Eletrónico LED Embutido */}
        <View style={styles.scoreboardWrapper}>
          {match.status === 'scheduled' ? (
            <View style={styles.vsPlate}>
              <Text style={styles.vsText}>VS</Text>
            </View>
          ) : (
            <View ref={scoreboardRef} collapsable={false}>
              <ScoreboardPlate
                homeScore={match.homeScore}
                awayScore={match.awayScore}
                size="small"
                status={match.status}
                minute={match.minute}
              />
            </View>
          )}
        </View>

        {/* Equipa Visitante */}
        <View style={styles.team}>
          <View ref={awayBadgeRef} collapsable={false}>
            <ClubBadge club={match.awayClub} size={36} />
          </View>
          <Text style={[styles.teamName, { color: isDark ? '#e4e6eb' : '#111827' }]} numberOfLines={2}>
            {match.awayClub.shortName}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    // Elevação física neumórfica
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  topBevel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  competition: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 5,
  },
  liveText: {
    color: '#ef4444',
    fontSize: 10,
    fontWeight: '800',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  team: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  teamName: {
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 14,
  },
  scoreboardWrapper: {
    paddingHorizontal: 6,
    paddingTop: 2,
  },
  vsPlate: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#0c0d0e',
    borderWidth: 1,
    borderColor: '#26282b',
  },
  vsText: {
    color: '#8b8f97',
    fontSize: 11,
    fontWeight: '800',
  },
});
