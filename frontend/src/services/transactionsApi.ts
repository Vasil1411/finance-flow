import { apiSlice } from './api';
import { type Transaction, type TransactionQueryParams } from '../types/transaction';

export const transactionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // ==================== Transactions ====================
    getTransactions: builder.query<Transaction[], TransactionQueryParams | void>({
      query: (params) => {
        if (!params) {
          return 'transactions/';
        }
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.set(key, String(value));
          }
        });
        const qs = searchParams.toString();
        return qs ? `transactions/?${qs}` : 'transactions/';
      },
      providesTags: ['Transaction'],
    }),

    getTransactionById: builder.query<Transaction, number>({
      query: (id) => `transactions/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Transaction', id }],
    }),

    addTransaction: builder.mutation<Transaction, Partial<Transaction> | FormData>({
      query: (newTransaction) => ({
        url: 'transactions/',
        method: 'POST',
        body: newTransaction,
      }),
      invalidatesTags: ['Transaction', 'Budget'],
    }),

    updateTransaction: builder.mutation<Transaction, { id: number; data: Partial<Transaction> | FormData }>({
      query: ({ id, data }) => ({
        url: `transactions/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Transaction', id },
        'Transaction',
        'Budget',
      ],
    }),

    deleteTransaction: builder.mutation<number, number>({
      query: (id) => ({
        url: `transactions/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Transaction', 'Budget', 'SavingGoal'],
    }),

    // 🧾 Нов ендпойнт за AI сканиране на касови бележки и фактури
    parseReceipt: builder.mutation<any, File>({
      query: (file) => {
        const formData = new FormData();
        formData.append('receipt_file', file);
        return {
          url: 'transactions/parse-receipt/',
          method: 'POST',
          body: formData,
        };
      },
    }),
  }),
});

export const {
  useGetTransactionsQuery,
  useGetTransactionByIdQuery,
  useAddTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useParseReceiptMutation,
} = transactionApi;