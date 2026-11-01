export const rupiah = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
export const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
/** Moves a local YYYY-MM-DD date by whole days (negative goes back). */
export const shiftDateISO = (iso: string, days: number) => { const [y, m, d] = iso.split('-').map(Number); const next = new Date(y, m - 1, d + days); return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`; };
export const parseRupiah = (value: string) => Number(value.replace(/\D/g, '')) || 0;

export function isValidISODate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day;
}

const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

/** "2026-10-14" → "Rabu, 14 Okt 2026" (or "14 Oktober 2026" without weekday and with full month). */
export function formatDate(iso: string, options: { weekday?: boolean; fullMonth?: boolean } = {}) {
  if (!isValidISODate(iso)) return iso;
  const [year, month, day] = iso.split('-').map(Number);
  const monthName = options.fullMonth ? monthNames[month - 1] : monthNames[month - 1].slice(0, 3);
  const text = `${day} ${monthName} ${year}`;
  return options.weekday ? `${dayNames[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]}, ${text}` : text;
}

/** "2026-10" → "Oktober 2026". */
export function formatPeriod(period: string) {
  const [year, month] = period.split('-').map(Number);
  return monthNames[month - 1] ? `${monthNames[month - 1]} ${year}` : period;
}

export function shiftPeriod(period: string, delta: number) {
  const [year, month] = period.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export const currentPeriod = () => todayISO().slice(0, 7);

/** Digits-only input state → "1.250.000" for display inside amount fields. */
export const formatThousands = (digits: string) => (digits ? new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Number(digits)) : '');
