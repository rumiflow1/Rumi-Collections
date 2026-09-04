import axios from 'axios';
import { productionFallbackConfig } from '../config/productionFallback';

export const API_URL = '/api';

const mergeConfig = (data: any) => ({
  ...productionFallbackConfig,
  ...(data || {}),
  announcementBar: { ...productionFallbackConfig.announcementBar, ...(data?.announcementBar || {}) },
  header: { ...productionFallbackConfig.header, ...(data?.header || {}) },
  purchaseNotifications: { ...productionFallbackConfig.purchaseNotifications, ...(data?.purchaseNotifications || {}) },
  heroBanner: { ...productionFallbackConfig.heroBanner, ...(data?.heroBanner || {}) },
  newArrivals: { ...productionFallbackConfig.newArrivals, ...(data?.newArrivals || {}) },
  featuredArrivals: { ...productionFallbackConfig.featuredArrivals, ...(data?.featuredArrivals || {}) },
  featuredCollections: { ...productionFallbackConfig.featuredCollections, ...(data?.featuredCollections || {}) },
  customerReviews: { ...productionFallbackConfig.customerReviews, ...(data?.customerReviews || {}) },
  trustBadges: { ...productionFallbackConfig.trustBadges, ...(data?.trustBadges || {}) },
  footer: { ...productionFallbackConfig.footer, ...(data?.footer || {}) },
  aiConcierge: { ...productionFallbackConfig.aiConcierge, ...(data?.aiConcierge || {}) },
  notifications: { ...productionFallbackConfig.notifications, ...(data?.notifications || {}) },
  settings: { ...productionFallbackConfig.settings, ...(data?.settings || {}) },
  pages: { ...productionFallbackConfig.pages, ...(data?.pages || {}) },
  elements: { ...productionFallbackConfig.elements, ...(data?.elements || {}) },
});

const normalizeProduct = (product: any) => {
  const image = product.image || product.images?.[0] || '';
  return {
    ...product,
    title: product.title || product.name || 'New Product',
    name: product.name || product.title || 'New Product',
    image,
    images: product.images?.length ? product.images : (image ? [image] : []),
  };
};

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (config.url?.includes('/admin/upload') && typeof FormData !== 'undefined' && config.data instanceof FormData) {
    const image = config.data.get('image');
    if (image && !config.data.get('file')) config.data.append('file', image);
  }
  return config;
});

api.interceptors.response.use((response) => {
  if (response.config.url?.endsWith('/config')) response.data = mergeConfig(response.data);
  if (response.config.url?.includes('/admin/upload') && response.data?.url && !response.data.imageUrl) {
    response.data.imageUrl = response.data.url;
  }
  if (response.config.url?.endsWith('/admin/customers') && Array.isArray(response.data)) {
    response.data = { users: response.data, logs: [] };
  }
  return response;
});

export const authApi = {
  syncUser: (userData: any) => api.post('/auth/sync', userData),
  getProfile: (uid: string) => api.get(`/user/profile/${uid}`),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  verifyCode: (email: string, code: string) => api.post('/auth/verify-code', { email, code }),
  resetPassword: (email: string, code: string, newPassword: any) => api.post('/auth/reset-password', { email, code, newPassword }),
};

export const orderApi = {
  placeOrder: (orderData: any) => api.post('/orders/create', {
    ...orderData,
    shippingDetails: {
      firstName: orderData.fullName || '',
      lastName: '',
      email: orderData.email || '',
      phone: orderData.phone || '',
      address: {
        line1: orderData.shippingAddress?.street || '',
        city: orderData.shippingAddress?.city || '',
        state: orderData.shippingAddress?.state || '',
        postalCode: orderData.shippingAddress?.zip || '',
        country: orderData.shippingAddress?.country || '',
      },
    },
  }),
  updateStatus: (id: string, status: string) => api.put(`/admin/orders/${id}/status`, { status }),
  getUserOrders: (userId: string) => api.get(`/admin/orders?userId=${encodeURIComponent(userId)}`),
};

export const adminApi = {
  getOrders: () => api.get('/admin/orders'),
  getCustomers: () => api.get('/admin/customers'),
  getConfig: () => api.get('/config'),
  updateConfig: (config: any) => api.post('/admin/config', config),
  addProduct: (product: any) => api.post('/admin/products', normalizeProduct(product)),
  // The historical production API has no PUT product endpoint. Try it first,
  // then safely fall back to delete+create so the existing admin editor still
  // works against that deployment without changing its UI.
  updateProduct: async (id: string, product: any) => {
    const payload = normalizeProduct(product);
    try {
      return await api.put(`/admin/products/${id}`, payload);
    } catch (error: any) {
      if (error?.response?.status !== 404 && error?.response?.status !== 405) throw error;
      await api.delete(`/admin/products/${id}`);
      return await api.post('/admin/products', payload);
    }
  },
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
