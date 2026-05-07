
/**
 * Normalizes and resolves image URLs to ensure they load correctly from the backend 
 * or external sources.
 */
export const resolveImageUrl = (url: string | undefined | null) => {
  if (!url || typeof url !== 'string' || url.trim() === "") {
    // Elegant luxury placeholder instead of white transparency
    return 'https://images.unsplash.com/photo-1594932224826-94b2724242ee?q=80&w=2080&auto=format&fit=crop';
  }
  
  const cleanUrl = url.trim();
  
  // If it's already an absolute external URL or data URI, return as is
  if (cleanUrl.startsWith('http') || cleanUrl.startsWith('data:')) return cleanUrl;
  
  // In frontend, we want to ensure it hits the current origin's backend uploads
  const origin = window.location.origin;
  
  // Handle relative paths
  if (cleanUrl.startsWith('/uploads')) return `${origin}${cleanUrl}`;
  if (cleanUrl.startsWith('uploads/')) return `${origin}/${cleanUrl}`;

  // Fallback for relative paths without slash
  return cleanUrl.startsWith('/') ? `${origin}${cleanUrl}` : `${origin}/${cleanUrl}`;
};

export const formatPriceGlobal = (price: number | string, currency: string = 'USD') => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numericPrice)) return '$0.00';
  
  const symbol = currency === 'PKR' ? 'Rs.' : currency === 'INR' ? '₹' : currency === 'SAR' ? 'SR' : '$';
  return `${symbol}${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
