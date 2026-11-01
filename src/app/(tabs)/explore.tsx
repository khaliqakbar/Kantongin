import { useCallback, useState } from 'react';
import { Platform, Pressable, Share, Switch, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { router, useFocusEffect, type Href } from 'expo-router';
import Constants from 'expo-constants';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '@/hooks/use-theme';
import { useAppThemePreference } from '@/hooks/app-theme-provider';
import { mochi } from '@/constants/mochi';
import { AppIcon, type IconName } from '@/components/app-icon';
import { ListRow, Panel, Screen, Segmented, styles } from '@/components/finance-ui';
import { showMessage } from '@/utils/show-message';
import { getAllTransactionsForExport, transactionsToCSV } from '@/database/analytics-repository';
import { getProfilePhoto, getSoundEnabled, getUserName, saveProfilePhoto, saveSoundEnabled, saveUserName, type ThemePreference } from '@/database/preferences';
import { resetAllBalances } from '@/database/repository';
import { deleteProfilePhoto, pickProfilePhoto } from '@/utils/profile-photo';
import { confirmDestructiveAction } from '@/utils/confirm-destructive-action';
import { configureSounds } from '@/utils/sound';

const menu: { title: string; icon: IconName; href: Href }[] = [
  { title: 'Kantong', icon: 'wallet', href: '/wallets' },
  { title: 'Anggaran', icon: 'budget', href: '/budgets' },
  { title: 'Target Tabungan', icon: 'target', href: '/savings-goals' },
  { title: 'Transaksi Berulang', icon: 'recurring', href: '/recurring' },
  { title: 'Laporan', icon: 'report', href: '/reports' },
  { title: 'Insight Keuangan', icon: 'insight', href: '/insights' },
];
const themeOptions: { value: ThemePreference; label: string }[] = [{ value: 'system', label: 'Otomatis' }, { value: 'light', label: 'Terang' }, { value: 'dark', label: 'Gelap' }];

export default function MoreScreen() {
  const db = useSQLiteContext(), c = useTheme(), s = styles(c), { preference, setPreference } = useAppThemePreference();
  const [exporting, setExporting] = useState(false); const [name, setName] = useState(''); const [draft, setDraft] = useState(''); const [editing, setEditing] = useState(false); const [soundOn, setSoundOn] = useState(true); const [photo, setPhoto] = useState<string | null>(null); const [picking, setPicking] = useState(false);
  useFocusEffect(useCallback(() => { let active = true; getProfilePhoto(db).then((value) => { if (active) setPhoto(value); }).catch((error: unknown) => { if (__DEV__) console.error('[Kantongin] Load profile photo failed', error); }); getSoundEnabled(db).then((value) => { if (active) setSoundOn(value); }).catch((error: unknown) => { if (__DEV__) console.error('[Kantongin] Load sound preference failed', error); }); getUserName(db).then((value) => { if (active) setName(value); }).catch((error: unknown) => { if (__DEV__) console.error('[Kantongin] Load user name failed', error); }); return () => { active = false; }; }, [db]));
  const saveName = async () => {
    try { await saveUserName(db, draft); setName(draft.trim()); setEditing(false); }
    catch (error) { if (__DEV__) console.error('[Kantongin] Save user name failed', error); showMessage('Nama belum tersimpan', 'Coba kembali.'); }
  };
  const exportData = async () => {
    if (exporting) return; setExporting(true);
    try {
      const rows = await getAllTransactionsForExport(db);
      if (!rows.length) { showMessage('Belum ada data', 'Catat transaksi sebelum mengekspor.'); return; }
      const csv = transactionsToCSV(rows);
      if (Platform.OS === 'web') { const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'kantongin-transaksi.csv'; link.click(); URL.revokeObjectURL(url); }
      else await Share.share({ title: 'Ekspor transaksi Kantongin', message: csv });
    } catch (error) { if (__DEV__) console.error('[Kantongin] Export transactions failed', error); showMessage('Ekspor gagal', error instanceof Error ? error.message : 'Terjadi kesalahan saat menyiapkan ekspor.'); }
    finally { setExporting(false); }
  };
  const choosePhoto = async () => {
    if (picking) return; setPicking(true);
    try {
      const uri = await pickProfilePhoto();
      if (!uri) return;
      await saveProfilePhoto(db, uri);
      deleteProfilePhoto(photo);
      setPhoto(uri);
    } catch (error) { if (__DEV__) console.error('[Kantongin] Pick profile photo failed', error); showMessage('Foto belum tersimpan', error instanceof Error ? error.message : 'Coba pilih foto lain.'); }
    finally { setPicking(false); }
  };
  const removePhoto = async () => {
    try { await saveProfilePhoto(db, null); deleteProfilePhoto(photo); setPhoto(null); }
    catch (error) { if (__DEV__) console.error('[Kantongin] Remove profile photo failed', error); showMessage('Foto belum terhapus', 'Coba kembali.'); }
  };
  const resetBalances = () => confirmDestructiveAction(
    'Reset semua saldo?',
    'Semua transaksi dan transfer akan dihapus, dan saldo awal setiap kantong dijadikan Rp0. Kantong, anggaran, target, dan jadwal tetap ada. Tindakan ini tidak bisa dibatalkan.',
    async () => { await resetAllBalances(db); showMessage('Saldo sudah direset', 'Semua saldo kini Rp0. Mulai catat dari awal, ya!'); },
    (error) => { if (__DEV__) console.error('[Kantongin] Reset balances failed', error); },
    'Reset',
  );
  const toggleSound = async (on: boolean) => {
    setSoundOn(on);
    try { await saveSoundEnabled(db, on); configureSounds(on); }
    catch (error) { if (__DEV__) console.error('[Kantongin] Save sound preference failed', error); setSoundOn(!on); showMessage('Pengaturan suara belum tersimpan', 'Coba kembali.'); }
  };
  const changeTheme = async (value: ThemePreference) => { try { await setPreference(value); } catch (error) { if (__DEV__) console.error('[Kantongin] Save theme preference failed', error); showMessage('Tema belum tersimpan', 'Coba kembali.'); } };

  return <Screen title="Profil" tabBar>
    <Panel style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
      <Pressable onPress={choosePhoto} disabled={picking} accessibilityRole="button" accessibilityLabel={photo ? 'Ganti foto profil' : 'Pilih foto profil'} style={{ alignItems: 'center', gap: 6 }}>
        <View>
          <Image source={photo ? { uri: photo } : mochi.avatar} style={{ width: 66, height: 66, borderRadius: 33 }} contentFit={photo ? 'cover' : 'contain'} accessibilityLabel={photo ? 'Foto profil' : 'Avatar Mochi'} />
          <View style={{ position: 'absolute', right: -2, bottom: -2, width: 26, height: 26, borderRadius: 13, backgroundColor: c.forest, borderWidth: 2, borderColor: c.surface, alignItems: 'center', justifyContent: 'center' }}><AppIcon name="camera" size={14} color={c.onForest} /></View>
        </View>
        {photo ? <Pressable onPress={removePhoto} accessibilityRole="button" hitSlop={6}><Text style={{ color: c.negative, fontSize: 11, fontWeight: '700' }}>Hapus foto</Text></Pressable> : null}
      </Pressable>
      {editing ? <View style={{ flex: 1, gap: 8 }}>
        <View style={s.inputBox}><TextInput value={draft} onChangeText={setDraft} autoFocus placeholder="Nama panggilan" placeholderTextColor={c.textSecondary} maxLength={40} onSubmitEditing={saveName} accessibilityLabel="Nama panggilan" style={s.input} /></View>
        <View style={{ flexDirection: 'row', gap: 14 }}><Pressable onPress={saveName} accessibilityRole="button"><Text style={{ color: c.forest, fontWeight: '800' }}>Simpan</Text></Pressable><Pressable onPress={() => setEditing(false)} accessibilityRole="button"><Text style={{ color: c.textSecondary, fontWeight: '700' }}>Batal</Text></Pressable></View>
      </View> : <Pressable onPress={() => { setDraft(name); setEditing(true); }} accessibilityRole="button" accessibilityLabel="Ubah nama panggilan" style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{name || 'Tambahkan namamu'}</Text>
        <Text style={{ color: c.textSecondary, fontSize: 12, marginTop: 3 }}>Data tersimpan di perangkat ini · ketuk untuk ubah nama</Text>
      </Pressable>}
      {!editing ? <AppIcon name="edit" size={18} color={c.textSecondary} /> : null}
    </Panel>

    <Panel style={{ paddingVertical: 2, marginBottom: 14 }}>
      {menu.map((item) => <ListRow key={item.title} icon={item.icon} title={item.title} onPress={() => router.push(item.href)} />)}
      <ListRow icon="export" title={exporting ? 'Menyiapkan ekspor…' : 'Ekspor Data (CSV)'} onPress={exportData} last />
    </Panel>

    <Panel style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}><AppIcon name="palette" size={20} color={c.text} /><Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Tema Tampilan</Text></View>
      <Segmented options={themeOptions} value={preference} onChange={changeTheme} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: c.line, paddingTop: 12 }}>
        <View style={{ flex: 1 }}><Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>Efek Suara</Text><Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 2 }}>Suara Mochi saat membuka aplikasi, menyimpan, dan menghapus</Text></View>
        <Switch value={soundOn} onValueChange={toggleSound} accessibilityLabel="Efek suara" trackColor={{ false: c.border, true: c.forest }} thumbColor="#FFFFFF" />
      </View>
    </Panel>

    <Panel style={{ paddingVertical: 2, marginBottom: 14 }}>
      <ListRow icon="reset" title="Reset Semua Saldo" subtitle="Hapus semua transaksi & transfer, saldo jadi Rp0" onPress={resetBalances} last />
    </Panel>

    <Panel style={{ paddingVertical: 2 }}>
      <ListRow icon="info" title="Tentang Kantongin" subtitle="Uang Rapi, Hidup Lebih Pasti." trailing={<Text style={{ color: c.textSecondary, fontSize: 12 }}>v{Constants.expoConfig?.version ?? '1.0.0'}</Text>} last />
    </Panel>
  </Screen>;
}
