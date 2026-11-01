import { useState } from 'react';
import { Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '@/hooks/use-theme';
import { mochi, mochiAspect } from '@/constants/mochi';
import { PrimaryButton } from '@/components/finance-ui';
import { completeOnboarding } from '@/database/preferences';
import { showMessage } from '@/utils/show-message';

const pages = [
  { image: 'onboardingWallet', title: 'Atur Setiap\nKantong Uangmu', description: 'Pisahkan uang untuk kebutuhan, tabungan, dan tujuan masa depan.' },
  { image: 'onboardingShopping', title: 'Catat Pengeluaran\ndengan Mudah', description: 'Makan, transport, belanja: semua tercatat rapi dalam hitungan detik.' },
  { image: 'onboardingSaving', title: 'Capai Target\nTabunganmu', description: 'Pantau progres tabungan dan anggaran langsung dari transaksimu.' },
] as const;

export default function OnboardingScreen() {
  const db = useSQLiteContext(); const c = useTheme(); const s = createStyles(c); const [step, setStep] = useState(0); const [saving, setSaving] = useState(false); const page = pages[step];
  // Opened again from Pengaturan: onboarding is already done, so finishing just returns there.
  const { replay } = useLocalSearchParams<{ replay?: string }>();
  const finish = async () => {
    if (replay) { router.back(); return; }
    if (saving) return;
    setSaving(true);
    try { await completeOnboarding(db); router.replace('/home'); }
    catch (error) { if (__DEV__) console.error('[Kantongin] Could not save onboarding completion', error); showMessage('Belum bisa melanjutkan', 'Status pengenalan belum tersimpan. Periksa ruang penyimpanan lalu coba lagi.'); }
    finally { setSaving(false); }
  };
  const last = step === pages.length - 1;
  return <SafeAreaView style={s.safe} edges={['top', 'bottom']}><StatusBar barStyle={c.statusBarStyle} />
    <View style={s.header}>
      {step > 0 ? <Pressable onPress={() => setStep((current) => current - 1)} accessibilityRole="button" hitSlop={8}><Text style={s.link}>Kembali</Text></Pressable> : <View />}
      {!last ? <Pressable onPress={finish} disabled={saving} accessibilityRole="button" accessibilityLabel="Lewati pengenalan" hitSlop={8}><Text style={s.link}>Lewati</Text></Pressable> : <View />}
    </View>
    <View style={s.hero}>
      <Image source={mochi[page.image]} contentFit="contain" style={{ width: '100%', maxWidth: 340, aspectRatio: mochiAspect[page.image] }} accessibilityLabel={page.title.replace('\n', ' ')} />
    </View>
    <View style={s.footer}>
      <Text style={s.title}>{page.title}</Text>
      <Text style={s.description}>{page.description}</Text>
      <View style={s.dots}>{pages.map((item, index) => <View key={item.image} style={[s.dot, index === step && s.dotActive]} />)}</View>
      <View style={{ alignSelf: 'stretch' }}><PrimaryButton label={saving ? 'Menyimpan…' : last ? 'Mulai Sekarang' : 'Lanjut'} onPress={() => last ? void finish() : setStep((current) => current + 1)} disabled={saving} /></View>
    </View>
  </SafeAreaView>;
}

function createStyles(c: ReturnType<typeof useTheme>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.background, paddingHorizontal: 24 },
    header: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    link: { color: c.sageStrong, fontSize: 14, fontWeight: '700', paddingVertical: 8 },
    hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    footer: { paddingBottom: 12, alignItems: 'center' },
    title: { color: c.text, fontSize: 26, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5, lineHeight: 32 },
    description: { color: c.textSecondary, fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 10, maxWidth: 300 },
    dots: { flexDirection: 'row', gap: 8, marginVertical: 22 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.border },
    dotActive: { width: 22, backgroundColor: c.forest },
  });
}
