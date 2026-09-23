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
import * as Haptics from 'expo-haptics';
import { useFavorites } from '@/context/FavoritesContext';
import { useClubs } from '@/hooks/useClubs';
import { useLiveMatches } from '@/hooks/useLiveMatches';
import { useStandings } from '@/hooks/useStandings';
import { MatchCard } from '@/components/MatchCard';
import { ClubBadge } from '@/components/ClubBadge';
import { formatMatchDate } from '@/utils/dateFormat';
import { Match, Club } from '@/types';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StadiumTexture } from '@/components/StadiumTexture';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useSwipeableTabs } from '@/hooks/useSwipeableTabs';

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

  // Permite arrastar o dedo sobre a lista de jogos para percorrer as
  // competições, de forma circular, sem precisar de tocar nos separadores.
  const selectedCompIndex = COMPETITIONS_FILTER.indexOf(selectedComp);
  const { panGesture, animatedStyle } = useSwipeableTabs({
    length: COMPETITIONS_FILTER.length,
    currentIndex: selectedCompIndex === -1 ? 0 : selectedCompIndex,
    onChangeIndex: (index) => {
      Haptics.selectionAsync();
      setSelectedComp(COMPETITIONS_FILTER[index]);
    },
  });

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
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: isDark ? '#1a1b1e' : '#eef0f2' }]}>
        <ActivityIndicator size="large" color="#2f6b4a" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1a1b1e' : '#eef0f2' }]}>
      <StadiumTexture variant="grass" />
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
                        backgroundColor: isDark ? '#202226' : '#ffffff',
                        borderColor: isDark ? '#2c2e33' : '#e2e5e8',
                      },
                    ]}
                  >
                    <View style={styles.cardHeader}>
                      <ClubBadge club={item} size={40} />
                      <View style={styles.cardHeaderText}>
                        <Text style={[styles.clubTitle, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
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
                        <Text style={[styles.statValue, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
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
                          <Text style={[styles.statValue, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
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
                      { backgroundColor: activeCardIndex === i ? '#2f6b4a' : isDark ? '#3f3f46' : '#d4d4d8' },
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Filtros */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Jogos do Distrito</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersScroll}>
          {COMPETITIONS_FILTER.map((comp) => {
            const isSelected = selectedComp === comp;
            return (
              <TouchableOpacity
                key={comp}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isSelected ? '#2f6b4a' : isDark ? '#202226' : '#e2e5e8',
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedComp(comp);
                }}
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

        {/* Lista com Supabase Realtime — arrastável para o lado para
            percorrer as competições */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.matchesList, animatedStyle]}>
          {loading ? (
            <ActivityIndicator size="large" color="#2f6b4a" style={{ marginTop: 24 }} />
          ) : filteredMatches.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              <Text style={{ textAlign: 'center', color: isDark ? '#71717a' : '#a1a1aa' }}>
                {selectedComp === 'Todas'
                  ? 'Ainda não há jogos registados.'
                  : `Sem jogos de teste na competição "${selectedComp}".`}
              </Text>
              {selectedComp !== 'Todas' && (
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedComp('Todas');
                  }}
                  style={{ marginTop: 10 }}
                >
                  <Text style={{ color: '#2f6b4a', fontWeight: '700', fontSize: 13 }}>Ver todas as competições</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredMatches.map((match) => <MatchCard key={match.id} match={match} />)
          )}
          </Animated.View>
        </GestureDetector>
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
    backgroundColor: 'rgba(47, 107, 74, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  positionNumber: { color: '#2f6b4a', fontSize: 16, fontWeight: '800' },
  positionText: { color: '#2f6b4a', fontSize: 10, fontWeight: '600' },
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
