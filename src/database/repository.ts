import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category, EntryType, Transaction, TransactionInput, Transfer, TransferInput, Wallet, WalletInput, WalletKind } from './types';
import { isValidISODate } from './format';

export type TransactionSaveFailureKind = 'validation' | 'category' | 'wallet' | 'foreign-key' | 'database' | 'unknown';

export class TransactionSaveError extends Error {
  constructor(public readonly kind: TransactionSaveFailureKind, message: string) {
    super(message);
    this.name = 'TransactionSaveError';
  }
}

function describeError(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error);
}

export async function getCategories(db: SQLiteDatabase, type?: EntryType) {
  return type
    ? db.getAllAsync<Category>('SELECT * FROM categories WHERE type = ? ORDER BY id', type)
    : db.getAllAsync<Category>('SELECT * FROM categories ORDER BY type, id');
}

/** Balance of the wallet aliased `w`: initial balance, transactions, and transfers in/out. */
export const walletBalanceSql = `(w.initial_balance
  + COALESCE((SELECT SUM(CASE WHEN t.type='income' THEN t.amount ELSE -t.amount END) FROM transactions t WHERE t.wallet_id = w.id), 0)
  + COALESCE((SELECT SUM(tf.amount) FROM transfers tf WHERE tf.to_wallet_id = w.id), 0)
  - COALESCE((SELECT SUM(tf.amount) FROM transfers tf WHERE tf.from_wallet_id = w.id), 0))`;

export const currentMonth = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; };

export const walletKindLabel: Record<WalletKind, string> = { spending: 'Pengeluaran', saving: 'Tabungan' };

export async function getWallets(db: SQLiteDatabase) {
  return db.getAllAsync<Wallet>(`SELECT w.*, ${walletBalanceSql} AS balance,
    COALESCE((SELECT SUM(t.amount) FROM transactions t WHERE t.wallet_id = w.id AND t.type = 'expense' AND substr(t.transaction_date, 1, 7) = ?), 0) AS spent_this_month
    FROM wallets w ORDER BY w.id`, currentMonth());
}

/** Spending wallets compare this month's expenses to the cap; saving wallets compare balance to the goal. */
export function walletTargetProgress(wallet: Wallet) {
  if (!wallet.target_amount) return null;
  const current = wallet.kind === 'saving' ? Math.max(0, wallet.balance ?? wallet.initial_balance) : wallet.spent_this_month ?? 0;
  return { current, target: wallet.target_amount, ratio: current / wallet.target_amount };
}

const transactionSelect = `SELECT t.*, w.name AS wallet_name, w.icon AS wallet_icon, w.color AS wallet_color,
  c.name AS category_name, c.icon AS category_icon, c.color AS category_color
  FROM transactions t JOIN wallets w ON w.id=t.wallet_id JOIN categories c ON c.id=t.category_id`;

export async function getTransactions(db: SQLiteDatabase, options: { walletId?: number; from?: string; to?: string; query?: string; type?: EntryType; limit?: number } = {}) {
  const clauses: string[] = [];
  const params: (string | number)[] = [];
  if (options.walletId) { clauses.push('t.wallet_id = ?'); params.push(options.walletId); }
  if (options.from) { clauses.push('t.transaction_date >= ?'); params.push(options.from); }
  if (options.to) { clauses.push('t.transaction_date <= ?'); params.push(options.to); }
  if (options.type) { clauses.push('t.type = ?'); params.push(options.type); }
  if (options.query?.trim()) { clauses.push('(t.note LIKE ? OR c.name LIKE ?)'); const q = `%${options.query.trim()}%`; params.push(q, q); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = options.limit ? 'LIMIT ?' : '';
  if (options.limit) params.push(options.limit);
  return db.getAllAsync<Transaction>(`${transactionSelect} ${where} ORDER BY t.transaction_date DESC, t.id DESC ${limit}`, ...params);
}

export async function getTransaction(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Transaction>(`${transactionSelect} WHERE t.id = ?`, id);
}

export async function saveTransaction(db: SQLiteDatabase, input: TransactionInput, id?: number) {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0 || !Number.isInteger(input.wallet_id) || input.wallet_id <= 0 || !Number.isInteger(input.category_id) || input.category_id <= 0 || !isValidISODate(input.transaction_date) || (input.type !== 'income' && input.type !== 'expense')) {
    throw new TransactionSaveError('validation', 'Periksa kembali nominal, kategori, kantong, dan tanggal transaksi.');
  }
  try {
    const category = await db.getFirstAsync<{ id: number }>('SELECT id FROM categories WHERE id = ? AND type = ?', input.category_id, input.type);
    if (!category) throw new TransactionSaveError('category', 'Kategori tidak ditemukan atau tidak sesuai dengan jenis transaksi.');
    const wallet = await db.getFirstAsync<{ id: number }>('SELECT id FROM wallets WHERE id = ?', input.wallet_id);
    if (!wallet) throw new TransactionSaveError('wallet', 'Kantong yang dipilih tidak ditemukan.');
    const now = new Date().toISOString();
    const result = id
      ? await db.runAsync('UPDATE transactions SET wallet_id=?, category_id=?, type=?, amount=?, note=?, transaction_date=?, updated_at=? WHERE id=?', input.wallet_id, input.category_id, input.type, input.amount, input.note.trim(), input.transaction_date, now, id)
      : await db.runAsync('INSERT INTO transactions(wallet_id, category_id, type, amount, note, transaction_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', input.wallet_id, input.category_id, input.type, input.amount, input.note.trim(), input.transaction_date, now, now);
    if (result.changes !== 1) throw new TransactionSaveError('database', id ? 'Transaksi yang akan diperbarui tidak ditemukan.' : 'SQLite tidak menambahkan transaksi.');
  } catch (error) {
    if (error instanceof TransactionSaveError) throw error;
    const detail = describeError(error);
    if (/FOREIGN KEY constraint failed/i.test(detail)) {
      throw new TransactionSaveError('foreign-key', `Relasi kategori atau kantong ditolak oleh SQLite: ${detail}`);
    }
    throw new TransactionSaveError('database', `SQLite gagal menyimpan transaksi: ${detail}`);
  }
}

