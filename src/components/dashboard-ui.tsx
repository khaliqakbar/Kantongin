import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

import { AppTheme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SectionHeading({ title, action }: { title: string; action?: string }) {
  const colors = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.headingRow}>
      <Text style={styles.heading}>{title}</Text>
      {action ? <Text style={styles.action}>{action}</Text> : null}
    </View>
  );
}

export function SurfaceCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const colors = useTheme();
  const styles = createStyles(colors);

  return <View style={[styles.surface, style]}>{children}</View>;
}

export function DashboardHeader() {
  const colors = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.dashboardHeader}>
      <View style={styles.brandCopy}>
        {colors.statusBarStyle === 'dark-content' ? (
          <Image
            source={require('../../assets/generated/branding/logo_horizontal.png')}
            style={styles.wordmark}
            contentFit="contain"
            accessibilityLabel="Kantongin. Uang Rapi, Hidup Lebih Pasti."
          />
        ) : (
          <>
            <Text style={styles.brand}>Kantongin<Text style={styles.brandDot}>.</Text></Text>
            <Text style={styles.tagline}>Uang Rapi, Hidup Lebih Pasti.</Text>
          </>
        )}
      </View>
      <Image
        source={require('../../assets/generated/mascot/mochi_default.png')}
        style={styles.mochiMascot}
        contentFit="contain"
        accessibilityLabel="Mochi, maskot Kantongin"
      />
    </View>
  );
}

export function getToneColors(colors: AppTheme, tone: 'green' | 'orange' | 'lavender' | 'blue') {
  switch (tone) {
    case 'orange':
      return { background: colors.softOrange, accent: colors.negative };
    case 'lavender':
      return { background: colors.softLavender, accent: colors.sageStrong };
    case 'blue':
      return { background: colors.softBlue, accent: colors.sageStrong };
    default:
      return { background: colors.softGreen, accent: colors.positive };
  }
}

function createStyles(colors: AppTheme) {
  return StyleSheet.create({
    surface: {
      backgroundColor: colors.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOpacity: 0.045,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 5 },
      elevation: 2,
    },
    headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
    heading: { color: colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.35 },
    action: { color: colors.sageStrong, fontSize: 13, fontWeight: '700' },
    dashboardHeader: {
      minHeight: 73,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 22,
    },
    brandCopy: { flexShrink: 1 },
    wordmark: { width: 170, height: 46 },
    brand: { color: colors.forest, fontSize: 25, fontWeight: '800', letterSpacing: -0.8 },
    brandDot: { color: colors.sageStrong },
    tagline: { color: colors.textSecondary, fontSize: 11, fontWeight: '500', marginTop: 2 },
    mochiMascot: { width: 64, height: 73, flexShrink: 0 },
  });
}
