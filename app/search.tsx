import React, { useMemo, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useClubs } from '@/hooks/useClubs';
import { useFavorites } from '@/context/FavoritesContext';
import { ClubBadge } from '@/components/ClubBadge';
import { HeaderShell } from '@/components/AppHeader';
import { StadiumTexture } from '@/components/StadiumTexture';
import { getTheme } from '@/constants/theme';
import { useTrackSearch } from '@/hooks/useTrackSearch';
import { EmptyState } from '@/components/EmptyState';
import { ClubRowSkeleton } from '@/components/Skeleton';
import { track } from '@/services/analytics';

/** Normaliza para pesquisar sem ligar a acentos nem a maiúsculas ("mação" = "macao"). */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const DIVISION_LABEL: Record<string, string> = {
  '1_divisao': '1.ª Divisão',
  '2_divisao_a': '2.ª Divisão · Série A',
  '2_divisao_b': '2.ª Divisão · Série B',
};

/** Pesquisa de clube ou estádio, aberta pela lupa do Início. */
export default function SearchScreen() {
  const router = useRouter();
  const t = getTheme(useColorScheme() === 'dark');
  const { clubs, loading } = useClubs();
  const { isFavorite } = useFavorites();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = norm(query.trim());
    if (!q) return [];
    return clubs.filter((c) => norm(c.name).includes(q) || norm(c.shortName).includes(q) || norm(c.stadiumName).includes(q));
  }, [clubs, query]);

  useTrackSearch(query, results.length, 'search_screen');

  return (
    <View style={[styles.container, { backgroundColor: t.base }]}>
      <HeaderShell>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityLabel="Voltar">
          <Ionicons name="arrow-back" size={24} color={t.text} />
        </TouchableOpacity>
        <View style={[styles.inputBox, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Ionicons name="search" size={18} color={t.textMuted} />
          <TextInput
            autoFocus
            placeholder="Pesquisar clube ou estádio..."
            placeholderTextColor={t.textFaint}
            value={query}
            onChangeText={setQuery}
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.input, { color: t.text }]}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={t.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </HeaderShell>

      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <StadiumTexture variant="grass" />
        {loading ? (
          <ClubRowSkeleton count={6} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(c) => c.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={
              query.trim() ? (
                <EmptyState icon="search-outline" title="Nada encontrado" subtitle="Não há clubes nem estádios com esse nome." />
              ) : (
                <EmptyState icon="search-outline" title="Pesquisar" subtitle="Escreve o nome de um clube ou de um estádio." />
              )
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                style={[styles.row, { backgroundColor: t.surface, borderColor: t.border }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  track('search.result_open', { club_id: item.id });
                  router.push(`/club/${item.id}`);
                }}
              >
                <ClubBadge club={item} size={42} />
                <View style={{ flex: 1, marginHorizontal: 12 }}>
                  <Text style={[styles.name, { color: t.text }]} numberOfLines={1}>{item.name}</Text>
                  <Text style={[styles.sub, { color: t.textMuted }]} numberOfLines={1}>📍 {item.stadiumName}</Text>
                  <Text style={[styles.sub, { color: t.textFaint }]}>{DIVISION_LABEL[item.division] ?? ''}</Text>
                </View>
                {isFavorite(item.id) && <Ionicons name="star" size={18} color="#eab308" />}
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  empty: { textAlign: 'center', marginTop: 40, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  name: { fontSize: 14, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
});
