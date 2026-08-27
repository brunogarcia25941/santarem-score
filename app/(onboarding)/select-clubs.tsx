import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  useColorScheme,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SANTARÉM_CLUBS } from '@/constants/clubs';
import { useFavorites } from '@/context/FavoritesContext';

export default function SelectClubsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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

      <FlatList
        data={SANTARÉM_CLUBS}
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
              <View style={[styles.badge, { backgroundColor: item.primaryColor }]}>
                <Text style={styles.badgeText}>{item.initials}</Text>
              </View>

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
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 13,
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