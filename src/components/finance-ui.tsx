import { ReactNode } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTheme, MaxContentWidth } from '@/constants/theme';
import { mochi, mochiAspect } from '@/constants/mochi';
import { useTheme } from '@/hooks/use-theme';
import { SurfaceCard } from '@/components/dashboard-ui';
import { AppIcon, IconTile, type IconName } from '@/components/app-icon';
import { formatPeriod, shiftPeriod } from '@/database/format';

/** Space reserved under tab screens for the floating tab bar. */
export const TabBarSpace = 120;

export function goBack() { if (router.canGoBack()) router.back(); else router.replace('/home'); }

/**
 * Screen frame shared by every page. `variant="page"` shows a large title (tab and list pages);
 * `variant="form"` shows a centered title between back and close buttons (create/edit flows).
 */
export function Screen({ title, subtitle, children, action, back, variant = 'page', scroll = true, tabBar, footer }: { title?: string; subtitle?: string; children: ReactNode; action?: ReactNode; back?: boolean; variant?: 'page' | 'form'; scroll?: boolean; tabBar?: boolean; footer?: ReactNode }) {
  const c = useTheme(); const s = styles(c);
  const header = variant === 'form'
    ? <View style={s.formHeader}><IconButton icon="back" label="Kembali" onPress={goBack} /><Text style={s.formTitle} numberOfLines={1}>{title}</Text>{action ?? <IconButton icon="close" label="Tutup" onPress={goBack} />}</View>
    : title ? <View style={s.header}>{back ? <IconButton icon="back" label="Kembali" onPress={goBack} /> : null}<View style={{ flex: 1 }}><Text style={s.title}>{title}</Text>{subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}</View>{action}</View> : null;
  const bottomSpace = tabBar ? TabBarSpace : 28;
  const body = scroll
    ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: bottomSpace }]}>{header}{children}</ScrollView>
    : <View style={[s.content, { flex: 1, paddingBottom: tabBar ? TabBarSpace - 20 : 12 }]}>{header}{children}</View>;
  return <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={tabBar ? ['top'] : ['top', 'bottom']}>
    <StatusBar barStyle={c.statusBarStyle} />
    {/* Android is edge-to-edge, so the window no longer resizes for the keyboard; pad on both platforms. */}
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      {body}
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function IconButton({ icon, label, onPress, tone = 'plain' }: { icon: IconName; label: string; onPress: () => void; tone?: 'plain' | 'filled' }) {
  const c = useTheme();
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={({ pressed }) => [{ width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: tone === 'filled' ? c.forestDeep : c.surface, borderWidth: tone === 'filled' ? 0 : 1, borderColor: c.border }, pressed && { opacity: 0.7 }]}>
    <AppIcon name={icon} size={20} color={tone === 'filled' ? c.onForest : c.text} />
  </Pressable>;
}

export function Field({ label, value, onChangeText, placeholder, keyboardType, multiline, prefix, large, icon, children }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'default' | 'numeric'; multiline?: boolean; prefix?: string; large?: boolean; icon?: IconName; children?: ReactNode }) {
  const c = useTheme(); const s = styles(c);
  return <View style={s.field}><Text style={s.label}>{label}</Text>
    <View style={[s.inputBox, multiline && { alignItems: 'flex-start', minHeight: 84 }]}>
      {prefix ? <Text style={[s.prefix, large && { fontSize: 22 }]}>{prefix}</Text> : null}
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={c.textSecondary} keyboardType={keyboardType} multiline={multiline} accessibilityLabel={label} style={[s.input, large && s.inputLarge, multiline && { textAlignVertical: 'top', paddingTop: 12 }]} />
      {icon ? <AppIcon name={icon} size={20} color={c.textSecondary} /> : null}
      {children}
    </View>
  </View>;
}

/** Pill chip used for filters and single choices. */
export function Choice({ label, selected, onPress, icon, tint }: { label: string; selected?: boolean; onPress: () => void; icon?: IconName; tint?: string }) {
  const c = useTheme(); const s = styles(c);
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: Boolean(selected) }} style={[s.choice, selected && { backgroundColor: c.forest, borderColor: c.forest }]}>
    {icon ? <AppIcon name={icon} size={16} color={selected ? c.onForest : tint ?? c.textSecondary} /> : null}
    <Text style={[s.choiceText, selected && { color: c.onForest }]}>{label}</Text>
  </Pressable>;
}

/** Equal-width tabs inside one track, e.g. Pengeluaran / Pemasukan. */
export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (value: T) => void }) {
  const c = useTheme(); const s = styles(c);
  return <View style={s.segment}>{options.map((option) => {
    const selected = option.value === value;
    return <Pressable key={option.value} onPress={() => onChange(option.value)} accessibilityRole="tab" accessibilityState={{ selected }} style={[s.segmentItem, selected && { backgroundColor: c.forest }]}>
      <Text style={[s.segmentText, selected && { color: c.onForest }]}>{option.label}</Text>
    </Pressable>;
  })}</View>;
}

export function PrimaryButton({ label, onPress, secondary, disabled, icon, danger }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean; icon?: IconName; danger?: boolean }) {
  const c = useTheme(); const s = styles(c);
  const fg = danger ? c.negative : secondary ? c.text : c.onForest;
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled: Boolean(disabled) }} style={({ pressed }) => [s.button, (secondary || danger) && { backgroundColor: c.surface, borderColor: danger ? c.negative : c.border, borderWidth: 1 }, disabled && { opacity: 0.55 }, pressed && !disabled && { opacity: 0.85, transform: [{ scale: 0.99 }] }]}>
    {icon ? <AppIcon name={icon} size={18} color={fg} /> : null}
    <Text style={[s.buttonText, { color: fg }]}>{label}</Text>
  </Pressable>;
}

