import { StyleSheet, Text as NativeText, TextInput as NativeTextInput, type TextInputProps, type TextProps } from 'react-native';

/** Nunito, loaded with every weight in the root layout, so `fontWeight` picks the matching face. */
export const AppFontFamily = 'Nunito';

const base = StyleSheet.create({ font: { fontFamily: AppFontFamily } });

/** React Native `Text` with the app font as the default; a `fontFamily` in `style` still wins. */
export function Text({ style, ...props }: TextProps) {
  return <NativeText {...props} style={[base.font, style]} />;
}

export function TextInput({ style, ...props }: TextInputProps) {
  return <NativeTextInput {...props} style={[base.font, style]} />;
}
