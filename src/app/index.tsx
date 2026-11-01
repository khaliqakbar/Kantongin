import { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { Redirect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '@/hooks/use-theme';
import { BrandSplash } from '@/components/brand-splash';
import { isOnboardingCompleted } from '@/database/preferences';
import { processDueRecurring } from '@/database/planning-repository';

export default function EntryScreen() {
  const db = useSQLiteContext(); const colors = useTheme(); const [destination, setDestination] = useState<'/home' | '/onboarding' | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([
      processDueRecurring(db).catch((error: unknown) => {
        if (__DEV__) console.error('[Kantongin] Could not process due recurring transactions', error);
        return 0;
      }),
      isOnboardingCompleted(db),
    ]).then(([, completed]) => { if (active) setDestination(completed ? '/home' : '/onboarding'); }).catch((error: unknown) => {
      if (__DEV__) console.error('[Kantongin] Could not read onboarding preference', error);
      if (active) setDestination('/home');
    });
    return () => { active = false; };
  }, [db]);

  if (destination) return <Redirect href={destination} />;
  return <><StatusBar barStyle={colors.statusBarStyle} /><BrandSplash status="Menyiapkan keuanganmu…" loadingMs={2400} /></>;
}
