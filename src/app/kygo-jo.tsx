import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AppState, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/back-button';
import { LinearProgress } from '@/components/linear-progress';
import { ThemedText } from '@/components/themed-text';
import { UiButton } from '@/components/ui-button';
import { Radius, ScreenPadding, Spacing, Type } from '@/constants/theme';
import { generateDailyProtocol } from '@/features/protocol/protocol';
import { useTheme, useThemeName } from '@/hooks/use-theme';
import { dateKey } from '@/lib/dates';
import { useProfile } from '@/stores/profile';
import { useProgress } from '@/stores/progress';

const TRACK_DURATION_SECONDS = 153;
const APPLE_MUSIC_TRACK_ID = '6788515090';
const SPOTIFY_NATIVE_URL = 'spotify:album:6AQiRXJ2i48Lu7CFUrKUER';
const SPOTIFY_URL =
  'https://spotify.link/content_linking?~campaign=com.norwaymaxxing.app&$canonical_url=https%3A%2F%2Fopen.spotify.com%2Falbum%2F6AQiRXJ2i48Lu7CFUrKUER';
const SPOTIFY_OEMBED_URL = `https://open.spotify.com/oembed?url=${encodeURIComponent('https://open.spotify.com/album/6AQiRXJ2i48Lu7CFUrKUER')}`;
const APPLE_MUSIC_NATIVE_URL =
  'music://music.apple.com/ca/album/kygo-jo-feat-lyng-kygo-remix/6788515089?i=6788515090';
const APPLE_MUSIC_URL =
  'https://music.apple.com/ca/album/kygo-jo-feat-lyng-kygo-remix/6788515089?i=6788515090';
const APPLE_LOOKUP_URL = `https://itunes.apple.com/lookup?id=${APPLE_MUSIC_TRACK_ID}&entity=song&country=ca`;

type MusicService = 'spotify' | 'appleMusic';
type TrackMetadata = {
  title: string;
  subtitle: string;
  duration: string;
  artworkUrl: string | null;
  providerName: string;
  providerUrl: string;
  releaseYear?: string;
  genre?: string;
};

type SpotifyOembedResponse = {
  title?: string;
  thumbnail_url?: string;
  provider_name?: string;
  provider_url?: string;
};

type AppleLookupTrack = {
  artistName?: string;
  trackName?: string;
  artworkUrl100?: string;
  trackTimeMillis?: number;
  releaseDate?: string;
  primaryGenreName?: string;
  trackViewUrl?: string;
};

type AppleLookupResponse = {
  results?: AppleLookupTrack[];
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatDurationMs(milliseconds?: number) {
  if (!milliseconds) return null;
  return formatTime(Math.round(milliseconds / 1000));
}

function highResAppleArtwork(url?: string) {
  return url?.replace(/\/100x100bb\.jpg$/, '/600x600bb.jpg') ?? null;
}

async function fetchJson<T>(url: string) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`metadata fetch failed: ${response.status}`);
  return response.json() as Promise<T>;
}

async function fetchTrackMetadata(): Promise<TrackMetadata> {
  const [spotifyResult, appleResult] = await Promise.allSettled([
    fetchJson<SpotifyOembedResponse>(SPOTIFY_OEMBED_URL),
    fetchJson<AppleLookupResponse>(APPLE_LOOKUP_URL),
  ]);
  const spotify = spotifyResult.status === 'fulfilled' ? spotifyResult.value : null;
  const apple = appleResult.status === 'fulfilled' ? appleResult.value.results?.[0] : null;
  const artworkUrl = spotify?.thumbnail_url ?? highResAppleArtwork(apple?.artworkUrl100);
  const providerName = spotify?.thumbnail_url ? (spotify.provider_name ?? 'Spotify') : 'Apple Music';

  return {
    title: apple?.trackName ?? spotify?.title ?? 'Kygo Jo (Kygo Remix)',
    subtitle: apple?.artistName ?? 'Kygo, Flow Kingz & JMK feat. Lyng',
    duration: formatDurationMs(apple?.trackTimeMillis) ?? '2:33',
    artworkUrl,
    providerName,
    providerUrl: spotify?.thumbnail_url ? SPOTIFY_URL : (apple?.trackViewUrl ?? APPLE_MUSIC_URL),
    releaseYear: apple?.releaseDate ? new Date(apple.releaseDate).getFullYear().toString() : undefined,
    genre: apple?.primaryGenreName,
  };
}

