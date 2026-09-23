import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClubs } from '@/hooks/useClubs';
import { useFavorites } from '@/context/FavoritesContext';
import { useLiveMatches } from '@/hooks/useLiveMatches';
import { MatchCard } from '@/components/MatchCard';
import { ClubBadge } from '@/components/ClubBadge';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { clubs, loading } = useClubs();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { matches } = useLiveMatches();

  const club = useMemo(() => {
    return clubs.find((c) => c.id === id);
  }, [clubs, id]);

  // Jogos onde este clube participa
  const clubMatches = useMemo(() => {
    if (!club) return [];
    return matches.filter(
      (m) => m.homeClub.id === club.id || m.awayClub.id === club.id
    );
  }, [matches, club]);

  if (loading || !club) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090b' : '#f4f4f5', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  const isFav = isFavorite(club.id);

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${club.latitude},${club.longitude}`;
    Linking.openURL(url);
  };

  const openWaze = () => {
    const url = `https://waze.com/ul?ll=${club.latitude},${club.longitude}&navigate=yes`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090b' : '#f4f4f5' }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Cartão de Apresentação do Clube */}
        <View style={[styles.clubHero, { backgroundColor: isDark ? '#18181b' : '#ffffff' }]}>
          <ClubBadge club={club} size={72} />

          <Text style={[styles.clubNameTitle, { color: isDark ? '#f4f4f5' : '#09090b' }]}>
            {club.name}
          </Text>

          <Text style={[styles.divisionSubtitle, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
            AF Santarém • {club.division === '1_divisao' ? '1.ª Divisão Distrital' : '2.ª Divisão Distrital'}
          </Text>

          {/* Botão de Favorito */}
          <TouchableOpacity
            style={[
              styles.favoriteToggleBtn,
              {
                backgroundColor: isFav ? 'rgba(234, 179, 8, 0.15)' : isDark ? '#27272a' : '#e4e4e7',
                borderColor: isFav ? '#eab308' : 'transparent',
              },
            ]}
            onPress={() => toggleFavorite(club.id)}
          >
            <Ionicons
              name={isFav ? 'star' : 'star-outline'}
              size={18}
              color={isFav ? '#eab308' : isDark ? '#a1a1aa' : '#52525b'}
            />
            <Text
              style={[
                styles.favoriteToggleText,
                { color: isFav ? '#eab308' : isDark ? '#f4f4f5' : '#09090b' },
              ]}
            >
              {isFav ? 'Clube Favorito' : 'Adicionar aos Favoritos'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Estádio & Coordenadas GPS */}
        <View style={[styles.stadiumCard, { backgroundColor: isDark ? '#18181b' : '#ffffff' }]}>
          <View style={styles.stadiumHeader}>
            <Ionicons name="location" size={22} color="#16a34a" />
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={[styles.stadiumTitle, { color: isDark ? '#f4f4f5' : '#09090b' }]}>
                {club.stadiumName}
              </Text>
              <Text style={[styles.coordsText, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
                {club.latitude.toFixed(4)}° N, {Math.abs(club.longitude).toFixed(4)}° W
              </Text>
            </View>
          </View>

          <View style={styles.gpsRow}>
            <TouchableOpacity style={styles.mapsBtn} onPress={openGoogleMaps}>
              <Ionicons name="map-outline" size={16} color="#ffffff" />
              <Text style={styles.gpsBtnText}>Google Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.mapsBtn, { backgroundColor: '#33ccff' }]} onPress={openWaze}>
              <Ionicons name="navigate-outline" size={16} color="#ffffff" />
              <Text style={styles.gpsBtnText}>Waze</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendário e Jogos do Clube */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#f4f4f5' : '#09090b' }]}>
          Jogos e Resultados
        </Text>

        <View style={styles.matchesList}>
          {clubMatches.length === 0 ? (
            <Text style={{ textAlign: 'center', color: '#71717a', marginVertical: 20, fontSize: 13 }}>
              Sem partidas agendadas ou terminadas para este clube.
            </Text>
          ) : (
            clubMatches.map((m) => <MatchCard key={m.id} match={m} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  clubHero: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  clubNameTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },
  divisionSubtitle: {
    fontSize: 13,
    marginTop: 4,
    marginBottom: 14,
  },
  favoriteToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 8,
  },
  favoriteToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  stadiumCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  stadiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  stadiumTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  coordsText: {
    fontSize: 12,
    marginTop: 2,
  },
  gpsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mapsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  gpsBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
    marginLeft: 4,
  },
  matchesList: {
    gap: 4,
  },
});
