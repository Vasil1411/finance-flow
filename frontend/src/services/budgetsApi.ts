
import { apiSlice } from './api';
import {type  Budget } from '../types/budget';

export const budgetApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // ==================== BUDGETS ====================
    getBudgets: builder.query<Budget[], void>({
      query: () => 'budgets/',
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
  useGetBudgetByIdQuery,
  useAddBudgetMutation,
  useUpdateBudgetMutation,
  useDeleteBudgetMutation,
} = budgetApi;