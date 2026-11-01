import { Alert, Platform } from 'react-native';

export function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    globalThis.alert?.(`${title}\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
