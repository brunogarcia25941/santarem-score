# Santarém Score — Contexto do Projeto

> Este ficheiro existe para que qualquer sessão do Claude Code que abra esta
> pasta arranque já a par de tudo — stack, decisões tomadas, porquês, bugs já
> resolvidos e o que falta. Foi escrito a partir de uma conversa longa (Cowork)
> onde o projeto foi analisado, ligado ao Supabase e sujeito a uma reformulação
> visual e de UX. Fala-se **português de Portugal** neste projeto — o
> utilizador (Bruno) prefere respostas razoavelmente concisas e comunica-se
> sempre em PT-PT.

## O que é

App em React Native / Expo (iOS + Android) para acompanhar as divisões
distritais de futebol da Associação de Futebol de Santarém (AF Santarém):
classificações, jogos ao vivo/agendados/terminados, favoritos por clube, e um
"Painel de Delegado" para representantes de clubes registarem golos/cartões
em tempo real.

**IMPORTANTE:** o projeto **não tem, nem teve, qualquer parceria oficial**
com a Associação de Futebol de Santarém. É um projeto pessoal do Bruno. Não
apresentar a app como oficial nem sugerir isso em comunicação, textos da UI,
etc.

## Estado atual (muito resumido)

- ✅ Ligado a um Supabase real (projeto `santarem-score`, ver secção Supabase)
  — já não há dados mock/hardcoded.
- ✅ 42 clubes reais + emblemas (badges) já estão no Supabase Storage/tabela.
- ✅ Autenticação de delegados (login por email/password, sem signup público)
  com RLS a proteger `matches`/`match_events`.
