import type { SQLiteDatabase } from 'expo-sqlite';

export async function initializeDatabase(db: SQLiteDatabase) {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
  const current = await db.getFirstAsync<{ version: number }>('SELECT MAX(version) AS version FROM schema_migrations');
  if ((current?.version ?? 0) < 1) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
          icon TEXT NOT NULL,
          color TEXT NOT NULL,
          UNIQUE(name, type)
        );
        CREATE TABLE IF NOT EXISTS wallets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'Umum',
          initial_balance INTEGER NOT NULL DEFAULT 0 CHECK (initial_balance >= 0),
          icon TEXT NOT NULL DEFAULT '◉',
          color TEXT NOT NULL DEFAULT '#E4EFE6',
          created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
          category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
          type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
          amount INTEGER NOT NULL CHECK (amount > 0),
          note TEXT NOT NULL DEFAULT '',
          transaction_date TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC, id DESC);
        CREATE INDEX IF NOT EXISTS idx_transactions_wallet_date ON transactions(wallet_id, transaction_date DESC);
        CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category_id);
      `);
      await tx.runAsync('INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (1, ?)', new Date().toISOString());
    });
  }
  if ((current?.version ?? 0) < 2) {
  const categoryCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM categories');
  if ((categoryCount?.count ?? 0) === 0) {
    const categories = [
      ['Gaji', 'income', '↙', '#E4EFE6'], ['Bonus', 'income', '✦', '#E0EBEF'], ['Lainnya', 'income', '+', '#E8E5F4'],
      ['Makan', 'expense', '🍜', '#F9E9D9'], ['Transportasi', 'expense', '↗', '#E0EBEF'], ['Belanja', 'expense', '▣', '#E8E5F4'],
      ['Hiburan', 'expense', '♫', '#E8E5F4'], ['Tagihan', 'expense', '▤', '#F9E9D9'], ['Kesehatan', 'expense', '♡', '#E4EFE6'], ['Lainnya', 'expense', '•••', '#E4EFE6'],
    ];
    for (const [name, type, icon, color] of categories) {
      await db.runAsync('INSERT OR IGNORE INTO categories(name, type, icon, color) VALUES (?, ?, ?, ?)', name, type, icon, color);
    }
  }
  const walletCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM wallets');
  if ((walletCount?.count ?? 0) === 0) {
    const wallets = [
      ['Kebutuhan', 'Harian', '⌂', '#E4EFE6'],
      ['Transportasi', 'Harian', '↗', '#E0EBEF'],
      ['Nongkrong', 'Hiburan', '☕', '#E8E5F4'],
      ['Tabungan', 'Simpanan', '✦', '#E0EBEF'],
    ];
    for (const [name, type, icon, color] of wallets) {
      await db.runAsync('INSERT INTO wallets(name, type, initial_balance, icon, color, created_at) VALUES (?, ?, 0, ?, ?, ?)', name, type, icon, color, new Date().toISOString());
    }
  }
  await db.runAsync('INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (2, ?)', new Date().toISOString());
  }
  if ((current?.version ?? 0) < 3) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(`
        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `);
      await tx.runAsync("INSERT OR IGNORE INTO app_settings(key, value) VALUES ('onboarding_completed', '0')");
      await tx.runAsync('INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (3, ?)', new Date().toISOString());
    });
  }
  if ((current?.version ?? 0) < 4) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      await tx.execAsync(`
        CREATE TABLE IF NOT EXISTS budgets (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
          period TEXT NOT NULL,
          amount INTEGER NOT NULL CHECK (amount > 0),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          UNIQUE(category_id, period)
        );
        CREATE INDEX IF NOT EXISTS idx_budgets_period ON budgets(period, category_id);
        CREATE TABLE IF NOT EXISTS savings_goals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          wallet_id INTEGER NOT NULL UNIQUE REFERENCES wallets(id) ON DELETE CASCADE,
          title TEXT NOT NULL,
          target_amount INTEGER NOT NULL CHECK (target_amount > 0),
          target_date TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS recurring_transactions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
          wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
          category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
          amount INTEGER NOT NULL CHECK (amount > 0),
          note TEXT NOT NULL DEFAULT '',
          frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
          next_date TEXT NOT NULL,
          end_date TEXT,
          is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_recurring_due ON recurring_transactions(is_active, next_date);
        CREATE TABLE IF NOT EXISTS recurring_occurrences (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          recurring_id INTEGER NOT NULL REFERENCES recurring_transactions(id) ON DELETE CASCADE,
          occurrence_date TEXT NOT NULL,
          transaction_id INTEGER REFERENCES transactions(id) ON DELETE SET NULL,
          UNIQUE(recurring_id, occurrence_date)
        );
      `);
      await tx.runAsync('INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (4, ?)', new Date().toISOString());
    });
  }
  if ((current?.version ?? 0) < 5) {
    await db.withExclusiveTransactionAsync(async (tx) => {
      // target_amount: monthly spending cap for 'spending' wallets, balance goal for 'saving' wallets.
      await tx.execAsync(`
        ALTER TABLE wallets ADD COLUMN kind TEXT NOT NULL DEFAULT 'spending' CHECK (kind IN ('spending', 'saving'));
        ALTER TABLE wallets ADD COLUMN target_amount INTEGER CHECK (target_amount IS NULL OR target_amount > 0);
        UPDATE wallets SET kind = 'saving' WHERE type = 'Simpanan';
        CREATE TABLE IF NOT EXISTS transfers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          from_wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
          to_wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
          amount INTEGER NOT NULL CHECK (amount > 0),
          note TEXT NOT NULL DEFAULT '',
          transfer_date TEXT NOT NULL,
          created_at TEXT NOT NULL,
          CHECK (from_wallet_id <> to_wallet_id)
        );
        CREATE INDEX IF NOT EXISTS idx_transfers_from ON transfers(from_wallet_id, transfer_date DESC);
        CREATE INDEX IF NOT EXISTS idx_transfers_to ON transfers(to_wallet_id, transfer_date DESC);
      `);
      await tx.runAsync('INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (5, ?)', new Date().toISOString());
    });
  }
}
