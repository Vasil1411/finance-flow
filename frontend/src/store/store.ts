// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../services/api'; // 

export const store = configureStore({
  reducer: {
    // Add the RTK Query reducer to the store
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  // Add the RTK Query middleware to the store
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;