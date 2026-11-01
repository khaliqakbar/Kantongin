import type { SQLiteDatabase } from 'expo-sqlite';

export async function isOnboardingCompleted(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key = 'onboarding_completed'");
  return result?.value === '1';
}

export async function completeOnboarding(db: SQLiteDatabase) {
  await db.runAsync("UPDATE app_settings SET value = '1' WHERE key = 'onboarding_completed'");
}

export type ThemePreference = 'system' | 'light' | 'dark';
export async function getThemePreference(db: SQLiteDatabase): Promise<ThemePreference> {
  const result = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key='theme_preference'");
  return result?.value === 'light' || result?.value === 'dark' ? result.value : 'system';
}
export async function saveThemePreference(db: SQLiteDatabase, preference: ThemePreference) {
  await db.runAsync("INSERT INTO app_settings(key,value) VALUES('theme_preference',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", preference);
}

export async function getUserName(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key='user_name'");
  return result?.value ?? '';
}
export async function saveUserName(db: SQLiteDatabase, name: string) {
  await db.runAsync("INSERT INTO app_settings(key,value) VALUES('user_name',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", name.trim().slice(0, 40));
}

export async function getSoundEnabled(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key='sound_enabled'");
  return result?.value !== '0';
}
export async function saveSoundEnabled(db: SQLiteDatabase, enabled: boolean) {
  await db.runAsync("INSERT INTO app_settings(key,value) VALUES('sound_enabled',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", enabled ? '1' : '0');
}

export async function getHapticsEnabled(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key='haptics_enabled'");
  return result?.value !== '0';
}
export async function saveHapticsEnabled(db: SQLiteDatabase, enabled: boolean) {
  await db.runAsync("INSERT INTO app_settings(key,value) VALUES('haptics_enabled',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", enabled ? '1' : '0');
}

export async function getProfilePhoto(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key='profile_photo'");
  return result?.value || null;
}
export async function saveProfilePhoto(db: SQLiteDatabase, uri: string | null) {
  await db.runAsync("INSERT INTO app_settings(key,value) VALUES('profile_photo',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", uri ?? '');
}

/** The highest streak level the user has already been congratulated for, so each celebration shows once. */
export async function getStreakLevelSeen(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key='streak_level_seen'");
  return Number(result?.value) || 0;
}
export async function saveStreakLevelSeen(db: SQLiteDatabase, level: number) {
  await db.runAsync("INSERT INTO app_settings(key,value) VALUES('streak_level_seen',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", String(level));
}
