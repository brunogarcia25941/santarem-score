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
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Match } from '@/types';
import { submitMatchEvent } from '@/services/matchActions';
import { supabase } from '@/services/supabase';
import { brand, getTheme } from '@/constants/theme';
import { currentMinute } from '@/utils/matchClock';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useNow } from '@/hooks/useNow';

type Tab = 'period' | 'goal' | 'card' | 'events';
type PeriodAction = 'start_first_half' | 'end_first_half' | 'start_second_half' | 'end_match';

interface DelegadoPanelModalProps {
  visible: boolean;
  match: Match;
  /** Linhas de `match_events` deste jogo (para listar e apagar). */
  events: any[];
  onClose: () => void;
  /** Chamado depois de qualquer alteração, para o ecrã do jogo recarregar. */
  onChanged: () => void;
}

const EVENT_LABEL: Record<string, string> = {
  GOAL: '⚽ Golo',
  OWN_GOAL: '⚽ Autogolo',
  YELLOW_CARD: '🟨 Amarelo',
  RED_CARD: '🟥 Vermelho',
};

export function DelegadoPanelModal({ visible, match, events, onClose, onChanged }: DelegadoPanelModalProps) {
  const isDark = useColorScheme() === 'dark';
  const t = getTheme(isDark);
  const keyboardHeight = useKeyboardHeight();
  const { height: windowHeight } = useWindowDimensions();
  const now = useNow(visible && match.status === 'live');

  // Só se registam acontecimentos com o jogo já começado e ainda por terminar.
  const canAddEvents = ['live', 'halftime', 'interrupted'].includes(match.status);

  const [activeTab, setActiveTab] = useState<Tab>('period');
  const [busy, setBusy] = useState(false);

  // Formulário de golo / cartão
  const [selectedClubId, setSelectedClubId] = useState<string>(match.homeClub.id);
  const [playerName, setPlayerName] = useState('');
  const [isPenalty, setIsPenalty] = useState(false);
  const [isOwnGoal, setIsOwnGoal] = useState(false);
  const [eventMinute, setEventMinute] = useState('');

  // Ao abrir, parte do estado atual do jogo: separador certo e minuto do relógio.
  useEffect(() => {
    if (!visible) return;
    setActiveTab(canAddEvents ? 'goal' : 'period');
    setSelectedClubId(match.homeClub.id);
    setPlayerName('');
    setIsPenalty(false);
    setIsOwnGoal(false);
    setEventMinute(String(currentMinute(match) ?? ''));
  }, [visible, match.id]);

  const switchTab = (tab: Tab) => {
    Haptics.selectionAsync();
    // O minuto do relógio avançou desde que o painel abriu.
    if (tab === 'goal' || tab === 'card') setEventMinute(String(currentMinute(match) ?? ''));
    setActiveTab(tab);
  };

  // --- Relógio do jogo -------------------------------------------------------
  const periodStep: { action: PeriodAction; label: string; confirm: string; color: string } | null =
    match.status === 'scheduled' || match.status === 'postponed'
      ? { action: 'start_first_half', label: 'Iniciar jogo (1.ª parte)', confirm: 'O relógio começa a contar agora.', color: brand.forest }
      : match.status === 'live' && (match.minuteOffset ?? 0) === 0
        ? { action: 'end_first_half', label: 'Terminar 1.ª parte (intervalo)', confirm: 'O relógio pára até começares a 2.ª parte.', color: brand.amberDeep }
        : match.status === 'halftime'
          ? { action: 'start_second_half', label: 'Iniciar 2.ª parte', confirm: 'O relógio retoma aos 45 minutos.', color: brand.forest }
          : match.status === 'live'
            ? { action: 'end_match', label: 'Terminar jogo', confirm: 'O jogo fica terminado e conta para a classificação.', color: brand.red }
            : null;

  const statusText =
    match.status === 'scheduled' || match.status === 'postponed'
      ? 'Por começar'
      : match.status === 'halftime'
        ? 'Intervalo'
        : match.status === 'finished'
          ? 'Jogo terminado'
          : match.status === 'live'
            ? `${(match.minuteOffset ?? 0) === 0 ? '1.ª parte' : '2.ª parte'} · ${currentMinute(match, now)}'`
            : 'Interrompido';

  const runPeriodAction = (step: NonNullable<typeof periodStep>) => {
    Alert.alert(step.label, step.confirm, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          setBusy(true);
          const { error } = await supabase.rpc('set_match_period', {
            p_match_id: match.id,
            p_action: step.action,
          });
          setBusy(false);
          if (error) {
            Alert.alert('Erro', error.message);
            return;
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onChanged();
        },
      },
    ]);
  };

  // --- Golos e cartões ---------------------------------------------------------
  const parsedMinute = () => {
    const n = parseInt(eventMinute, 10);
    return Number.isNaN(n) ? (currentMinute(match) ?? 0) : n;
  };

  const handleSendGoal = async () => {
    try {
      await submitMatchEvent({
        matchId: match.id,
        clubId: selectedClubId,
        eventType: isOwnGoal ? 'OWN_GOAL' : 'GOAL',
        minute: parsedMinute(),
        playerName: playerName.trim() || undefined,
        isPenalty: isPenalty && !isOwnGoal,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onChanged();
      onClose();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Não foi possível registar', err?.message || 'Tenta de novo.');
    }
  };

  const handleSendCard = async (type: 'YELLOW_CARD' | 'RED_CARD') => {
    try {
      await submitMatchEvent({
        matchId: match.id,
        clubId: selectedClubId,
        eventType: type,
        minute: parsedMinute(),
        playerName: playerName.trim() || undefined,
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChanged();
      onClose();
    } catch (err: any) {
      Alert.alert('Não foi possível registar', err?.message || 'Tenta de novo.');
    }
  };

  // --- Apagar acontecimentos ---------------------------------------------------
  const confirmDelete = (evt: any) => {
    const club = evt.club_id === match.homeClub.id ? match.homeClub.shortName : match.awayClub.shortName;
    const isGoal = evt.event_type === 'GOAL' || evt.event_type === 'OWN_GOAL';
    Alert.alert(
      'Apagar acontecimento?',
      `${EVENT_LABEL[evt.event_type]} · ${club} · ${evt.minute}'${evt.player_name ? ` · ${evt.player_name}` : ''}` +
        (isGoal ? '\n\nO marcador é corrigido automaticamente.' : ''),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('match_events').delete().eq('id', evt.id);
            if (error) {
              Alert.alert('Erro', error.message);
              return;
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChanged();
          },
        },
      ]
    );
  };

  const inputStyle = [styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.base }];

  const clubSelector = (
    <View style={styles.clubSelectorRow}>
      {[match.homeClub, match.awayClub].map((c) => (
        <TouchableOpacity
          key={c.id}
          style={[
            styles.clubChoiceBtn,
            selectedClubId === c.id && { borderColor: brand.forest, backgroundColor: brand.forestMuted },
          ]}
          onPress={() => setSelectedClubId(c.id)}
        >
          <Text style={[styles.clubChoiceText, { color: t.text }]} numberOfLines={1}>
            {c.shortName}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const notStarted = (
    <View style={styles.body}>
      <Text style={[styles.notice, { color: t.textMuted }]}>
        {match.status === 'finished'
          ? 'O jogo já terminou. Já não é possível registar novos acontecimentos aqui — podes apagar os que estiverem errados no separador "Lista".'
          : 'O jogo ainda não começou. Inicia o jogo no separador "Tempo" para poderes registar acontecimentos.'}
      </Text>
      {match.status !== 'finished' && (
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: brand.forest }]} onPress={() => switchTab('period')}>
          <Text style={styles.actionBtnText}>Ir para o Tempo</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const sortedEvents = [...events].sort((a, b) => b.minute - a.minute);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      {/* O painel sobe com o teclado: margem igual à altura do teclado e altura máxima do resto do ecrã. */}
      <View style={[styles.overlay, { paddingBottom: keyboardHeight }]}>
        <View
          style={[
            styles.container,
            { backgroundColor: t.surface, maxHeight: Math.max(windowHeight - keyboardHeight - 40, 240) },
          ]}
        >
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: t.text }]}>Painel de Delegado</Text>
              <Text style={[styles.matchSubtitle, { color: t.textMuted }]} numberOfLines={1}>
                {match.homeClub.shortName} {match.homeScore}-{match.awayScore} {match.awayClub.shortName} · {statusText}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={24} color={t.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabRow}>
            {(
              [
                ['period', '⏱️ Tempo'],
                ['goal', '⚽ Golo'],
                ['card', '🟨 Cartão'],
                ['events', '📋 Lista'],
              ] as [Tab, string][]
            ).map(([tab, label]) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
                onPress={() => switchTab(tab)}
              >
                <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Tempo */}
            {activeTab === 'period' && (
              <View style={styles.body}>
                <View style={[styles.statusBox, { borderColor: t.border }]}>
                  <Text style={[styles.statusBoxLabel, { color: t.textMuted }]}>Estado do jogo</Text>
                  <Text style={[styles.statusBoxValue, { color: t.text }]}>{statusText}</Text>
                </View>
                {periodStep ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: periodStep.color }, busy && { opacity: 0.6 }]}
                    onPress={() => runPeriodAction(periodStep)}
                    disabled={busy}
                  >
                    <Text style={styles.actionBtnText}>{periodStep.label}</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.notice, { color: t.textMuted }]}>
                    {match.status === 'finished' ? 'Este jogo já terminou.' : 'Sem ações disponíveis para o estado atual.'}
                  </Text>
                )}
              </View>
            )}

            {/* Golo */}
            {activeTab === 'goal' &&
              (!canAddEvents ? (
                notStarted
              ) : (
                <View style={styles.body}>
                  <Text style={[styles.label, { color: t.textMuted }]}>Equipa que marcou</Text>
                  {clubSelector}

                  <View style={styles.inlineRow}>
                    <View style={{ width: 80 }}>
                      <Text style={[styles.label, { color: t.textMuted }]}>Minuto</Text>
                      <TextInput
                        style={inputStyle}
                        keyboardType="number-pad"
                        maxLength={3}
                        value={eventMinute}
                        onChangeText={setEventMinute}
                        selectTextOnFocus
                      />
                    </View>
                    {!isOwnGoal && (
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.label, { color: t.textMuted }]}>Marcador (opcional)</Text>
                        <TextInput
                          style={inputStyle}
                          placeholder="Nome ou número"
                          placeholderTextColor={t.textFaint}
                          value={playerName}
                          onChangeText={setPlayerName}
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.switchRow}>
                    <Text style={[styles.switchLabel, { color: t.text }]}>Penálti</Text>
                    <Switch value={isPenalty} onValueChange={setIsPenalty} disabled={isOwnGoal} />
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={[styles.switchLabel, { color: t.text }]}>Autogolo</Text>
                    <Switch
                      value={isOwnGoal}
                      onValueChange={(val) => {
                        setIsOwnGoal(val);
                        if (val) setIsPenalty(false);
                      }}
                    />
                  </View>

                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: brand.forest }]} onPress={handleSendGoal}>
                    <Text style={styles.actionBtnText}>Confirmar golo ⚽</Text>
                  </TouchableOpacity>
                </View>
              ))}

            {/* Cartão */}
            {activeTab === 'card' &&
              (!canAddEvents ? (
                notStarted
              ) : (
                <View style={styles.body}>
                  <Text style={[styles.label, { color: t.textMuted }]}>Equipa</Text>
                  {clubSelector}

                  <View style={styles.inlineRow}>
                    <View style={{ width: 80 }}>
                      <Text style={[styles.label, { color: t.textMuted }]}>Minuto</Text>
                      <TextInput
                        style={inputStyle}
                        keyboardType="number-pad"
                        maxLength={3}
                        value={eventMinute}
                        onChangeText={setEventMinute}
                        selectTextOnFocus
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.label, { color: t.textMuted }]}>Jogador (opcional)</Text>
                      <TextInput
                        style={inputStyle}
                        placeholder="Nome ou dorsal"
                        placeholderTextColor={t.textFaint}
                        value={playerName}
                        onChangeText={setPlayerName}
                      />
                    </View>
                  </View>

                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity style={[styles.cardBtn, { backgroundColor: brand.yellow }]} onPress={() => handleSendCard('YELLOW_CARD')}>
                      <Text style={styles.actionBtnText}>🟨 Amarelo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.cardBtn, { backgroundColor: brand.red }]} onPress={() => handleSendCard('RED_CARD')}>
                      <Text style={styles.actionBtnText}>🟥 Vermelho</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

            {/* Lista / apagar */}
            {activeTab === 'events' && (
              <View style={styles.body}>
                {sortedEvents.length === 0 ? (
                  <Text style={[styles.notice, { color: t.textMuted }]}>Ainda não há acontecimentos registados.</Text>
                ) : (
                  sortedEvents.map((evt) => {
                    const club = evt.club_id === match.homeClub.id ? match.homeClub.shortName : match.awayClub.shortName;
                    return (
                      <View key={evt.id} style={[styles.eventRow, { borderColor: t.border }]}>
                        <Text style={[styles.eventMinute, { color: brand.amber }]}>{evt.minute}'</Text>
                        <Text style={[styles.eventText, { color: t.text }]} numberOfLines={2}>
                          {EVENT_LABEL[evt.event_type]} · {club}
                          {evt.player_name ? ` · ${evt.player_name}` : ''}
                          {evt.is_penalty ? ' (pen.)' : ''}
                        </Text>
                        <TouchableOpacity onPress={() => confirmDelete(evt)} hitSlop={10}>
                          <Ionicons name="trash-outline" size={20} color={brand.red} />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12 },
  title: { fontSize: 18, fontWeight: '800' },
  matchSubtitle: { fontSize: 13, marginTop: 2 },
  closeBtn: { padding: 4 },
  tabRow: { flexDirection: 'row', marginBottom: 16, gap: 6 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: 'rgba(150,150,150,0.1)' },
  tabBtnActive: { backgroundColor: brand.forest },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: '#71717a' },
  tabBtnTextActive: { color: '#ffffff' },
  body: { gap: 14, paddingBottom: 8 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  notice: { fontSize: 14, lineHeight: 20 },
  statusBox: { borderWidth: 1, borderRadius: 12, padding: 14, alignItems: 'center' },
  statusBoxLabel: { fontSize: 12, fontWeight: '600' },
  statusBoxValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  clubSelectorRow: { flexDirection: 'row', gap: 10 },
  clubChoiceBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(150,150,150,0.2)', alignItems: 'center' },
  clubChoiceText: { fontWeight: '700', fontSize: 13 },
  inlineRow: { flexDirection: 'row', gap: 10 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  switchLabel: { fontSize: 14, fontWeight: '500' },
  actionBtn: { height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  cardActionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cardBtn: { flex: 1, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  eventMinute: { width: 38, fontWeight: '800', fontSize: 13 },
  eventText: { flex: 1, fontSize: 13, fontWeight: '500' },
});
