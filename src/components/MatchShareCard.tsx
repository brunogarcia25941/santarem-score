import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Image as RNImage } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Club, Match } from '@/types';
import { brand } from '@/constants/theme';
import { formatMatchDayLong, formatMatchTime } from '@/utils/dateFormat';

/** Tamanho lógico do cartaz (4:5, bom para stories/feed); captura-se a 3x → 1080×1350. */
export const SHARE_CARD_WIDTH = 360;
export const SHARE_CARD_HEIGHT = 450;

interface Props {
  match: Match;
  /** Minuto atual (só relevante com o jogo em direto). */
  minute?: number;
  /** Chamado quando um emblema acaba de carregar (ou não precisa de carregar), para saber quando é seguro capturar. */
  onBadgeSettled?: () => void;
}

/** "2.ª Divisão Série A" → { title: "2.ª Divisão Distrital", series: "Série A" }. */
function splitCompetition(competition: string) {
  const m = competition.match(/^(.*?)\s*(Série\s+\w+)$/i);
  if (m) return { title: m[1].replace(/\s*Distrital$/i, '') + ' Distrital', series: m[2] };
  return { title: competition, series: null as string | null };
}

const capitalize = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

function Badge({ club, onSettled }: { club: Club; onSettled?: () => void }) {
  const [failed, setFailed] = React.useState(false);
  const useImage = Boolean(club.badgeUrl) && !failed;

  // Sem emblema (ou se falhar) o fallback é síncrono, por isso conta logo como "pronto".
  React.useEffect(() => {
    if (!useImage) onSettled?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useImage]);

  return (
    <View style={useImage ? styles.badgeImageBox : [styles.badgeFallbackCircle, { backgroundColor: club.primaryColor }]}>
      {useImage ? (
        <Image
          source={{ uri: club.badgeUrl }}
          style={{ width: 104, height: 104 }}
          contentFit="contain"
          onLoad={onSettled}
          onError={() => setFailed(true)}
        />
      ) : (
        <Text style={styles.badgeFallback}>{club.initials}</Text>
      )}
    </View>
  );
}

/**
 * Cartaz do jogo para partilhar: fundo com os holofotes da app sobre um degradé azul (a cor da AF Santarém), divisão/série/jornada
 * no topo, os dois emblemas e, ao centro, a hora (agendado), o resultado + minuto (em direto) ou o
 * resultado final. Tem tamanho fixo e cores próprias (não segue o tema claro/escuro) para a imagem
 * sair sempre igual.
 */
