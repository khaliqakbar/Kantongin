export type EntryType = 'income' | 'expense';
export type WalletKind = 'spending' | 'saving';

export type Category = { id: number; name: string; type: EntryType; icon: string; color: string };
export type Wallet = {
  id: number;
  name: string;
  type: string;
  initial_balance: number;
  icon: string;
  color: string;
  kind: WalletKind;
  target_amount: number | null;
  created_at: string;
  balance?: number;
  spent_this_month?: number;
};
export type Transaction = {
  id: number;
  wallet_id: number;
  category_id: number;
  type: EntryType;
  amount: number;
  note: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  wallet_name: string;
  wallet_icon: string;
  wallet_color: string;
  category_name: string;
  category_icon: string;
  category_color: string;
};

export type Transfer = {
  id: number;
  from_wallet_id: number;
  to_wallet_id: number;
  amount: number;
  note: string;
  transfer_date: string;
  created_at: string;
  from_wallet_name: string;
  to_wallet_name: string;
};

export type WalletInput = Pick<Wallet, 'name' | 'initial_balance' | 'icon' | 'color' | 'kind' | 'target_amount'>;
export type TransferInput = Pick<Transfer, 'from_wallet_id' | 'to_wallet_id' | 'amount' | 'note' | 'transfer_date'>;
export type TransactionInput = Pick<Transaction, 'wallet_id' | 'category_id' | 'type' | 'amount' | 'note' | 'transaction_date'>;
