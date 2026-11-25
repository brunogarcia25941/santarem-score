import React, { useState, useEffect, useRef } from 'react';
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
import { ClubBadgeLink } from '@/components/ClubBadgeLink';
import { useAuth } from '@/context/AuthContext';
import { DelegadoPanelModal } from '@/components/DelegadoPanelModal';
import { RegisterResultModal } from '@/components/RegisterResultModal';
import { LineupCard, LineupRow } from '@/components/LineupCard';
import { LineupEditorModal } from '@/components/LineupEditorModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StadiumTexture } from '@/components/StadiumTexture';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { FlyInFromOrigin } from '@/components/FlyInFromOrigin';
import { consumeMatchTransitionOrigin } from '@/utils/matchTransitionOrigin';
import { formatMatchDateFull } from '@/utils/dateFormat';
import { currentMinute } from '@/utils/matchClock';
import { useNow } from '@/hooks/useNow';
import { canUsePanel, canEditResult } from '@/utils/matchAccess';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { MatchShareCard } from '@/components/MatchShareCard';
import { SegmentedTabs, SegmentedTab } from '@/components/SegmentedTabs';
import { EmptyState } from '@/components/EmptyState';
import { MatchStandingsTab } from '@/components/MatchStandingsTab';
import { Skeleton } from '@/components/Skeleton';
import { track, trackError } from '@/services/analytics';

