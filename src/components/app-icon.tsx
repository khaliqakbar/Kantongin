import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

/** Font family registered by the root layout (`@expo-google-fonts/material-symbols`). */
export const IconFontFamily = 'MaterialSymbols_400Regular';

/**
 * Semantic icon names mapped to Material Symbols codepoints, plus the accent used for tiles.
 * The trailing comment is the Material Symbols name, for looking icons up on fonts.google.com/icons.
 */
export const icons = {
  home: { glyph: 0xe88a, tint: '#2E9B5F' }, // home
  wallet: { glyph: 0xe850, tint: '#2E9B5F' }, // account_balance_wallet
  transactions: { glyph: 0xef6e, tint: '#2E9B5F' }, // receipt_long
  more: { glyph: 0xe5d3, tint: '#7A8981' }, // more_horiz
  add: { glyph: 0xe145, tint: '#2E9B5F' }, // add
  income: { glyph: 0xf1e5, tint: '#2E9B5F' }, // south_west
  expense: { glyph: 0xf1e1, tint: '#E2574C' }, // north_east
  transfer: { glyph: 0xe8d4, tint: '#3D7BE0' }, // swap_horiz
  search: { glyph: 0xe8b6, tint: '#7A8981' }, // search
  filter: { glyph: 0xe429, tint: '#7A8981' }, // tune
  bell: { glyph: 0xe7f4, tint: '#7A8981' }, // notifications
  eye: { glyph: 0xe8f4, tint: '#FFFFFF' }, // visibility
  eyeOff: { glyph: 0xe8f5, tint: '#FFFFFF' }, // visibility_off
  back: { glyph: 0xe5cb, tint: '#1F302A' }, // chevron_left
  forward: { glyph: 0xe5cc, tint: '#7A8981' }, // chevron_right
  yearBack: { glyph: 0xeac3, tint: '#1F302A' }, // keyboard_double_arrow_left
  yearForward: { glyph: 0xeac9, tint: '#1F302A' }, // keyboard_double_arrow_right
  close: { glyph: 0xe5cd, tint: '#1F302A' }, // close
  calendar: { glyph: 0xebcc, tint: '#7A8981' }, // calendar_month
  settings: { glyph: 0xe8b8, tint: '#7A8981' }, // settings
  report: { glyph: 0xe26b, tint: '#3D7BE0' }, // bar_chart
  budget: { glyph: 0xe6c4, tint: '#F2994A' }, // pie_chart
  target: { glyph: 0xe8e1, tint: '#E2574C' }, // track_changes
  recurring: { glyph: 0xe863, tint: '#8B5CF6' }, // autorenew
  insight: { glyph: 0xe65f, tint: '#E0A526' }, // auto_awesome
  export: { glyph: 0xe6b8, tint: '#2E9B5F' }, // ios_share
  palette: { glyph: 0xe40a, tint: '#8B5CF6' }, // palette
  info: { glyph: 0xe88e, tint: '#7A8981' }, // info
  edit: { glyph: 0xe3c9, tint: '#2E9B5F' }, // edit
  delete: { glyph: 0xe872, tint: '#E2574C' }, // delete
  check: { glyph: 0xe5ca, tint: '#2E9B5F' }, // check
  warning: { glyph: 0xe002, tint: '#E2574C' }, // warning
  trendUp: { glyph: 0xe8e5, tint: '#E2574C' }, // trending_up
  trendDown: { glyph: 0xe8e3, tint: '#2E9B5F' }, // trending_down
  lightbulb: { glyph: 0xe0f0, tint: '#E0A526' }, // lightbulb
  camera: { glyph: 0xe412, tint: '#2E9B5F' }, // photo_camera
  reset: { glyph: 0xf053, tint: '#E2574C' }, // restart_alt
  scan: { glyph: 0xe5fa, tint: '#8A5CD1' }, // document_scanner
  // Category and wallet icons.
  food: { glyph: 0xe56c, tint: '#E2574C' }, // restaurant
  transport: { glyph: 0xe531, tint: '#3D7BE0' }, // directions_car
  shopping: { glyph: 0xf1cc, tint: '#8B5CF6' }, // shopping_bag
  entertainment: { glyph: 0xea28, tint: '#E0577A' }, // sports_esports
  bill: { glyph: 0xef6e, tint: '#F2994A' }, // receipt_long
  health: { glyph: 0xe87d, tint: '#2EA36B' }, // favorite
  salary: { glyph: 0xef63, tint: '#2E9B5F' }, // payments
  bonus: { glyph: 0xe8f6, tint: '#E0A526' }, // card_giftcard
  savings: { glyph: 0xe2eb, tint: '#2E9B5F' }, // savings
  coffee: { glyph: 0xe541, tint: '#A0693B' }, // local_cafe
  education: { glyph: 0xe80c, tint: '#3D7BE0' }, // school
  travel: { glyph: 0xe539, tint: '#3D7BE0' }, // flight
  emergency: { glyph: 0xf109, tint: '#E2574C' }, // medical_services
  other: { glyph: 0xe574, tint: '#7A8981' }, // category
} satisfies Record<string, { glyph: number; tint: string }>;

