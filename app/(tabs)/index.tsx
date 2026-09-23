import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFavorites } from '@/context/FavoritesContext';
import { useClubs } from '@/hooks/useClubs';
import { useLiveMatches } from '@/hooks/useLiveMatches';
import { useStandings } from '@/hooks/useStandings';
import { MatchCard } from '@/components/MatchCard';
import { ClubBadge } from '@/components/ClubBadge';
import { formatMatchDate } from '@/utils/dateFormat';
import { Match, Club } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const COMPETITIONS_FILTER = [
  'Todas',
  '1.ª Divisão',
  '2.ª Divisão - Série A',
  '2.ª Divisão - Série B',
  'Taça Ribatejo',
];

function lastResultLabel(club: Club, match: Match): string {
  const isHome = match.homeClub.id === club.id;
  const own = isHome ? match.homeScore : match.awayScore;
  const rival = isHome ? match.awayScore : match.homeScore;
  const letter = own > rival ? 'V' : own === rival ? 'E' : 'D';
  return `${letter} ${own}-${rival}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { favoriteClubIds, isOnboardingCompleted, isLoading: favoritesLoading } = useFavorites();
  const { clubs } = useClubs();
  const { matches, loading } = useLiveMatches();
  const { getClubStanding } = useStandings();
  const [selectedComp, setSelectedComp] = useState('Todas');
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  React.useEffect(() => {
    // Só decide redirecionar depois de saber mesmo se o onboarding já
    // foi concluído — evita mostrar a Home por instantes antes de saltar
    // para a seleção de clubes.
    if (!favoritesLoading && !isOnboardingCompleted) {
      router.replace('/(onboarding)/select-clubs');
    }
  }, [favoritesLoading, isOnboardingCompleted]);

  const favoriteClubs = clubs.filter((c) => favoriteClubIds.includes(c.id));

  const filteredMatches = matches.filter((m) => {
    if (selectedComp === 'Todas') return true;
    return m.competition.includes(selectedComp.replace(' - ', ' '));
  });

  if (favoritesLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: isDark ? '#09090b' : '#f4f4f5' }]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090b' : '#f4f4f5' }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Carrossel de Equipas Favoritas */}
        {favoriteClubs.length > 0 && (
          <View style={styles.carouselContainer}>
            <FlatList
              data={favoriteClubs}
              keyExtractor={(item) => item.id}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToAlignment="center"
              decelerationRate="fast"
              onScroll={(e) => {
                const index = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
                setActiveCardIndex(index);
              }}
              renderItem={({ item }) => {
                const clubMatches = matches.filter(
                  (m) => m.homeClub.id === item.id || m.awayClub.id === item.id
                );
                const lastFinished = [...clubMatches]
                  .filter((m) => m.status === 'finished')
                  .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())[0];
                const liveNow = clubMatches.find((m) => m.status === 'live' || m.status === 'halftime');
                const nextScheduled = [...clubMatches]
                  .filter((m) => m.status === 'scheduled')
                  .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime())[0];

                const standing = getClubStanding(item.id, item.division);

                return (
                  <View
                    style={[
                      styles.favoriteCard,
                      {
                        width: width - 32,
                        backgroundColor: isDark ? '#18181b' : '#ffffff',
                        borderColor: isDark ? '#27272a' : '#e4e4e7',
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <ClubBadge club={item} size={40} />
                      <View style={styles.cardHeaderText}>
                        <Text style={[styles.clubTitle, { color: isDark ? '#f4f4f5' : '#09090b' }]}>
                          {item.shortName}
                        </Text>
                        <Text style={[styles.divisionLabel, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
                          AF Santarém • {item.division === '1_divisao' ? '1.ª Divisão' : '2.ª Divisão'}
                        </Text>
                      </View>
                      {standing && (
                        <View style={styles.positionBadge}>
                          <Text style={styles.positionNumber}>{standing.position}.º</Text>
                          <Text style={styles.positionText}>Lugar</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardStatsRow}>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: isDark ? '#71717a' : '#a1a1aa' }]}>Último Jogo</Text>
                        <Text style={[styles.statValue, { color: isDark ? '#f4f4f5' : '#09090b' }]}>
                          {lastFinished ? lastResultLabel(item, lastFinished) : 'Sem jogos'}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={[styles.statLabel, { color: isDark ? '#71717a' : '#a1a1aa' }]}>Próximo Jogo</Text>
                        {liveNow ? (
                          <Text style={[styles.statValue, { color: '#dc2626' }]}>
                            AO VIVO {liveNow.minute ? `${liveNow.minute}'` : ''}
                          </Text>
                        ) : (
                          <Text style={[styles.statValue, { color: isDark ? '#f4f4f5' : '#09090b' }]}>
                            {nextScheduled ? formatMatchDate(nextScheduled.matchDate) : 'Por agendar'}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                );
              }}
            />

            {favoriteClubs.length > 1 && (
              <View style={styles.paginationDots}>
                {favoriteClubs.map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.dot,
                      activeCardIndex === i ? styles.activeDot : null,
                      { backgroundColor: activeCardIndex === i ? '#16a34a' : isDark ? '#3f3f46' : '#d4d4d8' },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Filtros */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#f4f4f5' : '#09090b' }]}>Jogos do Distrito</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {COMPETITIONS_FILTER.map((comp) => {
            const isSelected = selectedComp === comp;
            return (
              <TouchableOpacity
                key={comp}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? '#16a34a' : isDark ? '#18181b' : '#e4e4e7',
                  },
                ]}
                onPress={() => setSelectedComp(comp)}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: isSelected ? '#ffffff' : isDark ? '#a1a1aa' : '#52525b',
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {comp}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lista com Supabase Realtime */}
        <View style={styles.matchesList}>
          {loading ? (
            <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 24 }} />
          ) : filteredMatches.length === 0 ? (
            <Text style={{ textAlign: 'center', marginTop: 20, color: isDark ? '#71717a' : '#a1a1aa' }}>
              Nenhum jogo encontrado para esta competição.
            </Text>
          ) : (
            filteredMatches.map((match) => <MatchCard key={match.id} match={match} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingBottom: 40 },
  carouselContainer: { marginTop: 12, paddingHorizontal: 16 },
  favoriteCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginRight: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardHeaderText: { flex: 1, marginLeft: 12 },
  clubTitle: { fontSize: 16, fontWeight: '700' },
  divisionLabel: { fontSize: 12, marginTop: 2 },
  positionBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  positionNumber: { color: '#16a34a', fontSize: 16, fontWeight: '800' },
  positionText: { color: '#16a34a', fontSize: 10, fontWeight: '600' },
  cardStatsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  statBox: { flex: 1 },
  statLabel: { fontSize: 11, fontWeight: '500' },
  statValue: { fontSize: 14, fontWeight: '700', marginTop: 2 },
  paginationDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 3 },
  activeDot: { width: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 20, marginBottom: 10, paddingHorizontal: 16 },
  filtersScroll: { paddingHorizontal: 16, marginBottom: 14 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  filterText: { fontSize: 13 },
  matchesList: { paddingHorizontal: 16 },
});
