import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Altura atual do teclado. Os painéis em Modal usam-na para subirem com o
 * teclado — em edge-to-edge o Android deixa de redimensionar a janela, e o
 * Modal é uma janela à parte onde o KeyboardAvoidingView não é fiável.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}

/**
 * Espaço a deixar por baixo de um painel em Modal: o teclado quando está aberto, senão a
 * barra de navegação do sistema (os 3 botões do Android, que em edge-to-edge ficam POR CIMA
 * da janela da app e tapavam os botões de baixo dos painéis).
 */
export function useSheetBottomPadding(): number {
  const keyboardHeight = useKeyboardHeight();
  const insets = useSafeAreaInsets();
  return Math.max(keyboardHeight, insets.bottom);
}
