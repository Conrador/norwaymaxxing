import {
  AudioContext,
  AudioManager,
  type AudioBuffer,
} from 'react-native-audio-api';

/**
 * Silnik audio RO! na react-native-audio-api (Web Audio dla RN) —
 * expo-audio ma za dużą latencję do rytmicznych SFX (ro-activity.md §6).
 * Bufory dekodowane raz, każde uderzenie to świeży BufferSource.
 */

export type RoSampleName = 'drum' | 'horn' | 'roShort' | 'roRoar';

const SOURCES: Record<RoSampleName, number> = {
  drum: require('../../../assets/audio/drum.m4a'),
  horn: require('../../../assets/audio/horn.m4a'),
  roShort: require('../../../assets/audio/ro-short.mp3'),
  roRoar: require('../../../assets/audio/ro-roar.m4a'),
};

export class RoAudio {
  private context: AudioContext | null = null;
  private buffers = new Map<RoSampleName, AudioBuffer>();

  async load(): Promise<void> {
    AudioManager.setAudioSessionOptions({
      iosCategory: 'playback',
      iosMode: 'default',
      iosAllowHaptics: true,
    });
    this.context = new AudioContext();
    await Promise.all(
      (Object.keys(SOURCES) as RoSampleName[]).map(async (name) => {
        const buffer = await this.context!.decodeAudioData(SOURCES[name]);
        this.buffers.set(name, buffer);
      }),
    );
  }

  /** Odpala sample; delayMs pozwala zaplanować odpowiedź tłumu po bębnie. */
  play(name: RoSampleName, { gain = 1, delayMs = 0 }: { gain?: number; delayMs?: number } = {}) {
    const context = this.context;
    const buffer = this.buffers.get(name);
    if (!context || !buffer) return;

    const source = context.createBufferSource();
    source.buffer = buffer;
    const gainNode = context.createGain();
    gainNode.gain.value = gain;
    source.connect(gainNode);
    gainNode.connect(context.destination);
    source.start(context.currentTime + delayMs / 1000);
  }

  dispose() {
    this.context?.close();
    this.context = null;
    this.buffers.clear();
  }
}
