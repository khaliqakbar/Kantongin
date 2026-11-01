import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export type HapticKind = 'tap' | 'success' | 'warning';

let enabled = true;

/** Called once the saved preference is known, and whenever the user toggles it. */
export function configureHaptics(on: boolean) {
  enabled = on;
}

/** A short vibration: `tap` for buttons, `success` after saving money, `warning` after deleting. */
export function haptic(kind: HapticKind) {
  if (!enabled || Platform.OS === 'web') return;
  // Android's haptics engine feels crisper than the Vibrator-based simulation and needs no permission.
  const feedback = Platform.OS === 'android'
    ? Haptics.performAndroidHapticsAsync(kind === 'tap' ? Haptics.AndroidHaptics.Virtual_Key : kind === 'success' ? Haptics.AndroidHaptics.Confirm : Haptics.AndroidHaptics.Reject)
    : kind === 'tap' ? Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      : Haptics.notificationAsync(kind === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
  feedback.catch((error: unknown) => { if (__DEV__) console.warn('[Kantongin] Haptic feedback failed', kind, error); });
}
