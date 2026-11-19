import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand } from '@/constants/theme';

/** Altura do conteúdo do cabeçalho (sem a barra de estado). */
export const HEADER_CONTENT_HEIGHT = 56;

/** Cores do cabeçalho: verde floresta em degradé, mais escuro no modo escuro. */
export function useHeaderColors(): [string, string] {
  const isDark = useColorScheme() === 'dark';
  return isDark ? ['#102a1c', '#1f4d36'] : [brand.forestDeep, brand.forest];
}

/**
 * Casca do cabeçalho de marca: degradé verde, margem da barra de estado e um fio âmbar por baixo.
 * Quem a usa mete lá dentro a linha de conteúdo. Serve os separadores, a pesquisa e a seleção de
 * clubes, para toda a app ter o mesmo cabeçalho (a barra de estado é sempre clara por cima dele).
 */
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const colors = useHeaderColors();
  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={{ paddingTop: insets.top, borderBottomWidth: 2, borderBottomColor: brand.amber }}
    >
      <View style={styles.row}>{children}</View>
    </LinearGradient>
  );
}

interface AppHeaderProps {
  title: string;
  /** Mostra a lupa de pesquisa à direita. */
  onSearch?: () => void;
  /** No Início o título é a marca ("Santarém Score"), com o nome do separador por baixo. */
  brandTitle?: boolean;
}

/** Cabeçalho dos separadores: logótipo da app à esquerda, título e ações à direita. */
export function AppHeader({ title, onSearch, brandTitle }: AppHeaderProps) {
  return (
    <HeaderShell>
      <Image source={require('../../assets/images/app-logo.png')} style={styles.logo} />
      <View style={styles.titleBox}>
        {brandTitle ? (
          <>
            <Text style={styles.kicker}>AF SANTARÉM</Text>
            <Text style={styles.title} numberOfLines={1}>Santarém Score</Text>
          </>
        ) : (
          <>
            <Text style={styles.kicker}>SANTARÉM SCORE</Text>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </>
        )}
      </View>
      {onSearch && (
        <TouchableOpacity onPress={onSearch} hitSlop={10} style={styles.action} accessibilityLabel="Pesquisar">
          <Ionicons name="search" size={22} color="#ffffff" />
        </TouchableOpacity>
      )}
    </HeaderShell>
  );
}

const styles = StyleSheet.create({
  row: { height: HEADER_CONTENT_HEIGHT, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 },
  logo: { width: 36, height: 36, borderRadius: 18 },
  titleBox: { flex: 1 },
  kicker: { color: brand.amber, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  title: { color: '#ffffff', fontSize: 19, fontWeight: '800', marginTop: 1 },
  action: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
});
