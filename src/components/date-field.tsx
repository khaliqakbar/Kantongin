import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { AppIcon, type IconName } from '@/components/app-icon';
import { styles } from '@/components/finance-ui';
import { formatDate, formatPeriod, isValidISODate, shiftPeriod, todayISO } from '@/database/format';

const weekdays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const pad = (n: number) => String(n).padStart(2, '0');

/** Date input that opens a calendar instead of asking for typed YYYY-MM-DD. */
export function DateField({ label, value, onChange, optional, placeholder = 'Pilih tanggal' }: { label: string; value: string; onChange: (value: string) => void; optional?: boolean; placeholder?: string }) {
  const c = useTheme(); const s = styles(c); const [open, setOpen] = useState(false);
  const valid = isValidISODate(value);
  return <View style={s.field}>
    <Text style={s.label}>{label}</Text>
    <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={`${label}: ${valid ? formatDate(value, { weekday: true, fullMonth: true }) : placeholder}`} style={({ pressed }) => [s.inputBox, pressed && { opacity: 0.8 }]}>
      <Text style={{ flex: 1, color: valid ? c.text : c.textSecondary, fontSize: 15, paddingVertical: 14 }} numberOfLines={1}>{valid ? formatDate(value, { weekday: true, fullMonth: true }) : placeholder}</Text>
      {optional && valid ? <Pressable onPress={() => onChange('')} accessibilityRole="button" accessibilityLabel={`Kosongkan ${label}`} hitSlop={10}><AppIcon name="close" size={18} color={c.textSecondary} /></Pressable> : null}
      <AppIcon name="calendar" size={20} color={c.forest} />
    </Pressable>
    {open ? <CalendarModal value={valid ? value : todayISO()} onSelect={(date) => { onChange(date); setOpen(false); }} onClose={() => setOpen(false)} /> : null}
  </View>;
}

function CalendarModal({ value, onSelect, onClose }: { value: string; onSelect: (value: string) => void; onClose: () => void }) {
  const c = useTheme(); const [period, setPeriod] = useState(value.slice(0, 7)); const today = todayISO();
  const [year, month] = period.split('-').map(Number);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = [...Array<null>(firstWeekday).fill(null), ...Array.from({ length: dayCount }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const nav = (icon: IconName, label: string, delta: number) => <Pressable onPress={() => setPeriod(shiftPeriod(period, delta))} accessibilityRole="button" accessibilityLabel={label} hitSlop={6} style={{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}><AppIcon name={icon} size={20} color={c.text} /></Pressable>;

  return <Modal transparent animationType="fade" visible onRequestClose={onClose} statusBarTranslucent>
    <Pressable onPress={onClose} accessibilityLabel="Tutup kalender" style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Inner Pressable swallows taps so only the backdrop closes the dialog. */}
      <Pressable onPress={() => {}} style={{ width: '100%', maxWidth: 360, backgroundColor: c.surface, borderRadius: 24, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          {nav('yearBack', 'Tahun sebelumnya', -12)}{nav('back', 'Bulan sebelumnya', -1)}
          <Text style={{ flex: 1, textAlign: 'center', color: c.text, fontSize: 15, fontWeight: '800' }}>{formatPeriod(period)}</Text>
          {nav('forward', 'Bulan berikutnya', 1)}{nav('yearForward', 'Tahun berikutnya', 12)}
        </View>
        <View style={{ flexDirection: 'row' }}>{weekdays.map((d) => <Text key={d} style={{ width: `${100 / 7}%`, textAlign: 'center', color: c.textSecondary, fontSize: 11, fontWeight: '700', paddingVertical: 6 }}>{d}</Text>)}</View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{cells.map((day, index) => {
          if (!day) return <View key={`e${index}`} style={{ width: `${100 / 7}%`, aspectRatio: 1 }} />;
          const iso = `${period}-${pad(day)}`; const selected = iso === value; const isToday = iso === today;
          return <Pressable key={iso} onPress={() => onSelect(iso)} accessibilityRole="button" accessibilityLabel={formatDate(iso, { weekday: true, fullMonth: true })} accessibilityState={{ selected }} style={{ width: `${100 / 7}%`, aspectRatio: 1, padding: 3 }}>
            <View style={{ flex: 1, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? c.forest : 'transparent', borderWidth: isToday && !selected ? 1.5 : 0, borderColor: c.forest }}>
              <Text style={{ color: selected ? c.onForest : c.text, fontSize: 14, fontWeight: selected || isToday ? '800' : '500' }}>{day}</Text>
            </View>
          </Pressable>;
        })}</View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <Pressable onPress={() => onSelect(today)} accessibilityRole="button" hitSlop={8} style={{ padding: 8 }}><Text style={{ color: c.forest, fontSize: 14, fontWeight: '800' }}>Hari ini</Text></Pressable>
          <Pressable onPress={onClose} accessibilityRole="button" hitSlop={8} style={{ padding: 8 }}><Text style={{ color: c.textSecondary, fontSize: 14, fontWeight: '700' }}>Batal</Text></Pressable>
        </View>
      </Pressable>
    </Pressable>
  </Modal>;
}
