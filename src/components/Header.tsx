import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, X, Heart, Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { useAppContext, Currency } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { resolveImageUrl } from '../lib/utils';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, profileData, loginWithGoogle, logout } = useAuth();
  const { cart } = useCart();
  const { currency, setCurrency, setIsSearchOpen, wishlist } = useAppContext();
  const { SiteConfig, loading } = useConfig();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!SiteConfig?.header?.isVisible) return null;

  const headerBg = isHome 
    ? (isScrolled ? 'bg-white shadow-md' : 'bg-transparent') 
    : 'bg-white shadow-sm';
  
  const textColor = isHome && !isScrolled ? 'text-white' : 'text-brand-dark';

  const headerTop = SiteConfig?.announcementBar?.isVisible ? 'top-10' : 'top-0';

  return (
    <header className={`fixed ${headerTop} left-0 right-0 z-50 transition-all duration-500 ${headerBg} py-0`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center h-20 relative justify-between`}>
          
          {/* MOBILE LEFT: Menu, Search */}
          <div className="flex md:hidden items-center space-x-4 absolute left-4 h-full">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className={textColor}>
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <button onClick={() => setIsSearchOpen(true)} className={textColor}>
              <Search size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Navigation Links (Desktop) - Left */}
          <nav className={`hidden md:flex space-x-8 flex-1 ${SiteConfig?.header?.isCentered ? 'justify-start' : 'justify-start'} ${textColor}`}>
            {(SiteConfig?.header?.navLinks || []).map((link, idx) => (
              <Link 
                key={idx} 
                to={link.path} 
                className="text-[10px] font-bold tracking-[0.2em] uppercase hover:text-brand-gold transition-colors"
                style={{ color: link.color || undefined, fontSize: link.fontSize || undefined }}
              >
                {link.label}
              </Link>
            ))}
            {(SiteConfig?.featuredCollections?.items || [])
              .filter((col: any) => col.showInHeader)
              .map((col: any, idx: number) => (
                <Link 
                  key={`col-${idx}`} 
                  to={col.link} 
                  className="text-[10px] font-bold tracking-[0.2em] uppercase hover:text-brand-gold transition-colors"
                >
                  {col.name}
                </Link>
              ))
            }
          </nav>

          {/* Logo - Centered for Mobile & Desktop */}
          <div className={`flex-shrink-0 px-2 flex items-center justify-center h-full absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 
            ${SiteConfig?.header?.isCentered ? 'md:absolute md:left-1/2 md:-translate-x-1/2' : ''}
          `}>
            <Link to="/" className="flex items-center group transition-all duration-500" style={{ padding: `${SiteConfig?.header?.logoPadding || 0}px` }}>
              {SiteConfig?.header?.logoImage && SiteConfig.header.logoImage.trim() !== "" ? (
                <img 
                  src={resolveImageUrl(SiteConfig.header.logoImage)} 
                  alt={SiteConfig.header.logoText} 
                  className="h-auto object-contain transition-all duration-700 group-hover:scale-105"
                  style={{ 
                    width: (SiteConfig.header.logoWidth ? `${SiteConfig.header.logoWidth}px` : '32px'),
                    maxHeight: (SiteConfig.header.logoHeight ? `${SiteConfig.header.logoHeight}px` : '32px')
                  }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="font-serif tracking-tighter font-bold transition-all duration-300 whitespace-nowrap group-hover:text-brand-gold" style={{ fontSize: (SiteConfig?.header?.logoSize || '18px'), color: textColor === 'text-white' ? 'white' : (SiteConfig?.header?.logoColor || 'inherit'), fontFamily: SiteConfig?.header?.logoFontFamily || 'inherit' }}>
                  {(SiteConfig?.header?.logoText || "LUXE ATTIRE")}
                </div>
              )}
            </Link>
          </div>

          {/* MOBILE RIGHT: Wishlist, Cart, Account */}
          <div className="flex md:hidden items-center space-x-4 absolute right-4 h-full">
            <Link to="/wishlist" className={`${textColor} relative`}>
              <Heart size={20} strokeWidth={1.5} />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-brand-gold w-1.5 h-1.5 rounded-full"></span>
              )}
            </Link>
            <Link to="/cart" className={`${textColor} relative`}>
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-brand-gold text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cart.length}
                </span>
              )}
            </Link>
            <Link to={user ? "/profile" : "/auth"} className={textColor}>
              {user ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-brand-gold/30">
                  <img 
                    src={profileData?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${profileData?.displayName || user.displayName || 'User'}&background=D4AF37&color=fff`} 
                    alt="P" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <User size={20} strokeWidth={1.5} />
              )}
            </Link>
          </div>

          {/* Actions (Desktop) - Right */}
          <div className={`hidden md:flex items-center justify-end space-x-6 flex-1 ${textColor}`}>
            {/* Currency Selector */}
            <div className="flex items-center space-x-2 group relative">
              <Globe size={16} className="text-gray-400 group-hover:text-brand-gold transition-colors" />
              <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="bg-transparent text-[10px] font-bold tracking-widest uppercase focus:outline-none cursor-pointer hover:text-brand-gold transition-colors"
              >
                <option value="USD" className="text-black">USD</option>
                <option value="PKR" className="text-black">PKR</option>
                <option value="INR" className="text-black">INR</option>
                <option value="SAR" className="text-black">SAR</option>
              </select>
            </div>

            <button 
              onClick={() => setIsSearchOpen(true)}
              className="hover:text-brand-gold transition-colors"
            >
              <Search size={20} strokeWidth={1.5} />
            </button>

            <Link to="/wishlist" className="hover:text-brand-gold transition-colors relative">
              <Heart size={20} strokeWidth={1.5} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-gold w-1.5 h-1.5 rounded-full"></span>
              )}
            </Link>

            <Link to={user ? "/profile" : "/auth"} className="hover:text-brand-gold transition-colors flex items-center">
              {user ? (
                <div className="w-8 h-8 rounded-full overflow-hidden border border-brand-gold/30">
                  <img 
                    src={profileData?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${profileData?.displayName || user.displayName || 'User'}&background=D4AF37&color=fff`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <User size={20} strokeWidth={1.5} />
              )}
              {user && <span className="ml-2 text-[10px] font-bold tracking-widest uppercase hidden lg:inline">{(profileData?.displayName || user.displayName)?.split(' ')[0]}</span>}
            </Link>

            <Link to="/cart" className="hover:text-brand-gold transition-colors relative">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-gold text-white text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {cart.length}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-brand-cream border-t border-brand-dark/5 p-6 space-y-6 animate-in slide-in-from-top duration-300">
          {(SiteConfig?.header?.navLinks || []).map((link, idx) => (
            <Link 
              key={idx} 
              to={link.path} 
              className="block text-xs font-bold tracking-widest uppercase" 
              style={{ color: link.color || undefined, fontSize: link.fontSize || undefined }}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {(SiteConfig?.featuredCollections?.items || [])
            .filter((col: any) => col.showInHeader)
            .map((col: any, idx: number) => (
              <Link 
                key={`mobile-col-${idx}`} 
                to={col.link} 
                className="block text-xs font-bold tracking-widest uppercase"
                onClick={() => setIsMenuOpen(false)}
              >
                {col.name}
              </Link>
            ))
          }
          <div className="pt-4 border-t border-brand-dark/5">
            <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-4">Currency</p>
            <div className="flex space-x-4">
              {(['USD', 'PKR', 'INR', 'SAR'] as Currency[]).map((c) => (
                <button 
                  key={c}
                  onClick={() => { setCurrency(c); setIsMenuOpen(false); }}
                  className={`text-xs font-bold ${currency === c ? 'text-brand-gold' : 'text-brand-dark'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
