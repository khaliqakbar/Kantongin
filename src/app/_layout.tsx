import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialSymbols_400Regular } from '@expo-google-fonts/material-symbols/400Regular';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_500Medium } from '@expo-google-fonts/nunito/500Medium';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { AppThemeProvider, useAppThemePreference } from '@/hooks/app-theme-provider';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { initializeDatabase } from '@/database/database';
import { IconFontFamily } from '@/components/app-icon';
import { AppFontFamily } from '@/components/text';
import { getHapticsEnabled, getSoundEnabled } from '@/database/preferences';
import { configureSounds } from '@/utils/sound';
import { configureHaptics } from '@/utils/haptics';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Icons are font glyphs and all text uses Nunito; keep the native splash up until both are ready.
  // One family with every weight, so `fontWeight` in styles selects the matching Nunito face.
  const [fontLoaded, fontError] = useFonts([
    { fontFamily: IconFontFamily, fontDefinitions: [{ path: MaterialSymbols_400Regular }] },
    { fontFamily: AppFontFamily, fontDefinitions: [
      { path: Nunito_400Regular, weight: 400 }, { path: Nunito_500Medium, weight: 500 }, { path: Nunito_600SemiBold, weight: 600 }, { path: Nunito_700Bold, weight: 700 },
      { path: Nunito_800ExtraBold, weight: 800 }, { path: Nunito_900Black, weight: 900 },
    ] },
  ]);
  if (!fontLoaded && !fontError) return null;
  return (
    // Gesture root for swipeable rows (react-native-gesture-handler needs it above every gesture).
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="kantongin.db" onInit={initializeDatabase}>
        <AppThemeProvider><AppNavigation /></AppThemeProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigation() {
  const { effective } = useAppThemePreference();
  const db = useSQLiteContext();
  useEffect(() => {
    getSoundEnabled(db).then(configureSounds).catch((error: unknown) => {
      if (__DEV__) console.error('[Kantongin] Could not read sound preference', error);
      configureSounds(true);
    });
    getHapticsEnabled(db).then(configureHaptics).catch((error: unknown) => {
      if (__DEV__) console.error('[Kantongin] Could not read haptics preference', error);
    });
  }, [db]);
  return <NavigationThemeProvider value={effective === 'dark' ? DarkTheme : DefaultTheme}>
    <AnimatedSplashOverlay />
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="transaction-form" options={{ presentation: 'modal' }} />
      <Stack.Screen name="transaction-detail/[id]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="wallet-form" options={{ presentation: 'modal' }} />
      <Stack.Screen name="wallet-detail/[id]" />
      <Stack.Screen name="transfer-form" options={{ presentation: 'modal' }} />
      <Stack.Screen name="reports" />
      <Stack.Screen name="budgets" />
      <Stack.Screen name="budget-form" options={{ presentation: 'modal' }} />
      <Stack.Screen name="savings-goals" />
      <Stack.Screen name="savings-goal-form" options={{ presentation: 'modal' }} />
      <Stack.Screen name="recurring" />
      <Stack.Screen name="recurring-form" options={{ presentation: 'modal' }} />
      <Stack.Screen name="insights" />
    </Stack>
  </NavigationThemeProvider>;
}
