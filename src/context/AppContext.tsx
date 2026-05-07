import React, { createContext, useContext, useState, useEffect } from 'react';
import { cartApi } from '../services/api';
import axios from 'axios';
import { auth } from '../firebase';
import { useConfig } from './ConfigContext';

export type Currency = 'USD' | 'PKR' | 'INR' | 'SAR' | 'EUR' | 'GBP' | 'AED';

interface ExchangeRates {
  [key: string]: number;
}

const EXCHANGE_RATES: ExchangeRates = {
  USD: 1,
  PKR: 278.50,
  INR: 83.30,
  SAR: 3.75,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
};

const CURRENCY_SYMBOLS: { [key: string]: string } = {
  USD: '$',
  PKR: 'Rs.',
  INR: '₹',
  SAR: 'SR',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
};

interface AppContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (price: number) => string;
  wishlist: string[];
  toggleWishlist: (productId: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  reportActivity: (action: string, details?: any) => Promise<void>;
  products: any[];
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { SiteConfig } = useConfig();
  const [currency, setCurrency] = useState<Currency>(() => {
    const saved = localStorage.getItem('currency');
    return (saved as Currency) || 'PKR';
  });

  // Sync currency with SiteConfig when it loads if no user preference is saved
  useEffect(() => {
    if (SiteConfig?.settings?.baseCurrency && !localStorage.getItem('currency')) {
      setCurrency(SiteConfig.settings.baseCurrency as Currency);
    }
  }, [SiteConfig?.settings?.baseCurrency]);

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('wishlist');
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('currency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const formatPrice = (price: number) => {
    const rate = EXCHANGE_RATES[currency];
    const converted = price * rate;
    const symbol = CURRENCY_SYMBOLS[currency];
    
    if (currency === 'PKR' || currency === 'INR') {
      return `${symbol} ${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return `${symbol}${converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId) 
        : [...prev, productId]
    );
  };

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.size === item.size && i.color === item.color);
      if (existing) {
        return prev.map(i => i === existing ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
    reportActivity('add_to_cart', `Product: ${item.name}`);
  };

  const removeFromCart = (productId: string, size: string, color: string) => {
    setCart(prev => prev.filter(i => !(i.productId === productId && i.size === size && i.color === color)));
  };

  const updateQuantity = (productId: string, size: string, color: string, quantity: number) => {
    setCart(prev => prev.map(i => 
      (i.productId === productId && i.size === size && i.color === color) 
        ? { ...i, quantity: Math.max(1, quantity) } 
        : i
    ));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('/api/products');
        setProducts(res.data);
      } catch (err) {
        console.error('Failed to fetch products', err);
      }
    };
    fetchProducts();
  }, []);

  const reportActivity = async (action: string, details?: any) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    try {
      await axios.post('/api/admin/customers/log', {
        userId: currentUser.uid,
        email: currentUser.email,
        action,
        details,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to report activity:', error);
    }
  };

  // Abandoned Cart Logic
  useEffect(() => {
    if (cart.length === 0) return;
    
    const timer = setTimeout(() => {
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.email) {
        cartApi.reportAbandoned({
          email: currentUser.email,
          displayName: currentUser.displayName || 'Patron',
          total: cartTotal,
          cartItems: cart
        }).catch(err => console.error('Abandoned cart report failed:', err));
        
        reportActivity('abandoned_cart', { itemCount: cart.length, total: cartTotal });
      }
    }, 30 * 60 * 1000); // 30 minutes of inactivity

    return () => clearTimeout(timer);
  }, [cart]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  return (
    <AppContext.Provider value={{ 
      currency, 
      setCurrency, 
      formatPrice, 
      wishlist, 
      toggleWishlist,
      searchQuery,
      setSearchQuery,
      isSearchOpen,
      setIsSearchOpen,
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      addToast,
      reportActivity,
      products
    }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-4 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto min-w-[300px] p-4 rounded-lg shadow-2xl border-l-4 flex flex-col relative overflow-hidden animate-slide-up ${
              toast.type === 'success' ? 'bg-white border-green-500' :
              toast.type === 'error' ? 'bg-white border-red-500' :
              'bg-white border-brand-gold'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`text-[10px] font-bold tracking-widest uppercase ${
                toast.type === 'success' ? 'text-green-600' :
                toast.type === 'error' ? 'text-red-600' :
                'text-brand-gold'
              }`}>
                {toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Information'}
              </span>
              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-gray-400 hover:text-brand-dark transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <p className="text-xs font-medium text-brand-dark">{toast.message}</p>
            <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full">
              <div className={`h-full animate-progress ${
                toast.type === 'success' ? 'bg-green-500' :
                toast.type === 'error' ? 'bg-red-500' :
                'bg-brand-gold'
              }`}></div>
            </div>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within AppProvider');
  return context;
};
