import React from 'react';
import { useColorScheme } from 'react-native';
import Svg, { Defs, Pattern, Rect, RadialGradient, Stop } from 'react-native-svg';
import { brand } from '@/constants/theme';

interface StadiumTextureProps {
  /** 'grass' — riscas de corte de relvado na diagonal.
   *  'mesh' — malha fina tipo rede de baliza. */
  variant?: 'grass' | 'mesh';
  /** Brilho suave de holofote a partir do topo. */
  glow?: boolean;
}

/**
 * Camada de fundo com "alma" de estádio — sem depender de fotografias
 * externas. Opacidade muito baixa (8-12%) para nunca comprometer a
 * legibilidade do texto por cima.
 */
export function StadiumTexture({ variant = 'grass', glow = true }: StadiumTextureProps) {
  const isDark = useColorScheme() === 'dark';
  const stripeColor = isDark ? '#3d5a45' : '#41573f';
  const stripeOpacity = isDark ? 0.05 : 0.045;

  return (
    <Svg style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
      <Defs>
        {glow && (
          <RadialGradient id="floodlight" cx="50%" cy="0%" r="70%">
            <Stop offset="0%" stopColor={brand.amber} stopOpacity={isDark ? 0.09 : 0.05} />
            <Stop offset="100%" stopColor={brand.amber} stopOpacity={0} />
          </RadialGradient>
        )}
        {variant === 'grass' ? (
          <Pattern id="texture" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <Rect width="13" height="26" fill={stripeColor} fillOpacity={stripeOpacity} />
          </Pattern>
        ) : (
          <Pattern id="texture" width="18" height="18" patternUnits="userSpaceOnUse">
            <Rect width="18" height="1" fill={stripeColor} fillOpacity={stripeOpacity} />
            <Rect width="1" height="18" fill={stripeColor} fillOpacity={stripeOpacity} />
          </Pattern>
        )}
      </Defs>
      <Rect width="100%" height="100%" fill="url(#texture)" />
      {glow && <Rect width="100%" height="100%" fill="url(#floodlight)" />}
    </Svg>
  );
}
