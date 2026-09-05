/**
 * SINGLE SOURCE OF TRUTH FOR THE FRONTEND BRAND IDENTITY.
 * Rebrand by changing these values (or VITE_* environment variables) only.
 */
export const BRAND = {
  name: import.meta.env.VITE_BRAND_NAME || 'DENFIT',
  siteUrl: (import.meta.env.VITE_SITE_URL || 'https://www.denfit.shop').replace(/\/$/, ''),
  email: import.meta.env.VITE_SUPPORT_EMAIL || 'support@denfit.shop',
} as const;

/**
 * Compatibility cleanup for content/config that may have been stored under an old brand.
 * This is runtime sanitisation only; old names are not used in SEO metadata or new content.
 */
export const normalizeBrandText = (value: string) => value
  .replace(/LUXE ATTIRE/gi, BRAND.name)
  .replace(/ETHEREAL/gi, BRAND.name)
  .replace(/ETHANOL/gi, BRAND.name)
  .replace(/E-T-H-O-N-A-L/gi, BRAND.name)
  .replace(/ROOMY/gi, BRAND.name)
  .replace(/RUMI/gi, BRAND.name);
