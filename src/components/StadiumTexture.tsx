import React from 'react';
import { useColorScheme } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { brand } from '@/constants/theme';

interface StadiumTextureProps {
  /** 'grass' — fotografia real de relvado, para o fundo geral (Home).
   *  'floodlights' — fotografia real de holofotes, para a página do jogo. */
  variant?: 'grass' | 'floodlights';
  /** Brilho suave de holofote a partir do topo, sobreposto à fotografia. */
  glow?: boolean;
}

const TEXTURE_IMAGES: Record<'grass' | 'floodlights', number> = {
  grass: require('../../assets/images/textures/grass-background.jpg'),
  floodlights: require('../../assets/images/textures/floodlights.jpg'),
};

const absoluteFill = { position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0 };

/**
 * Camada de fundo com "alma" de estádio, a partir das fotografias reais
 * do utilizador. Opacidade muito baixa (8-12%) para nunca comprometer a
 * legibilidade do texto por cima.
 */
export function StadiumTexture({ variant = 'grass', glow = true }: StadiumTextureProps) {
  const isDark = useColorScheme() === 'dark';

  return (
    <>
      <Image
        source={TEXTURE_IMAGES[variant]}
        style={[absoluteFill, { opacity: isDark ? 0.12 : 0.08 }]}
        contentFit="cover"
        pointerEvents="none"
      />
      {glow && (
        <Svg style={absoluteFill} pointerEvents="none">
          <Defs>
            <RadialGradient id="floodlight" cx="50%" cy="0%" r="70%">
              <Stop offset="0%" stopColor={brand.amber} stopOpacity={isDark ? 0.09 : 0.05} />
              <Stop offset="100%" stopColor={brand.amber} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#floodlight)" />
        </Svg>
      )}
    </>
  );
}
