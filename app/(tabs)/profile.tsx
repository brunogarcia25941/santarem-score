import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
  AppState,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StadiumTexture } from '@/components/StadiumTexture';
import { useAuth } from '@/context/AuthContext';
import { useFavorites } from '@/context/FavoritesContext';
import {
  PushPrefs,
  DEFAULT_PREFS,
  anyPushEnabled,
  requestPushPermission,
  getPushPermissionStatus,
  getPushPrefs,
  setPushPrefs,
  syncPushToken,
  disablePushToken,
} from '@/services/pushNotifications';
import { getAnalyticsEnabled, setAnalyticsEnabled, track } from '@/services/analytics';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  collaborator: 'Colaborador de Clube',
  user: 'Sem acesso de colaborador',
};

export default function ProfileScreen() {
  const router = useRouter();
  const isDark = useColorScheme() === 'dark';
  const { session, profile, signOut } = useAuth();
  const { favoriteClubIds } = useFavorites();

  const [prefs, setPrefs] = useState<PushPrefs>(DEFAULT_PREFS);
  // Estado da permissão no telemóvel (para avisar quando está desligada).
  const [permission, setPermission] = useState<string | null>(null);
  const [togglingPush, setTogglingPush] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(true);

  useEffect(() => {
    getPushPrefs().then(setPrefs);
    getAnalyticsEnabled().then(setAnalyticsOn);
    const refresh = () => getPushPermissionStatus().then(setPermission);
    refresh();
    // Ao voltar das definições do telemóvel (ou da janela de permissão) atualiza o estado.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, []);

  /** Explica porque não há notificações e, quando o sistema já não pergunta, leva às definições. */
  const explainBlocked = () =>
    Alert.alert(
      'Notificações desativadas',
      'O telemóvel não está a permitir notificações desta app. Liga-as nas definições do telemóvel.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir definições', onPress: () => Linking.openSettings() },
      ]
    );

  const handleToggle = async (key: keyof PushPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setTogglingPush(true);
    try {
      if (!anyPushEnabled(next)) {
        // Nada ligado: o aparelho deixa de estar registado.
        await disablePushToken();
      } else if (value) {
        // A ligar um aviso: garante a permissão antes de o dar como ativo.
        const { granted } = await requestPushPermission();
        setPermission(await getPushPermissionStatus());
        if (!granted) {
          explainBlocked();
          return;
        }
        if (!(await syncPushToken(favoriteClubIds, next))) {
          Alert.alert('Não foi possível ativar', 'Verifica a ligação à internet. As notificações só funcionam numa build instalada.');
          return;
        }
      } else {
        // A desligar um aviso (os outros ficam): atualiza o registo, se houver permissão.
        await syncPushToken(favoriteClubIds, next);
      }
      await setPushPrefs(next);
      setPrefs(next);
      track('push.pref', { key, value });
    } finally {
      setTogglingPush(false);
    }
  };

  /** "Não estás a receber notificações?": volta a pedir a permissão e regista o aparelho. */
  const fixNotifications = async () => {
    setTogglingPush(true);
    try {
      const { granted } = await requestPushPermission();
      setPermission(await getPushPermissionStatus());
      track('push.fix', { granted });
      if (!granted) {
        explainBlocked();
        return;
      }
      // Se os três estavam desligados, voltam a ligar-se.
      const next = anyPushEnabled(prefs) ? prefs : DEFAULT_PREFS;
      const ok = await syncPushToken(favoriteClubIds, next);
      if (!ok) {
        Alert.alert('Não foi possível ativar', 'Verifica a ligação à internet e tenta outra vez.');
        return;
      }
      await setPushPrefs(next);
      setPrefs(next);
      Alert.alert(
        'Notificações ativas',
        favoriteClubIds.length > 0
          ? 'Está tudo pronto: vais receber os avisos dos jogos dos teus clubes favoritos.'
          : 'Está tudo pronto. Escolhe clubes favoritos para começares a receber avisos.'
      );
    } finally {
      setTogglingPush(false);
    }
  };

  const isSignedIn = Boolean(session);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1a1b1e' : '#eef0f2' }]}>
      <StadiumTexture variant="grass" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Conta: só aparece com sessão iniciada (email + papel, sem foto) */}
        {session && (
          <View style={[styles.card, { backgroundColor: isDark ? '#202226' : '#ffffff' }]}>
            <Text style={[styles.userName, { color: isDark ? '#eef0f2' : '#1a1b1e' }]} numberOfLines={1}>
              {session.user.email}
            </Text>
            {profile && (
              <View style={styles.rolePill}>
                <Text style={styles.rolePillText}>{ROLE_LABEL[profile.role] ?? ROLE_LABEL.user}</Text>
              </View>
            )}
          </View>
        )}

        {/* Notificações */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Notificações Push</Text>
        <View style={[styles.card, { backgroundColor: isDark ? '#202226' : '#ffffff' }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Golos em Direto</Text>
              <Text style={styles.settingSub}>Golos e cartões nos jogos dos teus clubes (de qualquer das equipas)</Text>
            </View>
            <Switch value={prefs.goals} onValueChange={(v) => handleToggle('goals', v)} disabled={togglingPush} />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Início de Jogo</Text>
              <Text style={styles.settingSub}>Lembrete 15 min antes e aviso quando começar</Text>
            </View>
            <Switch value={prefs.start} onValueChange={(v) => handleToggle('start', v)} disabled={togglingPush} />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Resultado Final</Text>
              <Text style={styles.settingSub}>Resultado quando o jogo terminar</Text>
            </View>
            <Switch value={prefs.end} onValueChange={(v) => handleToggle('end', v)} disabled={togglingPush} />
          </View>
          <View style={styles.divider} />

          <TouchableOpacity style={styles.actionRow} onPress={fixNotifications} disabled={togglingPush}>
            <Ionicons name="notifications-outline" size={20} color="#2f6b4a" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.settingLabel, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
                Não estás a receber notificações?
              </Text>
              <Text style={styles.settingSub}>
                {permission && permission !== 'granted' && permission !== 'unsupported'
                  ? 'Estão desativadas no telemóvel. Toca aqui para as ativar.'
                  : 'Toca aqui para as ativar.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#71717a" />
          </TouchableOpacity>

          <Text style={styles.notifsDisclaimer}>
            Recebes avisos dos jogos dos clubes que tens nos favoritos.
          </Text>
        </View>

        {/* Privacidade */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Privacidade</Text>
        <View style={[styles.card, { backgroundColor: isDark ? '#202226' : '#ffffff' }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Ajudar a melhorar a app</Text>
              <Text style={styles.settingSub}>
                Envia dados anónimos de utilização (ecrãs abertos, favoritos, pesquisas, erros). Sem nome, email nem localização. Podes mudar a qualquer momento.
              </Text>
            </View>
            <Switch
              value={analyticsOn}
              onValueChange={(v) => {
                setAnalyticsOn(v);
                setAnalyticsEnabled(v);
              }}
            />
          </View>
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

          {profile?.role === 'admin' && (
            <>
              <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/admin' as any)}>
                <Ionicons name="people-outline" size={20} color="#2f6b4a" />
                <Text style={[styles.actionRowText, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
                  Zona Admin · Colaboradores
                </Text>
                <Ionicons name="chevron-forward" size={18} color="#71717a" />
              </TouchableOpacity>
              <View style={styles.divider} />
            </>
          )}

          {isSignedIn ? (
            <TouchableOpacity style={styles.actionRow} onPress={() => signOut()}>
              <Ionicons name="log-out-outline" size={20} color="#dc2626" />
              <Text style={[styles.actionRowText, { color: '#dc2626' }]}>Terminar Sessão</Text>
              <Ionicons name="chevron-forward" size={18} color="#71717a" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/colaborador-login')}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#2f6b4a" />
              <Text style={[styles.actionRowText, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
                Área Reservada de Colaboradores
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
  rolePill: { alignSelf: 'flex-start', marginTop: 8, backgroundColor: 'rgba(47, 107, 74, 0.14)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  rolePillText: { color: '#2f6b4a', fontSize: 12, fontWeight: '700' },
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
