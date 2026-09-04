import axios from 'axios';
import { productionFallbackConfig } from '../config/productionFallback';

const mergeSection = (fallback: any, incoming: any) => ({ ...fallback, ...(incoming || {}) });

const textValue = (value: any, fallback = '') => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') return String(value.text ?? value.content ?? fallback);
  return fallback;
};

const normalizeConfigShape = (config: any) => {
  const next = { ...(config || {}) };
  next.branding = mergeSection(productionFallbackConfig.branding, next.branding);
  next.header = mergeSection(productionFallbackConfig.header, next.header);
  next.announcementBar = mergeSection(productionFallbackConfig.announcementBar, next.announcementBar);
  next.footer = mergeSection(productionFallbackConfig.footer, next.footer);

  next.header.logoText = textValue(next.header.logoText, productionFallbackConfig.header.logoText);
  next.footer.brandName = textValue(next.footer.brandName, productionFallbackConfig.footer.brandName);
  next.footer.description = textValue(next.footer.description, productionFallbackConfig.footer.description);
  next.footer.copyright = textValue(next.footer.copyright, productionFallbackConfig.footer.copyright);
  next.footer.newsletterTitle = textValue(next.footer.newsletterTitle, productionFallbackConfig.footer.newsletterTitle);
  next.footer.newsletterDesc = textValue(next.footer.newsletterDesc, productionFallbackConfig.footer.newsletterDesc);

  if (Array.isArray(next.announcementBar.items)) {
    next.announcementBar.items = next.announcementBar.items.map((item: any) => ({ ...item, text: textValue(item?.text, '') }));
  }
  if (Array.isArray(next.header.navLinks)) {
    next.header.navLinks = next.header.navLinks.map((item: any) => ({ ...item, label: textValue(item?.label, '') }));
  }
  return next;
};

const mergeProductionConfig = (data: any) => normalizeConfigShape({
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

const compressImageFile = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/') || file.size <= 3.5 * 1024 * 1024) return file;

  return new Promise((resolve) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDimension = 2200;
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) return resolve(file);
        resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() }));
      }, 'image/jpeg', 0.82);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };
    image.src = objectUrl;
  });
};

// The app still has legacy screens that use the global axios instance.
// Keep those screens compatible with the production API without rewriting their UI.
axios.interceptors.request.use(async (config) => {
  if (config.url?.includes('/admin/upload') && typeof FormData !== 'undefined' && config.data instanceof FormData) {
    const current = config.data.get('file') || config.data.get('image');
    if (current instanceof File) {
      const compressed = await compressImageFile(current);
      config.data.delete('file');
      config.data.delete('image');
      config.data.append('file', compressed);
    }
  }
  return config;
});

axios.interceptors.response.use((response) => {
  if (response.config.url?.endsWith('/config')) response.data = mergeProductionConfig(response.data);
  if (response.config.url?.includes('/admin/upload') && response.data?.url && !response.data.imageUrl) response.data.imageUrl = response.data.url;
  return response;
});

export { mergeProductionConfig };
