/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { AppTheme } from '@/constants/theme';
import { getThemeColors, useAppThemePreference } from '@/hooks/app-theme-provider';

export function useTheme(): AppTheme {
  const { effective } = useAppThemePreference();
  return getThemeColors(effective);
}
