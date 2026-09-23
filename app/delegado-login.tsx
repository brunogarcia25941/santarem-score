import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DelegadoLoginScreen() {
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMsg('Preenche o email e a palavra-passe.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);

    if (error) {
      setErrorMsg('Credenciais inválidas. Contacta a equipa técnica do Santarém Score.');
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#09090b' : '#f4f4f5' }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.content}>
          <Text style={[styles.title, { color: isDark ? '#f4f4f5' : '#09090b' }]}>Área de Delegados</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
            Entra com a conta que a equipa técnica te criou. Sem conta? Contacta-nos para obteres acesso.
          </Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#71717a"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={[
              styles.input,
              { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#3f3f46' : '#d4d4d8' },
            ]}
          />
          <TextInput
            placeholder="Palavra-passe"
            placeholderTextColor="#71717a"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={[
              styles.input,
              { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#3f3f46' : '#d4d4d8' },
            ]}
          />

          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.loginBtnText}>Entrar</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, marginTop: 20 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 6, marginBottom: 24, lineHeight: 19 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    marginBottom: 12,
  },
  errorText: { color: '#dc2626', fontSize: 13, marginBottom: 12 },
  loginBtn: {
    backgroundColor: '#16a34a',
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  loginBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
