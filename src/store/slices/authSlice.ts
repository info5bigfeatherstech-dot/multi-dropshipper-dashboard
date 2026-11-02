import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { DropshipperProfile } from '../../types/dropshipper';
import { dropshipperAuthService, type LoginInput } from '../../services/dropshipperAuthService';
import {
  hasDropshipperPanelSession,
  getAuthToken,
  getDropshipperUser,
  clearDropshipperSession
} from '../../lib/api';

interface AuthState {
  user: DropshipperProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialHasSession = typeof window !== 'undefined' ? hasDropshipperPanelSession() : false;
const initialUser = typeof window !== 'undefined' ? (getDropshipperUser() as DropshipperProfile | null) : null;
const initialToken = typeof window !== 'undefined' ? getAuthToken() : null;

const initialState: AuthState = {
  user: initialUser,
  token: initialToken,
  isAuthenticated: initialHasSession,
  loading: false,
  error: null
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginInput, { rejectWithValue }) => {
    try {
      const res = await dropshipperAuthService.login(credentials);
      return res;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Login failed');
    }
  }
);

export const fetchMeThunk = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      const profile = await dropshipperAuthService.me();
      return profile;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch profile');
    }
  }
);

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async () => {
    await dropshipperAuthService.logout();
    clearDropshipperSession();
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: DropshipperProfile; token: string }>
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.accessToken;
        state.user = (action.payload.dropshipper || action.payload.user) as DropshipperProfile;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Me
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      // Logout
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      });
  }
});

export const { setCredentials, clearError } = authSlice.actions;
export default authSlice.reducer;