const MATCH_TABS: SegmentedTab<'summary' | 'lineups' | 'table' | 'venue'>[] = [
  { id: 'summary', label: 'Resumo', icon: 'list-outline' },
  { id: 'lineups', label: 'Onzes', icon: 'people-outline' },
  { id: 'table', label: 'Tabela', icon: 'podium-outline' },
  { id: 'venue', label: 'Local', icon: 'location-outline' },
];

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isDark = useColorScheme() === 'dark';
  const router = useRouter();
  const { session, profile, canModerateClub } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const [transitionOrigin] = useState(() => consumeMatchTransitionOrigin());
  const [match, setMatch] = useState<Match | null>(transitionOrigin?.initialMatch ?? null);
  const [events, setEvents] = useState<any[]>([]);
  const [lineups, setLineups] = useState<LineupRow[]>([]);
  const [isLineupModalVisible, setIsLineupModalVisible] = useState(false);
  const [loading, setLoading] = useState(!transitionOrigin?.initialMatch);
  const [isDelegadoModalVisible, setIsDelegadoModalVisible] = useState(false);
  const [isResultModalVisible, setIsResultModalVisible] = useState(false);
  const [tab, setTab] = useState<'summary' | 'lineups' | 'table' | 'venue'>('summary');
  const now = useNow(match?.status === 'live' || (match?.status === 'finished' && Boolean(match.finishedAt)));

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
      period_started_at,
      minute_offset,
      finished_at,
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
        periodStartedAt: matchData.period_started_at,
        minuteOffset: matchData.minute_offset,
        finishedAt: matchData.finished_at,
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

    const { data: lineupData } = await supabase
      .from('match_lineups')
      .select('id, club_id, shirt_number, player_name, sort_order, is_goalkeeper')
      .eq('match_id', id)
      .order('sort_order', { ascending: true });
    if (lineupData) {
      setLineups(lineupData);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'match_lineups', filter: `match_id=eq.${id}` }, () => fetchMatchData())
      .subscribe();

    return () => {
      supabase.removeChannel(matchChannel);
    };
  }, [id]);

  // Partilhar o jogo como imagem: o cartaz só é desenhado (fora do ecrã) enquanto se partilha;
  // espera-se que os dois emblemas carreguem antes de capturar, senão saíam em branco.
  const shareCardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const badgesReady = useRef(0);

  const startShare = async () => {
    if (sharing) return;
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert('Partilha indisponível', 'Este aparelho não permite partilhar imagens.');
      return;
    }
    Haptics.selectionAsync();
    track('share.start', { match_id: id, status: match?.status });
    badgesReady.current = 0;
    setSharing(true);
  };

  const captureAndShare = async () => {
    try {
      // Pequena folga para o fundo e o texto assentarem antes da captura.
      await new Promise((r) => setTimeout(r, 250));
      const uri = await captureRef(shareCardRef, { format: 'png', quality: 1, width: 1080, height: 1350, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Partilhar jogo' });
      track('share.done', { match_id: id });
    } catch (err) {
      trackError('share', err, { match_id: id });
      Alert.alert('Erro', 'Não foi possível criar a imagem para partilhar.');
    } finally {
      setSharing(false);
    }
  };

  const onBadgeSettled = () => {
    badgesReady.current += 1;
    if (badgesReady.current === 2) captureAndShare();
  };

  // Rede de segurança: se um emblema nunca responder, captura-se na mesma ao fim de 5 s.
  useEffect(() => {
    if (!sharing) return;
    const t = setTimeout(() => {
      if (badgesReady.current < 2) {
        badgesReady.current = 2;
        captureAndShare();
      }
    }, 5000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharing]);

  // Quem pode o quê (a base de dados é que garante; isto decide o que mostrar).
  const isDelegate = !isAdmin && Boolean(match && (canModerateClub(match.homeClub.id) || canModerateClub(match.awayClub.id)));
  const role = { isAdmin, isDelegate };
  const panelAllowed = Boolean(match && canUsePanel(match, role, now));
  const resultAllowed = Boolean(match && canEditResult(match, role, now));

  // Abrir um modal a partir do painel: fecha-se o painel primeiro e abre-se o outro logo a seguir
  // (dois modais em simultâneo falham no Android).
  const openFromPanel = (open: (v: boolean) => void) => {
    setIsDelegadoModalVisible(false);
    setTimeout(() => open(true), 350);
  };

  if (loading || !match) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#1a1b1e' : '#eef0f2' }]}>
        <View style={styles.content}>
          <View style={[styles.scoreCard, { backgroundColor: isDark ? '#202226' : '#ffffff', alignItems: 'center' }]}>
            <Skeleton width="60%" height={12} />
            <Skeleton width="40%" height={11} style={{ marginTop: 10, marginBottom: 22 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Skeleton width={48} height={48} radius={24} />
              <Skeleton width={96} height={44} radius={10} />
              <Skeleton width={48} height={48} radius={24} />
            </View>
          </View>
          <Skeleton height={48} radius={14} style={{ marginBottom: 16 }} />
          <Skeleton height={140} radius={16} />
        </View>
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
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={startShare}
            disabled={sharing}
            accessibilityLabel="Partilhar jogo"
            hitSlop={10}
          >
            {sharing ? (
              <ActivityIndicator size="small" color="#2f6b4a" />
            ) : (
              <Ionicons name="share-social-outline" size={22} color={isDark ? '#a1a1aa' : '#52525b'} />
            )}
          </TouchableOpacity>
          <Text style={[styles.competitionText, { color: isDark ? '#a1a1aa' : '#71717a' }]}>
            {match.competition} • {match.round}
          </Text>
          <Text style={[styles.dateText, { color: isDark ? '#a1a1aa' : '#52525b' }]}>
            {formatMatchDateFull(match.matchDate)}
          </Text>

          <View style={styles.scoreboard}>
            <View style={styles.teamColumn}>
              <FlyInFromOrigin origin={transitionOrigin?.homeBadge}>
                <ClubBadgeLink club={match.homeClub} size={48} />
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
                <ScoreDisplay
                  homeScore={match.homeScore}
                  awayScore={match.awayScore}
                  size="large"
                  status={match.status}
                  minute={currentMinute(match, now)}
                />
              </FlyInFromOrigin>
              {match.status === 'finished' && (
                <Text style={[styles.statusLabel, { marginTop: 8 }]}>Terminado</Text>
              )}
            </View>

            <View style={styles.teamColumn}>
              <FlyInFromOrigin origin={transitionOrigin?.awayBadge}>
                <ClubBadgeLink club={match.awayClub} size={48} />
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

        {/* Ponto de entrada de quem gere o jogo. Onze inicial e registar/corrigir resultado
            estão dentro do painel. O colaborador perde o acesso 1 hora depois do fim; o admin nunca. */}
        {panelAllowed ? (
          <TouchableOpacity
            style={styles.delegadoBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsDelegadoModalVisible(true);
            }}
          >
            <Ionicons name="create-outline" size={18} color="#ffffff" />
            <Text style={styles.delegadoBtnText}>Painel do Colaborador</Text>
          </TouchableOpacity>
        ) : !session ? (
          <TouchableOpacity
            style={styles.delegadoLoginBtn}
            onPress={() => router.push('/delegado-login')}
          >
            <Ionicons name="lock-closed-outline" size={16} color="#71717a" />
            <Text style={styles.delegadoLoginBtnText}>Sou colaborador neste jogo — iniciar sessão</Text>
          </TouchableOpacity>
        ) : null}

        {/* Separadores do jogo */}
        <SegmentedTabs<'summary' | 'lineups' | 'table' | 'venue'>
          tabs={MATCH_TABS}
          value={tab}
          onChange={(id) => {
            track('match.tab', { match_id: match.id, tab: id });
            setTab(id);
          }}
        />

        {tab === 'summary' && (
          <>
        {/* Acontecimentos em tempo real: casa à esquerda, visitante à direita */}
        <View style={[styles.tickerCard, { backgroundColor: isDark ? '#202226' : '#ffffff' }]}>
          {events.length === 0 ? (
            <EmptyState
              compact
              icon="football-outline"
              title="Sem acontecimentos"
              subtitle={
                match.status === 'scheduled'
                  ? 'O jogo ainda não começou. Os golos e os cartões aparecem aqui em direto.'
                  : match.status === 'finished'
                    ? 'Não foram registados golos nem cartões neste jogo.'
                    : 'Ainda não há golos nem cartões neste jogo.'
              }
            />
          ) : (
            events.map((evt) => {
              // Um autogolo conta para a equipa adversária, por isso aparece do lado
              // de quem fica com o golo (coerente com o marcador).
              const isHomeClub = evt.club_id === match.homeClub.id;
              const side: 'home' | 'away' =
                evt.event_type === 'OWN_GOAL' ? (isHomeClub ? 'away' : 'home') : isHomeClub ? 'home' : 'away';

              const icon =
                evt.event_type === 'GOAL' || evt.event_type === 'OWN_GOAL'
                  ? '⚽'
                  : evt.event_type === 'YELLOW_CARD'
                    ? '🟨'
                    : '🟥';
              const fallbackLabel =
                evt.event_type === 'GOAL'
                  ? 'Golo'
                  : evt.event_type === 'OWN_GOAL'
                    ? 'Autogolo'
                    : evt.event_type === 'YELLOW_CARD'
                      ? 'Amarelo'
                      : 'Vermelho';
              const label =
                (evt.player_name || fallbackLabel) +
                (evt.event_type === 'OWN_GOAL' && evt.player_name ? ' (a.g.)' : '') +
                (evt.is_penalty ? ' (pen.)' : '');
              const textColor = isDark ? '#eef0f2' : '#1a1b1e';

              return (
                <View key={evt.id} style={styles.eventRow}>
                  <View style={styles.eventSide}>
                    {side === 'home' && (
                      <Text style={[styles.eventText, { color: textColor }]} numberOfLines={2}>
                        {icon} {label}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.eventMinute}>{evt.minute}'</Text>
                  <View style={styles.eventSide}>
                    {side === 'away' && (
                      <Text style={[styles.eventText, { color: textColor, textAlign: 'right' }]} numberOfLines={2}>
                        {label} {icon}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

          </>
        )}

        {tab === 'lineups' &&
          (lineups.length > 0 ? (
            <LineupCard match={match} lineups={lineups} />
          ) : (
            <View style={[styles.tickerCard, { backgroundColor: isDark ? '#202226' : '#ffffff' }]}>
              <EmptyState
                compact
                icon="people-outline"
                title="Onze inicial por anunciar"
                subtitle="Os colaboradores dos clubes podem adicioná-lo antes do jogo."
              />
            </View>
          ))}

        {tab === 'table' && <MatchStandingsTab match={match} />}

        {tab === 'venue' && (
          <>
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
          </>
        )}
      </ScrollView>

      {/* Cartaz para partilhar: desenhado fora do ecrã só enquanto se cria a imagem */}
      {sharing && (
        <View pointerEvents="none" style={{ position: 'absolute', left: -2000, top: 0 }}>
          <MatchShareCard
            ref={shareCardRef}
            match={match}
            minute={currentMinute(match, now)}
            onBadgeSettled={onBadgeSettled}
          />
        </View>
      )}

      {/* Modal de Gestão */}
      {panelAllowed && (
        <>
          <DelegadoPanelModal
            visible={isDelegadoModalVisible}
            match={match}
            events={events}
            onChanged={fetchMatchData}
            onClose={() => setIsDelegadoModalVisible(false)}
            onOpenLineup={() => openFromPanel(setIsLineupModalVisible)}
            resultLabel={resultAllowed ? (match.status === 'finished' ? 'Corrigir resultado' : 'Registar resultado') : null}
            onOpenResult={() => openFromPanel(setIsResultModalVisible)}
          />

          <LineupEditorModal
            visible={isLineupModalVisible}
            match={match}
            lineups={lineups}
            onClose={() => setIsLineupModalVisible(false)}
            onSaved={fetchMatchData}
          />

          {resultAllowed && (
            <RegisterResultModal
              visible={isResultModalVisible}
              match={match}
              existingEvents={events}
              onClose={() => setIsResultModalVisible(false)}
              onSaved={fetchMatchData}
              onOpenLineup={() => {
                setIsResultModalVisible(false);
                setTimeout(() => setIsLineupModalVisible(true), 350);
              }}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shareBtn: { position: 'absolute', top: 12, right: 12, zIndex: 5 },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  scoreCard: {
  padding: 18,
  borderRadius: 16,
  marginBottom: 16,
  borderWidth: 1,
  borderColor: 'rgba(255, 255, 255, 0.05)',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.5,
  shadowRadius: 6,
  elevation: 4,
},
  competitionText: { fontSize: 13, textAlign: 'center', marginBottom: 4 },
  dateText: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
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
  tickerCard: { padding: 16, borderRadius: 16, marginBottom: 16 },
  eventRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  eventSide: { flex: 1 },
  eventMinute: { width: 44, textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#71717a' },
  eventText: { fontSize: 14, fontWeight: '500' },
});