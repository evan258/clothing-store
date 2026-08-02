import { configureStore } from "@reduxjs/toolkit";
import scrollReducer from "./slice";

export const store = configureStore({
  reducer: {
    scroll: scrollReducer,
  },
});
