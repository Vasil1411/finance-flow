import { apiSlice } from './api';
import { type SavingGoal } from '../types/saving-goal';

export interface ContributeSavingGoalPayload {
  id: number;
  amount: number;
  date?: string;
  description?: string;
  category_id?: number;
  create_transaction?: boolean;
  use_reserve?: boolean;
  force?: boolean;
}

export interface SavingsReserveSummary {
  free_reserve: string;
  allocated_in_goals: string;
  total_wealth_with_goals: string;
  total_income_all_time: string;
  total_expenses_all_time: string;
}

export const savingGoalApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSavingGoals: builder.query<SavingGoal[], void>({
      query: () => 'saving-goals/',
      providesTags: ['SavingGoal'],
    }),

    getSavingsReserveSummary: builder.query<SavingsReserveSummary, void>({
      query: () => 'saving-goals/reserve-summary/',
      providesTags: ['SavingGoal', 'Transaction'],
    }),

    getSavingGoalById: builder.query<SavingGoal, number>({
      query: (id) => `saving-goals/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'SavingGoal', id }],
    }),

    addSavingGoal: builder.mutation<SavingGoal, Partial<SavingGoal>>({
      query: (newGoal) => ({
        url: 'saving-goals/',
        method: 'POST',
        body: newGoal,
      }),
      invalidatesTags: ['SavingGoal'],
    }),

    updateSavingGoal: builder.mutation<SavingGoal, { id: number; data: Partial<SavingGoal> }>({
      query: ({ id, data }) => ({
        url: `saving-goals/${id}/`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'SavingGoal', id }, 'SavingGoal'],
    }),

    contributeToSavingGoal: builder.mutation<any, ContributeSavingGoalPayload>({
      query: ({ id, ...body }) => ({
        url: `saving-goals/${id}/contribute/`,
        method: 'POST',
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'SavingGoal', id },
        'SavingGoal',
        'Transaction',
        'Budget',
      ],
    }),

    deleteSavingGoal: builder.mutation<number, number>({
      query: (id) => ({
        url: `saving-goals/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SavingGoal', 'Transaction'],
    }),
  }),
});

export const {
  useGetSavingGoalsQuery,
  useGetSavingsReserveSummaryQuery,
  useGetSavingGoalByIdQuery,
  useAddSavingGoalMutation,
  useUpdateSavingGoalMutation,
  useContributeToSavingGoalMutation,
  useDeleteSavingGoalMutation,
} = savingGoalApi;