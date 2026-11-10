// src/services/authApi.ts
import { apiSlice } from './api';
import { type User, type AuthCredentials, type AuthResponse } from '../types/user';
import { store } from '../store/store';


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

  }),
});





export const { useRegisterMutation, useLoginMutation } = authApi;