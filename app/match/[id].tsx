import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking, useColorScheme, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_MATCHES } from '@/constants/matches';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams();
  const isDark = useColorScheme() === 'dark';

  const match = MOCK_MATCHES.find((m) => m.id === id) || MOCK_MATCHES[0];

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${match.homeClub.latitude},${match.homeClub.longitude}`;
    Linking.openURL(url);
  };

  const openWaze = () => {
    const url = `https://waze.com/ul?ll=${match.homeClub.latitude},${match.homeClub.longitude}&navigate=yes`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090b' : '#f4f4f5' }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Placar de Jogo */}
        <View style={[styles.scoreCard, { backgroundColor: isDark ? '#18181b' : '#ffffff' }]}>
          <Text style={[styles.competitionText, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
            {match.competition} • {match.round}
          </Text>

          <View style={styles.scoreboard}>
            <View style={styles.teamColumn}>
              <View style={[styles.badge, { backgroundColor: match.homeClub.primaryColor }]}>
                <Text style={styles.badgeText}>{match.homeClub.initials}</Text>
              </View>
              <Text style={[styles.teamName, { color: isDark ? '#f4f4f5' : '#09090b' }]}>{match.homeClub.shortName}</Text>
            </View>

            <View style={styles.scoreCenter}>
              <Text style={[styles.score, { color: isDark ? '#f4f4f5' : '#09090b' }]}>
                {match.homeScore} - {match.awayScore}
              </Text>
              {match.status === 'live' && <Text style={styles.minute}>{match.minute}' Decorridos</Text>}
            </View>

            <View style={styles.teamColumn}>
              <View style={[styles.badge, { backgroundColor: match.awayClub.primaryColor }]}>
                <Text style={styles.badgeText}>{match.awayClub.initials}</Text>
              </View>
              <Text style={[styles.teamName, { color: isDark ? '#f4f4f5' : '#09090b' }]}>{match.awayClub.shortName}</Text>
            </View>
          </View>
        </View>

        {/* Localização & Direções GPS */}
        <View style={[styles.locationCard, { backgroundColor: isDark ? '#18181b' : '#ffffff' }]}>
          <View style={styles.locationHeader}>
            <Ionicons name="location" size={20} color="#16a34a" />
            <Text style={[styles.stadiumName, { color: isDark ? '#f4f4f5' : '#09090b' }]}>
              {match.homeClub.stadiumName}
            </Text>
          </View>

          <View style={styles.gpsButtonsRow}>
            <TouchableOpacity style={styles.gpsButton} onPress={openGoogleMaps}>
              <Ionicons name="map-outline" size={16} color="#ffffff" />
              <Text style={styles.gpsButtonText}>Google Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.gpsButton, { backgroundColor: '#33ccff' }]} onPress={openWaze}>
              <Ionicons name="navigate-outline" size={16} color="#ffffff" />
              <Text style={styles.gpsButtonText}>Waze</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Match Ticker Simples */}
        <Text style={[styles.tickerTitle, { color: isDark ? '#f4f4f5' : '#09090b' }]}>Acontecimentos</Text>
        <View style={[styles.tickerCard, { backgroundColor: isDark ? '#18181b' : '#ffffff' }]}>
          <View style={styles.eventRow}>
            <Text style={styles.eventMinute}>68'</Text>
            <Text style={styles.eventIcon}>⚽</Text>
            <Text style={[styles.eventText, { color: isDark ? '#f4f4f5' : '#09090b' }]}>Golo - União de Tomar</Text>
          </View>
          <View style={styles.eventRow}>
            <Text style={styles.eventMinute}>45'</Text>
            <Text style={styles.eventIcon}>🟨</Text>
            <Text style={[styles.eventText, { color: isDark ? '#f4f4f5' : '#09090b' }]}>Cartão Amarelo - CD Torres Novas</Text>
          </View>
          <View style={styles.eventRow}>
            <Text style={styles.eventMinute}>12'</Text>
            <Text style={styles.eventIcon}>⚽</Text>
            <Text style={[styles.eventText, { color: isDark ? '#f4f4f5' : '#09090b' }]}>Golo - CD Torres Novas</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  scoreCard: { padding: 20, borderRadius: 16, marginBottom: 16 },
  competitionText: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  scoreboard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamColumn: { flex: 1, alignItems: 'center' },
  teamName: { fontSize: 13, fontWeight: '700', marginTop: 8, textAlign: 'center' },
  scoreCenter: { alignItems: 'center', paddingHorizontal: 16 },
  score: { fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  minute: { color: '#dc2626', fontSize: 12, fontWeight: '700', marginTop: 4 },
  badge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontWeight: 'bold' },
  locationCard: { padding: 16, borderRadius: 16, marginBottom: 16 },
  locationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stadiumName: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
  gpsButtonsRow: { flexDirection: 'row', gap: 10 },
  gpsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  gpsButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  tickerTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  tickerCard: { padding: 16, borderRadius: 16 },
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  eventMinute: { width: 32, fontSize: 13, fontWeight: '700', color: '#71717a' },
  eventIcon: { fontSize: 14, marginHorizontal: 8 },
  eventText: { fontSize: 14, fontWeight: '500' },
});