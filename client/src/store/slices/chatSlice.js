import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { messageAPI, userAPI } from '../../services/api';
import toast from 'react-hot-toast';

export const fetchMessages = createAsyncThunk('chat/fetchMessages', async ({ userId, page = 1 }, { rejectWithValue }) => {
  try {
    const res = await messageAPI.getMessages(userId, { page, limit: 40 });
    return { messages: res.data.messages, userId, page };
  } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const fetchUsers = createAsyncThunk('chat/fetchUsers', async (params, { rejectWithValue }) => {
  try {
    const res = await userAPI.getAll(params);
    return res.data.users;
  } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const fetchUnreadCounts = createAsyncThunk('chat/fetchUnreadCounts', async (_, { rejectWithValue }) => {
  try {
    const res = await messageAPI.getUnreadCounts();
    return res.data.unreadCounts;
  } catch (e) { return rejectWithValue(e.response?.data?.message); }
});

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    users: [],
    usersLoading: false,
    selectedUser: null,
    messages: [],        // messages for current conversation
    messagesLoading: false,
    hasMore: true,
    onlineUsers: [],     // array of userIds
    unreadCounts: {},    // { userId: count }
    searchQuery: '',
  },
  reducers: {
    setSelectedUser: (s, a) => {
      s.selectedUser = a.payload;
      s.messages = [];
      s.hasMore = true;
      // Clear unread for selected user
      if (a.payload?._id) {
        delete s.unreadCounts[a.payload._id];
      }
    },
    addMessage: (s, a) => {
      const msg = a.payload;
      // Avoid duplicate (optimistic + real)
      if (!s.messages.find(m => m._id === msg._id)) {
        s.messages.push(msg);
      }
      // Update unread count if not current chat
      if (s.selectedUser?._id !== msg.senderId && msg.senderId !== undefined) {
        s.unreadCounts[msg.senderId] = (s.unreadCounts[msg.senderId] || 0) + 1;
      }
    },
    updateMessage: (s, a) => {
      const idx = s.messages.findIndex(m => m._id === a.payload._id);
      if (idx > -1) s.messages[idx] = { ...s.messages[idx], ...a.payload };
    },
    deleteMessage: (s, a) => {
      const idx = s.messages.findIndex(m => m._id === a.payload);
      if (idx > -1) s.messages[idx] = { ...s.messages[idx], isDeleted: true, text: '', image: '' };
    },
    setMessageReactions: (s, a) => {
      const { messageId, reactions } = a.payload;
      const idx = s.messages.findIndex(m => m._id === messageId);
      if (idx > -1) s.messages[idx].reactions = reactions;
    },
    setUserOnline: (s, a) => {
      if (!s.onlineUsers.includes(a.payload)) s.onlineUsers.push(a.payload);
      // Update in users list
      const idx = s.users.findIndex(u => u._id === a.payload);
      if (idx > -1) s.users[idx] = { ...s.users[idx], isOnline: true };
      if (s.selectedUser?._id === a.payload) s.selectedUser = { ...s.selectedUser, isOnline: true };
    },
    setUserOffline: (s, a) => {
      s.onlineUsers = s.onlineUsers.filter(id => id !== a.payload.userId);
      const idx = s.users.findIndex(u => u._id === a.payload.userId);
      if (idx > -1) s.users[idx] = { ...s.users[idx], isOnline: false, lastSeen: a.payload.lastSeen };
      if (s.selectedUser?._id === a.payload.userId) {
        s.selectedUser = { ...s.selectedUser, isOnline: false, lastSeen: a.payload.lastSeen };
      }
    },
    setSearchQuery: (s, a) => { s.searchQuery = a.payload; },
    clearMessages: (s) => { s.messages = []; s.hasMore = true; },
  },
  extraReducers: (b) => {
    b.addCase(fetchMessages.pending, (s) => { s.messagesLoading = true; })
     .addCase(fetchMessages.fulfilled, (s, a) => {
       s.messagesLoading = false;
       if (a.payload.page === 1) {
         s.messages = a.payload.messages;
       } else {
         // Prepend older messages
         s.messages = [...a.payload.messages, ...s.messages];
       }
       s.hasMore = a.payload.messages.length === 40;
     })
     .addCase(fetchMessages.rejected, (s) => { s.messagesLoading = false; });

    b.addCase(fetchUsers.pending, (s) => { s.usersLoading = true; })
     .addCase(fetchUsers.fulfilled, (s, a) => { s.usersLoading = false; s.users = a.payload; })
     .addCase(fetchUsers.rejected, (s) => { s.usersLoading = false; });

    b.addCase(fetchUnreadCounts.fulfilled, (s, a) => { s.unreadCounts = a.payload; });
  },
});

export const {
  setSelectedUser, addMessage, updateMessage, deleteMessage,
  setMessageReactions, setUserOnline, setUserOffline,
  setSearchQuery, clearMessages,
} = chatSlice.actions;
export default chatSlice.reducer;
