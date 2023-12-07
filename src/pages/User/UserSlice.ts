  // Import the necessary modules
import { API_URL } from '@/utils/config';
import { request } from '@umijs/max';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Create an async thunk for userLogin
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

      // Check if the request was successful
      if (response.status) {
        // Update the state with user data
        const user = response.user;
        const token = response.token;

        // Save the token to localStorage
        localStorage.setItem('token', token);

        return { user, token, status: 'success' };
      } else {
        // If the request was not successful, return the error status
        return { status: 'error', error: response.error };
      }
    } catch (error) {
      // If there was an error in the API request, return the error status
      return { status: 'error', error: 'Something went wrong, please try again later' };
    }
  }
);



function logout(state: any) {
  console.log('::: USER LOGOUT CALLED :::');
  state.user = {};
}


// Create the user slice
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
export const { clearMessage } = userSlice.actions;
export default userSlice.reducer;
