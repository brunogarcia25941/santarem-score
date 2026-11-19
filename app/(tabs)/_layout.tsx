import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { AppHeader } from '@/components/AppHeader';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  // Com a navegação de 3 botões o Android desenha-os por cima do fundo da app (edge-to-edge):
  // a barra de separadores tem de crescer esse espaço, senão fica por baixo deles e não se clica.
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';

  const tintColor = '#2f6b4a'; // Verde distrital padrão
  const inactiveColor = isDark ? '#71717a' : '#a1a1aa';
  const bgColor = isDark ? '#121214' : '#ffffff';
  const borderColor = isDark ? '#2c2e33' : '#e2e5e8';
  const sceneBg = isDark ? '#1a1b1e' : '#eef0f2';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: tintColor,
        tabBarInactiveTintColor: inactiveColor,
        // O separador de abas em si (por baixo de cada ecrã) tinha fundo
        // branco por omissão — era isso que "piscava" ao voltar atrás de
        // um jogo ou da seleção de clubes, antes do ecrã de baixo pintar
        // por cima com a sua própria cor.
        sceneStyle: { backgroundColor: sceneBg },
        tabBarStyle: {
          backgroundColor: bgColor,
          borderTopColor: borderColor,
          height: 60 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        // Cabeçalho de marca (logótipo + título + lupa no Início) em vez do cabeçalho genérico.
        header: ({ options, route }) => (
          <AppHeader
            title={options.title ?? route.name}
            brandTitle={route.name === 'index'}
            onSearch={route.name === 'index' ? () => router.push('/search' as any) : undefined}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Ionicons name="football-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="competitions"
        options={{
          title: 'Competições',
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favoritos',
          tabBarIcon: ({ color, size }) => <Ionicons name="star-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="clubs"
        options={{
          title: 'Clubes',
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}