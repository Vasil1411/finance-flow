import { apiSlice } from './api';
import { type User, type AuthCredentials, type AuthResponse } from '../types/user';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<User, AuthCredentials>({
      query: (credentials) => ({
        url: 'auth/register/',
        method: 'POST',
        body: credentials,
      }),
    }),

    login: builder.mutation<AuthResponse, AuthCredentials>({
      query: (credentials) => ({
        url: 'auth/login/',
        method: 'POST',
        body: credentials,
      }),
    }),

    requestPasswordReset: builder.mutation<any, { email: string }>({
      query: (body) => ({
        url: 'auth/password-reset/',
        method: 'POST',
        body,
      }),
    }),

    confirmPasswordReset: builder.mutation<any, { uid: string; token: string; new_password: string }>({
      query: (body) => ({
        url: 'auth/password-reset-confirm/',
        method: 'POST',
        body,
      }),
    }),

    getAdminStats: builder.query<{
      total_users: number;
      active_users: number;
      total_transactions: number;
      total_budgets: number;
      total_goals: number;
    }, void>({
      query: () => 'api/admin/stats/',
    }),

    getAdminUsers: builder.query<Array<{
      id: number;
      username: string;
      email: string;
      date_joined: string;
      transactions_count: number;
    }>, void>({
      query: () => 'api/admin/users/',
    }),
  }),
});

export const { 
  useRegisterMutation, 
  useLoginMutation, 
  useRequestPasswordResetMutation, 
  useConfirmPasswordResetMutation,
  useGetAdminStatsQuery, // 👈 Добавено
  useGetAdminUsersQuery, // 👈 Добавено
} = authApi;