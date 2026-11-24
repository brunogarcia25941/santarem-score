import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  useWindowDimensions,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useClubs } from '@/hooks/useClubs';
import { useFavorites } from '@/context/FavoritesContext';
import { ClubBadge } from '@/components/ClubBadge';
import { HeaderShell } from '@/components/AppHeader';
import { StadiumTexture } from '@/components/StadiumTexture';
import { TileGridSkeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';
import { brand, getTheme } from '@/constants/theme';
import { Club } from '@/types';

/** Normaliza para pesquisar sem ligar a acentos nem a maiúsculas. */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const COLUMNS = 3;
const GAP = 10;
const SIDE = 16;

const SECTIONS: { id: Club['division']; label: string }[] = [
  { id: '1_divisao', label: '1.ª Divisão' },
  { id: '2_divisao_a', label: '2.ª Divisão · Série A' },
  { id: '2_divisao_b', label: '2.ª Divisão · Série B' },
];

type ListItem =
  | { key: string; type: 'header'; label: string; count: number }
  | { key: string; type: 'row'; clubs: Club[] };

/**
 * Escolha dos clubes favoritos. É o ecrã da primeira utilização e também o que se abre a partir do
 * Início/Favoritos/Perfil para adicionar ou retirar favoritos: nesse caso (onboarding já feito)
 * mostra a seta de voltar e o botão "Concluir". Não escolher nenhum clube é permitido.
 */
export default function SelectClubsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const t = getTheme(isDark);
  const { clubs, loading, error, refresh } = useClubs();
  const { isFavorite, toggleFavorite, completeOnboarding, favoriteClubIds, isOnboardingCompleted } = useFavorites();
  const [search, setSearch] = useState('');

  const { width } = useWindowDimensions();
  const cardWidth = (width - SIDE * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

  // Secções por divisão, cada uma em linhas de 3 clubes (só as que têm resultados).
  const items = useMemo<ListItem[]>(() => {
    const q = norm(search.trim());
    const matches = (c: Club) =>
      !q || norm(c.name).includes(q) || norm(c.shortName).includes(q) || norm(c.stadiumName).includes(q);
    const out: ListItem[] = [];
    for (const section of SECTIONS) {
      const list = clubs
        .filter((c) => c.division === section.id && matches(c))
        .sort((a, b) => a.shortName.localeCompare(b.shortName, 'pt'));
      if (list.length === 0) continue;
      out.push({ key: `h-${section.id}`, type: 'header', label: section.label, count: list.length });
      for (let i = 0; i < list.length; i += COLUMNS) {
        out.push({ key: `r-${section.id}-${i}`, type: 'row', clubs: list.slice(i, i + COLUMNS) });
      }
    }
    return out;
  }, [clubs, search]);

  const handleContinue = async () => {
    if (isOnboardingCompleted) {
      router.back();
      return;
    }
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const count = favoriteClubIds.length;
  const buttonLabel = isOnboardingCompleted
    ? count > 0
      ? `Concluir (${count} ${count === 1 ? 'selecionado' : 'selecionados'})`
      : 'Concluir'
    : count > 0
      ? `Continuar (${count} ${count === 1 ? 'selecionado' : 'selecionados'})`
      : 'Continuar sem selecionar';

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1a1b1e' : '#eef0f2' }]}>
      <HeaderShell>
        {isOnboardingCompleted ? (
          <TouchableOpacity onPress={() => router.back()} hitSlop={10} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={24} color={t.text} />
          </TouchableOpacity>
        ) : (
          <Image source={require('../../assets/images/app-logo.png')} style={styles.logo} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>SANTARÉM SCORE</Text>
          <Text style={[styles.headerTitle, { color: t.text }]}>{isOnboardingCompleted ? 'Clubes favoritos' : 'Bem-vindo'}</Text>
        </View>
      </HeaderShell>

      <SafeAreaView edges={['left', 'right']} style={{ flex: 1 }}>
        <StadiumTexture variant="grass" />
        <View style={styles.intro}>
          <Text style={[styles.subtitle, { color: isDark ? '#a1a1aa' : '#52525b' }]}>
            Escolhe os clubes que queres acompanhar para receberes notificações e ver os jogos deles à mão. Podes
            continuar sem escolher e fazê-lo mais tarde.
          </Text>
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
              autoCorrect={false}
              style={[styles.searchInput, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color="#71717a" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {loading ? (
          <TileGridSkeleton rows={4} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Não foi possível carregar os clubes.</Text>
            <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => item.key}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.listContent, { paddingBottom: 100 + insets.bottom }]}
            ListEmptyComponent={<EmptyState compact icon="search-outline" title="Nenhum clube encontrado" subtitle="Tenta outro nome de clube ou de estádio." />}
            renderItem={({ item }) => {
              if (item.type === 'header') {
                return (
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: t.text }]}>{item.label}</Text>
                    <Text style={[styles.sectionCount, { color: t.textFaint }]}>{item.count} clubes</Text>
                  </View>
                );
              }
              return (
                <View style={styles.gridRow}>
                  {item.clubs.map((club) => {
                    const selected = isFavorite(club.id);
                    return (
                      <TouchableOpacity
                        key={club.id}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={club.shortName}
                        style={[
                          styles.tile,
                          {
                            width: cardWidth,
                            backgroundColor: selected ? brand.forestMuted : t.surface,
                            borderColor: selected ? brand.forest : t.border,
                          },
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          toggleFavorite(club.id);
                        }}
                      >
                        {selected && (
                          <View style={styles.tick}>
                            <Ionicons name="checkmark" size={13} color="#ffffff" />
                          </View>
                        )}
                        <ClubBadge club={club} size={54} />
                        <Text style={[styles.tileName, { color: t.text }]} numberOfLines={2}>
                          {club.shortName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {/* células vazias mantêm as colunas alinhadas na última linha */}
                  {Array.from({ length: COLUMNS - item.clubs.length }).map((_, i) => (
                    <View key={`pad-${i}`} style={{ width: cardWidth }} />
                  ))}
                </View>
              );
            }}
          />
        )}

        <View
          style={[
            styles.footer,
            { backgroundColor: isDark ? '#1a1b1e' : '#eef0f2', paddingBottom: 14 + insets.bottom },
          ]}
        >
          <TouchableOpacity
            style={[styles.continueButton, { backgroundColor: count > 0 || isOnboardingCompleted ? brand.forest : '#71717a' }]}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>{buttonLabel}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  logo: { width: 38, height: 38, borderRadius: 19 },
  kicker: { color: brand.amberDeep, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginTop: 1 },
  intro: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 12 },
  subtitle: { fontSize: 13, lineHeight: 19 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 44, borderRadius: 10, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  listContent: { paddingHorizontal: SIDE },
  empty: { textAlign: 'center', color: '#71717a', marginTop: 30, fontSize: 13 },
  errorBox: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  errorText: { color: '#71717a', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: brand.forest, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#ffffff', fontWeight: '700' },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 14, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionCount: { fontSize: 12, fontWeight: '600' },
  gridRow: { flexDirection: 'row', gap: GAP, marginBottom: GAP },
  tile: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1.5,
    minHeight: 124,
  },
  tick: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: brand.forest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileName: { fontSize: 12.5, fontWeight: '700', textAlign: 'center', marginTop: 10, lineHeight: 16 },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  continueButton: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  continueButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
});
