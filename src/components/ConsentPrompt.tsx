import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { brand, getTheme } from '@/constants/theme';
import { getAnalyticsConsent, setAnalyticsEnabled } from '@/services/analytics';

/**
 * Aviso da primeira abertura: pede autorização para recolher dados anónimos de utilização.
 * Enquanto não houver resposta a app não recolhe nem envia nada. A escolha pode ser mudada
 * a qualquer momento no Perfil. Não se fecha sem escolher (o botão "voltar" não o dispensa).
 */
export function ConsentPrompt() {
  const t = getTheme(useColorScheme() === 'dark');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAnalyticsConsent().then((answer) => {
      if (!cancelled && answer === null) setVisible(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const answer = async (accepted: boolean) => {
    Haptics.selectionAsync();
    setVisible(false);
    await setAnalyticsEnabled(accepted);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: t.surface, borderColor: t.border }]}>
          <View style={styles.iconWrap}>
            <Ionicons name="analytics-outline" size={26} color={brand.forest} />
          </View>
          <Text style={[styles.title, { color: t.text }]}>Ajudar a melhorar a app?</Text>
          <Text style={[styles.text, { color: t.textMuted }]}>
            Podemos recolher dados anónimos de utilização, como os ecrãs que abres, os clubes que segues, as pesquisas e os
            erros que acontecem. Servem só para perceber o que funciona e o que corrigir.
          </Text>
          <Text style={[styles.text, { color: t.textMuted }]}>
            Não recolhemos o teu nome, email, contactos nem localização. Podes mudar de ideias a qualquer momento em Perfil →
            Privacidade.
          </Text>

          <TouchableOpacity style={styles.accept} onPress={() => answer(true)} accessibilityRole="button">
            <Text style={styles.acceptText}>Aceitar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.refuse, { borderColor: t.border }]} onPress={() => answer(false)} accessibilityRole="button">
            <Text style={[styles.refuseText, { color: t.text }]}>Recusar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  card: { borderRadius: 18, borderWidth: 1, padding: 22 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: brand.forestMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: { fontSize: 19, fontWeight: '800', marginBottom: 10 },
  text: { fontSize: 13, lineHeight: 19, marginBottom: 10 },
  accept: { backgroundColor: brand.forest, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  acceptText: { color: '#ffffff', fontWeight: '800', fontSize: 15 },
  refuse: { borderWidth: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  refuseText: { fontWeight: '700', fontSize: 15 },
});
