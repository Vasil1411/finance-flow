export type TransactionType = 'Income' | 'Expense';

export type RuleChoice = 'NEED' | 'WANT' | 'SAVINGS' | 'NONE';


export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  allocation_type: RuleChoice;
}

export interface Transaction {
  id: number;
  category: number; // ID of the category
  category_name?: string; //  (read-only)
  amount: number;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  description?: string;
  created_at?: string;
}