async function openMusicUrl(urls: string[]) {
  let lastError: unknown;
  for (const url of urls) {
    try {
      await Linking.openURL(url);
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function WaveBar({ active, color, index }: { active: boolean; color: string; index: number }) {
  const reducedMotion = useReducedMotion();
  const level = useSharedValue(0.28);

  useEffect(() => {
    cancelAnimation(level);
    if (!active || reducedMotion) {
      level.set(withTiming(active ? 0.7 : 0.28, { duration: 180 }));
      return;
    }

    level.set(
      withDelay(
        index * 70,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 260 + index * 25 }),
            withTiming(0.3, { duration: 300 - index * 18 }),
          ),
          -1,
          true,
        ),
      ),
    );
    return () => cancelAnimation(level);
  }, [active, index, level, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: level.value }],
  }));

  return <Animated.View style={[styles.waveBar, { backgroundColor: color }, animatedStyle]} />;
}

function ServiceButton({
  service,
  label,
  active,
  busy,
  onPress,
}: {
  service: MusicService;
  label: string;
  active: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const themeName = useThemeName();
  const isSpotify = service === 'spotify';
  const brandColor = isSpotify ? '#1DB954' : '#FA2D48';

  return (
    <Pressable
      accessibilityRole="link"
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [
        styles.serviceButton,
        {
          backgroundColor: active ? `${brandColor}20` : theme.surface,
          borderColor: active ? `${brandColor}A8` : theme.border,
          opacity: busy ? 0.55 : pressed ? 0.78 : 1,
        },
      ]}>
      <View style={[styles.serviceIcon, { backgroundColor: brandColor }]}>
        <SymbolView name={isSpotify ? 'waveform' : 'music.note'} size={19} tintColor="#FFFFFF" />
      </View>
      <ThemedText style={[styles.serviceLabel, { color: theme.textPrimary }]}>{label}</ThemedText>
      <SymbolView
        name="arrow.up.right"
        size={15}
        tintColor={themeName === 'dark' ? '#C8D4E5' : theme.textSecondary}
      />
    </Pressable>
  );
}

