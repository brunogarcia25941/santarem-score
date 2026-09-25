import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  useColorScheme,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/services/supabase';
import { mapClub } from '@/services/clubs';
import { Match } from '@/types';
import { ClubBadge } from '@/components/ClubBadge';
import { useAuth } from '@/context/AuthContext';
import { DelegadoPanelModal } from '@/components/DelegadoPanelModal';
import { RegisterResultModal } from '@/components/RegisterResultModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StadiumTexture } from '@/components/StadiumTexture';
import { ScoreboardPlate } from '@/components/ScoreboardPlate';
import { FlyInFromOrigin } from '@/components/FlyInFromOrigin';
import { consumeMatchTransitionOrigin } from '@/utils/matchTransitionOrigin';

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { session, profile, canModerateClub } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [transitionOrigin] = useState(() => consumeMatchTransitionOrigin());
  const [match, setMatch] = useState<Match | null>(transitionOrigin?.initialMatch ?? null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(!transitionOrigin?.initialMatch);
  const [isDelegadoModalVisible, setIsDelegadoModalVisible] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);

  async function fetchMatchData() {
    if (!id) return;

    // Buscar jogo com clubes
    const { data: matchData, error } = await supabase
      .from('matches')
      .select(`
      id,
      competition,
      round,
      home_score,
      away_score,
      status,
      minute,
      match_date,
      home_club:clubs!matches_home_club_id_fkey(*),
      away_club:clubs!matches_away_club_id_fkey(*)
    `)
      .eq('id', id)
      .single();

    if (!error && matchData) {
      setMatch({
        id: matchData.id,
        competition: matchData.competition,
        round: matchData.round,
        homeClub: mapClub(Array.isArray(matchData.home_club) ? matchData.home_club[0] : matchData.home_club),
        awayClub: mapClub(Array.isArray(matchData.away_club) ? matchData.away_club[0] : matchData.away_club),
        homeScore: matchData.home_score,
        awayScore: matchData.away_score,
        status: matchData.status,
        minute: matchData.minute,
        matchDate: matchData.match_date,
      });
    }

    // Buscar eventos
    const { data: eventData } = await supabase
      .from('match_events')
      .select('*')
      .eq('match_id', id)
      .order('minute', { ascending: false });

    if (eventData) {
      setEvents(eventData);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchMatchData();

    // Subscrição em direto aos eventos e placar deste jogo
    const matchChannel = supabase
      .channel(`match:${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches', filter: `id=eq.${id}` }, () => fetchMatchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_events', filter: `match_id=eq.${id}` }, () => fetchMatchData())
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
    };
  }, [id]);

  if (loading || !match) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1a1b1e' : '#eef0f2', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#2f6b4a" />
      </SafeAreaView>
    );
  }

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${match.homeClub.latitude},${match.homeClub.longitude}`;
    Linking.openURL(url);
  };

  const openWaze = () => {
    const url = `https://waze.com/ul?ll=${match.homeClub.latitude},${match.homeClub.longitude}&navigate=yes`;
    Linking.openURL(url);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1a1b1e' : '#eef0f2' }]}>
      <StadiumTexture variant="floodlights" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Placar de Jogo */}
        <View style={[styles.scoreCard, { backgroundColor: isDark ? '#202226' : '#ffffff' }]}>
          <Text style={[styles.competitionText, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
            {match.competition} • {match.round}
          </Text>

          <View style={styles.scoreboard}>
            <View style={styles.teamColumn}>
              <FlyInFromOrigin origin={transitionOrigin?.homeBadge}>
                <ClubBadge club={match.homeClub} size={48} />
              </FlyInFromOrigin>
              <Text
                style={[styles.teamName, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {match.homeClub.shortName}
              </Text>
            </View>

            <View style={styles.scoreCenter}>
              <FlyInFromOrigin origin={transitionOrigin?.scoreboard}>
                <ScoreboardPlate
                  homeScore={match.homeScore}
                  awayScore={match.awayScore}
                  size="large"
                  status={match.status}
                  minute={match.minute}
                />
              </FlyInFromOrigin>
              {match.status === 'finished' && (
                <Text style={[styles.statusLabel, { marginTop: 8 }]}>Terminado</Text>
              )}
            </View>

            <View style={styles.teamColumn}>
              <FlyInFromOrigin origin={transitionOrigin?.awayBadge}>
                <ClubBadge club={match.awayClub} size={48} />
              </FlyInFromOrigin>
              <Text
                style={[styles.teamName, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {match.awayClub.shortName}
              </Text>
            </View>
          </View>
        </View>

        {/* Botão de Controlo de Delegado — só visível a quem tem permissão */}
        {canModerateClub(match.homeClub.id) || canModerateClub(match.awayClub.id) ? (
          <TouchableOpacity
            style={styles.delegadoBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsDelegadoModalVisible(true);
            }}
          >
            <Ionicons name="create-outline" size={18} color="#ffffff" />
            <Text style={styles.delegadoBtnText}>Painel do Delegado (Registar Golo/Tempo)</Text>
          </TouchableOpacity>
        ) : !session ? (
          <TouchableOpacity
            style={styles.delegadoLoginBtn}
            onPress={() => router.push('/delegado-login')}
          >
            <Ionicons name="lock-closed-outline" size={16} color="#71717a" />
            <Text style={styles.delegadoLoginBtnText}>Sou delegado deste jogo — iniciar sessão</Text>
          </TouchableOpacity>
        ) : null}

        {/* Registo retroativo de jogos já realizados — só admin */}
        {isAdmin && (
          <TouchableOpacity
            style={[styles.delegadoBtn, { backgroundColor: '#d97706' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsResultModalVisible(true);
            }}
          >
            <Ionicons name="checkmark-done-outline" size={18} color="#ffffff" />
            <Text style={styles.delegadoBtnText}>
              {match.status === 'finished' ? 'Corrigir resultado (Admin)' : 'Registar resultado (Admin)'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Localização & GPS */}
        <View style={[styles.locationCard, { backgroundColor: isDark ? '#202226' : '#ffffff' }]}>
          <View style={styles.locationHeader}>
            <Ionicons name="location" size={20} color="#2f6b4a" />
            <Text style={[styles.stadiumName, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
              {match.homeClub.stadiumName}
            </Text>
          </View>

          <View style={styles.gpsButtonsRow}>
            <TouchableOpacity style={styles.gpsButton} onPress={openGoogleMaps}>
              <Ionicons name="map-outline" size={16} color="#ffffff" />
              <Text style={styles.gpsButtonText}>Google Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.gpsButton, { backgroundColor: '#33ccff' }]} onPress={openWaze}>
              <Ionicons name="navigate-outline" size={16} color="#ffffff" />
              <Text style={styles.gpsButtonText}>Waze</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Match Ticker em Tempo Real */}
        <Text style={[styles.tickerTitle, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>Acontecimentos</Text>
        <View style={[styles.tickerCard, { backgroundColor: isDark ? '#202226' : '#ffffff' }]}>
          {events.length === 0 ? (
            <Text style={{ color: '#71717a', textAlign: 'center', paddingVertical: 10 }}>
              Sem eventos registados até ao momento.
            </Text>
          ) : (
            events.map((evt) => (
              <View key={evt.id} style={styles.eventRow}>
                <Text style={styles.eventMinute}>{evt.minute}'</Text>
                <Text style={styles.eventIcon}>
                  {evt.event_type === 'GOAL' || evt.event_type === 'OWN_GOAL' ? '⚽' : evt.event_type === 'YELLOW_CARD' ? '🟨' : '🔴'}
                </Text>
                <Text style={[styles.eventText, { color: isDark ? '#eef0f2' : '#1a1b1e' }]}>
                  {evt.event_type === 'GOAL'
                    ? 'Golo'
                    : evt.event_type === 'OWN_GOAL'
                      ? 'Autogolo'
                      : evt.event_type === 'YELLOW_CARD'
                        ? 'Amarelo'
                        : 'Vermelho'}
                  {evt.player_name ? ` - ${evt.player_name}` : ''}
                  {evt.is_penalty ? ' (Penálti)' : ''}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal de Gestão */}
      <DelegadoPanelModal
        visible={isDelegadoModalVisible}
        match={match}
        onClose={() => {
          setIsDelegadoModalVisible(false);
          fetchMatchData();
        }}
      />

      {isAdmin && (
        <RegisterResultModal
          visible={isResultModalVisible}
          match={match}
          existingEvents={events}
          onClose={() => setIsResultModalVisible(false)}
          onSaved={fetchMatchData}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  scoreCard: {
  padding: 18,
  borderRadius: 16,
  marginBottom: 14,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.05)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.5,
  shadowRadius: 6,
  elevation: 4,
},
  competitionText: { fontSize: 13, textAlign: 'center', marginBottom: 16 },
  scoreboard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  teamColumn: { flex: 1, alignItems: 'center', minWidth: 0 },
  teamName: { fontSize: 12.5, fontWeight: '700', marginTop: 8, textAlign: 'center', lineHeight: 15 },
  scoreCenter: { alignItems: 'center', paddingHorizontal: 8 },
  score: { fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  minute: { color: '#dc2626', fontSize: 12, fontWeight: '700', marginTop: 4 },
  statusLabel: { color: '#71717a', fontSize: 12, fontWeight: '700', marginTop: 4 },
  badge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontWeight: 'bold' },
  delegadoBtn: {
    backgroundColor: '#2f6b4a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
  },
  delegadoBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  delegadoLoginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.3)',
    borderStyle: 'dashed',
  },
  delegadoLoginBtnText: { color: '#71717a', fontWeight: '600', fontSize: 12 },
  locationCard: { padding: 16, borderRadius: 16, marginBottom: 16 },
  locationHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  stadiumName: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
  gpsButtonsRow: { flexDirection: 'row', gap: 10 },
  gpsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2f6b4a',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  gpsButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 13 },
  tickerTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  tickerCard: { padding: 16, borderRadius: 16 },
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  eventMinute: { width: 32, fontSize: 13, fontWeight: '700', color: '#71717a' },
  eventIcon: { fontSize: 14, marginHorizontal: 8 },
  eventText: { fontSize: 14, fontWeight: '500' },
});