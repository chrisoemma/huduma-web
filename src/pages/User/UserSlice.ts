  // Import the necessary modules
import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

export const userLogin = createAsyncThunk(
  'users/userLogin',
  async (data) => {
    try {
      // Make the API request
      const response = await request(`${API_URL}/auth/web_login`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.status) {
        const user = response.user;
        const token = Cookies.get('token');

        return { user, token, status: 'success' };
      } else {

        return { status: 'error', error: response.error };
      }
    } catch (error) {
      return { status: 'error', error: 'Something went wrong, please try again later' };
    }
  }
);



function logout(state: any) {
  console.log('::: USER LOGOUT CALLED :::');
  state.user = {};
  Cookies.remove('currentUser');
  Cookies.remove('token');
  state.token = '';
}

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: {},
    loading: false,
    token:'',
    status: '',
  },
  reducers: {
    userLogout(state: any) {
      console.log('execurung this')
      logout(state);
    },
    clearMessage(state: any) {
      state.status = null;
    },
  },
  extraReducers: (builder) => {
    // Define extra reducers for the userLogin async thunk
    builder.addCase(userLogin.pending, (state) => {
      state.loading = true;
      state.status = '';
    });
    builder.addCase(userLogin.fulfilled, (state, action) => {
      state.user = action.payload.user;
      state.token=action.payload.token;
      state.loading = false;
      state.status = action.payload.status;
    });
    builder.addCase(userLogin.rejected, (state, action) => {
      state.loading = false;
      state.status = 'error';
    });
  },
});

// Export the reducer and actions
export const { clearMessage,userLogout } = userSlice.actions;
export default userSlice.reducer;
