import axios from 'axios';

// Live website par ye khud hi /api pakar lega
export const API_URL = "/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  syncUser: (userData: any) => api.post('/auth/sync', userData),
  getProfile: (uid: string) => api.get(`/user/profile/${uid}`),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  verifyCode: (email: string, code: string) => api.post('/auth/verify-code', { email, code }),
  resetPassword: (email: string, code: string, newPassword: any) => api.post('/auth/reset-password', { email, code, newPassword }),
};

export const orderApi = {
  placeOrder: (orderData: any) => api.post('/orders/create', orderData), // Note: Changed to match your server.ts
  updateStatus: (id: string, status: string) => api.put(`/admin/orders/${id}/status`, { status }),
  getUserOrders: (userId: string) => api.get(`/admin/orders?userId=${userId}`),
};

export const adminApi = {
  getOrders: () => api.get('/admin/orders'),
  getCustomers: () => api.get('/admin/customers'),
  getConfig: () => api.get('/config'),
  updateConfig: (config: any) => api.post('/config/update', config), // Match server.ts
  addProduct: (product: any) => api.post('/products/add', product), // Match server.ts
  updateProduct: (id: string, product: any) => api.put(`/admin/products/${id}`, product),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),
  logCustomerActivity: (data: any) => api.post('/admin/customers/log', data),
};

export const productApi = {
  getAll: () => api.get('/products'),
  getById: (id: string) => api.get(`/products/${id}`),
};

// ADDED: Added cartApi helper to resolve build errors in AppContext.tsx
export const cartApi = {
  reportAbandoned: (cartData: any) => api.post('/cart/abandoned', cartData),
};

export default api;