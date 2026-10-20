import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  useColorScheme,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Match } from '@/types';
import { supabase } from '@/services/supabase';
import { brand, getTheme } from '@/constants/theme';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { LineupRow } from './LineupCard';

interface DraftPlayer {
  number: string;
  name: string;
}

const SLOTS = 11;
const emptyDraft = (): DraftPlayer[] => Array.from({ length: SLOTS }, () => ({ number: '', name: '' }));

interface Props {
  visible: boolean;
  match: Match;
  /** Onze já guardado (as duas equipas). */
  lineups: LineupRow[];
  onClose: () => void;
  onSaved: () => void;
}

/** Jogadores preenchidos (com número e/ou nome), pela ordem das linhas. */
const filled = (draft: DraftPlayer[]) => draft.filter((p) => p.number.trim() !== '' || p.name.trim() !== '');
const serialize = (draft: DraftPlayer[]) =>
  JSON.stringify(filled(draft).map((p) => [p.number.trim(), p.name.trim()]));

/**
 * Editor do onze inicial. Pode preencher-se só uma equipa ou as duas, e cada
 * jogador com número, nome ou ambos. Guarda as equipas que foram alteradas;
 * outro delegado pode voltar mais tarde e completar o que souber.
 */
export function LineupEditorModal({ visible, match, lineups, onClose, onSaved }: Props) {
  const isDark = useColorScheme() === 'dark';
  const t = getTheme(isDark);
  const keyboardHeight = useKeyboardHeight();
  const { height: windowHeight } = useWindowDimensions();

  const [clubId, setClubId] = useState(match.homeClub.id);
  const [drafts, setDrafts] = useState<Record<string, DraftPlayer[]>>({});
  const [saved, setSaved] = useState<Record<string, string>>({}); // assinatura do que está guardado
  const [saving, setSaving] = useState(false);

  const clubs = [match.homeClub, match.awayClub];

  useEffect(() => {
    if (!visible) return;
    const next: Record<string, DraftPlayer[]> = {};
    const signatures: Record<string, string> = {};
    for (const c of clubs) {
      const rows = lineups
        .filter((l) => l.club_id === c.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((l) => ({ number: l.shirt_number?.toString() ?? '', name: l.player_name ?? '' }));
      const draft = [...rows, ...emptyDraft()].slice(0, SLOTS);
      next[c.id] = draft;
      signatures[c.id] = serialize(draft);
    }
    setDrafts(next);
    setSaved(signatures);
    setClubId(match.homeClub.id);
  }, [visible, match.id]);

  const draft = drafts[clubId] ?? emptyDraft();

  const update = (index: number, field: keyof DraftPlayer, value: string) => {
    const cleaned = field === 'number' ? value.replace(/[^0-9]/g, '').slice(0, 2) : value;
    setDrafts((prev) => ({
      ...prev,
      [clubId]: (prev[clubId] ?? emptyDraft()).map((p, i) => (i === index ? { ...p, [field]: cleaned } : p)),
    }));
  };

  const dirtyClubs = clubs.filter((c) => serialize(drafts[c.id] ?? emptyDraft()) !== saved[c.id]);

  const save = async () => {
    // Validação: números repetidos dentro da mesma equipa.
    for (const c of dirtyClubs) {
      const numbers = filled(drafts[c.id]).map((p) => p.number.trim()).filter(Boolean);
      if (new Set(numbers).size !== numbers.length) {
        Alert.alert('Número repetido', `Na equipa ${c.shortName} há dois jogadores com o mesmo número.`);
        setClubId(c.id);
        return;
      }
    }

    setSaving(true);
    for (const c of dirtyClubs) {
      const { error } = await supabase.rpc('set_match_lineup', {
        p_match_id: match.id,
        p_club_id: c.id,
        p_players: filled(drafts[c.id]).map((p) => ({
          number: p.number.trim() === '' ? null : parseInt(p.number, 10),
          name: p.name.trim() || null,
        })),
      });
      if (error) {
        setSaving(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(`Erro ao guardar (${c.shortName})`, error.message);
        return;
      }
    }
    setSaving(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSaved();
    onClose();
  };

  const inputStyle = [styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.base }];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.overlay, { paddingBottom: keyboardHeight }]}>
        <View
          style={[
            styles.container,
            { backgroundColor: t.surface, maxHeight: Math.max(windowHeight - keyboardHeight - 40, 260) },
          ]}
        >
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: t.text }]}>Onze inicial</Text>
              <Text style={[styles.subtitle, { color: t.textMuted }]} numberOfLines={1}>
                {match.homeClub.shortName} vs {match.awayClub.shortName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={t.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.chipRow}>
            {clubs.map((c) => {
              const count = filled(drafts[c.id] ?? []).length;
              return (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.chip,
                    { borderColor: t.border },
                    clubId === c.id && { borderColor: brand.forest, backgroundColor: brand.forestMuted },
                  ]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setClubId(c.id);
                  }}
                >
                  <Text style={[styles.chipText, { color: t.text }]} numberOfLines={1}>
                    {c.shortName} · {count}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.hint, { color: t.textFaint }]}>
            Preenche o que souberes: só números, só nomes, ou os dois. Podes deixar uma equipa por preencher — o
            delegado dela (ou tu, mais tarde) pode completar.
          </Text>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {draft.map((p, i) => (
              <View key={i} style={styles.row}>
                <Text style={[styles.index, { color: t.textFaint }]}>{i + 1}</Text>
                <TextInput
                  style={[...inputStyle, styles.numberInput]}
                  placeholder="Nº"
                  placeholderTextColor={t.textFaint}
                  keyboardType="number-pad"
                  maxLength={2}
                  value={p.number}
                  onChangeText={(v) => update(i, 'number', v)}
                />
                <TextInput
                  style={[...inputStyle, { flex: 1 }]}
                  placeholder="Nome (opcional)"
                  placeholderTextColor={t.textFaint}
                  value={p.name}
                  onChangeText={(v) => update(i, 'name', v)}
                  maxLength={60}
                />
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={[styles.saveBtn, (saving || dirtyClubs.length === 0) && { opacity: 0.5 }]}
            onPress={save}
            disabled={saving || dirtyClubs.length === 0}
          >
            <Text style={styles.saveBtnText}>
              {saving
                ? 'A guardar…'
                : dirtyClubs.length === 0
                  ? 'Sem alterações'
                  : dirtyClubs.length === 2
                    ? 'Guardar as duas equipas'
                    : `Guardar ${dirtyClubs[0].shortName}`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  chip: { flex: 1, paddingVertical: 10, borderRadius: 999, borderWidth: 1.5, alignItems: 'center' },
  chipText: { fontSize: 13, fontWeight: '700' },
  hint: { fontSize: 12, lineHeight: 17, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  index: { width: 18, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 42, fontSize: 14 },
  numberInput: { width: 62, textAlign: 'center', fontWeight: '700' },
  saveBtn: { backgroundColor: brand.forest, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
