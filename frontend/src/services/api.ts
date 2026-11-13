import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const rawBaseQuery = fetchBaseQuery({
  baseUrl: 'http://localhost:8000/',
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('access_token');
    if (token) headers.set('authorization', `Bearer ${token}`);
    return headers;
  },
});

// Custom baseQuery за автоматично засичане на изтекъл токен (401)
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  // Ако бекендът върне 401 Unauthorized (изтекъл или невалиден токен)
  if (result.error && result.error.status === 401) {
    // Чистиме стария токен от localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    // Пренасочваме потребителя към страницата за вход (или го рефресваме)
    window.location.href = '/login'; 
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth, // Използваме обвивката вместо обикновения fetchBaseQuery
  refetchOnFocus: true,     // Автоматично презарежда данните при връщане на фокус в прозореца
  refetchOnReconnect: true, // Автоматично презарежда при възстановяване на интернет връзката
  tagTypes: ['Transaction', 'Budget', 'SavingGoal', 'Category'],
  endpoints: () => ({}), 
});