export const MatchShareCard = React.forwardRef<View, Props>(function MatchShareCard(
  { match, minute, onBadgeSettled },
  ref
) {
  const { title, series } = splitCompetition(match.competition);
  const isLive = match.status === 'live' || match.status === 'halftime';
  const hasScore = isLive || match.status === 'finished';

  let liveLabel = 'AO VIVO';
  if (match.status === 'halftime') liveLabel = 'INTERVALO';
  else if (minute != null) liveLabel = `AO VIVO · ${minute}′`;

  return (
    <View ref={ref} collapsable={false} style={styles.card}>
      <ImageBackground
        source={require('../../assets/images/textures/floodlights.jpg')}
        style={StyleSheet.absoluteFill}
        imageStyle={{ opacity: 0.35 }}
      />
      <LinearGradient
        colors={['rgba(30,86,176,0.94)', 'rgba(18,48,108,0.96)', 'rgba(8,20,48,0.98)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Cabeçalho */}
      <View style={styles.header}>
        {/* Logótipo da AF Santarém no canto superior esquerdo */}
        <RNImage source={require('../../assets/images/af-santarem.png')} style={styles.afLogo} resizeMode="contain" />
        <Text style={styles.org}>AF SANTARÉM</Text>
        <Text style={styles.division}>{title}</Text>
        <View style={styles.subRow}>
          {series && <Text style={styles.sub}>{series}</Text>}
          {series && <Text style={styles.subDot}>•</Text>}
          <Text style={styles.sub}>{match.round}</Text>
        </View>
        <View style={styles.rule} />
      </View>

      {/* Equipas + centro */}
      <View style={styles.body}>
        <View style={styles.team}>
          <Badge club={match.homeClub} onSettled={onBadgeSettled} />
          <Text style={styles.teamName} numberOfLines={2}>{match.homeClub.shortName}</Text>
        </View>

        <View style={styles.center}>
          {hasScore ? (
            <>
              <Text style={styles.score}>
                {match.homeScore} - {match.awayScore}
              </Text>
              {isLive ? (
                <View style={styles.livePill}>
                  <Text style={styles.livePillText}>{liveLabel}</Text>
                </View>
              ) : (
                <Text style={styles.centerCaption}>RESULTADO FINAL</Text>
              )}
            </>
          ) : match.status === 'postponed' ? (
            <Text style={styles.centerCaption}>ADIADO</Text>
          ) : (
            <>
              <Text style={styles.time}>{formatMatchTime(match.matchDate)}</Text>
              <Text style={styles.vs}>VS</Text>
            </>
          )}
        </View>

        <View style={styles.team}>
          <Badge club={match.awayClub} onSettled={onBadgeSettled} />
          <Text style={styles.teamName} numberOfLines={2}>{match.awayClub.shortName}</Text>
        </View>
      </View>

      {/* Rodapé: data e estádio, em todos os estados */}
      <View style={styles.footer}>
        <Text style={styles.date}>{capitalize(formatMatchDayLong(match.matchDate))}</Text>
        <Text style={styles.stadium}>{match.homeClub.stadiumName}</Text>
        <Text style={styles.brand}>SANTARÉM SCORE</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    width: SHARE_CARD_WIDTH,
    height: SHARE_CARD_HEIGHT,
    backgroundColor: '#1a1b1e',
    overflow: 'hidden',
    justifyContent: 'space-between',
    paddingVertical: 28,
    paddingHorizontal: 18,
  },
  header: { alignItems: 'center' },
  afLogo: { position: 'absolute', left: 0, top: -4, width: 46, height: 68 },
  org: { color: brand.amber, fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  division: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginTop: 6, textAlign: 'center' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sub: { color: '#d4d4d8', fontSize: 14, fontWeight: '600' },
  subDot: { color: brand.amber, fontSize: 12 },
  rule: { width: 56, height: 3, borderRadius: 2, backgroundColor: brand.amber, marginTop: 14 },
  body: { flexDirection: 'row', alignItems: 'center' },
  team: { flex: 1, alignItems: 'center' },
  // Os emblemas têm fundo transparente: ficam soltos, sem círculo. Só o fallback (iniciais) leva círculo.
  badgeImageBox: { width: 104, height: 104, alignItems: 'center', justifyContent: 'center' },
  badgeFallbackCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  badgeFallback: { color: '#ffffff', fontSize: 30, fontWeight: '800' },
  teamName: { color: '#ffffff', fontSize: 14, fontWeight: '700', textAlign: 'center', marginTop: 10, minHeight: 36 },
  center: { width: 112, alignItems: 'center' },
  score: { color: brand.amber, fontSize: 40, fontWeight: '900', letterSpacing: 1 },
  time: { color: brand.amber, fontSize: 40, fontWeight: '900' },
  vs: { color: '#a1a1aa', fontSize: 12, fontWeight: '800', letterSpacing: 3, marginTop: 2 },
  centerCaption: { color: '#d4d4d8', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginTop: 6, textAlign: 'center' },
  livePill: { backgroundColor: brand.red, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginTop: 8 },
  livePillText: { color: '#ffffff', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  footer: { alignItems: 'center' },
  date: { color: '#ffffff', fontSize: 14, fontWeight: '700', textAlign: 'center' },
  stadium: { color: '#cbd5e1', fontSize: 12, marginTop: 3 },
  brand: { color: '#93b4e8', fontSize: 10, fontWeight: '800', letterSpacing: 3, marginTop: 14, opacity: 0.9 },
});
