// src/services/categoryApi.ts
import { apiSlice } from './api';
import { type Category } from '../types/transaction'; 

export const categoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    
    // ==================== КАТЕГОРИИ ====================
    getCategories: builder.query<Category[], void>({
      query: () => 'categories/',
      providesTags: ['Category'],
    }),

    getCategoryById: builder.query<Category, number>({
      query: (id) => `categories/${id}/`,
      providesTags: (_result, _error, id) => [{ type: 'Category', id }],
    }),

    addCategory: builder.mutation<Category, Partial<Category>>({
      query: (newCategory) => ({
        url: 'categories/',
        method: 'POST',
        body: newCategory,
      }),
      invalidatesTags: ['Category'],
    }),

    updateCategory: builder.mutation<Category, { id: number; data: Partial<Category> }>({
      query: ({ id, data }) => ({
        url: `categories/${id}/`,
        method: 'PUT', 
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'Category', id }, 'Category'],
    }),

    deleteCategory: builder.mutation<number, number>({
      query: (id) => ({
        url: `categories/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Category'],
    }),

  }),
});


export const {
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useAddCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;