import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleProp, StyleSheet, View, ViewStyle, useColorScheme } from 'react-native';
import { getTheme } from '@/constants/theme';

/** Bloco cinzento a "respirar" enquanto os dados carregam (em vez de uma rodinha). */
export function Skeleton({
  width = '100%',
  height = 14,
  radius = 8,
  style,
}: {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const isDark = useColorScheme() === 'dark';
  const opacity = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.55, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[{ width, height, borderRadius: radius, backgroundColor: isDark ? '#2c2e33' : '#dcdfe3', opacity }, style]}
    />
  );
}

/** Esqueleto de um cartão de jogo (mesmo tamanho e forma do `MatchCard`). */
export function MatchCardSkeleton() {
  const t = getTheme(useColorScheme() === 'dark');
  return (
    <View style={[styles.matchCard, { backgroundColor: t.surface, borderColor: t.border }]}>
      <Skeleton width="55%" height={11} />
      <View style={styles.matchRow}>
        <View style={styles.matchTeam}>
          <Skeleton width={36} height={36} radius={18} />
          <Skeleton width={60} height={11} style={{ marginTop: 8 }} />
        </View>
        <Skeleton width={64} height={28} radius={8} />
        <View style={styles.matchTeam}>
          <Skeleton width={36} height={36} radius={18} />
          <Skeleton width={60} height={11} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  );
}

/** Esqueleto das linhas de uma tabela de classificação. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={styles.tableRow}>
          <Skeleton width={16} height={12} />
          <Skeleton width={22} height={22} radius={11} />
          <Skeleton width="38%" height={12} />
          <View style={{ flex: 1 }} />
          <Skeleton width={90} height={12} />
        </View>
      ))}
    </View>
  );
}

/** Esqueleto de uma linha de lista de clubes (emblema + duas linhas). */
export function ClubRowSkeleton({ count = 7 }: { count?: number }) {
  const t = getTheme(useColorScheme() === 'dark');
  return (
    <View style={{ paddingHorizontal: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={[styles.clubRow, { backgroundColor: t.surface, borderColor: t.border }]}>
          <Skeleton width={44} height={44} radius={22} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="65%" height={13} />
            <Skeleton width="45%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

/** Esqueleto da grelha de clubes (3 colunas). */
export function TileGridSkeleton({ rows = 4 }: { rows?: number }) {
  const t = getTheme(useColorScheme() === 'dark');
  return (
    <View style={{ paddingHorizontal: 16, gap: 10 }}>
      <Skeleton width={120} height={16} style={{ marginTop: 14, marginBottom: 2 }} />
      {Array.from({ length: rows }).map((_, r) => (
        <View key={r} style={{ flexDirection: 'row', gap: 10 }}>
          {[0, 1, 2].map((c) => (
            <View key={c} style={[styles.tile, { backgroundColor: t.surface, borderColor: t.border }]}>
              <Skeleton width={54} height={54} radius={27} />
              <Skeleton width="70%" height={11} style={{ marginTop: 12 }} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  matchCard: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14 },
  matchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  matchTeam: { alignItems: 'center', width: 96 },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, paddingHorizontal: 12 },
  clubRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  tile: { flex: 1, alignItems: 'center', paddingTop: 16, paddingBottom: 14, borderRadius: 16, borderWidth: 1.5, minHeight: 124 },
});
