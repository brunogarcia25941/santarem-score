import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Match } from '@/types';
import { submitMatchEvent } from '@/services/matchActions';
import { supabase } from '@/services/supabase';

interface DelegadoPanelModalProps {
  visible: boolean;
  match: Match;
  onClose: () => void;
}

export function DelegadoPanelModal({ visible, match, onClose }: DelegadoPanelModalProps) {
  const isDark = useColorScheme() === 'dark';
  const [activeTab, setActiveTab] = useState<'status' | 'goal' | 'card'>('goal');
  
  // Estado para Golo
  const [selectedClubId, setSelectedClubId] = useState<string>(match.homeClub.id);
  const [playerName, setPlayerName] = useState('');
  const [isPenalty, setIsPenalty] = useState(false);
  const [isOwnGoal, setIsOwnGoal] = useState(false);
  const [eventMinute, setEventMinute] = useState((match.minute || 0).toString());

  const handleUpdateStatus = async (newStatus: Match['status'], newMinute?: number) => {
    const updateData: any = { status: newStatus };
    if (newMinute !== undefined) updateData.minute = newMinute;

    const { error } = await supabase.from('matches').update(updateData).eq('id', match.id);
    if (error) {
      console.error('Erro ao atualizar status:', error);
      Alert.alert('Erro', `Erro: ${error.message}`);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Alert.alert('Sucesso', 'Estado do jogo atualizado.');
    }
  };

  const handleSendGoal = async () => {
    try {
      const min = parseInt(eventMinute, 10) || match.minute || 0;
      
      await submitMatchEvent({
        matchId: match.id,
        clubId: selectedClubId || match.homeClub.id,
        eventType: isOwnGoal ? 'OWN_GOAL' : 'GOAL',
        minute: min,
        playerName: isOwnGoal ? undefined : playerName.trim() || undefined,
        isPenalty: isPenalty,
      });

      setPlayerName('');
      setIsPenalty(false);
      setIsOwnGoal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Golo Registado!', 'O resultado foi atualizado.');
      onClose();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Aviso', `O golo foi guardado offline ou deu erro: ${err.message || ''}`);
    }
  };

  const handleSendCard = async (type: 'YELLOW_CARD' | 'RED_CARD') => {
    const min = parseInt(eventMinute, 10) || match.minute || 0;

    await submitMatchEvent({
      matchId: match.id,
      clubId: selectedClubId,
      eventType: type,
      minute: min,
      playerName: playerName.trim() || undefined,
    });

    setPlayerName('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Cartão Registado!', 'O evento foi adicionado ao ticker.');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: isDark ? '#202226' : '#ffffff' }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Painel de Delegado</Text>
              <Text style={[styles.matchSubtitle, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
                {match.homeClub.shortName} vs {match.awayClub.shortName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={isDark ? '#eef0f2' : '#1a1b1e'} />
            </TouchableOpacity>
          </View>

          {/* Navegação Interna */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'goal' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('goal');
              }}
            >
              <Text style={[styles.tabBtnText, activeTab === 'goal' && styles.tabBtnTextActive]}>⚽ Registar Golo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'status' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('status');
              }}
            >
              <Text style={[styles.tabBtnText, activeTab === 'status' && styles.tabBtnTextActive]}>⏱️ Período</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'card' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab('card');
              }}
            >
              <Text style={[styles.tabBtnText, activeTab === 'card' && styles.tabBtnTextActive]}>🟨 Disciplina</Text>
            </TouchableOpacity>
          </View>

          {/* Secção: Registar Golo */}
          {activeTab === 'goal' && (
            <View style={styles.body}>
              <Text style={[styles.label, { color: isDark ? '#a1a1aa' : '#71717a' }]}>Equipa que marcou:</Text>
              <View style={styles.clubSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.clubChoiceBtn,
                    selectedClubId === match.homeClub.id && { borderColor: '#2f6b4a', backgroundColor: 'rgba(47,107,74,0.1)' },
                  ]}
                  onPress={() => setSelectedClubId(match.homeClub.id)}
                >
                  <Text style={[styles.clubChoiceText, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
                    {match.homeClub.shortName}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.clubChoiceBtn,
                    selectedClubId === match.awayClub.id && { borderColor: '#2f6b4a', backgroundColor: 'rgba(47,107,74,0.1)' },
                  ]}
                  onPress={() => setSelectedClubId(match.awayClub.id)}
                >
                  <Text style={[styles.clubChoiceText, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
                    {match.awayClub.shortName}
                  </Text>
                </TouchableOpacity>
              </View>

              {!isOwnGoal && (
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: isDark ? '#a1a1aa' : '#71717a' }]}>Marcador (Opcional):</Text>
                  <TextInput
                    style={[styles.input, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#3f3f46' : '#d4d4d8' }]}
                    placeholder="Nome do jogador ou número"
                    placeholderTextColor="#71717a"
                    value={playerName}
                    onChangeText={setPlayerName}
                  />
                </View>
              )}

              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Grande Penalidade (Penálti)</Text>
                <Switch value={isPenalty} onValueChange={setIsPenalty} disabled={isOwnGoal} />
              </View>

              <View style={styles.switchRow}>
                <Text style={[styles.switchLabel, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Autogolo</Text>
                <Switch
                  value={isOwnGoal}
                  onValueChange={(val) => {
                    setIsOwnGoal(val);
                    if (val) setIsPenalty(false);
                  }}
                />
              </View>

              <TouchableOpacity style={styles.actionBtnPrimary} onPress={handleSendGoal}>
                <Text style={styles.actionBtnPrimaryText}>Confirmar Golo ⚽</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Secção: Controlo de Período / Tempo */}
          {activeTab === 'status' && (
            <View style={styles.body}>
              <TouchableOpacity
                style={[styles.periodBtn, { backgroundColor: '#2f6b4a' }]}
                onPress={() => handleUpdateStatus('live', 1)}
              >
                <Text style={styles.periodBtnText}>Iniciar 1.ª Parte</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.periodBtn, { backgroundColor: '#eab308' }]}
                onPress={() => handleUpdateStatus('halftime', 45)}
              >
                <Text style={styles.periodBtnText}>Marcar Intervalo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.periodBtn, { backgroundColor: '#2f6b4a' }]}
                onPress={() => handleUpdateStatus('live', 46)}
              >
                <Text style={styles.periodBtnText}>Iniciar 2.ª Parte</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.periodBtn, { backgroundColor: '#dc2626' }]}
                onPress={() => handleUpdateStatus('finished', 90)}
              >
                <Text style={styles.periodBtnText}>Terminar Jogo</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Secção: Disciplina */}
          {activeTab === 'card' && (
            <View style={styles.body}>
              <Text style={[styles.label, { color: isDark ? '#a1a1aa' : '#71717a' }]}>Equipa:</Text>
              <View style={styles.clubSelectorRow}>
                <TouchableOpacity
                  style={[
                    styles.clubChoiceBtn,
                    selectedClubId === match.homeClub.id && { borderColor: '#2f6b4a', backgroundColor: 'rgba(47,107,74,0.1)' },
                  ]}
                  onPress={() => setSelectedClubId(match.homeClub.id)}
                >
                  <Text style={[styles.clubChoiceText, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
                    {match.homeClub.shortName}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.clubChoiceBtn,
                    selectedClubId === match.awayClub.id && { borderColor: '#2f6b4a', backgroundColor: 'rgba(47,107,74,0.1)' },
                  ]}
                  onPress={() => setSelectedClubId(match.awayClub.id)}
                >
                  <Text style={[styles.clubChoiceText, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
                    {match.awayClub.shortName}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? '#a1a1aa' : '#71717a' }]}>Jogador:</Text>
                <TextInput
                  style={[styles.input, { color: isDark ? '#fff' : '#000', borderColor: isDark ? '#3f3f46' : '#d4d4d8' }]}
                  placeholder="Nome ou dorsal"
                  placeholderTextColor="#71717a"
                  value={playerName}
                  onChangeText={setPlayerName}
                />
              </View>

              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={[styles.cardBtn, { backgroundColor: '#eab308' }]}
                  onPress={() => handleSendCard('YELLOW_CARD')}
                >
                  <Text style={styles.cardBtnText}>🟨 Cartão Amarelo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cardBtn, { backgroundColor: '#dc2626' }]}
                  onPress={() => handleSendCard('RED_CARD')}
                >
                  <Text style={styles.cardBtnText}>🔴 Cartão Vermelho</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  container: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800' },
  matchSubtitle: { fontSize: 13, marginTop: 2 },
  closeBtn: { padding: 4 },
  tabRow: { flexDirection: 'row', marginBottom: 20, gap: 8 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: 'rgba(150,150,150,0.1)' },
  tabBtnActive: { backgroundColor: '#2f6b4a' },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: '#71717a' },
  tabBtnTextActive: { color: '#ffffff' },
  body: { gap: 14 },
  label: { fontSize: 13, fontWeight: '600' },
  clubSelectorRow: { flexDirection: 'row', gap: 10 },
  clubChoiceBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(150,150,150,0.2)', alignItems: 'center' },
  clubChoiceText: { fontWeight: '700', fontSize: 13 },
  inputGroup: { gap: 6 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  switchLabel: { fontSize: 14, fontWeight: '500' },
  actionBtnPrimary: { backgroundColor: '#2f6b4a', height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  actionBtnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  periodBtn: { height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  periodBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  cardActionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  cardBtn: { flex: 1, height: 46, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});