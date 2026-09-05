/**
 * SINGLE SOURCE OF TRUTH FOR THE FRONTEND BRAND IDENTITY.
 * Rebrand by changing these values only (or set the matching VITE_* variables).
 */
export const BRAND = {
  name: import.meta.env.VITE_BRAND_NAME || 'DENFIT',
  siteUrl: (import.meta.env.VITE_SITE_URL || 'https://www.denfit.shop').replace(/\/$/, ''),
  supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@denfit.shop',
} as const;
export const BRAND_LOGO_URL = `${BRAND.siteUrl}/denfit-logo.svg`;
export const normalizeBrandText = (value: string) => value;
