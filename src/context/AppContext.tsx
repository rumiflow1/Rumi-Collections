import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { cartApi, productApi } from '../services/api';
import { auth } from '../firebase';
import { useConfig } from './ConfigContext';

export type Currency = 'USD' | 'PKR' | 'INR' | 'SAR' | 'EUR' | 'GBP' | 'AED';
const EXCHANGE_RATES: Record<Currency, number> = { USD: 1, PKR: 278.5, INR: 83.3, SAR: 3.75, EUR: 0.92, GBP: 0.79, AED: 3.67 };
const CURRENCY_SYMBOLS: Record<Currency, string> = { USD: '$', PKR: 'Rs.', INR: '₹', SAR: 'SR', EUR: '€', GBP: '£', AED: 'د.إ' };
export const convertCurrency = (amount: number, from: Currency, to: Currency) => (Number(amount) || 0) / EXCHANGE_RATES[from] * EXCHANGE_RATES[to];

interface AppContextType { currency: Currency; setCurrency: (c: Currency) => void; formatPrice: (price: number, fromCurrency?: Currency) => string; wishlist: string[]; toggleWishlist: (productId: string) => void; searchQuery: string; setSearchQuery: (q: string) => void; isSearchOpen: boolean; setIsSearchOpen: (open: boolean) => void; cart: CartItem[]; addToCart: (item: CartItem) => void; removeFromCart: (productId: string, size: string, color: string) => void; updateQuantity: (productId: string, size: string, color: string, quantity: number) => void; clearCart: () => void; cartTotal: number; addToast: (message: string, type?: 'success' | 'error' | 'info') => void; reportActivity: (action: string, details?: any) => Promise<void>; products: any[]; }
export interface CartItem { productId: string; name: string; price: number; quantity: number; size: string; color: string; image: string; currency?: Currency; }
const AppContext = createContext<AppContextType | undefined>(undefined);
const isCurrency = (value: any): value is Currency => ['USD','PKR','INR','SAR','EUR','GBP','AED'].includes(value);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { SiteConfig } = useConfig();
  const [currency, setCurrencyState] = useState<Currency>(() => { const saved = localStorage.getItem('currency'); return isCurrency(saved) ? saved : 'PKR'; });
  const setCurrency = (next: Currency) => { if (isCurrency(next)) setCurrencyState(next); };
  useEffect(() => { const saved = localStorage.getItem('currency'); if (!isCurrency(saved) && isCurrency(SiteConfig?.settings?.baseCurrency)) setCurrencyState(SiteConfig.settings.baseCurrency); }, [SiteConfig?.settings?.baseCurrency]);
  useEffect(() => { localStorage.setItem('currency', currency); }, [currency]);

  const [wishlist, setWishlist] = useState<string[]>(() => { try { const saved = localStorage.getItem('wishlist'); return saved ? JSON.parse(saved) : []; } catch { return []; } });
  const [searchQuery, setSearchQuery] = useState(''); const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>(() => { try { const saved = localStorage.getItem('cart'); return saved ? JSON.parse(saved) : []; } catch { return []; } });
  useEffect(() => { localStorage.setItem('wishlist', JSON.stringify(wishlist)); }, [wishlist]); useEffect(() => { localStorage.setItem('cart', JSON.stringify(cart)); }, [cart]);

  const formatPrice = (price: number, fromCurrency: Currency = 'USD') => { const converted = convertCurrency(price, fromCurrency, currency); const symbol = CURRENCY_SYMBOLS[currency]; const digits = currency === 'PKR' || currency === 'INR' ? 0 : 2; return `${symbol}${currency === 'PKR' ? ' ' : ''}${converted.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`; };
  const toggleWishlist = (productId: string) => setWishlist(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const reportActivity = async (action: string, details?: any) => { const currentUser = auth.currentUser; if (!currentUser) return; try { await fetch('/api/admin/customers/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: currentUser.uid, email: currentUser.email, action, details, timestamp: new Date().toISOString() }) }); } catch (error) { console.warn('Activity report unavailable:', error); } };
  const addToCart = (item: CartItem) => { setCart(prev => { const existing = prev.find(i => i.productId === item.productId && i.size === item.size && i.color === item.color); return existing ? prev.map(i => i === existing ? { ...i, quantity: i.quantity + item.quantity } : i) : [...prev, item]; }); reportActivity('add_to_cart', `Product: ${item.name}`); };
  const removeFromCart = (productId: string, size: string, color: string) => setCart(prev => prev.filter(i => !(i.productId === productId && i.size === size && i.color === color)));
  const updateQuantity = (productId: string, size: string, color: string, quantity: number) => setCart(prev => prev.map(i => (i.productId === productId && i.size === size && i.color === color) ? { ...i, quantity: Math.max(1, quantity) } : i));
  const clearCart = () => setCart([]); const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0), [cart]);
  useEffect(() => { productApi.getAll().then(res => setProducts(Array.isArray(res.data) ? res.data : [])).catch(err => console.error('Failed to fetch products', err)); }, []);
  useEffect(() => { if (cart.length === 0) return; const timer = setTimeout(() => { const currentUser = auth.currentUser; if (currentUser?.email) { cartApi.reportAbandoned({ email: currentUser.email, displayName: currentUser.displayName || 'Customer', total: cartTotal, cartItems: cart }).catch(err => console.error('Abandoned cart report failed:', err)); reportActivity('abandoned_cart', { itemCount: cart.length, total: cartTotal, currency }); } }, 30 * 60 * 1000); return () => clearTimeout(timer); }, [cart, cartTotal, currency]);
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => { const id = Date.now(); setToasts(prev => [...prev, { id, message, type }]); setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id), 4000)); };

  return <AppContext.Provider value={{ currency, setCurrency, formatPrice, wishlist, toggleWishlist, searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen, cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, addToast, reportActivity, products }}>
    {children}<div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-4 pointer-events-none">{toasts.map(toast => <div key={toast.id} className={`pointer-events-auto min-w-[300px] p-4 rounded-lg shadow-2xl border-l-4 flex flex-col relative overflow-hidden animate-slide-up ${toast.type === 'success' ? 'bg-white border-green-500' : toast.type === 'error' ? 'bg-white border-red-500' : 'bg-white border-brand-gold'}`}><div className="flex items-center justify-between mb-1"><span className={`text-[10px] font-bold tracking-widest uppercase ${toast.type === 'success' ? 'text-green-600' : toast.type === 'error' ? 'text-red-600' : 'text-brand-gold'}`}>{toast.type === 'success' ? 'Success' : toast.type === 'error' ? 'Error' : 'Information'}</span><button onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} className="text-gray-400 hover:text-brand-dark">×</button></div><p className="text-xs font-medium text-brand-dark">{toast.message}</p></div>)}</div>
  </AppContext.Provider>;
};
export const useAppContext = () => { const context = useContext(AppContext); if (!context) throw new Error('useAppContext must be used within AppProvider'); return context; };
