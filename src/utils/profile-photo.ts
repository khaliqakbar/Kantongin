import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { File, Paths } from 'expo-file-system';

/**
 * Lets the user pick and square-crop a photo, then copies it into the app's document directory
 * so it survives the original being deleted from the gallery. Returns null when cancelled.
 */
export async function pickProfilePhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
  if (result.canceled || !result.assets?.length) return null;
  const picked = result.assets[0].uri;
  // Web returns a data URI that can be stored as-is; there is no app document directory there.
  if (Platform.OS === 'web') return picked;
  // A new name per pick, so cached images never show the previous photo.
  const destination = new File(Paths.document, `profile-${Date.now()}.jpg`);
  await new File(picked).copy(destination);
  return destination.uri;
}

/** Removes a stored profile photo file; missing files and web data URIs are ignored. */
export function deleteProfilePhoto(uri: string | null) {
  if (!uri || Platform.OS === 'web') return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch (error) {
    if (__DEV__) console.warn('[Kantongin] Could not delete old profile photo', error);
  }
}
