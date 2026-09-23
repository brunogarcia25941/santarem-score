import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useClubs } from '@/hooks/useClubs';
import { useFavorites } from '@/context/FavoritesContext';
import { ClubBadge } from '@/components/ClubBadge';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ClubsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { clubs, loading, error, refresh } = useClubs();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [search, setSearch] = useState('');

  const filteredClubs = clubs.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.shortName.toLowerCase().includes(search.toLowerCase()) ||
      c.stadiumName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1a1b1e' : '#eef0f2' }]}>
      {/* Barra de Pesquisa */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: isDark ? '#202226' : '#ffffff', borderColor: isDark ? '#2c2e33' : '#e2e5e8' },
          ]}
        >
          <Ionicons name="search" size={18} color="#71717a" />
          <TextInput
            placeholder="Pesquisar clube ou estádio..."
            placeholderTextColor="#71717a"
            value={search}
            onChangeText={setSearch}
            style={[styles.searchInput, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#71717a" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2f6b4a" style={{ marginTop: 24 }} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Não foi possível carregar os clubes.</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredClubs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const favorite = isFavorite(item.id);
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[
                  styles.clubCard,
                  { backgroundColor: isDark ? '#202226' : '#ffffff', borderColor: isDark ? '#2c2e33' : '#e2e5e8' },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/club/${item.id}`);
                }}
              >
                <ClubBadge club={item} size={44} />

                <View style={styles.clubInfo}>
                  <Text style={[styles.clubName, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.stadiumName, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
                    📍 {item.stadiumName}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    toggleFavorite(item.id);
                  }}
                  style={styles.starBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name={favorite ? 'star' : 'star-outline'}
                    size={22}
                    color={favorite ? '#eab308' : '#71717a'}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { padding: 16 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14 },
  listContent: { paddingHorizontal: 16, paddingBottom: 30 },
  errorBox: { alignItems: 'center', marginTop: 24, paddingHorizontal: 20 },
  errorText: { color: '#71717a', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: '#2f6b4a', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#ffffff', fontWeight: '700' },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  clubInfo: { flex: 1, marginHorizontal: 12 },
  clubName: { fontSize: 14, fontWeight: '700' },
  stadiumName: { fontSize: 12, marginTop: 3 },
  starBtn: { padding: 4 },
});
