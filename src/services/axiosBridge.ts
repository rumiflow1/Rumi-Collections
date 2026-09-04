import axios from 'axios';
import { productionFallbackConfig } from '../config/productionFallback';

const mergeSection = (fallback: any, incoming: any) => ({ ...fallback, ...(incoming || {}) });

const mergeProductionConfig = (data: any) => ({
  ...productionFallbackConfig,
  ...(data || {}),
  announcementBar: mergeSection(productionFallbackConfig.announcementBar, data?.announcementBar),
  header: mergeSection(productionFallbackConfig.header, data?.header),
  purchaseNotifications: mergeSection(productionFallbackConfig.purchaseNotifications, data?.purchaseNotifications),
  heroBanner: mergeSection(productionFallbackConfig.heroBanner, data?.heroBanner),
  newArrivals: mergeSection(productionFallbackConfig.newArrivals, data?.newArrivals),
  featuredArrivals: mergeSection(productionFallbackConfig.featuredArrivals, data?.featuredArrivals),
  featuredCollections: mergeSection(productionFallbackConfig.featuredCollections, data?.featuredCollections),
  customerReviews: mergeSection(productionFallbackConfig.customerReviews, data?.customerReviews),
  trustBadges: mergeSection(productionFallbackConfig.trustBadges, data?.trustBadges),
  footer: mergeSection(productionFallbackConfig.footer, data?.footer),
  aiConcierge: mergeSection(productionFallbackConfig.aiConcierge, data?.aiConcierge),
  notifications: mergeSection(productionFallbackConfig.notifications, data?.notifications),
  settings: mergeSection(productionFallbackConfig.settings, data?.settings),
  pages: mergeSection(productionFallbackConfig.pages, data?.pages),
  elements: mergeSection(productionFallbackConfig.elements, data?.elements),
});

// The app still has legacy screens that use the global axios instance.
// Keep those screens compatible with the production API without rewriting their UI.
axios.interceptors.request.use((config) => {
  if (config.url?.includes('/admin/upload') && typeof FormData !== 'undefined' && config.data instanceof FormData) {
    const image = config.data.get('image');
    if (image && !config.data.get('file')) config.data.append('file', image);
  }
  return config;
});

axios.interceptors.response.use((response) => {
  if (response.config.url?.endsWith('/config')) {
    response.data = mergeProductionConfig(response.data);
  }
  if (response.config.url?.includes('/admin/upload') && response.data?.url && !response.data.imageUrl) {
    response.data.imageUrl = response.data.url;
  }
  return response;
});

export { mergeProductionConfig };
