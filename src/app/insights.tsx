import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useTheme } from '@/hooks/use-theme';
import { IconTile, type IconName } from '@/components/app-icon';
import { MochiImage, MonthSwitcher, Panel, Screen } from '@/components/finance-ui';
import { getFinanceInsights, type Insight } from '@/database/analytics-repository';
import { currentPeriod } from '@/database/format';

function insightIcon(item: Insight): IconName {
  if (item.id === 'compare') return item.tone === 'warning' ? 'trendUp' : 'trendDown';
  if (item.id === 'budget') return 'warning';
  if (item.id === 'net-positive') return 'savings';
  if (item.id === 'top-category') return 'budget';
  return 'lightbulb';
}

export default function InsightsScreen() {
  const db = useSQLiteContext(), c = useTheme();
  const [period, setPeriod] = useState(currentPeriod()); const [items, setItems] = useState<Insight[]>([]); const [loadError, setLoadError] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    getFinanceInsights(db, period).then((data) => { if (active) { setItems(data); setLoadError(false); } }).catch((e) => { if (__DEV__) console.error('[Kantongin] Load insights failed', e); if (active) setLoadError(true); });
    return () => { active = false; };
  }, [db, period]));
  const tint = { positive: c.positive, neutral: '#3D7BE0', warning: c.negative };
  // Warnings first: they are the thing worth acting on.
  const headline = items.find((i) => i.tone === 'warning') ?? items[0];

  return <Screen title="Insight ✨" back>
    <View style={{ minHeight: 200, marginBottom: 8 }}>
      <MochiImage name="insight" width={250} style={{ position: 'absolute', left: -14, bottom: 0 }} />
      {headline ? <View style={{ marginLeft: 'auto', width: '52%', backgroundColor: c.surface, borderRadius: 18, borderWidth: 1, borderColor: c.border, padding: 12 }}>
        <Text style={{ color: c.text, fontSize: 12, fontWeight: '800' }}>{headline.title}</Text>
        <Text style={{ color: c.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 4 }}>{headline.detail}</Text>
      </View> : null}
    </View>
    <MonthSwitcher period={period} onChange={setPeriod} />
    {loadError ? <Text style={{ color: c.negative, fontSize: 12, marginBottom: 12 }}>Insight gagal dimuat. Coba buka kembali halaman.</Text> : null}
    {items.map((item) => <Panel key={item.id} style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
      <IconTile name={insightIcon(item)} tint={tint[item.tone]} size={42} />
      <View style={{ flex: 1 }}><Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>{item.title}</Text><Text style={{ color: c.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 4 }}>{item.detail}</Text></View>
    </Panel>)}
    <Text style={{ color: c.textSecondary, fontSize: 11, marginTop: 4, textAlign: 'center' }}>Insight dihitung dari transaksi dan anggaran yang tersimpan di perangkat ini.</Text>
  </Screen>;
}
