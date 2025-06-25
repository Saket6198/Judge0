import { configureStore } from "@reduxjs/toolkit";
import authSlice from "../authSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice, // slice name and slice function name
  },
});

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