export default function KygoJoScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const themeName = useThemeName();
  const params = useLocalSearchParams<{ date?: string; taskIds?: string }>();
  const sessionDate = params.date ?? dateKey();

  const profile = useProfile((s) => s.profile);
  const cold30Day = useProgress((s) => s.cold30Day);
  const completeTask = useProgress((s) => s.completeTask);
  const completeMusicSession = useProgress((s) => s.completeMusicSession);
  const musicLastCompletedDate = useProgress((s) => s.musicLastCompletedDate);
  const dayRecord = useProgress((s) => s.history[sessionDate]);

  const [service, setService] = useState<MusicService | null>(null);
  const [openedAt, setOpenedAt] = useState<number | null>(null);
  const [hasLeftApp, setHasLeftApp] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [openingService, setOpeningService] = useState(false);
  const [metadata, setMetadata] = useState<TrackMetadata | null>(null);
  const openedAtRef = useRef<number | null>(null);

  const tasks = useMemo(
    () => generateDailyProtocol(profile, cold30Day, new Date(`${sessionDate}T12:00:00`)),
    [cold30Day, profile, sessionDate],
  );
  const musicTask = tasks.find((task) => task.id === 'kygo-jo');
  const protocolTaskIds = useMemo(
    () => params.taskIds?.split(',').filter(Boolean) ?? tasks.map((task) => task.id),
    [params.taskIds, tasks],
  );
  const completedToday =
    musicLastCompletedDate === sessionDate || dayRecord?.tasksDone.includes('kygo-jo') === true;
  const remainingSeconds = Math.max(0, TRACK_DURATION_SECONDS - elapsedSeconds);
  const canComplete = hasLeftApp && remainingSeconds === 0 && !completedToday;
  const listening = openedAt !== null && remainingSeconds > 0;

  useEffect(() => {
    let mounted = true;
    fetchTrackMetadata()
      .then((nextMetadata) => {
        if (mounted) setMetadata(nextMetadata);
      })
      .catch(() => {
        if (!mounted) return;
        setMetadata({
          title: 'Kygo Jo (Kygo Remix)',
          subtitle: 'Kygo, Flow Kingz & JMK feat. Lyng',
          duration: '2:33',
          artworkUrl: null,
          providerName: 'Spotify',
          providerUrl: SPOTIFY_URL,
        });
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (!openedAtRef.current) return;
      if (nextState === 'inactive' || nextState === 'background') setHasLeftApp(true);
      if (nextState === 'active') {
        setElapsedSeconds(
          Math.min(TRACK_DURATION_SECONDS, Math.floor((Date.now() - openedAtRef.current) / 1000)),
        );
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!openedAt) return;
    const updateElapsed = () => {
      setElapsedSeconds(
        Math.min(TRACK_DURATION_SECONDS, Math.floor((Date.now() - openedAt) / 1000)),
      );
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 500);
    return () => clearInterval(interval);
  }, [openedAt]);

  const openService = async (nextService: MusicService) => {
    const urls =
      nextService === 'spotify'
        ? [SPOTIFY_NATIVE_URL, SPOTIFY_URL]
        : [APPLE_MUSIC_NATIVE_URL, APPLE_MUSIC_URL];
    setOpeningService(true);
    setService(nextService);

    if (!openedAtRef.current) {
      const now = Date.now();
      openedAtRef.current = now;
      setOpenedAt(now);
      setElapsedSeconds(0);
      setHasLeftApp(false);
    }

    try {
      await openMusicUrl(urls);
    } catch {
      openedAtRef.current = null;
      setOpenedAt(null);
      setService(null);
      Alert.alert(t('music.openErrorTitle'), t('music.openErrorMessage'));
    } finally {
      setOpeningService(false);
    }
  };

  const finish = () => {
    if (!canComplete) return;
    if (musicTask && protocolTaskIds.includes(musicTask.id)) {
      completeTask(sessionDate, musicTask, protocolTaskIds);
    }
    completeMusicSession(sessionDate);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const statusLabel = completedToday
    ? t('music.completedToday')
    : canComplete
      ? t('music.ready')
      : openedAt
        ? t('music.remaining', { time: formatTime(remainingSeconds) })
        : t('music.leaveFirst');

  return (
    <LinearGradient
      colors={themeName === 'dark' ? ['#251638', '#10182A', '#08111F'] : ['#E9DFFA', '#F4EEF8', '#F7F8FC']}
      style={styles.fill}>
      <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
      <View style={[styles.fill, { paddingTop: insets.top + Spacing.two }]}>
        <View style={styles.topBar}>
          <BackButton label={t('common.back')} onPress={() => router.back()} />
          {musicTask ? (
            <View style={[styles.xpBadge, { backgroundColor: `${theme.gold}1F` }]}>
              <ThemedText style={[styles.xpText, { color: theme.gold }]}>+{musicTask.xp} XP</ThemedText>
            </View>
          ) : null}
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]}
          showsVerticalScrollIndicator={false}>
          <View style={styles.heading}>
            <ThemedText style={[styles.kicker, { color: theme.blood }]}>{t('music.kicker').toUpperCase()}</ThemedText>
            <ThemedText style={styles.title}>{t('music.title')}</ThemedText>
            <ThemedText style={[Type.body, { color: theme.textSecondary }]}>{t('music.story')}</ThemedText>
          </View>

          <View style={[styles.playerCard, themeName === 'light' && styles.playerLight]}>
            {metadata?.artworkUrl ? (
              <Image
                source={{ uri: metadata.artworkUrl }}
                contentFit="cover"
                transition={180}
                style={styles.cover}
              />
            ) : (
              <LinearGradient
                colors={['#292047', '#5C315D', '#C8506A']}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.cover, styles.coverFallback]}>
                <SymbolView name="music.note" size={64} tintColor="#FFFFFF" />
              </LinearGradient>
            )}
            <View style={styles.trackInfo}>
              <View style={styles.trackTitleRow}>
                <View style={styles.trackCopy}>
                  <ThemedText style={styles.trackTitle}>{metadata?.title ?? t('music.taskTitle')}</ThemedText>
                  <ThemedText style={styles.trackSubtitle}>{metadata?.subtitle ?? t('music.subtitle')}</ThemedText>
                </View>
                <ThemedText style={styles.duration}>{metadata?.duration ?? t('music.duration')}</ThemedText>
              </View>

              <View style={styles.metaRow}>
                {metadata?.releaseYear ? (
                  <ThemedText style={styles.metaPill}>{metadata.releaseYear}</ThemedText>
                ) : null}
                {metadata?.genre ? <ThemedText style={styles.metaPill}>{metadata.genre}</ThemedText> : null}
                {metadata?.providerName ? (
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => Linking.openURL(metadata.providerUrl)}
                    style={({ pressed }) => [styles.providerLink, { opacity: pressed ? 0.7 : 1 }]}>
                    <ThemedText style={styles.providerText}>
                      {t('music.metadataSource', { provider: metadata.providerName })}
                    </ThemedText>
                    <SymbolView name="arrow.up.right" size={11} tintColor="#AEBBD0" />
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.waveform}>
                {[0, 1, 2, 3, 4, 5, 6].map((index) => (
                  <WaveBar
                    key={index}
                    active={listening}
                    color={canComplete ? theme.aurora : theme.blood}
                    index={index}
                  />
                ))}
              </View>

              <LinearProgress
                value={completedToday ? 1 : elapsedSeconds / TRACK_DURATION_SECONDS}
                color={completedToday || canComplete ? theme.aurora : theme.blood}
              />
              <View style={styles.statusRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: completedToday || canComplete ? theme.aurora : openedAt ? theme.blood : '#77849A' },
                  ]}
                />
                <ThemedText style={styles.statusText}>{statusLabel}</ThemedText>
              </View>
            </View>
          </View>

          <ThemedText style={[Type.body, styles.instructions]}>{t('music.instructions')}</ThemedText>

          <View style={styles.services}>
            <ServiceButton
              service="spotify"
              label={t('music.spotify')}
              active={service === 'spotify'}
              busy={openingService}
              onPress={() => openService('spotify')}
            />
            <ServiceButton
              service="appleMusic"
              label={t('music.appleMusic')}
              active={service === 'appleMusic'}
              busy={openingService}
              onPress={() => openService('appleMusic')}
            />
          </View>

          {openedAt ? (
            <View style={styles.returnHint}>
              <SymbolView name="speaker.wave.2.fill" size={17} tintColor={theme.frost} />
              <ThemedText style={[Type.caption, { color: theme.textSecondary }]}>
                {t('music.returnHint')}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.cta}>
            <UiButton
              label={completedToday ? t('music.completedToday') : t('music.done')}
              variant="prominent"
              tintColor={canComplete ? theme.aurora : theme.blood}
              disabled={!canComplete}
              onPress={finish}
            />
          </View>

          <ThemedText style={[styles.manualNote, { color: theme.textSecondary }]}>
            {t('music.manualNote')}
          </ThemedText>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topBar: {
    minHeight: 48,
    paddingHorizontal: ScreenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  xpBadge: {
    minHeight: 30,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xpText: { ...Type.caption, fontVariant: ['tabular-nums'] },
  scroll: {
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  heading: { gap: Spacing.one },
  kicker: { ...Type.caption, letterSpacing: 1.2 },
  title: { ...Type.display, maxWidth: 360 },
  playerCard: {
    borderRadius: Radius.card,
    backgroundColor: 'rgba(9, 14, 29, 0.92)',
    overflow: 'hidden',
    boxShadow: '0 18px 36px rgba(5, 10, 25, 0.24)',
  },
  playerLight: { boxShadow: '0 16px 34px rgba(31, 22, 53, 0.16)' },
  cover: { width: '100%', aspectRatio: 1 },
  coverFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackInfo: { padding: Spacing.three, gap: Spacing.three },
  trackTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  trackCopy: { flex: 1, gap: 2 },
  trackTitle: { ...Type.h1, color: '#FFFFFF' },
  trackSubtitle: { ...Type.caption, color: '#AEBBD0' },
  duration: { ...Type.caption, color: '#D6DEEB', fontVariant: ['tabular-nums'] },
  metaRow: {
    minHeight: 24,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  metaPill: {
    ...Type.caption,
    color: '#D6DEEB',
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
  },
  providerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  providerText: { ...Type.caption, color: '#AEBBD0' },
  waveform: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  waveBar: { width: 5, height: 28, borderRadius: 3 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...Type.caption, color: '#DCE4EF', flex: 1 },
  instructions: { textAlign: 'center', paddingHorizontal: Spacing.two },
  services: { gap: Spacing.two },
  serviceButton: {
    minHeight: 58,
    borderRadius: Radius.control,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  serviceIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceLabel: { ...Type.body, flex: 1, fontFamily: Type.h2.fontFamily },
  returnHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  cta: { minHeight: 52, marginTop: Spacing.one },
  manualNote: { ...Type.caption, fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
