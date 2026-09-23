import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClubs } from '@/hooks/useClubs';
import { useFavorites } from '@/context/FavoritesContext';
import { ClubBadge } from '@/components/ClubBadge';

export default function SelectClubsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { clubs, loading, error, refresh } = useClubs();
  const { isFavorite, toggleFavorite, completeOnboarding, favoriteClubIds } = useFavorites();

  const handleContinue = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090b' : '#f4f4f5' }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#f4f4f5' : '#09090b' }]}>
          Santarém Score
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? '#a1a1aa' : '#52525b' }]}>
          Escolhe os teus clubes favoritos para receberes notificações e acompanhares resultados em direto.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#16a34a" style={{ marginTop: 40 }} />
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>Não foi possível carregar os clubes.</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const selected = isFavorite(item.id);
            return (
              <TouchableOpacity
                activeOpacity={0.8}
                style={[
                  styles.clubCard,
                  {
                    backgroundColor: isDark ? '#18181b' : '#ffffff',
                    borderColor: selected ? '#16a34a' : isDark ? '#27272a' : '#e4e4e7',
                  },
                ]}
                onPress={() => toggleFavorite(item.id)}
              >
                <ClubBadge club={item} size={44} />

                <View style={styles.clubInfo}>
                  <Text style={[styles.clubName, { color: isDark ? '#f4f4f5' : '#09090b' }]}>
                    {item.shortName}
                  </Text>
                  <Text style={[styles.stadium, { color: isDark ? '#71717a' : '#71717a' }]}>
                    {item.stadiumName}
                  </Text>
                </View>

                <View
                  style={[
                    styles.checkbox,
                    selected && styles.checkboxActive,
                    { borderColor: selected ? '#16a34a' : isDark ? '#3f3f46' : '#d4d4d8' },
                  ]}
                >
                  {selected && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <View style={[styles.footer, { backgroundColor: isDark ? '#09090b' : '#f4f4f5' }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { backgroundColor: favoriteClubIds.length > 0 ? '#16a34a' : '#71717a' },
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>
            {favoriteClubIds.length > 0
              ? `Continuar (${favoriteClubIds.length} selecionados)`
              : 'Continuar sem selecionar'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  errorBox: { alignItems: 'center', marginTop: 40, paddingHorizontal: 20 },
  errorText: { color: '#71717a', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: '#16a34a', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  retryBtnText: { color: '#ffffff', fontWeight: '700' },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  clubInfo: {
    flex: 1,
    marginLeft: 14,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '700',
  },
  stadium: {
    fontSize: 12,
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: '#16a34a',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  continueButton: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
});
