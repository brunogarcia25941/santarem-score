import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand, getTheme } from '@/constants/theme';

/** Altura do conteúdo do cabeçalho (sem a barra de estado). */
export const HEADER_CONTENT_HEIGHT = 60;

/**
 * Casca do cabeçalho: tem a mesma cor de fundo dos ecrãs (o cabeçalho funde-se com o conteúdo, como
 * os cartões), margem da barra de estado e um fio fino por baixo. Serve os separadores, a
 * pesquisa e a seleção de clubes. Os cabeçalhos nativos dos ecrãs em pilha (`app/_layout.tsx`)
 * usam as mesmas cores.
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const t = getTheme(useColorScheme() === 'dark');
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: t.base, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border }}>
      <View style={styles.row}>{children}</View>
    </View>
  );
}

interface AppHeaderProps {
  title: string;
  /** Mostra a lupa de pesquisa à direita. */
  onSearch?: () => void;
  /** No Início o título é a marca ("Santarém Score"). */
  brandTitle?: boolean;
}

/** Cabeçalho dos separadores: logótipo, título grande e ações em botões redondos. */
export function AppHeader({ title, onSearch, brandTitle }: AppHeaderProps) {
  const t = getTheme(useColorScheme() === 'dark');
  return (
    <HeaderShell>
      <Image source={require('../../assets/images/app-logo.png')} style={styles.logo} />
      <View style={styles.titleBox}>
        <Text style={styles.kicker}>{brandTitle ? 'AF SANTARÉM · DISTRITAL' : 'SANTARÉM SCORE'}</Text>
        <Text style={[styles.title, { color: t.text }]} numberOfLines={1}>
          {brandTitle ? 'Santarém Score' : title}
        </Text>
      </View>
      {onSearch && (
        <TouchableOpacity
          onPress={onSearch}
          hitSlop={8}
          style={[styles.action, { backgroundColor: t.surface, borderColor: t.border }]}
          accessibilityLabel="Pesquisar"
        >
          <Ionicons name="search" size={20} color={t.text} />
        </TouchableOpacity>
      )}
    </HeaderShell>
  );
}

const styles = StyleSheet.create({
  row: { height: HEADER_CONTENT_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  logo: { width: 38, height: 38, borderRadius: 19 },
  titleBox: { flex: 1 },
  kicker: { color: brand.amberDeep, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginTop: 1 },
  action: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
