import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import * as ImagePicker from 'expo-image-picker';
import { isValidISODate, todayISO } from '@/database/format';

export type ReceiptDraft = { amount?: number; date?: string; note?: string };

export class ReceiptScanError extends Error {
  constructor(public kind: 'unsupported' | 'permission', message: string) { super(message); }
}

// Loaded optionally (instead of importing expo-text-extractor) so Expo Go and web, which lack the
// native OCR module, still open the app and get a friendly message instead of crashing at startup.
const textExtractor = requireOptionalNativeModule<{ isSupported: boolean; extractTextFromImage: (path: string) => Promise<string[]> }>('ExpoTextExtractor');

/**
 * Opens the camera, reads the receipt on-device (ML Kit / Apple Vision, nothing leaves the phone)
 * and guesses the total, date and store name. Returns null when the user cancels the camera.
 */
export async function scanReceipt(): Promise<ReceiptDraft | null> {
  if (Platform.OS === 'web' || !textExtractor?.isSupported) throw new ReceiptScanError('unsupported', 'Scan struk butuh aplikasi versi development build atau rilis, belum bisa di Expo Go atau web.');
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) throw new ReceiptScanError('permission', 'Izinkan akses kamera di pengaturan HP untuk memotret struk.');
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.9 });
  if (result.canceled || !result.assets?.length) return null;
  const texts = await textExtractor.extractTextFromImage(result.assets[0].uri.replace('file://', ''));
  return parseReceipt(texts.flatMap((text) => text.split('\n')).map((line) => line.trim()).filter(Boolean));
}

const totalLabel = /\b(grand\s*total|total\s*(belanja|bayar|harga|tagihan)?|jumlah\s*(bayar|total)?|tagihan|amount\s*due)\b/i;
const notTotalLabel = /\b(sub\s*-?\s*total|total\s*(item|qty|disc|diskon|hemat)|tunai|cash|kembali|change|bayar\s*tunai|ppn|pajak|tax|diskon|disc)\b/i;
// Cash handed over and change are not what was spent; card/QRIS lines carry the real total, so they stay.
const paymentLine = /\b(tunai|cash|kembali(an)?|change)\b/i;

/** Money values in a line, read as Indonesian rupiah ("25.000", "25,000", "Rp25.000,00"). */
function amountsIn(line: string): number[] {
  return (line.match(/\d[\d.,]*\d|\d/g) ?? []).flatMap((token) => {
    // Drop a two-digit decimal part (",00" / ".00") when what remains still looks like rupiah.
    const whole = token.replace(/[.,]\d{2}$/, (cents, offset) => (offset >= 3 || /[.,]/.test(token.slice(0, offset)) ? '' : cents));
    // Thousand separators only: every group after the first must have exactly three digits.
    if (/[.,]/.test(whole) && !/^\d{1,3}([.,]\d{3})+$/.test(whole)) return [];
    const value = Number(whole.replace(/\D/g, ''));
    return value >= 100 && value <= 100_000_000 ? [value] : [];
  });
}

function findTotal(lines: string[]) {
  for (const preferGrand of [true, false]) {
    for (let i = lines.length - 1; i >= 0; i -= 1) {
      const line = lines[i];
      if (!totalLabel.test(line) || notTotalLabel.test(line) || (preferGrand && !/grand/i.test(line))) continue;
      // OCR often puts the value on the label's line, otherwise on the next one.
      const value = amountsIn(line).at(-1) ?? amountsIn(lines[i + 1] ?? '').at(-1);
      if (value) return value;
    }
  }
  // No readable label: the largest price that is not cash handed over or change is usually the total.
  const candidates = lines.filter((line) => !paymentLine.test(line) && !/\d{2}[/.-]\d{2}[/.-]\d{2,4}|\d{2}:\d{2}|telp|hp|npwp|no\.?\s*\d/i.test(line)).flatMap(amountsIn);
  return candidates.length ? Math.max(...candidates) : undefined;
}

const months: Record<string, number> = { jan: 1, feb: 2, peb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, agu: 8, agt: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12 };

function findDate(lines: string[]) {
  const today = todayISO();
  for (const line of lines) {
    let year: number | undefined, month: number | undefined, day: number | undefined;
    const iso = line.match(/\b(20\d{2})[/.-](\d{1,2})[/.-](\d{1,2})\b/);
    const numeric = line.match(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})\b/);
    const named = line.match(/\b(\d{1,2})[\s-]*([a-z]{3})[a-z]*[\s-]*(\d{2,4})\b/i);
    if (iso) [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
    else if (numeric) [day, month, year] = [Number(numeric[1]), Number(numeric[2]), Number(numeric[3])]; // Indonesian receipts are day-first.
    else if (named && months[named[2].toLowerCase()]) [day, month, year] = [Number(named[1]), months[named[2].toLowerCase()], Number(named[3])];
    if (!year || !month || !day) continue;
    if (year < 100) year += 2000;
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    if (isValidISODate(date) && date <= today) return date;
  }
  return undefined;
}

/** The store name is normally one of the first lines: mostly letters, not an address or receipt heading. */
function findStore(lines: string[]) {
  const store = lines.slice(0, 5).find((line) => {
    const letters = line.replace(/[^a-z]/gi, '').length;
    return letters >= 3 && letters / line.length > 0.6 && !/\b(jl|jln|jalan|telp|tel|npwp|struk|receipt|nota|kasir|cashier|no)\b\.?/i.test(line);
  });
  return store ? store.slice(0, 40) : undefined;
}

export function parseReceipt(lines: string[]): ReceiptDraft {
  return { amount: findTotal(lines), date: findDate(lines), note: findStore(lines) };
}
