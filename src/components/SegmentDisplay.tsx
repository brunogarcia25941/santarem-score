import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

// Mapa de segmentos para cada dígito de 0 a 9
// A: topo, B: sup dir, C: inf dir, D: base, E: inf esq, F: sup esq, G: meio
const DIGIT_PATTERNS: Record<string, boolean[]> = {
  '0': [true, true, true, true, true, true, false],
  '1': [false, true, true, false, false, false, false],
  '2': [true, true, false, true, true, false, true],
  '3': [true, true, true, true, false, false, true],
  '4': [false, true, true, false, false, true, true],
  '5': [true, false, true, true, false, true, true],
  '6': [true, false, true, true, true, true, true],
  '7': [true, true, true, false, false, false, false],
  '8': [true, true, true, true, true, true, true],
  '9': [true, true, true, true, false, true, true],
  '-': [false, false, false, false, false, false, true],
  ' ': [false, false, false, false, false, false, false],
};

interface DigitProps {
  char: string;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
}

export function SevenSegmentDigit({
  char,
  size = 28,
  activeColor = '#f59e0b', // Âmbar estádio vintage
  inactiveColor = 'rgba(245, 158, 11, 0.08)',
}: DigitProps) {
  const pattern = DIGIT_PATTERNS[char] || DIGIT_PATTERNS[' '];
  const width = size * 0.58;
  const height = size;

  // Coordenadas dos 7 polígonos trapezoidais com chanfro
  return (
    <View style={{ width, height, marginHorizontal: size * 0.05 }}>
      <Svg viewBox="0 0 58 100" width="100%" height="100%">
        {/* Segmento A (Topo) */}
        <Polygon
          points="8,4 50,4 42,12 16,12"
          fill={pattern[0] ? activeColor : inactiveColor}
        />
        {/* Segmento B (Superior Direito) */}
        <Polygon
          points="52,6 56,10 50,46 44,40 50,14"
          fill={pattern[1] ? activeColor : inactiveColor}
        />
        {/* Segmento C (Inferior Direito) */}
        <Polygon
          points="50,54 56,60 50,94 44,88 44,60"
          fill={pattern[2] ? activeColor : inactiveColor}
        />
        {/* Segmento D (Base) */}
        <Polygon
          points="16,88 42,88 50,96 8,96"
          fill={pattern[3] ? activeColor : inactiveColor}
        />
        {/* Segmento E (Inferior Esquerdo) */}
        <Polygon
          points="8,60 14,60 14,88 8,94 2,60"
          fill={pattern[4] ? activeColor : inactiveColor}
        />
        {/* Segmento F (Superior Esquerdo) */}
        <Polygon
          points="8,10 14,14 14,40 8,46 2,10"
          fill={pattern[5] ? activeColor : inactiveColor}
        />
        {/* Segmento G (Centro) */}
        <Polygon
          points="14,46 44,46 48,50 44,54 14,54 10,50"
          fill={pattern[6] ? activeColor : inactiveColor}
        />
      </Svg>
    </View>
  );
}

interface ScoreboardScoreProps {
  score: number | string;
  size?: number;
  color?: string;
}

export function LedScoreDisplay({ score, size = 32, color = '#f59e0b' }: ScoreboardScoreProps) {
  const text = score.toString();
  return (
    <View style={styles.numberRow}>
      {text.split('').map((c, i) => (
        <SevenSegmentDigit key={i} char={c} size={size} activeColor={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});