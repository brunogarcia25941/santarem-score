import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Match } from '@/types';
import { supabase } from '@/services/supabase';
import { brand, getTheme } from '@/constants/theme';

type EventType = 'GOAL' | 'OWN_GOAL' | 'YELLOW_CARD' | 'RED_CARD';

interface DraftEvent {
  clubId: string;
  eventType: EventType;
  minute: number;
  playerName: string;
  isPenalty: boolean;
}

interface Props {
  visible: boolean;
  match: Match;
  /** Eventos já guardados (linhas de `match_events`), para poderem ser editados sem se perderem. */
  existingEvents: any[];
  onClose: () => void;
  onSaved: () => void;
}

const EVENT_LABEL: Record<EventType, string> = {
  GOAL: '⚽ Golo',
  OWN_GOAL: '⚽ Autogolo',
  YELLOW_CARD: '🟨 Amarelo',
  RED_CARD: '🔴 Vermelho',
};

/**
 * Registo retroativo de um jogo já realizado (só admin). O resultado é a
 * verdade; os acontecimentos são opcionais e podem estar incompletos (ex.:
 * só se conhece um dos marcadores). A função SQL `admin_register_match_result`
 * grava tudo numa transação e não deixa os golos somarem duas vezes.
 */
export function RegisterResultModal({ visible, match, existingEvents, onClose, onSaved }: Props) {
  const isDark = useColorScheme() === 'dark';
  const t = getTheme(isDark);

  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [events, setEvents] = useState<DraftEvent[]>([]);
  const [saving, setSaving] = useState(false);

  // Formulário de novo acontecimento
  const [clubId, setClubId] = useState(match.homeClub.id);
  const [eventType, setEventType] = useState<EventType>('GOAL');
  const [minute, setMinute] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isPenalty, setIsPenalty] = useState(false);

  // Sempre que o modal abre, parte do estado atual do jogo em vez de valores antigos.
  useEffect(() => {
    if (!visible) return;
    setHomeScore(String(match.homeScore ?? 0));
    setAwayScore(String(match.awayScore ?? 0));
    setEvents(
      [...existingEvents]
        .sort((a, b) => a.minute - b.minute)
        .map((e) => ({
          clubId: e.club_id,
          eventType: e.event_type as EventType,
          minute: e.minute ?? 0,
          playerName: e.player_name ?? '',
          isPenalty: Boolean(e.is_penalty),
        }))
    );
    setClubId(match.homeClub.id);
    setEventType('GOAL');
    setMinute('');
    setPlayerName('');
    setIsPenalty(false);
  }, [visible, match.id]);

  const clubName = (id: string) =>
    id === match.homeClub.id ? match.homeClub.shortName : match.awayClub.shortName;

  const addEvent = () => {
    const min = parseInt(minute, 10);
    if (Number.isNaN(min) || min < 0 || min > 130) {
      Alert.alert('Minuto inválido', 'Indica um minuto entre 0 e 130.');
      return;
    }
    Haptics.selectionAsync();
    setEvents((prev) =>
      [
        ...prev,
        {
          clubId,
          eventType,
          minute: min,
          playerName: playerName.trim(),
          isPenalty: eventType === 'GOAL' && isPenalty,
        },
      ].sort((a, b) => a.minute - b.minute)
    );
    setMinute('');
    setPlayerName('');
    setIsPenalty(false);
  };

  const removeEvent = (index: number) => {
    Haptics.selectionAsync();
    setEvents((prev) => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    const home = parseInt(homeScore, 10);
    const away = parseInt(awayScore, 10);
    if (Number.isNaN(home) || Number.isNaN(away) || home < 0 || away < 0) {
      Alert.alert('Resultado inválido', 'Indica os golos das duas equipas (0 ou mais).');
      return;
    }

    // Um golo conta para a equipa que marca; um autogolo conta para a adversária.
    const goalsFromEvents = (side: 'home' | 'away') =>
      events.filter((e) => {
        const isHome = e.clubId === match.homeClub.id;
        if (e.eventType === 'GOAL') return side === 'home' ? isHome : !isHome;
        if (e.eventType === 'OWN_GOAL') return side === 'home' ? !isHome : isHome;
        return false;
      }).length;

    if (goalsFromEvents('home') > home || goalsFromEvents('away') > away) {
      Alert.alert(
        'Marcadores a mais',
        'Há mais golos nos acontecimentos do que no resultado indicado. Corrige o resultado ou remove golos.'
      );
      return;
    }

    setSaving(true);
    const { error } = await supabase.rpc('admin_register_match_result', {
      p_match_id: match.id,
      p_home_score: home,
      p_away_score: away,
      p_events: events.map((e) => ({
        club_id: e.clubId,
        event_type: e.eventType,
        minute: e.minute,
        player_name: e.playerName || null,
        is_penalty: e.isPenalty,
      })),
    });
    setSaving(false);

    if (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro ao guardar', error.message);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSaved();
    onClose();
  };

  const inputStyle = [styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.base }];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { backgroundColor: t.surface }]}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: t.text }]}>Registar resultado</Text>
              <Text style={[styles.subtitle, { color: t.textMuted }]}>
                {match.round} • {match.homeClub.shortName} vs {match.awayClub.shortName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={t.text} />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            {/* Resultado final */}
            <Text style={[styles.label, { color: t.textMuted }]}>Resultado final</Text>
            <View style={styles.scoreRow}>
              <View style={styles.scoreCol}>
                <Text style={[styles.scoreTeam, { color: t.text }]} numberOfLines={1}>
                  {match.homeClub.shortName}
                </Text>
                <TextInput
                  style={[...inputStyle, styles.scoreInput]}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={homeScore}
                  onChangeText={setHomeScore}
                  selectTextOnFocus
                />
              </View>
              <Text style={[styles.dash, { color: t.textMuted }]}>–</Text>
              <View style={styles.scoreCol}>
                <Text style={[styles.scoreTeam, { color: t.text }]} numberOfLines={1}>
                  {match.awayClub.shortName}
                </Text>
                <TextInput
                  style={[...inputStyle, styles.scoreInput]}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={awayScore}
                  onChangeText={setAwayScore}
                  selectTextOnFocus
                />
              </View>
            </View>

            {/* Acontecimentos já adicionados */}
            <Text style={[styles.label, { color: t.textMuted, marginTop: 20 }]}>
              Acontecimentos (opcional)
            </Text>
            {events.length === 0 ? (
              <Text style={[styles.empty, { color: t.textFaint }]}>
                Nenhum. Podes registar só o resultado, ou adicionar marcadores e cartões abaixo.
              </Text>
            ) : (
              events.map((e, i) => (
                <View key={`${i}-${e.minute}-${e.eventType}`} style={[styles.eventRow, { borderColor: t.border }]}>
                  <Text style={[styles.eventMinute, { color: brand.amber }]}>{e.minute}'</Text>
                  <Text style={[styles.eventText, { color: t.text }]} numberOfLines={2}>
                    {EVENT_LABEL[e.eventType]} · {clubName(e.clubId)}
                    {e.playerName ? ` · ${e.playerName}` : ''}
                    {e.isPenalty ? ' (pen.)' : ''}
                  </Text>
                  <TouchableOpacity onPress={() => removeEvent(i)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={18} color={brand.red} />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Novo acontecimento */}
            <View style={[styles.newEvent, { borderColor: t.border }]}>
              <View style={styles.chipRow}>
                {[match.homeClub, match.awayClub].map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.chip,
                      { borderColor: t.border },
                      clubId === c.id && { borderColor: brand.forest, backgroundColor: brand.forestMuted },
                    ]}
                    onPress={() => setClubId(c.id)}
                  >
                    <Text style={[styles.chipText, { color: t.text }]} numberOfLines={1}>
                      {c.shortName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.chipRow}>
                {(Object.keys(EVENT_LABEL) as EventType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.chip,
                      { borderColor: t.border },
                      eventType === type && { borderColor: brand.forest, backgroundColor: brand.forestMuted },
                    ]}
                    onPress={() => setEventType(type)}
                  >
                    <Text style={[styles.chipText, { color: t.text }]}>{EVENT_LABEL[type]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inlineRow}>
                <TextInput
                  style={[...inputStyle, { width: 76 }]}
                  placeholder="Min."
                  placeholderTextColor={t.textFaint}
                  keyboardType="number-pad"
                  maxLength={3}
                  value={minute}
                  onChangeText={setMinute}
                />
                <TextInput
                  style={[...inputStyle, { flex: 1 }]}
                  placeholder="Jogador (opcional)"
                  placeholderTextColor={t.textFaint}
                  value={playerName}
                  onChangeText={setPlayerName}
                />
              </View>

              {eventType === 'GOAL' && (
                <View style={styles.switchRow}>
                  <Text style={[styles.switchLabel, { color: t.text }]}>Penálti</Text>
                  <Switch value={isPenalty} onValueChange={setIsPenalty} />
                </View>
              )}

              <TouchableOpacity style={[styles.addBtn, { borderColor: brand.forest }]} onPress={addEvent}>
                <Ionicons name="add" size={18} color={brand.forest} />
                <Text style={[styles.addBtnText, { color: brand.forest }]}>Adicionar acontecimento</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={save}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'A guardar…' : 'Guardar resultado'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '92%' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  body: { paddingBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 14 },
  scoreCol: { flex: 1, alignItems: 'center', gap: 6 },
  scoreTeam: { fontSize: 13, fontWeight: '700' },
  scoreInput: { width: 72, textAlign: 'center', fontSize: 24, fontWeight: '800', height: 56 },
  dash: { fontSize: 24, fontWeight: '700', paddingBottom: 12 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 14 },
  empty: { fontSize: 12, fontStyle: 'italic', marginBottom: 4 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  eventMinute: { width: 36, fontWeight: '800', fontSize: 13 },
  eventText: { flex: 1, fontSize: 13, fontWeight: '500' },
  newEvent: { marginTop: 14, padding: 12, borderWidth: 1, borderRadius: 12, gap: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5 },
  chipText: { fontSize: 12, fontWeight: '700' },
  inlineRow: { flexDirection: 'row', gap: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchLabel: { fontSize: 14, fontWeight: '500' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 42,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  addBtnText: { fontWeight: '700', fontSize: 13 },
  saveBtn: {
    backgroundColor: brand.forest,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
