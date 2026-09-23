import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useFavorites } from '@/context/FavoritesContext';
import { useLiveMatches } from '@/hooks/useLiveMatches';
import { useClubs } from '@/hooks/useClubs';
import { MatchCard } from '@/components/MatchCard';
import { ClubBadge } from '@/components/ClubBadge';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FavoritesScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { favoriteClubIds } = useFavorites();
  const { matches } = useLiveMatches();
  const { clubs, loading } = useClubs();

  const favoriteMatches = matches.filter(
    (m) => favoriteClubIds.includes(m.homeClub.id) || favoriteClubIds.includes(m.awayClub.id)
  );

  const favoriteClubs = clubs.filter((c) => favoriteClubIds.includes(c.id));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090b' : '#f4f4f5' }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 40 }} />
        ) : favoriteClubs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="star-outline" size={54} color="#71717a" />
            <Text style={[styles.emptyTitle, { color: isDark ? '#f4f4f5' : '#09090b' }]}>
              Sem clubes favoritos
            </Text>
            <Text style={styles.emptySubtitle}>
              Escolhe as equipas que queres acompanhar de perto na aba de Clubes.
            </Text>
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => router.push('/(onboarding)/select-clubs')}
            >
              <Text style={styles.selectBtnText}>Selecionar Clubes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#f4f4f5' : '#09090b' }]}>
                Os Teus Clubes ({favoriteClubs.length})
              </Text>
              <TouchableOpacity onPress={() => router.push('/(onboarding)/select-clubs')}>
                <Text style={styles.editLink}>Editar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clubsRow}>
              {favoriteClubs.map((club) => (
                <View
                  key={club.id}
                  style={[
                    styles.clubChip,
                    { backgroundColor: isDark ? '#18181b' : '#ffffff', borderColor: isDark ? '#27272a' : '#e4e4e7' },
                  ]}
                >
                  <ClubBadge club={club} size={20} />
                  <Text style={[styles.clubChipText, { color: isDark ? '#f4f4f5' : '#09090b' }]}>
                    {club.shortName}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <Text style={[styles.sectionTitle, { color: isDark ? '#f4f4f5' : '#09090b', marginTop: 24 }]}>
              Jogos das Tuas Equipas
            </Text>

            <View style={styles.matchesList}>
              {favoriteMatches.length === 0 ? (
                <Text style={styles.noMatchesText}>Sem partidas agendadas para os teus clubes.</Text>
              ) : (
                favoriteMatches.map((m) => <MatchCard key={m.id} match={m} />)
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  editLink: { color: '#16a34a', fontWeight: '700', fontSize: 13 },
  clubsRow: { flexDirection: 'row', marginBottom: 10 },
  clubChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  clubChipText: { fontSize: 12, fontWeight: '600' },
  matchesList: { marginTop: 10 },
  noMatchesText: { textAlign: 'center', color: '#71717a', marginVertical: 20, fontSize: 13 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySubtitle: { textAlign: 'center', color: '#71717a', fontSize: 13, marginTop: 6, marginBottom: 20 },
  selectBtn: { backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  selectBtnText: { color: '#ffffff', fontWeight: '700' },
});
