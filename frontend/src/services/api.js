import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Clients
export const clientApi = {
  getAll: () => api.get('/clients'),
  getById: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id, data) => api.delete(`/clients/${id}`, { data }),
};

// Invoices
export const invoiceApi = {
  getAll: (params) => api.get('/invoices', { params }),
  getById: (id) => api.get(`/invoices/${id}`),
  create: (data) => api.post('/invoices', data),
  update: (id, data) => api.put(`/invoices/${id}`, data),
  delete: (id, data) => api.delete(`/invoices/${id}`, { data }),
  generateNumber: () => api.get('/invoices/generate-number'),
  downloadPDF: (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
  duplicate: (id) => api.post(`/invoices/${id}/duplicate`),
  markAsPaid: (id) => api.post(`/invoices/${id}/paid`),
};

// Settings
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  uploadFile: (formData) => api.post('/settings/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

// Products
export const productApi = {
  getAll: () => api.get('/products'),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const unitApi = {
  getAll: () => api.get('/units'),
  create: (data) => api.post('/units', data),
};

// Admin
export const adminApi = {
  login: (data) => api.post('/admin/login', data),
  getMe: () => api.get('/admin/me'),
  list: () => api.get('/admin/list'),
  create: (data) => api.post('/admin/create', data),
  toggleStatus: (id) => api.put(`/admin/${id}/toggle-status`),
  resetPassword: (id, password) => api.put(`/admin/${id}/reset-password`, { password }),
  delete: (id) => api.delete(`/admin/${id}`),
};

export default api;
