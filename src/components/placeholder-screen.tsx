import { Platform, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppTheme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { DashboardHeader, SurfaceCard } from '@/components/dashboard-ui';

const descriptions: Record<string, string> = {
  Transaksi: 'Catatan pemasukan dan pengeluaranmu akan ditampilkan di sini.',
  Laporan: 'Ringkasan dan perkembangan keuanganmu akan ditampilkan di sini.',
  Lainnya: 'Pengaturan dan alat bantu Kantongin akan ditampilkan di sini.',
};

export function PlaceholderScreen({ title }: { title: string }) {
  const colors = useTheme();
  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle={colors.statusBarStyle} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic">
        <DashboardHeader />

        <View style={styles.pageIntro}>
          <Text style={styles.eyebrow}>KANTONGIN</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{descriptions[title] ?? 'Informasi Kantongin akan ditampilkan di sini.'}</Text>
        </View>

        <SurfaceCard style={styles.statusCard}>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>SEGERA HADIR</Text>
          </View>
          <Text style={styles.cardTitle}>Halaman ini sedang disiapkan</Text>
          <Text style={styles.cardDescription}>
            Sambil menunggu, kamu tetap bisa melihat saldo dan kantong keuangan dari Beranda.
          </Text>
          <View style={styles.divider} />
          <Text style={styles.cardFootnote}>Terima kasih sudah mengatur keuangan bersama Kantongin.</Text>
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppTheme) {
  return StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'web' ? 88 : 24,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    flexGrow: 1,
  },
  pageIntro: { marginTop: 5, marginBottom: 20 },
  eyebrow: { color: colors.sageStrong, fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  title: { color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.7, marginTop: 5 },
  description: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 6 },
  statusCard: { borderRadius: 22, padding: 21 },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.softGreen,
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.sageStrong, marginRight: 7 },
  statusText: { color: colors.sageStrong, fontSize: 10, fontWeight: '700', letterSpacing: 0.45 },
  cardTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginTop: 18 },
  cardDescription: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 7 },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 17 },
  cardFootnote: { color: colors.textSecondary, fontSize: 11, lineHeight: 17 },
  });
}
