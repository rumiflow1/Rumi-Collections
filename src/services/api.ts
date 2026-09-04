import axios from 'axios';

// Production and local development both use the same /api contract.
export const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

export const authApi = {
  syncUser: (userData: any) => api.post('/auth/sync', userData),
  getProfile: (uid: string) => api.get(`/user/profile/${uid}`),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  verifyCode: (email: string, code: string) => api.post('/auth/verify-code', { email, code }),
  resetPassword: (email: string, code: string, newPassword: any) => api.post('/auth/reset-password', { email, code, newPassword }),
};

export const orderApi = {
  placeOrder: (orderData: any) => api.post('/orders/create', orderData),
  updateStatus: (id: string, status: string) => api.put(`/admin/orders/${id}/status`, { status }),
  getUserOrders: (userId: string) => api.get(`/admin/orders?userId=${encodeURIComponent(userId)}`),
};

export const adminApi = {
  getOrders: () => api.get('/admin/orders'),
  getCustomers: () => api.get('/admin/customers'),
  getConfig: () => api.get('/config'),
  // Backend's canonical write endpoint is /api/admin/config.
  updateConfig: (config: any) => api.post('/admin/config', config),
  // Backend's canonical product-create endpoint is /api/admin/products.
  addProduct: (product: any) => api.post('/admin/products', product),
  updateProduct: (id: string, product: any) => api.put(`/admin/products/${id}`, product),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  logCustomerActivity: (data: any) => api.post('/admin/customers/log', data),
};

export const productApi = {
  getAll: () => api.get('/products'),
  getById: (id: string) => api.get(`/products/${id}`),
};

export const cartApi = {
  reportAbandoned: (cartData: any) => api.post('/cart/abandoned', cartData),
};

export const uploadApi = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default api;
