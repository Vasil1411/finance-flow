// src/services/savingGoalApi.ts
import { apiSlice } from './api';
import { type SavingGoal } from '../types/saving-goal';

export const savingGoalApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // ==================== Saving Goals ====================
    getSavingGoals: builder.query<SavingGoal[], void>({
      query: () => 'saving-goals/',
      providesTags: ['SavingGoal'],
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

    deleteSavingGoal: builder.mutation<number, number>({
      query: (id) => ({
        url: `saving-goals/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SavingGoal'],
    }),

  }),
});

export const {
  useGetSavingGoalsQuery,
  useGetSavingGoalByIdQuery,
  useAddSavingGoalMutation,
  useUpdateSavingGoalMutation,
  useDeleteSavingGoalMutation,
} = savingGoalApi;