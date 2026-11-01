import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { Colors } from '@/constants/theme';
import { getThemePreference, saveThemePreference, type ThemePreference } from '@/database/preferences';
type ThemeContextValue = { preference: ThemePreference; effective: 'light' | 'dark'; setPreference: (value: ThemePreference) => Promise<void> };
const Context = createContext<ThemeContextValue | null>(null);
export function AppThemeProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext(), systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  useEffect(() => { let active = true; getThemePreference(db).then(value => { if (active) setPreferenceState(value); }).catch(error => { if (__DEV__) console.error('[Kantongin] Theme preference load failed', error); }); return () => { active = false; }; }, [db]);
  const setPreference = useCallback(async (value: ThemePreference) => { await saveThemePreference(db, value); setPreferenceState(value); }, [db]);
  const effective = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo(() => ({ preference, effective, setPreference }), [preference, effective, setPreference]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useAppThemePreference() {
  const value = useContext(Context);
  if (!value) throw new Error('useAppThemePreference harus digunakan di dalam AppThemeProvider.');
  return value;
}
export function getThemeColors(effective: 'light' | 'dark') { return Colors[effective]; }
