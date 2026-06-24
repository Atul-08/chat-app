import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authAPI = {
  sendOTP:   (d) => api.post('/auth/send-otp', d),
  verifyOTP: (d) => api.post('/auth/verify-otp', d),

  register: (d) => api.post('/auth/register', d),
  login:    (d) => api.post('/auth/login', d),
  logout:   ()  => api.post('/auth/logout'),
  getMe:    ()  => api.get('/auth/me'),
};

export const userAPI = {
  getAll:              (p) => api.get('/users', { params: p }),
  getById:             (id) => api.get(`/users/${id}`),
  updateProfile:       (d)  => api.put('/users/profile', d),
  sendFriendRequest:   (id) => api.post(`/users/friend-request/${id}`),
  acceptFriendRequest: (id) => api.post(`/users/accept-request/${id}`),
  rejectFriendRequest: (id) => api.post(`/users/reject-request/${id}`),
  removeFriend:        (id) => api.delete(`/users/friend/${id}`),
};

export const messageAPI = {
  getMessages:    (userId, p) => api.get(`/messages/${userId}`, { params: p }),
  sendMessage:    (userId, d) => api.post(`/messages/${userId}`, d),
  deleteMessage:  (id)        => api.delete(`/messages/${id}`),
  editMessage:    (id, d)     => api.put(`/messages/${id}`, d),
  reactToMessage: (id, d)     => api.post(`/messages/${id}/react`, d),
  getUnreadCounts: ()         => api.get('/messages/unread/count'),
};
