import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

interface UseSwipeableTabsOptions {
  /** Número total de separadores (divisões/competições) a percorrer. */
  length: number;
  /** Índice atualmente selecionado. */
  currentIndex: number;
  /** Chamado com o novo índice (já circular) quando o gesto o determina. */
  onChangeIndex: (index: number) => void;
}

const SWIPE_DISTANCE_THRESHOLD = 42;
const SWIPE_VELOCITY_THRESHOLD = 450;
const EXIT_OFFSET = 46;

/**
 * Gesto de arrastar horizontal para alternar circularmente entre vários
 * separadores (ex: divisões, competições) — usado em zonas com várias
 * "abas" (Início > Jogos do Distrito, Competições > Classificação).
 *
 * Não interfere com o scroll vertical: só "ganha" o gesto quando o
 * movimento é claramente horizontal (activeOffsetX / failOffsetY), para
 * o ScrollView à volta continuar a deslizar normalmente.
 */
export function useSwipeableTabs({ length, currentIndex, onChangeIndex }: UseSwipeableTabsOptions) {
  const translateX = useSharedValue(0);

  function changeIndex(direction: 1 | -1) {
    if (length <= 1) return;
    const next = (currentIndex + direction + length) % length;
    onChangeIndex(next);
  }

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-14, 14])
    .onUpdate((event) => {
      // Alguma resistência ao arrastar — dá feedback sem mover o
      // conteúdo todo para fora do sítio.
      translateX.value = event.translationX * 0.35;
    })
    .onEnd((event) => {
      const distance = Math.abs(event.translationX);
      const velocity = Math.abs(event.velocityX);
      const shouldAdvance = length > 1 && (distance > SWIPE_DISTANCE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD);

      if (shouldAdvance) {
        const direction: 1 | -1 = event.translationX < 0 ? 1 : -1;

        translateX.value = withTiming(
          direction * -EXIT_OFFSET,
          { duration: 130, easing: Easing.out(Easing.quad) },
          (finished) => {
            if (!finished) return;
            translateX.value = direction * EXIT_OFFSET;
            translateX.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) });
            runOnJS(changeIndex)(direction);
          }
        );
      } else {
        translateX.value = withTiming(0, { duration: 160 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return { panGesture, animatedStyle };
}