export async function deleteTransaction(db: SQLiteDatabase, id: number) { await db.runAsync('DELETE FROM transactions WHERE id = ?', id); }

export async function saveWallet(db: SQLiteDatabase, input: WalletInput, id?: number) {
  if (!input.name.trim() || !Number.isInteger(input.initial_balance) || input.initial_balance < 0) throw new Error('Nama dan saldo awal kantong harus valid.');
  if (input.kind !== 'spending' && input.kind !== 'saving') throw new Error('Tipe kantong tidak valid.');
  if (input.target_amount !== null && (!Number.isSafeInteger(input.target_amount) || input.target_amount <= 0)) throw new Error('Target kantong harus lebih besar dari nol.');
  const type = walletKindLabel[input.kind];
  if (id) await db.runAsync('UPDATE wallets SET name=?, type=?, kind=?, target_amount=?, initial_balance=?, icon=?, color=? WHERE id=?', input.name.trim(), type, input.kind, input.target_amount, input.initial_balance, input.icon, input.color, id);
  else await db.runAsync('INSERT INTO wallets(name, type, kind, target_amount, initial_balance, icon, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', input.name.trim(), type, input.kind, input.target_amount, input.initial_balance, input.icon, input.color, new Date().toISOString());
}

export async function deleteWallet(db: SQLiteDatabase, id: number) { await db.runAsync('DELETE FROM wallets WHERE id = ?', id); }

export async function getFinanceSummary(db: SQLiteDatabase) {
  const month = currentMonth();
  const [balance, period] = await Promise.all([
    db.getFirstAsync<{ total: number }>(`SELECT (SELECT COALESCE(SUM(initial_balance),0) FROM wallets) + (SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE -amount END),0) FROM transactions) AS total`),
    db.getFirstAsync<{ income: number; expense: number }>(`SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END),0) AS income, COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END),0) AS expense FROM transactions WHERE substr(transaction_date,1,7)=?`, month),
  ]);
  return { balance: balance?.total ?? 0, income: period?.income ?? 0, expense: period?.expense ?? 0 };
}

export async function getTransfers(db: SQLiteDatabase, walletId?: number) {
  const where = walletId ? 'WHERE tf.from_wallet_id = ? OR tf.to_wallet_id = ?' : '';
  return db.getAllAsync<Transfer>(`SELECT tf.*, wf.name AS from_wallet_name, wt.name AS to_wallet_name
    FROM transfers tf JOIN wallets wf ON wf.id = tf.from_wallet_id JOIN wallets wt ON wt.id = tf.to_wallet_id
    ${where} ORDER BY tf.transfer_date DESC, tf.id DESC`, ...(walletId ? [walletId, walletId] : []));
}

export async function saveTransfer(db: SQLiteDatabase, input: TransferInput) {
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0 || !Number.isInteger(input.from_wallet_id) || !Number.isInteger(input.to_wallet_id) || !isValidISODate(input.transfer_date)) {
    throw new Error('Periksa kembali nominal, kantong, dan tanggal transfer.');
  }
  if (input.from_wallet_id === input.to_wallet_id) throw new Error('Kantong asal dan tujuan harus berbeda.');
  await db.withExclusiveTransactionAsync(async (tx) => {
    const source = await tx.getFirstAsync<{ balance: number }>(`SELECT ${walletBalanceSql} AS balance FROM wallets w WHERE w.id = ?`, input.from_wallet_id);
    const target = await tx.getFirstAsync<{ id: number }>('SELECT id FROM wallets WHERE id = ?', input.to_wallet_id);
    if (!source || !target) throw new Error('Kantong asal atau tujuan tidak ditemukan.');
    if (source.balance < input.amount) throw new Error('Saldo kantong asal tidak mencukupi untuk transfer ini.');
    await tx.runAsync('INSERT INTO transfers(from_wallet_id, to_wallet_id, amount, note, transfer_date, created_at) VALUES (?, ?, ?, ?, ?, ?)', input.from_wallet_id, input.to_wallet_id, input.amount, input.note.trim(), input.transfer_date, new Date().toISOString());
  });
}

export async function deleteTransfer(db: SQLiteDatabase, id: number) { await db.runAsync('DELETE FROM transfers WHERE id = ?', id); }

/**
 * Brings every balance back to zero: deletes all transactions and transfers and clears each
 * wallet's initial balance. Wallets, categories, budgets, goals, and schedules are kept.
 */
export async function resetAllBalances(db: SQLiteDatabase) {
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync('DELETE FROM transfers');
    await tx.runAsync('DELETE FROM transactions');
    await tx.runAsync('UPDATE wallets SET initial_balance = 0');
  });
}
