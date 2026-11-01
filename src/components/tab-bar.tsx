import { Tabs, TabList, TabTrigger, TabSlot, TabTriggerSlotProps, TabListProps } from 'expo-router/ui';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTheme, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { AppIcon, type IconName } from '@/components/app-icon';
import { haptic } from '@/utils/haptics';

/** Bottom navigation: four destinations with the add-transaction button in the middle. */
export function AppTabBar() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="home" href="/home" asChild><TabButton icon="home">Beranda</TabButton></TabTrigger>
          <TabTrigger name="wallets" href="/wallets" asChild><TabButton icon="wallet">Kantong</TabButton></TabTrigger>
          <AddAction />
          <TabTrigger name="transactions" href="/transactions" asChild><TabButton icon="transactions">Transaksi</TabButton></TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild><TabButton icon="more">Lainnya</TabButton></TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

function AddAction() {
  const c = useTheme(); const s = createStyles(c);
  return <Pressable onPress={() => { haptic('tap'); router.push('/transaction-form'); }} style={({ pressed }) => [s.addSlot, pressed && s.pressed]} accessibilityRole="button" accessibilityLabel="Tambah transaksi">
    <View style={s.addButton}><AppIcon name="add" size={28} color={c.onForest} /></View>
  </Pressable>;
}

function TabButton({ children, isFocused, icon, ...props }: TabTriggerSlotProps & { icon: IconName }) {
  const c = useTheme(); const s = createStyles(c);
  const pressableProps = props as unknown as React.ComponentProps<typeof Pressable>;
  return <Pressable {...pressableProps} accessibilityRole="tab" accessibilityState={{ selected: Boolean(isFocused) }} style={({ pressed }) => [s.tabButton, pressed && s.pressed]}>
    <AppIcon name={icon} size={24} color={isFocused ? c.forest : c.textSecondary} />
    <Text style={[s.tabLabel, isFocused && s.tabLabelSelected]} numberOfLines={1}>{children}</Text>
  </Pressable>;
}

function CustomTabList(props: TabListProps) {
  const c = useTheme(); const insets = useSafeAreaInsets(); const s = createStyles(c);
  return <View {...props} style={[s.container, { paddingBottom: Math.max(insets.bottom, 8) }]}>
    <View style={s.inner}>{props.children}</View>
  </View>;
}

function createStyles(c: AppTheme) {
  return StyleSheet.create({
    container: { position: 'absolute', bottom: 0, width: '100%', paddingTop: 6, alignItems: 'center', backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border, shadowColor: c.shadow, shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: -3 }, elevation: 12 },
    inner: { flexDirection: 'row', alignItems: 'center', width: '100%', maxWidth: MaxContentWidth, paddingHorizontal: 6 },
    tabButton: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 52, gap: 2 },
    tabLabel: { color: c.textSecondary, fontSize: 11, fontWeight: '600' },
    tabLabelSelected: { color: c.forest, fontWeight: '800' },
    addSlot: { width: 72, alignItems: 'center' },
    addButton: { width: 56, height: 56, borderRadius: 28, backgroundColor: c.forest, alignItems: 'center', justifyContent: 'center', marginTop: -26, borderWidth: 4, borderColor: c.surface, shadowColor: c.forest, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
    pressed: { opacity: 0.75, transform: [{ scale: 0.97 }] },
  });
}
