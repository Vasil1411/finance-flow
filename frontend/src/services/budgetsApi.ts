import { apiSlice } from './api';
import { type Budget } from '../types/budget';

export interface BudgetSummaryItem {
  id: number;
  category_id: number;
  category_name: string;
  allocation_type: string;
  month: string;
  budget_amount: string;
  spent_amount: string;
  remaining_amount: string;
  usage_percentage: number;
  is_exceeded: boolean;
}

export interface RuleBucketItem {
  key: string;
  label: string;
  amount: string;
  actual_percentage_of_income: number;
  target_percentage: number;
  difference_percentage: number;
}

export interface BudgetSummaryResponse {
  month: string;
  totals: {
    income: string;
    expenses: string;
    net_balance: string;
    total_budgeted: string;
    total_spent_in_budgets: string;
    total_remaining_in_budgets: string;
  };
  budgets: BudgetSummaryItem[];
  rule_50_30_20: {
    needs: RuleBucketItem;
    wants: RuleBucketItem;
    savings: RuleBucketItem;
    unassigned: RuleBucketItem;
  };
}

export const budgetApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ==================== BUDGETS ====================
    getBudgets: builder.query<Budget[], void>({
      query: () => 'budgets/',
      providesTags: ['Budget'],
    }),

    getBudgetSummary: builder.query<BudgetSummaryResponse, string | void>({
      query: (month) => (month ? `budgets/summary/?month=${month}` : 'budgets/summary/'),
      providesTags: ['Budget'],
    }),

    getBudgetById: builder.query<Budget, number>({
      query: (id) => `budgets/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Budget', id }],
    }),

    addBudget: builder.mutation<Budget, Partial<Budget>>({
      query: (newBudget) => ({
        url: 'budgets/',
        method: 'POST',
        body: newBudget,
      }),
      invalidatesTags: ['Budget'],
    }),

    updateBudget: builder.mutation<Budget, { id: number; data: Partial<Budget> }>({
      query: ({ id, data }) => ({
        url: `budgets/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Budget', id }, 'Budget'],
    }),

    deleteBudget: builder.mutation<number, number>({
      query: (id) => ({
        url: `budgets/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Budget'],
    }),
  }),
});

export const {
  useGetBudgetsQuery,
  useGetBudgetSummaryQuery,
  useGetBudgetByIdQuery,
  useAddBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
} = budgetApi;