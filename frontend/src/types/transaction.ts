export type TransactionType = 'INCOME' | 'EXPENSE';

export type RuleChoice = 'NEED' | 'WANT' | 'SAVINGS' | 'NONE';

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  allocation_type: RuleChoice;
}

export interface Transaction {
  id: number;
  category: number | null; 
  category_name?: string; 
  amount: number;
  type: TransactionType;
  date: string; // YYYY-MM-DD
  description?: string;
  created_at?: string;
  items?: any;
}

export interface TransactionQueryParams {
  year?: string | number;
  month?: string;
  start_date?: string;
  end_date?: string;
  category?: number | string;
  type?: TransactionType | 'ALL';
}