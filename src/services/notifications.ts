import { Vibration } from 'react-native';

export function vibrateGoal() {
  try {
    Vibration.vibrate([0, 400, 150, 400]);
  } catch (e) {
    // Ignorado se não suportado
  }
}