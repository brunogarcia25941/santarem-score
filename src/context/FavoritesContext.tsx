import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FavoritesContextType {
  favoriteClubIds: string[];
  toggleFavorite: (clubId: string) => void;
  isFavorite: (clubId: string) => boolean;
  isOnboardingCompleted: boolean;
  completeOnboarding: () => Promise<void>;
  primaryClubColor: string;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const FAVORITES_STORAGE_KEY = '@santarem_score:favorites';
const ONBOARDING_STORAGE_KEY = '@santarem_score:onboarding';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favoriteClubIds, setFavoriteClubIds] = useState<string[]>([]);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const storedFavs = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
        const storedOnboarding = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);

        if (storedFavs) {
          setFavoriteClubIds(JSON.parse(storedFavs));
        }
        setIsOnboardingCompleted(storedOnboarding === 'true');
      } catch (err) {
        console.error('Erro ao carregar favoritos:', err);
      }
    }
    loadData();
  }, []);

  const toggleFavorite = async (clubId: string) => {
    const updated = favoriteClubIds.includes(clubId)
      ? favoriteClubIds.filter((id) => id !== clubId)
      : [...favoriteClubIds, clubId];

    setFavoriteClubIds(updated);
    await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
  };

  const completeOnboarding = async () => {
    setIsOnboardingCompleted(true);
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
  };

  const isFavorite = (clubId: string) => favoriteClubIds.includes(clubId);

  return (
    <FavoritesContext.Provider
      value={{
        favoriteClubIds,
        toggleFavorite,
        isFavorite,
        isOnboardingCompleted,
        completeOnboarding,
        primaryClubColor: '#16a34a',
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}