import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, useColorScheme } from 'react-native';
import { brand, getTheme } from '@/constants/theme';

interface ScoreDisplayProps {
  homeScore: number;
  awayScore: number;
  size?: 'small' | 'large';
  status?: string;
  minute?: number;
}

/**
 * Resultado em estilo simples (números grandes na cor do tema). Substituiu o marcador LED de
 * 7 segmentos, que destoava do resto da app. Em direto mostra por baixo uma etiqueta vermelha
 * com o minuto (ponto a piscar); ao intervalo, "INT".
 */
export function ScoreDisplay({ homeScore, awayScore, size = 'small', status, minute }: ScoreDisplayProps) {
  const isDark = useColorScheme() === 'dark';
  const t = getTheme(isDark);
  const isLarge = size === 'large';
  const isLive = status === 'live';

  // Ponto a piscar com o jogo em direto.
  const blink = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!isLive) {
      blink.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 0.25, duration: 800, useNativeDriver: true }),
        Animated.timing(blink, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isLive, blink]);

  const numberStyle = {
    fontSize: isLarge ? 44 : 26,
    lineHeight: isLarge ? 50 : 30,
    color: t.text,
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[styles.number, numberStyle]}>{homeScore}</Text>
        <Text style={[styles.dash, { fontSize: isLarge ? 28 : 18, color: t.textFaint }]}>–</Text>
        <Text style={[styles.number, numberStyle]}>{awayScore}</Text>
      </View>

      {/* No cartão (small) o minuto já aparece no cabeçalho do MatchCard */}
      {isLarge && isLive && minute !== undefined && (
        <View style={[styles.pill, { backgroundColor: brand.redGlow }]}>
          <Animated.View style={[styles.dot, { opacity: blink }]} />
          <Text style={[styles.pillText, { color: brand.red, fontSize: isLarge ? 13 : 11 }]}>{minute}'</Text>
        </View>
      )}

      {isLarge && status === 'halftime' && (
        <View style={[styles.pill, { backgroundColor: brand.amberGlow }]}>
          <Text style={[styles.pillText, { color: brand.amberDeep, fontSize: isLarge ? 13 : 11 }]}>INTERVALO</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', minWidth: 74 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  number: { fontWeight: '800', fontVariant: ['tabular-nums'], textAlign: 'center', minWidth: 22 },
  dash: { fontWeight: '600' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: brand.red },
  pillText: { fontWeight: '800', letterSpacing: 0.3 },
});
