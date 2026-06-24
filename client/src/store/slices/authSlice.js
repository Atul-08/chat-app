import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.register(data);
    localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Registration failed'); }
});

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await authAPI.login(data);
    localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Login failed'); }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try { await authAPI.logout(); } catch {}
  localStorage.removeItem('token');
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const res = await authAPI.getMe();
    return res.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Failed'); }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const { userAPI } = await import('../../services/api');
    const res = await userAPI.updateProfile(data);
    return res.data;
  } catch (e) { return rejectWithValue(e.response?.data?.message || 'Update failed'); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    isAuthenticated: false,
    loading: false,
    initialized: false,
    error: null,
  },
  reducers: {
    clearError: (s) => { s.error = null; },
    addFriendRequest: (s, a) => {
      if (s.user && !s.user.friendRequests?.find(r => r._id === a.payload._id)) {
        s.user.friendRequests = [...(s.user.friendRequests || []), a.payload];
      }
    },
    setFriendOnline: (s, a) => {
      if (s.user?.friends) {
        s.user.friends = s.user.friends.map(f =>
          f._id === a.payload ? { ...f, isOnline: true } : f
        );
      }
    },
    setFriendOffline: (s, a) => {
      if (s.user?.friends) {
        s.user.friends = s.user.friends.map(f =>
          f._id === a.payload.userId ? { ...f, isOnline: false, lastSeen: a.payload.lastSeen } : f
        );
      }
    },
  },
  extraReducers: (b) => {
    const pending = (s) => { s.loading = true; s.error = null; };
    const rejected = (s, a) => { s.loading = false; s.error = a.payload; toast.error(a.payload); };

    b.addCase(register.pending, pending)
     .addCase(register.fulfilled, (s, a) => {
       s.loading = false; s.user = a.payload.user;
       s.token = a.payload.token; s.isAuthenticated = true;
       toast.success('Welcome to ChatApp! 🎉');
     })
     .addCase(register.rejected, rejected);

    b.addCase(login.pending, pending)
     .addCase(login.fulfilled, (s, a) => {
       s.loading = false; s.user = a.payload.user;
       s.token = a.payload.token; s.isAuthenticated = true;
       toast.success(`Hey ${a.payload.user.username}! 👋`);
     })
     .addCase(login.rejected, rejected);

    b.addCase(logout.fulfilled, (s) => {
      s.user = null; s.token = null; s.isAuthenticated = false; s.initialized = false;
    });

    b.addCase(getMe.pending, (s) => { s.loading = true; })
     .addCase(getMe.fulfilled, (s, a) => {
       s.loading = false; s.user = a.payload.user;
       s.isAuthenticated = true; s.initialized = true;
     })
     .addCase(getMe.rejected, (s) => {
       s.loading = false; s.isAuthenticated = false;
       s.initialized = true; s.token = null;
       localStorage.removeItem('token');
     });

    b.addCase(updateProfile.fulfilled, (s, a) => {
      s.user = { ...s.user, ...a.payload.user };
      toast.success('Profile updated!');
    })
     .addCase(updateProfile.rejected, (_, a) => toast.error(a.payload));
  },
});

export const { clearError, addFriendRequest, setFriendOnline, setFriendOffline } = authSlice.actions;
export default authSlice.reducer;
