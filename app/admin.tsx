import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  RefreshControl,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useClubs } from '@/hooks/useClubs';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { ClubBadge } from '@/components/ClubBadge';
import { adminUsers, generatePassword, ManagedUser } from '@/services/adminUsers';
import { brand, getTheme } from '@/constants/theme';
import { Club } from '@/types';

const DIVISION_LABEL: Record<string, string> = {
  '1_divisao': '1.ª Divisão',
  '2_divisao_a': '2.ª Divisão · Série A',
  '2_divisao_b': '2.ª Divisão · Série B',
};

function formatLastLogin(iso: string | null) {
  if (!iso) return 'Ainda não entrou';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return (
    'Último acesso: ' +
    new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Lisbon' }).format(d)
  );
}

/** Lista de clubes com pesquisa, dentro da própria página (os modais não se empilham no Android). */
function ClubPicker({ clubs, value, onChange }: { clubs: Club[]; value: string | null; onChange: (id: string) => void }) {
  const isDark = useColorScheme() === 'dark';
  const t = getTheme(isDark);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? clubs.filter((c) => c.name.toLowerCase().includes(q) || c.shortName.toLowerCase().includes(q)) : clubs;
  }, [clubs, query]);

  return (
    <View>
      <TextInput
        placeholder="Pesquisar clube…"
        placeholderTextColor={t.textFaint}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        style={[styles.input, { color: t.text, borderColor: t.border }]}
      />
      <ScrollView style={[styles.pickerList, { borderColor: t.border }]} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {filtered.length === 0 && <Text style={[styles.hint, { color: t.textFaint, padding: 12 }]}>Nenhum clube encontrado.</Text>}
        {filtered.map((c) => {
          const selected = c.id === value;
          return (
            <TouchableOpacity
              key={c.id}
              style={[styles.pickerRow, selected && { backgroundColor: brand.forestMuted }]}
              onPress={() => {
                Haptics.selectionAsync();
                onChange(c.id);
              }}
            >
              <ClubBadge club={c} size={28} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickerName, { color: t.text }]} numberOfLines={1}>{c.shortName}</Text>
                <Text style={[styles.hint, { color: t.textFaint }]}>{DIVISION_LABEL[c.division] ?? ''}</Text>
              </View>
              {selected && <Ionicons name="checkmark-circle" size={20} color={brand.forest} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function NewCollaboratorCard({ clubs, onCreated }: { clubs: Club[]; onCreated: () => void }) {
  const isDark = useColorScheme() === 'dark';
  const t = getTheme(isDark);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [clubId, setClubId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setEmail('');
    setPassword('');
    setClubId(null);
  };

  const submit = async () => {
    if (!email.trim() || !clubId) {
      Alert.alert('Faltam dados', 'Indica o email e escolhe o clube.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Palavra-passe curta', 'Usa pelo menos 8 caracteres (ou carrega em "Gerar").');
      return;
    }
    setSaving(true);
    const { error } = await adminUsers.create(email.trim(), password, clubId);
    setSaving(false);
    if (error) {
      Alert.alert('Não foi possível criar a conta', error);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const club = clubs.find((c) => c.id === clubId);
    const message =
      `Santarém Score — acesso de colaborador${club ? ' (' + club.shortName + ')' : ''}\n` +
      `Email: ${email.trim().toLowerCase()}\nPalavra-passe: ${password}\n` +
      `Entra em Perfil → Área Reservada de Colaboradores.`;
    Alert.alert('Conta criada', `${email.trim().toLowerCase()}\nPalavra-passe: ${password}\n\nGuarda ou envia estes dados agora: a palavra-passe não volta a aparecer.`, [
      { text: 'Fechar' },
      { text: 'Partilhar', onPress: () => Share.share({ message }) },
    ]);
    reset();
    setOpen(false);
    onCreated();
  };

  return (
    <View style={[styles.card, { backgroundColor: t.surface }]}>
      <TouchableOpacity style={styles.cardHeader} onPress={() => setOpen((o) => !o)}>
        <Ionicons name="person-add-outline" size={20} color={brand.forest} />
        <Text style={[styles.cardTitle, { color: t.text }]}>Novo colaborador</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={t.textFaint} />
      </TouchableOpacity>

      {open && (
        <View style={{ gap: 10, marginTop: 12 }}>
          <TextInput
            placeholder="Email do colaborador"
            placeholderTextColor={t.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={[styles.input, { color: t.text, borderColor: t.border }]}
          />
          <View style={styles.passwordRow}>
            <TextInput
              placeholder="Palavra-passe (mín. 8)"
              placeholderTextColor={t.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
              style={[styles.input, { flex: 1, color: t.text, borderColor: t.border }]}
            />
            <TouchableOpacity style={styles.smallBtn} onPress={() => setPassword(generatePassword())}>
              <Ionicons name="dice-outline" size={16} color="#ffffff" />
              <Text style={styles.smallBtnText}>Gerar</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.label, { color: t.textMuted }]}>Clube a que tem acesso</Text>
          <ClubPicker clubs={clubs} value={clubId} onChange={setClubId} />
          <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.6 }]} onPress={submit} disabled={saving}>
            {saving ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryBtnText}>Criar conta</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

type RowMode = 'menu' | 'club' | 'password' | null;

function UserRow({ user, club, clubs, onChanged }: { user: ManagedUser; club?: Club; clubs: Club[]; onChanged: () => void }) {
  const isDark = useColorScheme() === 'dark';
  const t = getTheme(isDark);
  const [mode, setMode] = useState<RowMode>(null);
  const [newClub, setNewClub] = useState<string | null>(user.club_id);
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<{ error: string | null }>, successTitle?: string, successBody?: string) => {
    setBusy(true);
    const { error } = await fn();
    setBusy(false);
    if (error) {
      Alert.alert('Não foi possível concluir', error);
      return false;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (successTitle) Alert.alert(successTitle, successBody);
    setMode(null);
    onChanged();
    return true;
  };

  const revoke = () =>
    Alert.alert('Retirar acesso?', `${user.email} deixa de poder registar jogos. A conta continua a existir e podes voltar a dar-lhe um clube.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Retirar', style: 'destructive', onPress: () => run(() => adminUsers.setClub(user.id, null)) },
    ]);

  const hasAccess = user.role === 'collaborator' && Boolean(user.club_id);

  return (
    <View style={[styles.card, { backgroundColor: t.surface, marginBottom: 10 }]}>
      <TouchableOpacity style={styles.userHeader} onPress={() => setMode(mode ? null : 'menu')}>
        {club ? (
          <ClubBadge club={club} size={34} />
        ) : (
          <View style={[styles.noClub, { borderColor: t.border }]}>
            <Ionicons name="remove" size={16} color={t.textFaint} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.userEmail, { color: t.text }]} numberOfLines={1}>{user.email}</Text>
          <Text style={[styles.hint, { color: hasAccess ? brand.forest : t.textFaint }]} numberOfLines={1}>
            {hasAccess ? (club?.shortName ?? user.club_id) : 'Sem acesso de colaborador'} · {formatLastLogin(user.last_sign_in_at)}
          </Text>
        </View>
        <Ionicons name={mode ? 'chevron-up' : 'chevron-down'} size={18} color={t.textFaint} />
      </TouchableOpacity>

      {mode === 'menu' && (
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuBtn} onPress={() => setMode('club')}>
            <Ionicons name="swap-horizontal-outline" size={18} color={brand.forest} />
            <Text style={[styles.menuText, { color: t.text }]}>{hasAccess ? 'Mudar de clube' : 'Dar acesso a um clube'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuBtn} onPress={() => { setNewPassword(''); setMode('password'); }}>
            <Ionicons name="key-outline" size={18} color={brand.forest} />
            <Text style={[styles.menuText, { color: t.text }]}>Nova palavra-passe</Text>
          </TouchableOpacity>
          {hasAccess && (
            <TouchableOpacity style={styles.menuBtn} onPress={revoke} disabled={busy}>
              <Ionicons name="ban-outline" size={18} color={brand.red} />
              <Text style={[styles.menuText, { color: brand.red }]}>Retirar acesso</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {mode === 'club' && (
        <View style={{ gap: 10, marginTop: 12 }}>
          <ClubPicker clubs={clubs} value={newClub} onChange={setNewClub} />
          <TouchableOpacity
            style={[styles.primaryBtn, (busy || !newClub) && { opacity: 0.6 }]}
            disabled={busy || !newClub}
            onPress={() => run(() => adminUsers.setClub(user.id, newClub))}
          >
            {busy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryBtnText}>Guardar clube</Text>}
          </TouchableOpacity>
        </View>
      )}

      {mode === 'password' && (
        <View style={{ gap: 10, marginTop: 12 }}>
          <View style={styles.passwordRow}>
            <TextInput
              placeholder="Nova palavra-passe (mín. 8)"
              placeholderTextColor={t.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              value={newPassword}
              onChangeText={setNewPassword}
              style={[styles.input, { flex: 1, color: t.text, borderColor: t.border }]}
            />
            <TouchableOpacity style={styles.smallBtn} onPress={() => setNewPassword(generatePassword())}>
              <Ionicons name="dice-outline" size={16} color="#ffffff" />
              <Text style={styles.smallBtnText}>Gerar</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.primaryBtn, busy && { opacity: 0.6 }]}
            disabled={busy}
            onPress={() => {
              if (newPassword.length < 8) {
                Alert.alert('Palavra-passe curta', 'Usa pelo menos 8 caracteres.');
                return;
              }
              const pw = newPassword;
              run(
                () => adminUsers.resetPassword(user.id, pw),
                'Palavra-passe alterada',
                `${user.email}\nNova palavra-passe: ${pw}`
              );
            }}
          >
            {busy ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.primaryBtnText}>Alterar palavra-passe</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function AdminScreen() {
  const isDark = useColorScheme() === 'dark';
  const t = getTheme(isDark);
  const { profile, loading: authLoading } = useAuth();
  const { clubs } = useClubs();
  const keyboardHeight = useKeyboardHeight();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await adminUsers.list();
    if (err) setError(err);
    else {
      setError(null);
      setUsers(data!.users);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const isAdmin = profile?.role === 'admin';
  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  const clubById = useMemo(() => new Map(clubs.map((c) => [c.id, c])), [clubs]);

  // Administradores não aparecem (não se mexe neles por aqui).
  const collaborators = users.filter((u) => u.role === 'collaborator').sort((a, b) => (a.email ?? '').localeCompare(b.email ?? ''));
  const others = users.filter((u) => u.role === 'user').sort((a, b) => (a.email ?? '').localeCompare(b.email ?? ''));

  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.base, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={brand.forest} />
      </SafeAreaView>
    );
  }

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: t.base, justifyContent: 'center', padding: 24 }]}>
        <Text style={[styles.cardTitle, { color: t.text, textAlign: 'center' }]}>Sem acesso</Text>
        <Text style={[styles.hint, { color: t.textMuted, textAlign: 'center', marginTop: 6 }]}>Esta zona é só para administradores.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.container, { backgroundColor: t.base }]}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 + keyboardHeight }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={brand.forest} />}
      >
        <Text style={[styles.intro, { color: t.textMuted }]}>
          Cria contas para os colaboradores e escolhe o clube a que têm acesso. Cada um só regista golos, cartões e onzes
          nos jogos do seu clube.
        </Text>

        <NewCollaboratorCard clubs={clubs} onCreated={load} />

        {loading ? (
          <ActivityIndicator color={brand.forest} style={{ marginTop: 20 }} />
        ) : error ? (
          <View style={[styles.card, { backgroundColor: t.surface }]}>
            <Text style={[styles.cardTitle, { color: brand.red }]}>Não foi possível carregar</Text>
            <Text style={[styles.hint, { color: t.textMuted, marginTop: 4 }]}>{error}</Text>
            <TouchableOpacity style={[styles.primaryBtn, { marginTop: 12 }]} onPress={() => { setLoading(true); load(); }}>
              <Text style={styles.primaryBtnText}>Tentar outra vez</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: t.text }]}>Colaboradores ({collaborators.length})</Text>
            {collaborators.length === 0 && <Text style={[styles.hint, { color: t.textFaint, marginBottom: 16 }]}>Ainda não há colaboradores.</Text>}
            {collaborators.map((u) => (
              <UserRow key={u.id} user={u} club={u.club_id ? clubById.get(u.club_id) : undefined} clubs={clubs} onChanged={load} />
            ))}

            {others.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { color: t.text, marginTop: 10 }]}>Contas sem acesso ({others.length})</Text>
                {others.map((u) => (
                  <UserRow key={u.id} user={u} clubs={clubs} onChanged={load} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  intro: { fontSize: 13, lineHeight: 19, marginBottom: 14 },
  card: { borderRadius: 14, padding: 14, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 10, marginLeft: 4 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  label: { fontSize: 12, fontWeight: '700', marginTop: 2 },
  hint: { fontSize: 11 },
  passwordRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  smallBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: brand.forest, paddingHorizontal: 12, paddingVertical: 11, borderRadius: 10 },
  smallBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  primaryBtn: { backgroundColor: brand.forest, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  primaryBtnText: { color: '#ffffff', fontWeight: '800', fontSize: 14 },
  pickerList: { maxHeight: 240, borderWidth: 1, borderRadius: 10, marginTop: 8 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  pickerName: { fontSize: 14, fontWeight: '600' },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  userEmail: { fontSize: 14, fontWeight: '700' },
  noClub: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  menu: { marginTop: 10, gap: 2 },
  menuBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  menuText: { fontSize: 14, fontWeight: '600' },
});
