import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { haptic, type HapticKind } from '@/utils/haptics';

const sources = {
  startup: require('../../assets/sounds/startup.wav'),
  coin: require('../../assets/sounds/coin.wav'),
  pocket: require('../../assets/sounds/pocket.wav'),
  celebration: require('../../assets/sounds/celebration.wav'),
  delete: require('../../assets/sounds/delete.wav'),
} as const;

export type SoundName = keyof typeof sources;

// Each money or delete sound comes with a matching vibration (its own setting), so call sites stay one line.
const hapticFor: Partial<Record<SoundName, HapticKind>> = { coin: 'success', pocket: 'success', celebration: 'success', delete: 'warning' };

// One player per effect for the app's lifetime; effects are short and replayed often.
const players: Partial<Record<SoundName, AudioPlayer>> = {};
let enabled = true;
let markReady: () => void = () => {};
// Sounds wait until the saved preference is known, so a disabled setting never plays the startup sound.
const ready = new Promise<void>((resolve) => { markReady = resolve; });

/** Called once the sound preference has been read (and whenever the user toggles it). */
export function configureSounds(on: boolean) {
  enabled = on;
  // Load every effect up front so the first tap does not wait for decoding.
  if (on) for (const name of Object.keys(sources) as SoundName[]) getPlayer(name);
  markReady();
}

function getPlayer(name: SoundName) {
  const existing = players[name];
  if (existing) return { player: existing, fresh: false };
  const player = createAudioPlayer(sources[name]);
  players[name] = player;
  return { player, fresh: true };
}

let audioModeSet = false;

export async function playSound(name: SoundName) {
  const kind = hapticFor[name];
  if (kind) haptic(kind);
  await ready;
  if (!enabled) return;
  try {
    if (!audioModeSet) {
      audioModeSet = true;
      // Mix with music instead of pausing it. playsInSilentMode must stay true: with false, Android
      // expo-audio refuses to play whenever the ringer is on vibrate or silent. The in-app toggle mutes instead.
      await setAudioModeAsync({ playsInSilentMode: true, interruptionMode: 'mixWithOthers' });
    }
    const { player, fresh } = getPlayer(name);
    // A finished player sits at its end; rewind before replaying. A new one already starts at 0.
    if (!fresh && player.currentTime > 0) await player.seekTo(0);
    player.play();
  } catch (error) {
    if (__DEV__) console.warn('[Kantongin] Could not play sound', name, error);
  }
}

/** After money moves: celebrate a newly reached savings goal, otherwise the coin sound. */
export async function playMoneySound(claimReachedGoals: () => Promise<unknown[]>) {
  try {
    const reached = await claimReachedGoals();
    await playSound(reached.length ? 'celebration' : 'coin');
  } catch (error) {
    if (__DEV__) console.warn('[Kantongin] Could not check reached goals', error);
    await playSound('coin');
  }
}
