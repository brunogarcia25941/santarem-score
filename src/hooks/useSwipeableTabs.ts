import { Gesture } from 'react-native-gesture-handler';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

interface UseSwipeableTabsOptions {
  /** Número total de separadores (divisões/competições) a percorrer. */
  length: number;
  /** Índice atualmente selecionado. */
  currentIndex: number;
  /** Chamado com o novo índice (já circular) assim que o gesto o determina. */
  onChangeIndex: (index: number) => void;
}

// Distância mínima do dedo para trocar de conteúdo — pequena de propósito:
// a ideia é que a divisão/competição seguinte apareça logo no arranque do
// gesto, a seguir o dedo, em vez de só trocar quando o dedo larga o ecrã.
const TRIGGER_DISTANCE = 18;

/**
 * Gesto de arrastar horizontal para alternar circularmente entre vários
 * separadores (ex: divisões, competições) — usado em zonas com várias
 * "abas" (Início > Jogos do Distrito, Competições > Classificação).
 *
 * Segue o dedo em tempo real (sem "resistência" artificial) e troca o
 * conteúdo assim que uma pequena distância é ultrapassada — ainda a meio
 * do gesto, não só depois de soltar — com um pequeno esbatimento a
 * disfarçar a troca instantânea de dados por baixo.
 *
 * Não interfere com o scroll vertical: só "ganha" o gesto quando o
 * movimento é claramente horizontal (activeOffsetX / failOffsetY), para
 * o ScrollView à volta continuar a deslizar normalmente.
 */
export function useSwipeableTabs({ length, currentIndex, onChangeIndex }: UseSwipeableTabsOptions) {
  const translateX = useSharedValue(0);
  const contentOpacity = useSharedValue(1);
  const triggered = useSharedValue(false);

  function changeIndex(direction: 1 | -1) {
    if (length <= 1) return;
    const next = (currentIndex + direction + length) % length;
    onChangeIndex(next);
  }

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-14, 14])
    .onBegin(() => {
      triggered.value = false;
    })
    .onUpdate((event) => {
      // Segue o dedo quase 1:1 — só uma ligeira resistência para o
      // gesto continuar a sentir-se "seguro" depois de trocar o conteúdo.
      translateX.value = event.translationX * 0.7;

      if (!triggered.value && length > 1 && Math.abs(event.translationX) > TRIGGER_DISTANCE) {
        triggered.value = true;
        const direction: 1 | -1 = event.translationX < 0 ? 1 : -1;
        // Pequeno esbatimento a acompanhar a troca de conteúdo, para a
        // substituição instantânea dos dados por baixo não parecer um corte seco.
        contentOpacity.value = withSequence(
          withTiming(0.4, { duration: 90, easing: Easing.out(Easing.quad) }),
          withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) })
        );
        runOnJS(changeIndex)(direction);
      }
    })
    .onEnd(() => {
      translateX.value = withTiming(0, { duration: 220, easing: Easing.out(Easing.quad) });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return { panGesture, animatedStyle };
}
