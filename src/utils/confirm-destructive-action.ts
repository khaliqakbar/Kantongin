import { Alert, Platform } from 'react-native';
import { playSound } from '@/utils/sound';

export function confirmDestructiveAction(title: string, message: string, action: () => Promise<void>, onError: (error: unknown) => void, confirmLabel = 'Hapus') {
  const run = () => {
    void action().then(() => playSound('delete'), (error: unknown) => {
      onError(error);
      const detail = error instanceof Error ? error.message : 'Silakan coba kembali.';
      if (Platform.OS === 'web') globalThis.alert?.(`${title}\n${detail}`);
      else Alert.alert(`${title} gagal`, detail);
    });
  };
  if (Platform.OS === 'web') {
    if (globalThis.confirm?.(`${title}\n${message}`)) run();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Batal', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: run },
  ]);
}