export type IconName = keyof typeof icons;

/** Wallet icons a user can pick in the wallet form. */
export const walletIconChoices: IconName[] = ['food', 'transport', 'shopping', 'entertainment', 'savings', 'emergency', 'home', 'coffee', 'bill', 'education', 'travel', 'wallet'];
/** Tile accents a user can pick in the wallet form. */
export const walletColorChoices = ['#E2574C', '#3D7BE0', '#8B5CF6', '#2E9B5F', '#F2994A', '#E0577A'];

// Seeded rows store text glyphs; map them to icons so older data keeps a sensible look.
const categoryGlyphs: Record<string, IconName> = { '🍜': 'food', '↗': 'transport', '▣': 'shopping', '♫': 'entertainment', '▤': 'bill', '♡': 'health', '↙': 'salary', '✦': 'bonus', '+': 'other', '•••': 'other' };
const walletGlyphs: Record<string, IconName> = { '⌂': 'home', '↗': 'transport', '☕': 'coffee', '✦': 'savings', '▣': 'shopping', '♡': 'health', '♫': 'entertainment', '◉': 'wallet' };
const isIconName = (value: string): value is IconName => value in icons;

export function categoryIcon(icon: string): IconName { return isIconName(icon) ? icon : categoryGlyphs[icon] ?? 'other'; }
export function walletIcon(icon: string): IconName { return isIconName(icon) ? icon : walletGlyphs[icon] ?? 'wallet'; }
/** Older wallets stored pastel backgrounds; only the accent palette is used as a tint. */
export function walletTint(wallet: { icon: string; color: string }) { return walletColorChoices.includes(wallet.color) ? wallet.color : icons[walletIcon(wallet.icon)].tint; }

/**
 * Draws the glyph as centered text with font scaling and font padding disabled, so icons keep
 * their size and stay centered in their box regardless of the device's text-size setting.
 */
export function AppIcon({ name, size = 22, color, style }: { name: IconName; size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  const c = useTheme();
  return <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]} accessible={false} importantForAccessibility="no-hide-descendants">
    <Text allowFontScaling={false} style={{ fontFamily: IconFontFamily, fontSize: size, lineHeight: size, width: size, height: size, textAlign: 'center', textAlignVertical: 'center', includeFontPadding: false, color: color ?? c.text }}>{String.fromCharCode(icons[name].glyph)}</Text>
  </View>;
}

/** Rounded square with a soft tint of the accent, as used for categories, wallets, and menu rows. */
export function IconTile({ name, tint, size = 40, iconSize, radius }: { name: IconName; tint?: string; size?: number; iconSize?: number; radius?: number }) {
  const c = useTheme();
  const accent = tint ?? icons[name].tint;
  const alpha = c.statusBarStyle === 'light-content' ? '33' : '1F';
  return <View style={{ width: size, height: size, borderRadius: radius ?? size * 0.32, backgroundColor: `${accent}${alpha}`, alignItems: 'center', justifyContent: 'center' }}><AppIcon name={name} size={iconSize ?? size * 0.52} color={accent} /></View>;
}
