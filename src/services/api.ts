import axios from 'axios';
import { productionFallbackConfig } from '../config/productionFallback';

export const API_URL = '/api';
const PRODUCT_CACHE_KEY = 'denfit_products_cache_v2';

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
  return { ...product, id: product.id || product._id, title: product.title || product.name || 'New Product', name: product.name || product.title || 'New Product', image, images: product.images?.length ? product.images : (image ? [image] : []) };
};

const readCachedProducts = (): any[] => {
  try {
    const raw = localStorage.getItem(PRODUCT_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
};

const writeCachedProducts = (products: any[]) => {
  try { localStorage.setItem(PRODUCT_CACHE_KEY, JSON.stringify(products.map(normalizeProduct))); } catch { /* cache is optional */ }
};

const api = axios.create({ baseURL: API_URL, timeout: 20000, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use((config) => {
  if (config.url?.includes('/admin/upload') && typeof FormData !== 'undefined' && config.data instanceof FormData) {
    const image = config.data.get('image');
    if (image && !config.data.get('file')) config.data.append('file', image);
  }
  return config;
});

api.interceptors.response.use((response) => {
  if (response.config.url?.endsWith('/config')) response.data = mergeConfig(response.data);
  if (response.config.url?.includes('/admin/upload') && response.data?.url && !response.data.imageUrl) response.data.imageUrl = response.data.url;
  if (response.config.url?.endsWith('/admin/customers') && Array.isArray(response.data)) response.data = { users: response.data, logs: [] };
  return response;
});

export const authApi = {
  syncUser: (userData: any) => api.post('/auth/sync', userData), getProfile: (uid: string) => api.get(`/user/profile/${uid}`),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }), verifyCode: (email: string, code: string) => api.post('/auth/verify-code', { email, code }),
  resetPassword: (email: string, code: string, newPassword: any) => api.post('/auth/reset-password', { email, code, newPassword }),
};

export const orderApi = {
  placeOrder: (orderData: any) => api.post('/orders/create', { ...orderData, shippingDetails: { firstName: orderData.fullName || '', lastName: '', email: orderData.email || '', phone: orderData.phone || '', address: { line1: orderData.shippingAddress?.street || '', city: orderData.shippingAddress?.city || '', state: orderData.shippingAddress?.state || '', postalCode: orderData.shippingAddress?.zip || '', country: orderData.shippingAddress?.country || '' } } }),
  updateStatus: (id: string, status: string) => api.put(`/admin/orders/${id}/status`, { status }), getUserOrders: (userId: string) => api.get(`/admin/orders?userId=${encodeURIComponent(userId)}`),
};

export const adminApi = {
  getOrders: () => api.get('/admin/orders'), getCustomers: () => api.get('/admin/customers'), getConfig: () => api.get('/config'), updateConfig: (config: any) => api.post('/admin/config', config),
  addProduct: (product: any) => api.post('/admin/products', normalizeProduct(product)),
  updateProduct: async (id: string, product: any) => { const payload = normalizeProduct(product); try { return await api.put(`/admin/products/${id}`, payload); } catch (error: any) { if (error?.response?.status !== 404 && error?.response?.status !== 405) throw error; await api.delete(`/admin/products/${id}`); return await api.post('/admin/products', payload); } },
  deleteProduct: (id: string) => api.delete(`/admin/products/${id}`), logCustomerActivity: (data: any) => api.post('/admin/customers/log', data),
};

export const productApi = {
  getAll: async () => {
    const response = await api.get('/products');
    const raw = response.data?.products || response.data;
    if (Array.isArray(raw)) writeCachedProducts(raw);
    return response;
  },
  getById: async (id: string) => {
    try {
      return await api.get(`/products/${encodeURIComponent(id)}`);
    } catch (error: any) {
      const cached = readCachedProducts();
      const match = cached.find((product: any) => String(product.id || product._id) === String(id));
      if (match) return { data: normalizeProduct(match), status: 200, statusText: 'OK', headers: {}, config: {} } as any;
      throw error;
    }
  },
};

export const cartApi = { reportAbandoned: (cartData: any) => api.post('/cart/abandoned', cartData) };

const compressImage = (file: File, maxBytes = 2 * 1024 * 1024): Promise<File> => new Promise((resolve) => {
  if (file.size <= maxBytes) return resolve(file);
  const img = new Image(); const url = URL.createObjectURL(file);
  img.onload = () => { URL.revokeObjectURL(url); const scale = Math.min(1, 1800 / Math.max(img.width, img.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(img.width * scale)); canvas.height = Math.max(1, Math.round(img.height * scale)); const ctx = canvas.getContext('2d'); if (!ctx) return resolve(file); ctx.drawImage(img, 0, 0, canvas.width, canvas.height); canvas.toBlob((blob) => resolve(blob && blob.size < file.size ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }) : file), 'image/jpeg', 0.82); };
  img.onerror = () => { URL.revokeObjectURL(url); resolve(file); }; img.src = url;
});

export const uploadApi = {
  uploadImage: async (file: File) => { const safeFile = await compressImage(file); const formData = new FormData(); formData.append('file', safeFile); const response = await api.post('/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' }, maxContentLength: 3 * 1024 * 1024, maxBodyLength: 3 * 1024 * 1024 }); return response.data; },
};

export default api;
