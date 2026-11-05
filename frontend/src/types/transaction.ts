export type TransactionType = 'Income' | 'Expense';

export interface Transaction {
  id: number;
  name: string;
  category: string;
  date: string;
  amount: number;
  type: TransactionType;
}