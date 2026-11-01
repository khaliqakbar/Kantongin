/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://unistyl.es/), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    statusBarStyle: 'dark-content',
    text: '#1F302A',
    textSecondary: '#7A8981',
    background: '#F7F5EE',
    surface: '#FFFFFF',
    backgroundElement: '#FFFFFF',
    surfaceRaised: '#FFFFFF',
    backgroundSelected: '#DDE9DE',
    border: '#E6EBE4',
    forest: '#1F6B45',
    forestDeep: '#1B5E3B',
    onForest: '#FFFFFF',
    onForestMuted: '#CFE6D6',
    sage: '#DDE9DE',
    sageStrong: '#2E8B57',
    muted: '#7A8981',
    line: '#EEF1EC',
    positive: '#2E9B5F',
    negative: '#E2574C',
    accent: '#F4C542',
    softYellow: '#FBF1D3',
    softGreen: '#E3F1E6',
    softOrange: '#F9E9D9',
    softLavender: '#E8E5F4',
    softBlue: '#E0EBEF',
    shadow: '#243D31',
  },
  dark: {
    statusBarStyle: 'light-content',
    text: '#F1F4F0',
    textSecondary: '#B2BEB6',
    background: '#121A16',
    surface: '#1B2822',
    backgroundElement: '#1B2822',
    surfaceRaised: '#223129',
    backgroundSelected: '#2B4034',
    border: '#2E4036',
    forest: '#8FD3A8',
    forestDeep: '#1E4D36',
    onForest: '#F7FAF7',
    onForestMuted: '#C2DCCB',
    sage: '#2B4034',
    sageStrong: '#8FD3A8',
    muted: '#AAB7AF',
    line: '#2A3A31',
    positive: '#7BD39A',
    negative: '#F08A7E',
    accent: '#F4C542',
    softYellow: '#3D3522',
    softGreen: '#263C2F',
    softOrange: '#46362B',
    softLavender: '#363245',
    softBlue: '#293B43',
    shadow: '#000000',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type AppTheme = (typeof Colors)[keyof typeof Colors];

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 560;
