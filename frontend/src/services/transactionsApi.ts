import { apiSlice } from './api';
import { type Transaction } from '../types/transaction';

export const transactionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // ==================== Transactions ====================
    getTransactions: builder.query<Transaction[], void>({
      query: () => 'transactions/',
      providesTags: ['Transaction'],
    }),

    getTransactionById: builder.query<Transaction, number>({
      query: (id) => `transactions/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Transaction', id }],
    }),

    addTransaction: builder.mutation<Transaction, Partial<Transaction>>({
      query: (newTransaction) => ({
        url: 'transactions/',
        method: 'POST',
        body: newTransaction,
      }),
      invalidatesTags: ['Transaction'],
    }),

    updateTransaction: builder.mutation<Transaction, { id: number; data: Partial<Transaction> }>({
      query: ({ id, data }) => ({
        url: `transactions/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Transaction', id }, 'Transaction'],
    }),

    deleteTransaction: builder.mutation<number, number>({
      query: (id) => ({
        url: `transactions/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Transaction'],
    }),
    
  }), 
}); 


export const {
  useGetTransactionsQuery,
  useGetTransactionByIdQuery,
  useAddTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
} = transactionApi;