/* eslint-disable no-param-reassign */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import type {
  UserSettingsThunkType,
  UserSliceStateType,
} from 'src/types/slices';
import routes from '../routes';

export const fetchUserData = createAsyncThunk<
  UserSettingsThunkType,
  UserSettingsThunkType
>('user/fetchUserData', async () => {
  const response = await axios.get(routes.userProfilePath());
  return response.data;
});

const initialState: UserSliceStateType = {
  status: 'empty',
  userInfo: {},
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUserInfo: (state, { payload }) => {
      state.userInfo = payload;
    },
    setCurrentUser: (state, { payload }) => {
      console.log('Текущий state ДО:', JSON.parse(JSON.stringify(state)));
      state.userInfo = payload;
      state.status = 'fulfilled';
      console.log('Текущий state ПОСЛЕ:', JSON.parse(JSON.stringify(state)));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserData.pending, (state) => {
        state.status = 'pending';
      })
      .addCase(fetchUserData.fulfilled, (state, { payload }) => {
        state.userInfo = payload.currentUser;
        state.status = 'fulfilled';
      });
  },
});

export const { actions } = userSlice;
export const { setCurrentUser } = userSlice.actions;

export default userSlice.reducer;
