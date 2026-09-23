import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, useColorScheme } from 'react-native';
import { LedScoreDisplay, SevenSegmentDigit } from './SegmentDisplay';
import { brand } from '@/constants/theme';

interface ScoreboardPlateProps {
  homeScore: number;
  awayScore: number;
  size?: 'small' | 'large';
  status?: string;
  minute?: number;
}

export function ScoreboardPlate({
  homeScore,
  awayScore,
  size = 'small',
  status,
  minute,
}: ScoreboardPlateProps) {
  const isDark = useColorScheme() === 'dark';
  const isLarge = size === 'large';
  const digitSize = isLarge ? 52 : 28;
  const isLive = status === 'live';

  // Piscar suave da luz de tempo em direto (pulsação a cada 1 segundo)
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isLive) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, { toValue: 0.25, duration: 800, useNativeDriver: true }),
          Animated.timing(blinkAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      blinkAnim.setValue(1);
    }
  }, [isLive]);

  return (
    <View
      style={[
        styles.plateFrame,
        isLarge ? styles.frameLarge : styles.frameSmall,
        {
          backgroundColor: '#0a0b0d',
          borderColor: isDark ? '#232529' : '#3a3d42',
        },
      ]}
    >
      {/* Sombra de cavidade no topo — reforça a sensação de ecrã embutido */}
      <View style={styles.insetShadowTop} pointerEvents="none" />

      {/* 4 Parafusos / Rebites industriais nos cantos */}
      <View style={[styles.bolt, styles.boltTL]} />
      <View style={[styles.bolt, styles.boltTR]} />
      <View style={[styles.bolt, styles.boltBL]} />
      <View style={[styles.bolt, styles.boltBR]} />

      {/* Reflexo de acrílico diagonal */}
      <View style={styles.acrylicGlare} pointerEvents="none" />

      {/* Miolo do Marcador LED */}
      <View style={styles.digitsContainer}>
        <LedScoreDisplay score={homeScore} size={digitSize} color={brand.amber} />

        {/* Separador de LEDs estilo estádio */}
        <View style={styles.colonContainer}>
          <View style={[styles.colonDot, { width: digitSize * 0.12, height: digitSize * 0.12 }]} />
          <View style={[styles.colonDot, { width: digitSize * 0.12, height: digitSize * 0.12, marginTop: digitSize * 0.24 }]} />
        </View>

        <LedScoreDisplay score={awayScore} size={digitSize} color={brand.amber} />
      </View>

      {/* Sub-painel embutido para o tempo de jogo (Cronómetro Digital) */}
      {status === 'live' && minute !== undefined && (
        <View style={styles.timerSubPlate}>
          <Animated.View style={[styles.pilotLight, { opacity: blinkAnim }]} />
          <View style={styles.minuteDigitsRow}>
            {minute.toString().padStart(2, '0').split('').map((char, idx) => (
              <SevenSegmentDigit
                key={idx}
                char={char}
                size={isLarge ? 16 : 13}
                activeColor={brand.amber}
                inactiveColor="#332714"
              />
            ))}
            <Text style={[styles.minuteSymbol, { color: brand.amber }]}>'</Text>
          </View>
        </View>
      )}

      {status === 'halftime' && (
        <View style={styles.timerSubPlate}>
          <Text style={styles.stateText}>INT</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  plateFrame: {
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.7,
    shadowRadius: 3,
    elevation: 5,
  },
  frameSmall: {
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 5,
    minWidth: 92,
  },
  frameLarge: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    minWidth: 170,
  },
  digitsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  colonContainer: {
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colonDot: {
    backgroundColor: brand.amber,
    borderRadius: 1,
    opacity: 0.9,
  },
  // Rebites
  bolt: {
    position: 'absolute',
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: '#3b3e43',
    borderWidth: 0.5,
    borderColor: '#131416',
    zIndex: 3,
  },
  boltTL: { top: 3, left: 3 },
  boltTR: { top: 3, right: 3 },
  boltBL: { bottom: 3, left: 3 },
  boltBR: { bottom: 3, right: 3 },
  // Reflexo de acrílico fosco
  acrylicGlare: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    transform: [{ skewY: '-6deg' }],
    zIndex: 1,
  },
  // Sombra que simula o corte/cavidade onde o visor está embutido
  insetShadowTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1,
  },
  // Sub-painel cronómetro
  timerSubPlate: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#050506',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#18191d',
    zIndex: 2,
    gap: 4,
  },
  pilotLight: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: brand.red,
  },
  minuteDigitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  minuteSymbol: {
    fontWeight: '800',
    marginLeft: 1,
    lineHeight: 12,
    fontSize: 11,
  },
  stateText: {
    color: brand.amber,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
