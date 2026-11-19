import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
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
import { brand } from '@/constants/theme';

/** Normaliza para pesquisar sem ligar a acentos nem a maiúsculas. */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Escolha dos clubes favoritos. É o ecrã da primeira utilização e também o que se abre a partir do
 * Início/Favoritos/Perfil para adicionar ou retirar favoritos: nesse caso (onboarding já feito)
 * mostra a seta de voltar e o botão "Concluir". Não escolher nenhum clube é permitido.
 */
export default function SelectClubsScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const insets = useSafeAreaInsets();
  const { clubs, loading, error, refresh } = useClubs();
  const { isFavorite, toggleFavorite, completeOnboarding, favoriteClubIds, isOnboardingCompleted } = useFavorites();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = norm(search.trim());
    if (!q) return clubs;
    return clubs.filter((c) => norm(c.name).includes(q) || norm(c.shortName).includes(q) || norm(c.stadiumName).includes(q));
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
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <Image source={require('../../assets/images/app-logo.png')} style={styles.logo} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>SANTARÉM SCORE</Text>
          <Text style={styles.headerTitle}>{isOnboardingCompleted ? 'Clubes favoritos' : 'Bem-vindo'}</Text>
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
          <ActivityIndicator size="large" color="#2f6b4a" style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>Não foi possível carregar os clubes.</Text>
            <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
              <Text style={styles.retryBtnText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.listContent, { paddingBottom: 100 + insets.bottom }]}
            ListEmptyComponent={<Text style={styles.empty}>Nenhum clube encontrado.</Text>}
            renderItem={({ item }) => {
              const selected = isFavorite(item.id);
              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.clubCard,
                    {
                      backgroundColor: isDark ? '#202226' : '#ffffff',
                      borderColor: selected ? brand.forest : isDark ? '#2c2e33' : '#e2e5e8',
                    },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    toggleFavorite(item.id);
                  }}
                >
                  <ClubBadge club={item} size={44} />

                  <View style={styles.clubInfo}>
                    <Text style={[styles.clubName, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>{item.shortName}</Text>
                    <Text style={styles.stadium}>{item.stadiumName}</Text>
                  </View>

                  <View
                    style={[
                      styles.checkbox,
                      selected && styles.checkboxActive,
                      { borderColor: selected ? brand.forest : isDark ? '#3f3f46' : '#d4d4d8' },
                    ]}
                  >
                    {selected && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                  </View>
                </TouchableOpacity>
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
  logo: { width: 36, height: 36, borderRadius: 18 },
  kicker: { color: brand.amber, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  headerTitle: { color: '#ffffff', fontSize: 19, fontWeight: '800', marginTop: 1 },
  intro: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10, gap: 12 },
  subtitle: { fontSize: 13, lineHeight: 19 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 44, borderRadius: 10, borderWidth: 1, gap: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  listContent: { paddingHorizontal: 16 },
  empty: { textAlign: 'center', color: '#71717a', marginTop: 30, fontSize: 13 },
  errorBox: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  errorText: { color: '#71717a', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: brand.forest, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#ffffff', fontWeight: '700' },
  clubCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14, marginBottom: 10, borderWidth: 1.5 },
  clubInfo: { flex: 1, marginLeft: 14 },
  clubName: { fontSize: 16, fontWeight: '700' },
  stadium: { fontSize: 12, marginTop: 2, color: '#71717a' },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: brand.forest },
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