- ✅ Fila offline de eventos (AsyncStorage) com sincronização automática.
- ✅ Identidade visual própria (verde floresta + âmbar, nada de "verde
  elétrico" genérico de template) — ver secção Tema.
- ✅ Marcador estilo LED 7-segmentos com efeito neumórfico.
- ✅ Transição "FLIP" do placar/emblemas entre a lista de jogos e a página do
  jogo (ver secção "Transições e animações" — é a parte mais delicada do
  código, ler antes de mexer).
- ✅ Gesto de arrastar (swipe) para percorrer circularmente competições/
  divisões no Início e em Competições.
- ✅ 16 jogos de teste inseridos com resultados reais da 1.ª Divisão
  (jornadas 3 e 4) para ter dados para trabalhar sem depender do calendário
  real (que o Bruno já tem, mas ainda não é usado).
- ⚠️ Vários avisos de segurança do Supabase por resolver (não urgentes, ver
  secção própria).
- ⏳ Nunca foi corrida uma build de produção (APK/dev build) — só testado
  via Expo Go. Há suspeita (não confirmada) de que alguns bugs de UX (ex.
  frame drops) possam ser só do Expo Go e não acontecerem numa build real.

## Stack técnica

- **Expo SDK 57** (`expo@^57.0.0`), **React Native 0.86.3**, **React 19.2.3**
- **expo-router ~57.0.20** — routing baseado em ficheiros, usa
  `@react-navigation/native-stack` por baixo (via
  `expo-router/build/react-navigation/...`)
- **Supabase** (`@supabase/supabase-js`) — Postgres + Auth + Realtime +
  Storage
- **react-native-reanimated 4.5.1** + **react-native-worklets 0.10.1** —
  configurados automaticamente pelo `babel-preset-expo`, **não há
  `babel.config.js` customizado no projeto** (confirmado a ler
  `node_modules/babel-preset-expo/build/configs/expo.js`)
- **react-native-gesture-handler ~2.32.0** — **atenção à versão**: o Expo Go
  da SDK 57 só tem o módulo nativo da série 2.x embutido. Se aparecer o erro
  `installUIRuntimeBindings ... undefined is not a function` ou
  `setGestureHandlerConfig ... undefined is not a function`, é sinal de que
  alguma dependência puxou a v3.x por baixo — corrigir com
  `npx expo install react-native-gesture-handler` (não fazer upgrade manual
  para v3 enquanto se testar em Expo Go nesta SDK).
- **react-native-svg** — usado para o marcador LED e as texturas de fundo
- **expo-image** — cache/fallback dos emblemas dos clubes
- **expo-haptics** — feedback tátil calibrado (selectionAsync nos
  separadores/filtros, impactAsync Light na navegação, notificationAsync
  Success no registo de golo)
- **@react-native-async-storage/async-storage** — fila offline de eventos e
  preferências locais (favoritos, onboarding concluído)
- **TypeScript** — `npx tsc --noEmit` é o método principal de validação (não
  há testes automatizados no projeto). Há **um erro pré-existente e
  irrelevante** em `components/ExternalLink.tsx` (ficheiro de template do
  Expo, não usado em lado nenhum) — é normal continuar a aparecer, não
  perder tempo com ele.

## Como correr

```bash
npm install
npx expo start
```

Testado até agora só via **Expo Go** num telemóvel real, num Mac/PC Windows
com o projeto numa pasta local. Não há EAS/dev build configurado.

Ambiente `.env` já preenchido com `EXPO_PUBLIC_SUPABASE_URL` e
`EXPO_PUBLIC_SUPABASE_ANON_KEY` reais — não commitar chaves novas sem
confirmar com o Bruno.

## Estrutura de pastas

```
app/
  (tabs)/            — 5 separadores: Início, Competições, Favoritos, Clubes, Perfil
    _layout.tsx      — configuração do Tabs (cores, ícones, sceneStyle)
    index.tsx        — Início: carrossel de favoritos + lista "Jogos do Distrito"
    competitions.tsx — tabela de classificação por divisão
    favorites.tsx    — clubes favoritos + jogos desses clubes
    clubs.tsx        — lista de todos os clubes
    profile.tsx       — sessão/role do utilizador autenticado
  (onboarding)/
    _layout.tsx      — stack próprio (sem header) para a seleção de clubes
    select-clubs.tsx — ecrã de primeira utilização, escolher clubes favoritos
  match/[id].tsx     — página de detalhe de um jogo
  club/[id].tsx      — ficha de um clube
  delegado-login.tsx — login modal para delegados de clube
  _layout.tsx        — root layout: Stack principal, providers, watchers globais
src/
  components/        — componentes reutilizáveis (ver secção própria)
  constants/theme.ts — paleta de cores da identidade visual
  context/           — AuthContext, FavoritesContext
  hooks/             — useClubs, useLiveMatches, useStandings, useSwipeableTabs
  services/          — supabase client, clubs.ts (mapClub), matchActions.ts, notifications.ts
  types/index.ts     — tipos Club e Match
  utils/             — dateFormat.ts, matchTransitionOrigin.ts
assets/images/textures/ — grass-background.jpg e floodlights.jpg (fotos reais
                           fornecidas pelo Bruno, usadas como texturas de fundo)
```

## Supabase

- Projeto: `santarem-score`, id **`egqxbstoyxsphmkvlptc`**, org
  `ygsbzdasgxmnfldkrzae`, região `eu-central-1`.
- Tabelas (todas com RLS **ativo**): `profiles`, `clubs` (42 linhas),
  `matches` (16 linhas, dados de teste), `match_events` (5 linhas),
  `push_tokens` (0 linhas, ainda não usada — notificações push por
  implementar).
- View `standings` — calcula classificação a partir de `matches` (pontos,
  vitórias, empates, derrotas, golos marcados/sofridos, diferença).
- `profiles.role` é um enum (`user` | `club_moderator` | `admin`).
  `club_moderator` tem `moderated_club_id` a apontar para o clube que pode
  gerir. A conta `brunoferreiragarcia2005@gmail.com` está promovida a
  **admin**.
- Políticas RLS relevantes:
  - `matches`: SELECT público (`Jogos Leitura Pública`); UPDATE só para
    `admin` ou para o `club_moderator` do clube em causa (`Delegados podem
    atualizar os seus jogos`).
  - `match_events`: SELECT público (`Eventos Leitura Pública`); INSERT só
    para `authenticated` (`Delegados podem registar eventos dos seus
    jogos`).
  - Antes desta ligação ao Supabase, RLS estava **desativado** em `matches`/
    `match_events`/`push_tokens` — foi uma falha de segurança real que foi
    corrigida (ver Histórico).
- Triggers/funções: `update_match_score_on_event` (recalcula `home_score`/
  `away_score` quando se insere um `match_event` do tipo GOAL/OWN_GOAL —
  usado nos dados de teste), `notify_on_goal_event`, `handle_new_user`.

### Avisos de segurança pendentes (não urgentes, mas por resolver)

Via `mcp__Supabase__get_advisors` (tipo `security`):

1. **ERROR** — view `public.standings` definida com `SECURITY DEFINER`
   (deveria normalmente ser `SECURITY INVOKER` ou equivalente, para respeitar
   RLS de quem consulta).
2. **WARN** — 3 funções com `search_path` mutável:
   `handle_new_user`, `update_match_score_on_event`, `notify_on_goal_event`.
3. **WARN** — 4 funções `SECURITY DEFINER` executáveis por `anon`/
   `authenticated` sem restrição: `handle_new_user`, `notify_on_goal_event`,
   `rls_auto_enable`, `update_match_score_on_event`.
4. **WARN** — proteção contra passwords comprometidas (HaveIBeenPwned)
   desativada no Auth.
5. **INFO** — `push_tokens` tem RLS ativo mas nenhuma política (ninguém
   consegue ler/escrever lá enquanto isso não for corrigido — não é grave
   porque a tabela ainda não está em uso).

Nenhum destes foi pedido para resolver ainda — ficam aqui documentados para
quando for oportuno.

## Sistema de tema / identidade visual

Ficheiro: `src/constants/theme.ts`. Motivação: o Bruno pediu explicitamente
para fugir ao "verde elétrico genérico de app corporativa" e ao preto/branco
puro típico de templates de IA. A paleta atual:

- **Verde floresta** (`brand.forest #2f6b4a`, `forestDeep #1f4d36`) —
  identidade principal, não neon.
- **Âmbar/laranja queimado** (`brand.amber #f59e0b`, `amberDeep #d97706`) —
  inspirado em marcadores de estádio vintage, usado nos dígitos LED e em
  destaques.
- **Vermelho** (`brand.red #dc2626`) — "AO VIVO", cartões vermelhos.
- **Aço escovado / grafite** (`brand.steel`, `steelDark`) — molduras,
  separadores.
- **Dark mode**: grafite asfalto orgânico (`#1a1b1e` base, `#202226`
  superfície) — propositadamente **não** preto puro.
- **Light mode**: cimento/pedra clara (`#eef0f2` base) — propositadamente
  **não** branco genérico.

Estas cores de fundo (`#1a1b1e` / `#eef0f2`) também têm de estar sincronizadas
em **três sítios diferentes** do React Navigation, ou volta o "flash branco"
(ver Histórico — foi uma dor de cabeça grande nesta conversa):
1. `app/_layout.tsx` — `screenOptions.contentStyle` do Stack raiz +
   `headerStyle`/`contentStyle` de cada `Stack.Screen` com `headerShown:true`.
2. `app/(tabs)/_layout.tsx` — `screenOptions.sceneStyle` do `<Tabs>` (é
   `sceneStyle`, **não** `sceneContainerStyle`, nesta versão de
   `@react-navigation/bottom-tabs` vendorizada pelo expo-router).
3. `app/(onboarding)/_layout.tsx` — `screenOptions.contentStyle` do Stack
   próprio da seleção de clubes.

Componentes visuais de marca:
- `src/components/ScoreboardPlate.tsx` — o "placar" em LED 7-segmentos, com
  moldura neumórfica (parafusos nos cantos, reflexo de acrílico, sombra de
  cavidade). Tem duas variantes: `size="small"` (usado no `MatchCard`,
  digitSize 22) e `size="large"` (usado em `match/[id].tsx`, digitSize 30 —
  **já foi reduzido duas vezes** a pedido do Bruno, começou em 52, não
  aumentar sem pedido explícito).
- `src/components/SegmentDisplay.tsx` — dígitos individuais 7-segmentos em
  SVG, com "fantasmas" dos segmentos não acesos visíveis a baixa opacidade.
- `src/components/StadiumTexture.tsx` — camada de fundo com fotografias reais
  fornecidas pelo Bruno (`assets/images/textures/grass-background.jpg` e
  `floodlights.jpg`), opacidade baixa (8-12%) + brilho de holofote em SVG
  por cima. Variante `grass` no Início, `floodlights` na página do jogo.
- `src/components/ClubBadge.tsx` — emblema do clube com fallback para
  iniciais + cor primária quando não há `badgeUrl` ou a imagem falha.

## Transições e animações (ler com atenção antes de mexer)

Esta foi a parte mais discutida e mais delicada da conversa. Resumo das
decisões e porquês:

### Porque NÃO se usa `sharedTransitionTag` do reanimated

O pedido inicial do Bruno era um efeito tipo "shared element transition": ao
tocar num jogo na lista, o placar e os dois emblemas "voam" da posição onde
estavam até à posição final na página do jogo. A abordagem óbvia seria
`react-native-reanimated`'s `sharedTransitionTag`/`SharedTransition` — mas
isso **não é fiável com o native-stack do expo-router** e, mais importante,
**o Bruno recusou explicitamente qualquer solução que sacrificasse o gesto
nativo de deslizar para trás (swipe-back) no iOS** — cito: "os utilizadores
estão habituados a isso e não vale a pena estragar". Portanto:
**NUNCA introduzir `sharedTransitionTag` ou `Shared Element Transitions**
nesta navegação sem voltar a discutir isto primeiro.**

### A solução: técnica FLIP (First-Last-Invert-Play), proposta pelo próprio Bruno

Em vez de shared transitions:
1. No `MatchCard` (`src/components/MatchCard.tsx`), ao tocar num jogo,
   medem-se as posições absolutas no ecrã do placar e dos dois emblemas via
   `View.measureInWindow()` (precisa de `collapsable={false}` nas Views
   medidas, especialmente no Android).
2. Essas posições (+ o próprio objeto `Match`, para arranque instantâneo —
   ver abaixo) são guardadas num singleton simples em
   `src/utils/matchTransitionOrigin.ts` (`setMatchTransitionOrigin` /
   `consumeMatchTransitionOrigin` — consumido uma única vez, à entrada do
   ecrã de destino).
3. Em `app/match/[id].tsx`, o placar grande e os dois emblemas são embrulhados
   em `src/components/FlyInFromOrigin.tsx`: este componente mede a sua
   própria posição final, calcula o delta em relação à origem guardada,
   coloca-se instantaneamente nessa origem (invisível, opacity 0), e anima
   com `withSpring` até à posição/opacidade finais.

Isto dá a mesma sensação de "continuidade" sem tocar na navegação nativa —
o gesto de voltar atrás continua 100% nativo.

### Porque a página do jogo arranca já com dados (sem spinner de página inteira)

Descoberta importante: o **spinner de carregamento a bloquear a página toda**
(enquanto se ia buscar os dados do jogo outra vez ao Supabase) estava a
**atrasar e a desfazer** o efeito da animação FLIP — a animação só começava
depois do spinner desaparecer, dessincronizada do toque do utilizador. Fix:
o `MatchTransitionOrigin` também carrega uma cópia do objeto `Match` inteiro
(`initialMatch`), e `match/[id].tsx` usa-o como estado inicial (`useState`)
em vez de `null` — a página desenha-se logo com os dados que já existiam na
lista, e o `fetchMatchData()` em segundo plano só atualiza silenciosamente se
algo tiver mudado. **Este padrão (arrancar com dados já conhecidos em vez de
mostrar spinner) deve ser considerado sempre que se navegar para um ecrã de
detalhe a partir de uma lista que já tem os dados.**

### Porque a transição nativa do ecrã do jogo é `animation: 'none'`

Foi tentado `animation: 'fade'` primeiro, mas isso causava um **flash branco**
visível ao entrar na página (o cross-dissolve nativo do `react-native-
screens` mostrava branco por trás durante a dissolução) e competia com a
animação FLIP. A solução final: `animation: 'none'` no `Stack.Screen` de
`match/[id]` em `app/_layout.tsx` — zero animação nativa, a única animação
visível é a nossa (FLIP). O gesto de deslizar para trás mantém-se
inteiramente funcional mesmo com `animation: 'none'`.

### A saga do "flash branco" — causas reais encontradas (por ordem cronológica)

Este bug teve **três causas diferentes**, uma de cada vez, e foi preciso
resolver as três:

1. `animation: 'fade'` no Stack.Screen de `match/[id]` → resolvido mudando
   para `animation: 'none'` (ver acima).
2. `sceneStyle` em falta no `<Tabs>` (`app/(tabs)/_layout.tsx`) — o
   contentor de cada separador tinha fundo branco por omissão do
   `react-native-screens`, visível por um instante ao voltar atrás de
   qualquer ecrã que reentra no Tabs (jogo, seleção de clubes, etc.).
3. `contentStyle` em falta no Stack do `(onboarding)` (usado pela seleção de
   clubes) — mesmo problema, stack diferente.

**Lição para o futuro**: sempre que se adicionar um novo Stack ou Tab
navigator neste projeto, definir logo `contentStyle`/`sceneStyle` a
acompanhar o tema (`#1a1b1e` dark / `#eef0f2` light), para não reintroduzir
este bug num sítio novo.

## Gesto de arrastar entre divisões/competições (swipe)

`src/hooks/useSwipeableTabs.ts` — hook reutilizável usado em:
- `app/(tabs)/index.tsx` — arrastar sobre a lista "Jogos do Distrito" percorre
  `COMPETITIONS_FILTER` de forma circular.
- `app/(tabs)/competitions.tsx` — arrastar sobre a tabela de classificação
  percorre `DIVISIONS` de forma circular.

Decisões de design (a pedido explícito do Bruno, depois de uma primeira
versão considerada pouco fluida):
- Segue o dedo quase 1:1 (fator de resistência 0.7), não uma "elástica"
  pesada.
- **Troca o conteúdo assim que uma pequena distância é ultrapassada
  (`TRIGGER_DISTANCE = 18`), ainda a meio do gesto** — não espera pelo fim
  do arrastar (`onEnd`). Isto foi um pedido explícito: "ao começar o swiping
  já devia aparecer os jogos da divisão seguinte, e não só quando acabar".
- Um pequeno esbatimento de opacidade (`withSequence`) disfarça a troca
  instantânea dos dados por baixo.
- Usa `activeOffsetX`/`failOffsetY` do `Gesture.Pan()` para não interferir
  com o scroll vertical do `ScrollView` à volta.
- Em `competitions.tsx`, as classificações **das 3 divisões são todas
  pré-carregadas de uma vez** (`fetchAllStandings`, `Promise.all`) para trocar
  de divisão a meio do gesto ser instantâneo, sem esperar por um novo pedido
  ao Supabase.

**Armadilha já apanhada**: `react-native-gesture-handler` tem de ficar na
**v2.32.x**, não v3.x, porque o Expo Go da SDK 57 só embute o módulo nativo
da série 2. Uma dependência transitiva já puxou a v3 uma vez por baixo e
partiu tudo com `installUIRuntimeBindings is not a function` — se isto
voltar a acontecer, correr `npx expo install react-native-gesture-handler`
(nunca fazer upgrade manual para v3 sem testar bem em Expo Go primeiro, ou
sem migrar para uma dev build).

## Convenções de código

- Comentários no código em **português**, explicando o "porquê", não só o
  "o quê" (segue o estilo já usado em `matchTransitionOrigin.ts`,
  `FlyInFromOrigin.tsx`, `useSwipeableTabs.ts`).
- Cores em hexadecimal direto espalhadas nalguns componentes mais antigos
  (`#2f6b4a`, `#1a1b1e`, etc.) — idealmente migrar tudo para
  `src/constants/theme.ts`, mas isso é trabalho ainda por fazer, não uma
  convenção a seguir para código novo (código novo deve importar de
  `theme.ts` quando possível).
- `mapClub()` em `src/services/clubs.ts` é o único sítio que deve converter
  snake_case (Supabase) → camelCase (`Club` type) — não duplicar essa lógica.
- Validação: sempre correr `npx tsc --noEmit` depois de alterações
  (ignorar o erro pré-existente do `ExternalLink.tsx`). Não há testes
  automatizados nem CI configurado.

## Limitações conhecidas / decisões em aberto

- **Nunca foi feita uma build real (EAS/dev client)** — tudo testado via
  Expo Go. Alguns problemas de performance podem ser específicos do Expo Go
  (o próprio Bruno levantou esta hipótese) e não se sabe ainda se persistem
  numa build de produção.
- Calendário real de jogos: o Bruno já o tem, mas **ainda não está integrado**
  — os 16 jogos atuais são dados de teste (resultados reais da 1.ª Divisão,
  jornadas 3-4, inseridos manualmente).
- Notificações push: tabela `push_tokens` existe mas está vazia e sem
  políticas RLS — funcionalidade não implementada.
- Não há admin UI para gerir contas de delegados/moderadores — feito por SQL
  direto até agora (só uma conta promovida a admin: a do Bruno).
- Avisos de segurança do Supabase por resolver (ver secção própria) — não
  urgentes mas relevantes antes de um lançamento público.

## Sobre esta conversa (Cowork) e a mudança para Claude Code

Este ficheiro foi criado precisamente porque o Bruno vai passar a trabalhar
com o Claude Code (CLI, a correr localmente na máquina dele) em vez desta
sessão Cowork, à procura de mais rapidez (sem a "ponte" para o dispositivo)
e para poder fazer `git push` diretamente (nesta sessão Cowork isso estava
bloqueado pelo proxy do sandbox — o Bruno teve sempre de fazer push
manualmente). O histórico de commits em `git log` já tem mensagens bastante
detalhadas sobre o raciocínio de cada mudança — vale a pena consultá-lo para
mais contexto além deste ficheiro.

Estilo de trabalho que resultou bem nesta conversa e que vale a pena manter:
- Explicar sempre o "porquê" de um bug antes de o corrigir, não só aplicar
  a correção.
- Validar sempre com `npx tsc --noEmit` antes de dar uma alteração como
  terminada.
- Fazer commits frequentes e descritivos (em português, a explicar o
  raciocínio), um por cada conjunto coerente de alterações.
- O Bruno testa sempre em dispositivo real via Expo Go e reporta o que vê —
  espera-se esse ciclo de "muda → testa → reporta" continuar.
