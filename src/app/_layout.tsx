import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { useFonts } from 'expo-font';
import { MaterialSymbols_400Regular } from '@expo-google-fonts/material-symbols/400Regular';
import { AppThemeProvider, useAppThemePreference } from '@/hooks/app-theme-provider';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { initializeDatabase } from '@/database/database';
import { IconFontFamily } from '@/components/app-icon';
import { getSoundEnabled } from '@/database/preferences';
import { configureSounds } from '@/utils/sound';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Icons are font glyphs; keep the native splash up until the font is ready so none render blank.
  const [fontLoaded, fontError] = useFonts({ [IconFontFamily]: MaterialSymbols_400Regular });
  if (!fontLoaded && !fontError) return null;
  return (
    <SQLiteProvider databaseName="kantongin.db" onInit={initializeDatabase}>
      <AppThemeProvider><AppNavigation /></AppThemeProvider>
    </SQLiteProvider>
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
