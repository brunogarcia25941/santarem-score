import React, { useEffect, useRef } from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { Origin } from '@/utils/matchTransitionOrigin';

interface FlyInFromOriginProps {
  origin?: Origin;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
}

// Implementa a técnica FLIP (First → Last → Invert → Play): em vez de uma
// transição partilhada nativa (que não é fiável com o native-stack do
// expo-router e sacrificaria o gesto de deslizar para trás), este
// componente recebe a posição onde o elemento estava na lista ("origin"),
// mede a sua posição final aqui no ecrã do jogo, e anima do primeiro
// sítio para o segundo — dando a mesma sensação de continuidade.
export function FlyInFromOrigin({ origin, children, style, delay = 0 }: FlyInFromOriginProps) {
  const containerRef = useRef<View>(null);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(origin ? 0 : 1);

  useEffect(() => {
    if (!origin || !containerRef.current) {
      return;
    }

    // Pequeno atraso para garantir que o layout final já foi calculado
    // antes de medirmos a posição de destino.
    const raf = requestAnimationFrame(() => {
      containerRef.current?.measureInWindow((x, y, width, height) => {
        if (width === 0 && height === 0) {
          opacity.value = withTiming(1, { duration: 150 });
          return;
        }

        const originCenterX = origin.x + origin.width / 2;
        const originCenterY = origin.y + origin.height / 2;
        const destCenterX = x + width / 2;
        const destCenterY = y + height / 2;

        const deltaX = originCenterX - destCenterX;
        const deltaY = originCenterY - destCenterY;
        const startScale = width > 0 ? Math.max(origin.width / width, 0.3) : 1;

        // Coloca o elemento instantaneamente na posição de origem...
        translateX.value = deltaX;
        translateY.value = deltaY;
        scale.value = startScale;
        opacity.value = 0.85;

        // ...e depois anima-o para o sítio certo, dando a sensação de que
        // "veio a voar" do cartão onde o utilizador tocou.
        translateX.value = withDelay(delay, withSpring(0, { damping: 16, stiffness: 140, mass: 0.6 }));
        translateY.value = withDelay(delay, withSpring(0, { damping: 16, stiffness: 140, mass: 0.6 }));
        scale.value = withDelay(delay, withSpring(1, { damping: 16, stiffness: 140, mass: 0.6 }));
        opacity.value = withDelay(delay, withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }));
      });
    });

    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View ref={containerRef} style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
}
