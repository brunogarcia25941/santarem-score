import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function OnboardingLayout() {
  const isDark = useColorScheme() === 'dark';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Sem isto, este stack usa o fundo branco por omissão do
        // react-native-screens — é o que piscava ao sair da seleção
        // de clubes de volta para os Favoritos.
        contentStyle: { backgroundColor: isDark ? '#1a1b1e' : '#eef0f2' },
        animation: 'none',
      }}
    >
      <Stack.Screen name="select-clubs" />
    </Stack>
  );
}
