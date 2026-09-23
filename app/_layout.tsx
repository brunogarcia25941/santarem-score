import React, { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus } from 'react-native';
import { FavoritesProvider, useFavorites } from '@/context/FavoritesContext';
import { AuthProvider } from '@/context/AuthContext';
import { GoalAlertBanner } from '@/components/GoalAlertBanner';
import { vibrateGoal } from '@/services/notifications';
import { supabase } from '@/services/supabase';
import { syncOfflineQueue } from '@/services/matchActions';

function RealtimeGoalWatcher() {
  const { favoriteClubIds } = useFavorites();
  const [alertData, setAlertData] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false,
    title: '',
    message: '',
  });

  const appState = useRef(AppState.currentState);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const appStateSub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      appState.current = nextAppState;
    });

    const channel = supabase
      .channel('global:match-events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_events' },
        (payload: any) => {
          const event = payload.new;
          console.log('[DEBUG Realtime] Evento recebido:', event);

          if (!event || !isMounted.current) return;

          if (event.event_type === 'GOAL' || event.event_type === 'OWN_GOAL') {
            const isFav = favoriteClubIds.length === 0 || favoriteClubIds.includes(event.club_id);

            if (isFav) {
              vibrateGoal();
              setAlertData({
                visible: true,
                title: '⚽ GOLO NA AF SANTARÉM!',
                message: `${event.player_name || 'Golo marcado'} aos ${event.minute}'!`,
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      isMounted.current = false;
      appStateSub.remove();
      supabase.removeChannel(channel);
    };
  }, [favoriteClubIds]);

  return (
    <GoalAlertBanner
      visible={alertData.visible}
      title={alertData.title}
      message={alertData.message}
      onDismiss={() => setAlertData((prev) => ({ ...prev, visible: false }))}
    />
  );
}

function OfflineQueueSync() {
  useEffect(() => {
    // Tenta despachar eventos que ficaram presos offline logo no arranque...
    syncOfflineQueue().catch(() => {});

    // ...e sempre que a app volta para primeiro plano (provável sinal de
    // que a rede também voltou).
    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        syncOfflineQueue().catch(() => {});
      }
    });

    return () => sub.remove();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
    <FavoritesProvider>
      <OfflineQueueSync />
      <RealtimeGoalWatcher />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
        <Stack.Screen
          name="delegado-login"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Área de Delegados',
          }}
        />
        <Stack.Screen
          name="match/[id]"
          options={{
            presentation: 'card',
            headerShown: true,
            title: 'Detalhes do Jogo',
            // Sem deslize lateral nativo: esse movimento competia com a
            // animação FLIP do placar/emblemas e desfazia o efeito.
            // O gesto nativo de voltar atrás (swipe-back) mantém-se.
            animation: 'fade',
            animationDuration: 180,
          }}
        />
        <Stack.Screen
          name="club/[id]"
          options={{
            presentation: 'card',
            headerShown: true,
            title: 'Ficha do Clube',
          }}
        />
      </Stack>
      <StatusBar style="auto" />
    </FavoritesProvider>
    </AuthProvider>
  );
}