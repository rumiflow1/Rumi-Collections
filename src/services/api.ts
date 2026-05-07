import axios from 'axios';

let baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';

// Robustness check: if the URL points to localhost:3001 (which is common in local dev but wrong here),
// we force it to use the relative /api path which is proxied by our server.
if (baseUrl.includes('localhost:3001')) {
  baseUrl = '/api';
}

export const API_URL = baseUrl;

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.warn('API request timed out (15s)');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  syncUser: (userData: any) => api.post('/auth/sync', userData),
  getProfile: (uid: string) => api.get(`/user/profile/${uid}`),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  verifyCode: (email: string, code: string) => api.post('/auth/verify-code', { email, code }),
  resetPassword: (email: string, code: string, newPassword: any) => api.post('/auth/reset-password', { email, code, newPassword }),
};

export const orderApi = {
  placeOrder: (orderData: any) => api.post('/orders', orderData),
  updateStatus: (id: string, status: string) => 
    api.put(`/admin/orders/${id}/status`, { status }),
  getUserOrders: (userId: string) => api.get(`/admin/orders?userId=${userId}`),
};

export const adminApi = {
  getOrders: () => api.get('/admin/orders'),
  getCustomers: () => api.get('/admin/customers'),
  getConfig: () => api.get('/config'),
  updateConfig: (config: any) => api.post('/admin/config', config),
  addProduct: (product: any) => api.post('/admin/products', product),
  updateProduct: (id: string, product: any) => api.put(`/admin/products/${id}`, product),
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`),
  replyToInquiry: (data: any) => api.post('/admin/contacts/reply', data),
  sendPromo: (data: any) => api.post('/orchestrate/dispatch-email', { ...data, actionType: 'PROMOTIONAL' }),
  sendAbandoned: (data: any) => api.post('/orchestrate/dispatch-email', { ...data, actionType: 'ABANDONED_CART' }),
  logCustomerActivity: (data: any) => api.post('/admin/customers/log', data),
};

export const cartApi = {
  sync: (data: any) => api.post('/cart/sync', data),
  reportAbandoned: (data: any) => api.post('/orchestrate/dispatch-email', { ...data, actionType: 'ABANDONED_CART' }),
};

export const productApi = {
  getAll: () => api.get('/products'),
  getById: (id: string) => api.get(`/products/${id}`),
};

export default api;
