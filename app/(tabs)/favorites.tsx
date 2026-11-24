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
import { MatchTabs } from '@/components/MatchTabs';
import { ClubBadge } from '@/components/ClubBadge';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StadiumTexture } from '@/components/StadiumTexture';
import { EmptyState } from '@/components/EmptyState';
import { MatchCardSkeleton } from '@/components/Skeleton';

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
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1a1b1e' : '#eef0f2' }]}>
      <StadiumTexture variant="grass" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <View>
            {[0, 1, 2].map((i) => (
              <MatchCardSkeleton key={i} />
            ))}
          </View>
        ) : favoriteClubs.length === 0 ? (
          <EmptyState
            icon="star-outline"
            title="Sem clubes favoritos"
            subtitle="Adiciona as equipas que queres acompanhar de perto para veres aqui os jogos delas e receberes avisos."
            actionLabel="Adicionar favoritos"
            onAction={() => router.push('/(onboarding)/select-clubs')}
          />
        ) : (
          <>
            <View style={styles.header}>
              <Text style={[styles.sectionTitle, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
                Os Teus Clubes ({favoriteClubs.length})
              </Text>
              <TouchableOpacity onPress={() => router.push('/(onboarding)/select-clubs')}>
                <Text style={styles.editLink}>Editar</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.clubsRow}>
              {favoriteClubs.map((club) => (
                <TouchableOpacity
                  key={club.id}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/club/${club.id}`)}
                  style={[
                    styles.clubChip,
                    { backgroundColor: isDark ? '#202226' : '#ffffff', borderColor: isDark ? '#2c2e33' : '#e2e5e8' },
                  ]}
                >
                  <ClubBadge club={club} size={20} />
                  <Text style={[styles.clubChipText, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
                    {club.shortName}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionTitle, { color: isDark ? '#eef0f2' : '#1a1b1e', marginTop: 24 }]}>
              Jogos das Tuas Equipas
            </Text>

            <View style={styles.matchesList}>
              <MatchTabs
                matches={favoriteMatches}
                emptyResults="Os teus clubes ainda não têm resultados."
                emptyFixtures="Sem jogos agendados para os teus clubes."
              />
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
  editLink: { color: '#2f6b4a', fontWeight: '700', fontSize: 13 },
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
  selectBtn: { backgroundColor: '#2f6b4a', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  selectBtnText: { color: '#ffffff', fontWeight: '700' },
});