export function Panel({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) { return <SurfaceCard style={[{ padding: 16, borderRadius: 20 }, style]}>{children}</SurfaceCard>; }

/** `warnOver` turns the bar red past 100%, for spending caps where exceeding the target is bad. */
export function ProgressBar({ ratio, warnOver, tint, track }: { ratio: number; warnOver?: boolean; tint?: string; track?: string }) {
  const c = useTheme();
  const fill = warnOver && ratio > 1 ? c.negative : tint ?? c.forest;
  return <View style={{ height: 6, borderRadius: 3, backgroundColor: track ?? c.line, overflow: 'hidden' }}><View style={{ width: `${Math.min(100, Math.max(0, ratio * 100))}%`, height: '100%', borderRadius: 3, backgroundColor: fill }} /></View>;
}

export function MochiImage({ name, width, style }: { name: keyof typeof mochi; width: number; style?: StyleProp<ViewStyle> }) {
  return <View style={style} pointerEvents="none"><Image source={mochi[name]} contentFit="contain" style={{ width, height: width / mochiAspect[name] }} accessibilityLabel="Ilustrasi Mochi, maskot Kantongin" /></View>;
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  const c = useTheme();
  return <View style={{ alignItems: 'center', paddingVertical: 18, paddingHorizontal: 12 }}>
    <MochiImage name="empty" width={170} />
    <Text style={{ color: c.text, fontSize: 15, fontWeight: '800', marginTop: 10, textAlign: 'center' }}>{title}</Text>
    {message ? <Text style={{ color: c.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4, textAlign: 'center', maxWidth: 280 }}>{message}</Text> : null}
    {action ? <View style={{ alignSelf: 'stretch', marginTop: 12 }}>{action}</View> : null}
  </View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const c = useTheme();
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 12 }}>
    <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>{title}</Text>
    {action && onAction ? <Pressable onPress={onAction} accessibilityRole="button" hitSlop={8}><Text style={{ color: c.sageStrong, fontSize: 12, fontWeight: '700' }}>{action}</Text></Pressable> : null}
  </View>;
}

/** Row with an icon tile, two lines of text, and a trailing value or chevron. */
export function ListRow({ icon, tint, title, subtitle, value, valueColor, onPress, last, trailing, accessibilityHint }: { icon: IconName; tint?: string; title: string; subtitle?: string; value?: string; valueColor?: string; onPress?: () => void; last?: boolean; trailing?: ReactNode; accessibilityHint?: string }) {
  const c = useTheme();
  const content = <>
    <IconTile name={icon} tint={tint} size={40} />
    <View style={{ flex: 1, minWidth: 0 }}><Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }} numberOfLines={1}>{title}</Text>{subtitle ? <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 3 }} numberOfLines={1}>{subtitle}</Text> : null}</View>
    {value ? <Text style={{ color: valueColor ?? c.text, fontSize: 13, fontWeight: '700' }}>{value}</Text> : null}
    {trailing ?? (onPress && !value ? <AppIcon name="forward" size={18} color={c.textSecondary} /> : null)}
  </>;
  const rowStyle = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line };
  return onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityHint={accessibilityHint} style={({ pressed }) => [rowStyle, pressed && { opacity: 0.7 }]}>{content}</Pressable> : <View style={rowStyle}>{content}</View>;
}

export function MonthSwitcher({ period, onChange }: { period: string; onChange: (period: string) => void }) {
  const c = useTheme();
  const arrow = (delta: number) => <Pressable onPress={() => onChange(shiftPeriod(period, delta))} accessibilityRole="button" accessibilityLabel={delta < 0 ? 'Bulan sebelumnya' : 'Bulan berikutnya'} hitSlop={8} style={{ padding: 6 }}><AppIcon name={delta < 0 ? 'back' : 'forward'} size={20} color={c.text} /></Pressable>;
  return <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 6, marginBottom: 14 }}>
    {arrow(-1)}<Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>{formatPeriod(period)}</Text>{arrow(1)}
  </View>;
}

export function styles(c: AppTheme) {
  return StyleSheet.create({
    content: { paddingHorizontal: 20, paddingTop: 10, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
    formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, gap: 12 },
    formTitle: { flex: 1, color: c.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
    title: { color: c.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.6 },
    subtitle: { color: c.textSecondary, fontSize: 12, marginTop: 3 },
    footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 12, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
    field: { marginBottom: 14 },
    label: { color: c.textSecondary, fontSize: 12, fontWeight: '600', marginBottom: 7 },
    inputBox: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderWidth: 1, borderColor: c.border, borderRadius: 14, backgroundColor: c.surface },
    input: { flex: 1, minHeight: 48, paddingVertical: 10, color: c.text, fontSize: 15 },
    inputLarge: { fontSize: 22, fontWeight: '800', minHeight: 56 },
    prefix: { color: c.text, fontSize: 15, fontWeight: '800' },
    choice: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, marginRight: 8, marginBottom: 8 },
    choiceText: { color: c.text, fontSize: 12, fontWeight: '600' },
    segment: { flexDirection: 'row', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 16, padding: 4, marginBottom: 16, gap: 4 },
    segmentItem: { flex: 1, minHeight: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    segmentText: { color: c.textSecondary, fontSize: 13, fontWeight: '700' },
    button: { minHeight: 52, borderRadius: 16, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: c.forest, marginTop: 6, paddingHorizontal: 16 },
    buttonText: { color: c.onForest, fontSize: 15, fontWeight: '800' },
  });
}
