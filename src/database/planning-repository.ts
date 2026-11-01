import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category, EntryType, Wallet } from './types';
import { isValidISODate, todayISO } from './format';
import { getCategories, walletBalanceSql } from './repository';

export type BudgetRow = { id: number; category_id: number; category_name: string; icon: string; color: string; period: string; amount: number; spent: number };
export type GoalRow = { id: number; wallet_id: number; wallet_name: string; icon: string; color: string; title: string; target_amount: number; target_date: string | null; balance: number };
export type RecurringRow = { id: number; type: EntryType; wallet_id: number; category_id: number; amount: number; note: string; frequency: 'daily' | 'weekly' | 'monthly'; next_date: string; end_date: string | null; is_active: number; wallet_name: string; category_name: string; category_icon: string };
const now = () => new Date().toISOString();
const validPeriod = (p: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(p);

export async function getBudgets(db: SQLiteDatabase, period: string): Promise<BudgetRow[]> {
  if (!validPeriod(period)) throw new Error('Periode anggaran tidak valid.');
  return db.getAllAsync<BudgetRow>(`SELECT b.*, c.name AS category_name, c.icon, c.color,
    COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.category_id=b.category_id AND t.type='expense' AND substr(t.transaction_date,1,7)=b.period),0) AS spent
    FROM budgets b JOIN categories c ON c.id=b.category_id WHERE b.period=? ORDER BY c.name`, period);
}
export async function saveBudget(db: SQLiteDatabase, categoryId: number, period: string, amount: number, id?: number) {
  if (!Number.isInteger(categoryId) || categoryId <= 0 || !validPeriod(period) || !Number.isSafeInteger(amount) || amount <= 0) throw new Error('Kategori, periode, dan nominal anggaran harus valid.');
  const cat = await db.getFirstAsync<{ id: number }>("SELECT id FROM categories WHERE id=? AND type='expense'", categoryId);
  if (!cat) throw new Error('Anggaran hanya dapat memakai kategori pengeluaran yang tersedia.');
  const stamp = now();
  if (id) {
    const r = await db.runAsync('UPDATE budgets SET category_id=?,period=?,amount=?,updated_at=? WHERE id=?', categoryId, period, amount, stamp, id);
    if (!r.changes) throw new Error('Anggaran tidak ditemukan.');
  } else await db.runAsync('INSERT INTO budgets(category_id,period,amount,created_at,updated_at) VALUES(?,?,?,?,?)', categoryId, period, amount, stamp, stamp);
}
export async function deleteBudget(db: SQLiteDatabase, id: number) { await db.runAsync('DELETE FROM budgets WHERE id=?', id); }

export async function getGoals(db: SQLiteDatabase): Promise<GoalRow[]> {
  return db.getAllAsync<GoalRow>(`SELECT g.*, w.name AS wallet_name,w.icon,w.color,
    ${walletBalanceSql} AS balance
    FROM savings_goals g JOIN wallets w ON w.id=g.wallet_id ORDER BY g.target_date IS NULL,g.target_date`);
}
export async function saveGoal(db: SQLiteDatabase, input: { wallet_id: number; title: string; target_amount: number; target_date: string | null }, id?: number) {
  if (!Number.isInteger(input.wallet_id) || input.wallet_id <= 0 || !input.title.trim() || !Number.isSafeInteger(input.target_amount) || input.target_amount <= 0 || (input.target_date !== null && !isValidISODate(input.target_date))) throw new Error('Periksa nama, kantong, target, dan tanggal target.');
  const wallet = await db.getFirstAsync<{ id: number }>('SELECT id FROM wallets WHERE id=?', input.wallet_id);
  if (!wallet) throw new Error('Kantong target tidak ditemukan.');
  const stamp = now();
  if (id) {
    const r = await db.runAsync('UPDATE savings_goals SET wallet_id=?,title=?,target_amount=?,target_date=?,updated_at=? WHERE id=?', input.wallet_id, input.title.trim(), input.target_amount, input.target_date, stamp, id);
    if (!r.changes) throw new Error('Target tabungan tidak ditemukan.');
  } else await db.runAsync('INSERT INTO savings_goals(wallet_id,title,target_amount,target_date,created_at,updated_at) VALUES(?,?,?,?,?,?)', input.wallet_id, input.title.trim(), input.target_amount, input.target_date, stamp, stamp);
}
export async function deleteGoal(db: SQLiteDatabase, id: number) { await db.runAsync('DELETE FROM savings_goals WHERE id=?', id); }

export async function getRecurring(db: SQLiteDatabase): Promise<RecurringRow[]> {
  return db.getAllAsync<RecurringRow>(`SELECT r.*,w.name AS wallet_name,c.name AS category_name,c.icon AS category_icon FROM recurring_transactions r JOIN wallets w ON w.id=r.wallet_id JOIN categories c ON c.id=r.category_id ORDER BY r.is_active DESC,r.next_date`);
}
export type RecurringInput = { type: EntryType; wallet_id: number; category_id: number; amount: number; note: string; frequency: RecurringRow['frequency']; next_date: string; end_date: string | null };
export async function saveRecurring(db: SQLiteDatabase, input: RecurringInput, id?: number) {
  if (!['income','expense'].includes(input.type) || !Number.isInteger(input.wallet_id) || !Number.isInteger(input.category_id) || !Number.isSafeInteger(input.amount) || input.amount <= 0 || !['daily','weekly','monthly'].includes(input.frequency) || !isValidISODate(input.next_date) || (input.end_date !== null && (!isValidISODate(input.end_date) || input.end_date < input.next_date))) throw new Error('Periksa jenis, kategori, kantong, nominal, frekuensi, dan tanggal jadwal.');
  const category = await db.getFirstAsync<{ id: number }>('SELECT id FROM categories WHERE id=? AND type=?', input.category_id, input.type);
  const wallet = await db.getFirstAsync<{ id: number }>('SELECT id FROM wallets WHERE id=?', input.wallet_id);
  if (!category) throw new Error('Kategori tidak sesuai dengan jenis transaksi.');
  if (!wallet) throw new Error('Kantong tidak ditemukan.');
  const stamp = now();
  if (id) {
    const r = await db.runAsync('UPDATE recurring_transactions SET type=?,wallet_id=?,category_id=?,amount=?,note=?,frequency=?,next_date=?,end_date=?,updated_at=? WHERE id=?', input.type,input.wallet_id,input.category_id,input.amount,input.note.trim(),input.frequency,input.next_date,input.end_date,stamp,id);
    if (!r.changes) throw new Error('Jadwal transaksi tidak ditemukan.');
  } else await db.runAsync('INSERT INTO recurring_transactions(type,wallet_id,category_id,amount,note,frequency,next_date,end_date,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?)', input.type,input.wallet_id,input.category_id,input.amount,input.note.trim(),input.frequency,input.next_date,input.end_date,stamp,stamp);
}
export async function setRecurringActive(db: SQLiteDatabase, id: number, active: boolean) { await db.runAsync('UPDATE recurring_transactions SET is_active=?,updated_at=? WHERE id=?', active ? 1 : 0, now(), id); }
export async function deleteRecurring(db: SQLiteDatabase, id: number) { await db.runAsync('DELETE FROM recurring_transactions WHERE id=?', id); }

function addOccurrence(date: string, frequency: RecurringRow['frequency']) {
  const [y,m,d] = date.split('-').map(Number);
  if (frequency === 'monthly') {
    const monthIndex = y * 12 + m;
    const nextYear = Math.floor(monthIndex / 12), nextMonth = monthIndex % 12 + 1;
    const last = new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate();
    return `${nextYear}-${String(nextMonth).padStart(2,'0')}-${String(Math.min(d,last)).padStart(2,'0')}`;
  }
  const dt = new Date(Date.UTC(y,m-1,d + (frequency === 'weekly' ? 7 : 1)));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;
}

/** Posts due occurrences and advances each schedule in one exclusive transaction. */
export async function processDueRecurring(db: SQLiteDatabase, throughDate = todayISO()) {
  if (!isValidISODate(throughDate)) throw new Error('Tanggal pemrosesan jadwal tidak valid.');
  let created = 0;
  await db.withExclusiveTransactionAsync(async tx => {
    const rows = await tx.getAllAsync<RecurringRow>('SELECT * FROM recurring_transactions WHERE is_active=1 AND next_date<=? ORDER BY next_date,id', throughDate);
    for (const row of rows) {
      let date = row.next_date;
      let processed = 0;
      while (date <= throughDate && processed < 100) {
        if (!row.end_date || date <= row.end_date) {
          const existing = await tx.getFirstAsync<{ id: number }>('SELECT id FROM recurring_occurrences WHERE recurring_id=? AND occurrence_date=?', row.id, date);
          if (!existing) {
            const stamp = now();
            const result = await tx.runAsync('INSERT INTO transactions(wallet_id,category_id,type,amount,note,transaction_date,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)', row.wallet_id,row.category_id,row.type,row.amount,row.note,date,stamp,stamp);
            await tx.runAsync('INSERT INTO recurring_occurrences(recurring_id,occurrence_date,transaction_id) VALUES(?,?,?)', row.id,date,result.lastInsertRowId);
            created++;
          }
        }
        processed++;
        date = addOccurrence(date,row.frequency);
      }
      const done = Boolean(row.end_date && date > row.end_date);
      await tx.runAsync('UPDATE recurring_transactions SET next_date=?,is_active=?,updated_at=? WHERE id=?',date,done ? 0 : 1,now(),row.id);
    }
  });
  return created;
}

export async function getExpenseCategories(db: SQLiteDatabase) { return getCategories(db,'expense'); }
export async function getIncomeExpenseCategories(db: SQLiteDatabase, type: EntryType): Promise<Category[]> { return getCategories(db,type); }
export async function getPlanningWallets(db: SQLiteDatabase): Promise<Wallet[]> { return db.getAllAsync<Wallet>('SELECT * FROM wallets ORDER BY id'); }

/**
 * Returns goals that reached their target since the last call, so the app can celebrate each once.
 * Goals that fall back below target are forgotten and can be celebrated again. On the first call
 * the current state is recorded without celebrating goals that were already reached before.
 */
export async function claimNewlyReachedGoals(db: SQLiteDatabase): Promise<GoalRow[]> {
  const reached = (await getGoals(db)).filter((goal) => goal.balance >= goal.target_amount);
  const stored = await db.getFirstAsync<{ value: string }>("SELECT value FROM app_settings WHERE key='celebrated_goals'");
  const celebrated = new Set<number>(stored ? JSON.parse(stored.value) : reached.map((goal) => goal.id));
  const fresh = stored ? reached.filter((goal) => !celebrated.has(goal.id)) : [];
  await db.runAsync("INSERT INTO app_settings(key,value) VALUES('celebrated_goals',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", JSON.stringify(reached.map((goal) => goal.id)));
  return fresh;
}
