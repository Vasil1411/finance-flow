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

    addTransaction: builder.mutation<Transaction, Partial<Transaction> | FormData>({
      query: (newTransaction) => ({
        url: 'transactions/',
        method: 'POST',
        // Ако подаваме FormData (заради receipt_file), fetch автоматично задава правилния multipart/form-data хедър
        body: newTransaction,
      }),
      invalidatesTags: ['Transaction'],
    }),

    updateTransaction: builder.mutation<Transaction, { id: number; data: Partial<Transaction> | FormData }>({
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
  useParseReceiptMutation, // Извличаме новия hook
} = transactionApi;