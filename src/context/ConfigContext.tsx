import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { mergeProductionConfig } from '../services/axiosBridge';

interface ElementConfig { content: string; color: string; fontFamily: string; fontSize: string; link: string; background: string; isVisible: boolean; }
interface Config {
  branding?: { brandName?: string; name?: string };
  auth?: any; account?: any;
  elements: Record<string, ElementConfig>;
  announcementBar: any; header: any; purchaseNotifications: any; heroBanner: any;
  newArrivals: any; featuredArrivals: any; featuredCollections: any; customerReviews: any;
  trustBadges: any; footer: any; aiConcierge: any; notifications: any; settings?: any; pages: any;
}
interface ConfigContextType { SiteConfig: Config | null; loading: boolean; refreshConfig: () => Promise<void>; getElement: (key: string) => ElementConfig | null; }
const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const defaultGlobalConfig: Config = {
  elements: {},
  announcementBar: { isVisible: true, bgColor: 'linear-gradient(-45deg, #000000, #000080, #ffffff, #000080, #000000)', items: [
    { text: 'Complimentary shipping on orders over $500', path: '/products' }, { text: "50% off on Men's Collection", path: '/products?category=men' },
    { text: 'Discover the new Summer Collection', path: '/products?category=women' }, { text: 'Exclusive 15% off for first-time members', path: '/profile' }
  ], socials: [
    { platform: 'TikTok', url: 'https://tiktok.com', icon: 'Music2', position: 'left' }, { platform: 'Instagram', url: 'https://instagram.com', icon: 'Instagram', position: 'left' },
    { platform: 'YouTube', url: 'https://youtube.com', icon: 'Youtube', position: 'right' }, { platform: 'WhatsApp', url: 'https://wa.me/yournumber', icon: 'MessageCircle', position: 'right' }
  ]},
  header: { isVisible: true, isCentered: false, logoText: 'LUXE ATTIRE', logoImage: '', logoColor: '#D4AF37', logoSize: '22px', logoWidth: '3rem', logoHeight: '3rem', logoPadding: '0px', logoFontFamily: 'Playfair Display', navLinks: [
    { label: 'Shop All', path: '/products' }, { label: "Men's Collection", path: '/products?category=men' }, { label: "Women's Collection", path: '/products?category=women' }
  ], search: { placeholder: 'Search the atelier...', buttonText: 'Search', trendingTitle: 'Trending Now', trending: ['Evening Gowns', 'Wool Blazers', 'Cashmere', 'Formal Shoes', 'Accessories'], trendingProducts: [] },
  account: { loginLabel: 'Login', signupLabel: 'Signup', emailLabel: 'Email Address', passwordLabel: 'Password', loginBtnText: 'Sign In', signupBtnText: 'Create Account' },
  wishlist: { title: 'My Wishlist', emptyText: 'Your wishlist is empty.', btnText: 'Explore Collection' }, cart: { title: 'Your Selection', emptyText: 'Your cart is empty.', checkoutBtnText: 'Checkout Now', viewCartBtnText: 'View Full Cart' } },
  purchaseNotifications: { isVisible: true, items: [] },
  heroBanner: { isVisible: true, slides: [
    { id: 'men', title: "Men's Collection", subtitle: 'The Pinnacle of Craftsmanship', image: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1964&auto=format&fit=crop', link: '/products?category=men', overlayColor: 'rgba(0,0,0,0.4)', btnText: "Shop Men's" },
    { id: 'women', title: "Women's Silhouette", subtitle: 'Timeless Elegance Defined', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop', link: '/products?category=women', overlayColor: 'rgba(0,0,0,0.4)', btnText: "Shop Women's" }
  ]},
  newArrivals: { isVisible: true, title: 'New Arrivals', tagline: 'Fresh From The Runway' }, featuredArrivals: { isVisible: true, title: 'Featured Arrivals', tagline: 'Curated Selection' },
  featuredCollections: { isVisible: true, title: 'Our Collections', items: [] }, customerReviews: { isVisible: true, title: 'Patron Voices', tagline: 'Testimonials', items: [] },
  trustBadges: { isVisible: true, items: [{ icon: 'Truck', title: 'Free Shipping', subtitle: 'On orders over $500' }, { icon: 'ShieldCheck', title: 'Secure Payment', subtitle: '100% secure payment' }, { icon: 'RefreshCw', title: 'Easy Returns', subtitle: '30-day return policy' }] },
  footer: { isVisible: true, brandName: 'RUMI', description: 'Elevating your style with premium fabrics and timeless designs.', copyright: '© 2026 RUMI. All rights reserved.', shopLinks: [], supportLinks: [], socials: [] },
  aiConcierge: { isEnabled: true, brandVoice: 'Sophisticated, confident, and professional', systemInstruction: 'You are an AI luxury stylist for DENFIT. Be transparent that you are an AI assistant, and help users find products and understand the store.', model: 'gemini-1.5-flash', welcomeMessage: 'Greetings. I am your AI stylist. How may I assist your style journey today?' },
  notifications: { isLive: true, broadcastMessage: '', emailFrequency: 'Weekly' }, settings: { baseCurrency: 'PKR' }, pages: { shippingPolicy: '', privacyPolicy: '', returnPolicy: '', termsOfService: '', faq: '' }
};

const asText = (value: any, fallback = ''): string => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') return asText(value.content ?? value.text ?? value.value ?? value.title, fallback);
  return fallback;
};

const sanitizeConfig = (config: any): Config => {
  const merged = mergeProductionConfig(config || {});
  const elements = Object.fromEntries(Object.entries(merged.elements || {}).map(([key, raw]: any) => [key, {
    ...(raw || {}),
    content: asText(raw?.content ?? raw?.text, ''),
    color: asText(raw?.color, ''),
    fontFamily: asText(raw?.fontFamily, ''),
    fontSize: asText(raw?.fontSize, ''),
    link: asText(raw?.link, ''),
    background: asText(raw?.background, ''),
    isVisible: raw?.isVisible !== false,
  }]));
  return {
    ...merged,
    elements,
    footer: {
      ...(merged.footer || {}),
      description: asText(merged.footer?.description, ''),
      copyright: asText(merged.footer?.copyright, ''),
    },
  } as Config;
};

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [SiteConfig, setSiteConfig] = useState<Config>(() => {
    try { const cached = localStorage.getItem('luxe_site_config'); return cached ? sanitizeConfig(JSON.parse(cached)) : defaultGlobalConfig; }
    catch { return defaultGlobalConfig; }
  });
  const [loading, setLoading] = useState(true);
  const fetchConfig = async () => {
    try {
      const response = await axios.get('/api/config');
      if (response.data) {
        const merged = sanitizeConfig(response.data);
        setSiteConfig(merged);
        localStorage.setItem('luxe_site_config', JSON.stringify(merged));
      }
    } catch (error) { console.error('Failed to fetch config:', error); }
    finally { setLoading(false); }
  };
  const getElement = (key: string) => SiteConfig?.elements?.[key] || null;
  useEffect(() => { fetchConfig(); }, []);
  return <ConfigContext.Provider value={{ SiteConfig, loading, refreshConfig: fetchConfig, getElement }}>{children}</ConfigContext.Provider>;
}
export function useConfig() { const context = useContext(ConfigContext); if (!context) throw new Error('useConfig must be used within a ConfigProvider'); return context; }
