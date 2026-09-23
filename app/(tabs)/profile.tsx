import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  club_moderator: 'Delegado de Clube',
  user: 'Utilizador Geral',
};

export default function ProfileScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { session, profile, signOut } = useAuth();

  const [liveGoalNotifs, setLiveGoalNotifs] = useState(true);
  const [matchStartNotifs, setMatchStartNotifs] = useState(true);
  const [finalScoreNotifs, setFinalScoreNotifs] = useState(true);

  const isDelegate = Boolean(session);
  const roleLabel = profile ? ROLE_LABEL[profile.role] || 'Utilizador Geral' : 'Utilizador Geral';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1a1b1e' : '#eef0f2' }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Cabeçalho do Perfil */}
        <View style={[styles.card, { backgroundColor: isDark ? '#202226' : '#ffffff' }]}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color="#ffffff" />
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
              {isDelegate ? session!.user.email : 'Adepto Ribatejano'}
            </Text>
            <Text style={styles.userRole}>{isDelegate ? roleLabel : 'Utilizador Geral'}</Text>
          </View>
        </View>

        {/* Notificações */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Notificações Push</Text>
        <View style={[styles.card, { backgroundColor: isDark ? '#202226' : '#ffffff' }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Golos em Direto</Text>
              <Text style={styles.settingSub}>Notificar sempre que houver golo nos favoritos</Text>
            </View>
            <Switch value={liveGoalNotifs} onValueChange={setLiveGoalNotifs} />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Início de Jogo</Text>
              <Text style={styles.settingSub}>Avisar 15 minutos antes do apito inicial</Text>
            </View>
            <Switch value={matchStartNotifs} onValueChange={setMatchStartNotifs} />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Resultado Final</Text>
              <Text style={styles.settingSub}>Resumo no encerramento da partida</Text>
            </View>
            <Switch value={finalScoreNotifs} onValueChange={setFinalScoreNotifs} />
          </View>
          <Text style={styles.notifsDisclaimer}>
            Estas opções ainda não ativam notificações reais — essa funcionalidade está a ser construída.
          </Text>
        </View>

        {/* Preferências & Gestão */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Gestão</Text>
        <View style={[styles.card, { backgroundColor: isDark ? '#202226' : '#ffffff' }]}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => router.push('/(onboarding)/select-clubs')}
          >
            <Ionicons name="star-outline" size={20} color="#2f6b4a" />
            <Text style={[styles.actionRowText, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
              Gerir Clubes Favoritos
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#71717a" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {isDelegate ? (
            <TouchableOpacity style={styles.actionRow} onPress={() => signOut()}>
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text style={[styles.actionRowText, { color: '#dc2626' }]}>Terminar Sessão de Delegado</Text>
              <Ionicons name="chevron-forward" size={18} color="#71717a" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/delegado-login')}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#2f6b4a" />
              <Text style={[styles.actionRowText, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
                Área Reservada de Delegados
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#71717a" />
            </TouchableOpacity>
          )}
        </View>

        {/* Versão */}
        <Text style={styles.footerInfo}>Santarém Score v1.0.0 • AF Santarém</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  card: { borderRadius: 14, padding: 16, marginBottom: 20 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#2f6b4a', alignItems: 'center', justifyContent: 'center' },
  userInfo: { marginLeft: 14, justifyContent: 'center', flex: 1 },
  userName: { fontSize: 16, fontWeight: '700' },
  userRole: { fontSize: 12, color: '#71717a', marginTop: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, marginLeft: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  settingText: { flex: 1, paddingRight: 10 },
  settingLabel: { fontSize: 14, fontWeight: '600' },
  settingSub: { fontSize: 12, color: '#71717a', marginTop: 2 },
  notifsDisclaimer: { fontSize: 11, color: '#71717a', marginTop: 10, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: 'rgba(150,150,150,0.1)', marginVertical: 10 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  actionRowText: { flex: 1, fontSize: 14, fontWeight: '600' },
  footerInfo: { textAlign: 'center', color: '#71717a', fontSize: 11, marginTop: 10 },
});
