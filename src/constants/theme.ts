/**
 * Sistema de tema do Santarém Score.
 *
 * Em vez de "verde elétrico" de app corporativa, usamos identidade
 * ribatejana: verde floresta sóbrio, âmbar/laranja de marcador de
 * estádio vintage e aço escovado para molduras. Dark mode em grafite
 * asfalto orgânico (não preto puro); light mode em cimento/pedra clara
 * (não branco genérico).
 */

export const brand = {
  // Verde relva escuro / floresta — identidade, não neon
  forest: '#2f6b4a',
  forestDeep: '#1f4d36',
  forestMuted: 'rgba(47, 107, 74, 0.14)',

  // Âmbar/laranja queimado do marcador — LEDs de estádio vintage
  amber: '#f59e0b',
  amberDeep: '#d97706',
  amberGlow: 'rgba(245, 158, 11, 0.16)',

  // Vermelho clássico de "AO VIVO" / disciplina
  red: '#dc2626',
  redGlow: 'rgba(220, 38, 38, 0.16)',

  // Amarelo de cartão
  yellow: '#eab308',

  // Aço escovado / grafite — molduras, separadores, ícones secundários
  steel: '#6b7075',
  steelDark: '#3a3d42',
};

export const dark = {
  base: '#1a1b1e', // grafite asfalto
  surface: '#202226', // cartão extrudido
  surfaceRaised: '#26282c',
  edgeHighlight: '#2f3136', // luz superior subtil
  edgeShadow: '#0f1012', // sombra inferior / cavidade
  border: '#2c2e33',
  text: '#f4f4f5',
  textMuted: '#9a9ca3',
  textFaint: '#6b6f76',
};

export const light = {
  base: '#eef0f2', // pedra/areia clara
  surface: '#ffffff',
  surfaceRaised: '#ffffff',
  edgeHighlight: '#ffffff',
  edgeShadow: '#d7dade', // sombra cinza-chumbo suave
  border: '#e2e5e8',
  text: '#1a1b1e',
  textMuted: '#5c6066',
  textFaint: '#8a8e94',
};

export type ThemeColors = typeof dark;

export function getTheme(isDark: boolean): ThemeColors {
  return isDark ? dark : light;
}
