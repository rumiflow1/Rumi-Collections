/**
 * SINGLE SOURCE OF TRUTH FOR THE FRONTEND BRAND IDENTITY.
 * Change only these values when this project is rebranded.
 */
export const BRAND = {
  name: 'DENFIT',
  siteUrl: 'https://www.denfit.shop',
  email: 'rumiflow1@gmail.com',
};

export const normalizeBrandText = (value: string) => value
  .replace(/LUXE ATTIRE/gi, BRAND.name)
  .replace(/ETHEREAL/gi, BRAND.name)
  .replace(/ETHANOL/gi, BRAND.name)
  .replace(/E-T-H-O-N-A-L/gi, BRAND.name)
  .replace(/ROOMY/gi, BRAND.name)
  .replace(/RUMI/gi, BRAND.name)
  .replace(/DENFIT/gi, BRAND.name);
