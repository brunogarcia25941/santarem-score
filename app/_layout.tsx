import React, { useEffect, useState, useRef } from 'react';
import { Stack, useRouter, usePathname, useRootNavigationState } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { AppState, AppStateStatus, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { FavoritesProvider, useFavorites } from '@/context/FavoritesContext';
import { AuthProvider } from '@/context/AuthContext';
import { GoalAlertBanner } from '@/components/GoalAlertBanner';
import { vibrateGoal } from '@/services/notifications';
import { supabase } from '@/services/supabase';
import { syncOfflineQueue } from '@/services/matchActions';
import { isPushEnabledLocally, syncPushToken } from '@/services/pushNotifications';

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

/**
 * Ao tocar numa notificação de golo abre o ecrã desse jogo. O hook
 * useLastNotificationResponse cobre tanto a app já aberta/em segundo plano
 * como o arranque a frio (app fechada) — daí esperar que o navegador raiz
 * esteja montado antes de navegar.
 */
function NotificationNavigator() {
  const router = useRouter();
  const pathname = usePathname();
  const navigationState = useRootNavigationState();
  const response = Notifications.useLastNotificationResponse();
  const handledId = useRef<string | null>(null);

  useEffect(() => {
    if (!response || !navigationState?.key) return;
    if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;

    const notificationId = response.notification.request.identifier;
    if (handledId.current === notificationId) return;
    handledId.current = notificationId;

    const matchId = response.notification.request.content.data?.matchId;
    if (typeof matchId !== 'string') return;
    if (pathname === `/match/${matchId}`) return;
    router.push(`/match/${matchId}`);
  }, [response, navigationState?.key]);

  return null;
}

function PushTokenSync() {
  const { favoriteClubIds } = useFavorites();

  useEffect(() => {
    // Só ressincroniza (novo token ou novos favoritos) se o utilizador já
    // tinha ativado as notificações no Perfil — nunca pede permissão sozinho.
    isPushEnabledLocally().then((enabled) => {
      if (enabled) syncPushToken(favoriteClubIds);
    });
  }, [favoriteClubIds]);

  return null;
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
  const isDark = useColorScheme() === 'dark';

  // Cores do próprio ecrã e do cabeçalho, para o fundo nativo do stack
  // nunca ser o branco por omissão do react-native-screens — era isso
  // que causava o "flash" branco ao abrir/fechar páginas.
  const screenBg = isDark ? '#1a1b1e' : '#eef0f2';
  const headerBg = isDark ? '#121214' : '#ffffff';
  const headerBorder = isDark ? '#2c2e33' : '#e2e5e8';
  const headerText = isDark ? '#eef0f2' : '#1a1b1e';

  const headerOptions = {
    headerShown: true,
    headerStyle: { backgroundColor: headerBg },
    headerTintColor: headerText,
    headerTitleStyle: { color: headerText, fontWeight: '700' as const },
    headerShadowVisible: true,
    contentStyle: { backgroundColor: screenBg },
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
      <FavoritesProvider>
        <OfflineQueueSync />
        <PushTokenSync />
        <NotificationNavigator />
        <RealtimeGoalWatcher />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: screenBg } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen
            name="delegado-login"
            options={{
              ...headerOptions,
              presentation: 'modal',
              title: 'Área de Delegados',
            }}
          />
          <Stack.Screen
            name="match/[id]"
            options={{
              ...headerOptions,
              presentation: 'card',
              title: 'Detalhes do Jogo',
              // Sem animação nativa de transição: o "fade" do próprio
              // react-native-screens estava a mostrar um flash branco por
              // trás durante a dissolução, e também competia com a
              // animação FLIP do placar/emblemas. O gesto nativo de voltar
              // atrás (swipe-back) mantém-se — só a animação de entrada é
              // que passa a ser inteiramente a nossa (FLIP).
              animation: 'none',
              freezeOnBlur: true,
            }}
          />
          <Stack.Screen
            name="club/[id]"
            options={{
              ...headerOptions,
              presentation: 'card',
              title: 'Ficha do Clube',
            }}
          />
        </Stack>
        <StatusBar style="auto" />
      </FavoritesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}