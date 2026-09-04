import axios from 'axios';
import { productionFallbackConfig } from '../config/productionFallback';

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
  placeOrder: (orderData: any) => api.post('/orders/create', {
    ...orderData,
    // Keep both shapes for compatibility with the current production backend.
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
  getConfig: async () => {
    const response = await api.get('/config');
    // Production may contain a partial legacy document. Merge it over the
    // complete frontend defaults so no home-page section disappears.
    const merged = {
      ...productionFallbackConfig,
      ...(response.data || {}),
      announcementBar: { ...productionFallbackConfig.announcementBar, ...(response.data?.announcementBar || {}) },
      header: { ...productionFallbackConfig.header, ...(response.data?.header || {}) },
      purchaseNotifications: { ...productionFallbackConfig.purchaseNotifications, ...(response.data?.purchaseNotifications || {}) },
      heroBanner: { ...productionFallbackConfig.heroBanner, ...(response.data?.heroBanner || {}) },
      newArrivals: { ...productionFallbackConfig.newArrivals, ...(response.data?.newArrivals || {}) },
      featuredArrivals: { ...productionFallbackConfig.featuredArrivals, ...(response.data?.featuredArrivals || {}) },
      featuredCollections: { ...productionFallbackConfig.featuredCollections, ...(response.data?.featuredCollections || {}) },
      customerReviews: { ...productionFallbackConfig.customerReviews, ...(response.data?.customerReviews || {}) },
      trustBadges: { ...productionFallbackConfig.trustBadges, ...(response.data?.trustBadges || {}) },
      footer: { ...productionFallbackConfig.footer, ...(response.data?.footer || {}) },
      aiConcierge: { ...productionFallbackConfig.aiConcierge, ...(response.data?.aiConcierge || {}) },
      notifications: { ...productionFallbackConfig.notifications, ...(response.data?.notifications || {}) },
      settings: { ...productionFallbackConfig.settings, ...(response.data?.settings || {}) },
      pages: { ...productionFallbackConfig.pages, ...(response.data?.pages || {}) },
      elements: { ...productionFallbackConfig.elements, ...(response.data?.elements || {}) },
    };
    return { ...response, data: merged };
  },
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
