import { createSlice } from '@reduxjs/toolkit'

export const counterSlice = createSlice({
  name: 'user',
  initialState: {
    userInfo: { account: 'Unknown', id: 0 }
  },
  reducers: {
    update: (state, action) => {
      state.userInfo = action.payload
    },
  }
})

export const { update } = counterSlice.actions;

export default counterSlice.reducer;
