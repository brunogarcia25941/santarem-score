import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { Match } from '@/types';

interface MatchCardProps {
  match: Match;
}

export function MatchCard({ match }: MatchCardProps) {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';

  const isLive = match.status === 'live' || match.status === 'halftime';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? '#18181b' : '#ffffff',
          borderColor: isDark ? '#27272a' : '#e4e4e7',
        },
      ]}
      onPress={() => router.push(`/match/${match.id}`)}
    >
      <View style={styles.header}>
        <Text style={[styles.competition, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
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
          <Text style={[styles.statusText, { color: isDark ? '#71717a' : '#a1a1aa' }]}>Terminado</Text>
        )}
        {match.status === 'scheduled' && (
          <Text style={[styles.statusText, { color: isDark ? '#a1a1aa' : '#71717a' }]}>{match.matchDate}</Text>
        )}
      </View>

      <View style={styles.teamsRow}>
        <View style={styles.team}>
          <View style={[styles.teamBadge, { backgroundColor: match.homeClub.primaryColor }]}>
            <Text style={styles.badgeText}>{match.homeClub.initials}</Text>
          </View>
          <Text style={[styles.teamName, { color: isDark ? '#f4f4f5' : '#09090b' }]} numberOfLines={1}>
            {match.homeClub.shortName}
          </Text>
        </View>

        <View style={styles.scoreContainer}>
          {match.status === 'scheduled' ? (
            <Text style={[styles.vsText, { color: isDark ? '#71717a' : '#a1a1aa' }]}>VS</Text>
          ) : (
            <Text style={[styles.scoreText, { color: isDark ? '#f4f4f5' : '#09090b' }]}>
              {match.homeScore} - {match.awayScore}
            </Text>
          )}
        </View>

        <View style={[styles.team, styles.teamAway]}>
          <Text style={[styles.teamName, styles.textRight, { color: isDark ? '#f4f4f5' : '#09090b' }]} numberOfLines={1}>
            {match.awayClub.shortName}
          </Text>
          <View style={[styles.teamBadge, { backgroundColor: match.awayClub.primaryColor }]}>
            <Text style={styles.badgeText}>{match.awayClub.initials}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  competition: {
    fontSize: 12,
    fontWeight: '600',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2626',
    marginRight: 4,
  },
  liveText: {
    color: '#dc2626',
    fontSize: 11,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  teamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  team: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamAway: {
    justifyContent: 'flex-end',
  },
  teamBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  teamName: {
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
    flexShrink: 1,
  },
  textRight: {
    textAlign: 'right',
  },
  scoreContainer: {
    paddingHorizontal: 12,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  vsText: {
    fontSize: 12,
    fontWeight: '700',
  },
});