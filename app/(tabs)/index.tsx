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
import { MatchCard } from '@/components/MatchCard';
import { ClubBadge } from '@/components/ClubBadge';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const COMPETITIONS_FILTER = [
  'Todas',
  '1.ª Divisão',
  '2.ª Divisão - Série A',
  '2.ª Divisão - Série B',
  'Taça Ribatejo',
];

export default function HomeScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { favoriteClubIds, isOnboardingCompleted } = useFavorites();
  const { clubs } = useClubs();
  const { matches, loading } = useLiveMatches();
  const [selectedComp, setSelectedComp] = useState('Todas');
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  React.useEffect(() => {
    if (!isOnboardingCompleted) {
      router.replace('/(onboarding)/select-clubs');
    }
  }, [isOnboardingCompleted]);

  const favoriteClubs = clubs.filter((c) => favoriteClubIds.includes(c.id));

  const filteredMatches = matches.filter((m) => {
    if (selectedComp === 'Todas') return true;
    return m.competition.includes(selectedComp.replace(' - ', ' '));
  });

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
              renderItem={({ item }) => (
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
                  </View>
                </View>
              )}
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
  scrollContent: { paddingBottom: 40 },
  carouselContainer: { marginTop: 12, paddingHorizontal: 16 },
  favoriteCard: { padding: 16, borderRadius: 16, borderWidth: 1, marginRight: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardHeaderText: { flex: 1, marginLeft: 12 },
  clubTitle: { fontSize: 16, fontWeight: '700' },
  divisionLabel: { fontSize: 12, marginTop: 2 },
  paginationDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, marginHorizontal: 3 },
  activeDot: { width: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginTop: 20, marginBottom: 10, paddingHorizontal: 16 },
  filtersScroll: { paddingHorizontal: 16, marginBottom: 14 },
  filterPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  filterText: { fontSize: 13 },
  matchesList: { paddingHorizontal: 16 },
});
