import { createSlice } from "@reduxjs/toolkit";

const scrollSlice = createSlice({
  name: "scroll",
  initialState: { scrollTo: null },
  reducers: {
    setScrollTo: (state, action) => { state.scrollTo = action.payload; },
  },
});

export const { setScrollTo } = scrollSlice.actions;
export default scrollSlice.reducer;
