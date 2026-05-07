import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Loader2, TrendingUp, ArrowRight, ShoppingBag, Eye, Sparkles } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useNavigate, Link } from 'react-router-dom';
import DynamicText from './DynamicText';

export default function SearchOverlay() {
  const { isSearchOpen, setIsSearchOpen, searchQuery, setSearchQuery, formatPrice, products: allProducts, addToCart, addToast } = useAppContext();
  const { SiteConfig } = useConfig();
  const trending = SiteConfig?.header?.search?.trending || ['Evening Gowns', 'Cashmere', 'Luxury Sets', 'Artisan Silk'];
  const searchTrendingProducts = allProducts.filter(p => (p as any).isSearchTrending || (p as any).isFeatured);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        const filtered = allProducts.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.collectionName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.fabric?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.style?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setResults(filtered);
        setIsSearching(false);
      }, 400); // Slightly longer for a "deliberate/thoughtful" luxury feel
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [searchQuery, allProducts]);

  const handleQuickAdd = (product: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image || product.images?.[0],
      quantity: 1,
      size: product.sizes?.[0] || 'M',
      color: product.colors?.[0] || 'Default'
    });
    addToast(`${product.name} added to your selection.`, 'success');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (!isSearchOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-xl flex flex-col overflow-hidden"
      >
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 flex flex-col h-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-12">
            <Link to="/" onClick={() => setIsSearchOpen(false)} className="text-2xl font-serif font-bold tracking-tighter">
              {(SiteConfig?.header?.logoText || "RUMY").split(' ')[0]} <span className="text-brand-gold">{(SiteConfig?.header?.logoText || "RUMY").split(' ').slice(1).join(' ')}</span>
            </Link>
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="p-3 hover:bg-black/5 rounded-full transition-all hover:rotate-90"
            >
              <X size={24} strokeWidth={1} />
            </button>
          </div>

          {/* Search Input Container */}
          <div className="max-w-3xl mx-auto w-full mb-16 relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={SiteConfig?.header?.search?.placeholder || "Enter a masterpiece name..."}
                className="w-full text-2xl md:text-4xl font-serif border-b border-brand-dark/10 pb-6 focus:outline-none focus:border-brand-gold transition-colors placeholder:text-gray-200 bg-transparent"
              />
              <div className="absolute right-0 bottom-6 flex items-center space-x-4">
                {isSearching ? (
                  <Loader2 size={24} className="animate-spin text-brand-gold" />
                ) : (
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    type="submit" 
                    className="text-brand-gold"
                  >
                    <Search size={32} strokeWidth={1.5} />
                  </motion.button>
                )}
              </div>
            </form>
            {searchQuery.length > 0 && !isSearching && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-10 left-0 text-[10px] uppercase tracking-[0.2em] text-gray-400"
              >
                Displaying {results.length} curated matches for your request
              </motion.p>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto pb-12 scrollbar-hide">
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16">
              
              {/* Left Column: Suggestions or Quick List */}
              <div className="lg:col-span-4 space-y-12">
                
                {/* Section 1: Dynamic Suggestions */}
                <section>
                  <div className="flex items-center space-x-3 mb-8">
                    <Sparkles size={16} className="text-brand-gold" />
                    <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-brand-dark/40">
                      {searchQuery.trim().length > 0 ? "Potential Matches" : "Refined Suggestions"}
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {searchQuery.trim().length > 0 ? (
                      results.length > 0 ? (
                        results.slice(0, 5).map((product, idx) => (
                          <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            key={product.id} 
                            className="group flex items-center space-x-4 cursor-pointer"
                          >
                            <Link 
                              to={`/product/${product.id}`}
                              onClick={() => setIsSearchOpen(false)}
                              className="w-16 h-20 bg-brand-cream/30 overflow-hidden flex-shrink-0 rounded-sm"
                            >
                              <img src={product.image || product.images?.[0] || `https://picsum.photos/seed/${product.id}/200/300`} alt={product.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                            </Link>
                            <div className="flex-1 min-w-0">
                              <Link 
                                to={`/product/${product.id}`}
                                onClick={() => setIsSearchOpen(false)}
                                className="block"
                              >
                                <h4 className="text-[11px] font-bold uppercase tracking-widest truncate group-hover:text-brand-gold transition-colors">{product.name}</h4>
                                <p className="text-[10px] text-brand-gold font-serif mt-1">{formatPrice(product.price)}</p>
                              </Link>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        <p className="text-[10px] text-gray-300 italic tracking-widest uppercase">No direct matches found</p>
                      )
                    ) : (
                      trending.map((s: string, idx: number) => (
                        <motion.button
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          key={s}
                          onClick={() => setSearchQuery(s)}
                          className="w-full flex items-center justify-between group py-3 text-left border-b border-brand-dark/5 hover:border-brand-gold transition-all"
                        >
                          <span className="text-xs font-medium text-gray-500 group-hover:text-brand-dark transition-colors">{s}</span>
                          <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-brand-gold" />
                        </motion.button>
                      ))
                    )}
                  </div>
                </section>

                {/* Section 2: Help / Policy Links */}
                <section className="pt-8 border-t border-brand-dark/5">
                   <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-brand-dark/40 mb-6">Concierge</h3>
                   <div className="grid grid-cols-1 gap-3">
                      <Link to="/contact" onClick={() => setIsSearchOpen(false)} className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-brand-dark transition-colors">Client Support</Link>
                      <Link to="/shipping" onClick={() => setIsSearchOpen(false)} className="text-[10px] uppercase tracking-widest text-gray-400 hover:text-brand-dark transition-colors">Shipment Logistics</Link>
                   </div>
                </section>
              </div>

              {/* Right Column: Visual Showcase */}
              <div className="lg:col-span-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-brand-dark/40">
                    {searchQuery.trim().length > 0 ? "Curated Catalog Results" : "Featured Pieces"}
                  </h3>
                  {searchQuery.trim().length > 0 && results.length > 6 && (
                    <button onClick={handleSearchSubmit} className="text-[9px] font-bold tracking-[0.2em] uppercase text-brand-gold hover:underline">
                      View Entire Selection ({results.length})
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                  {(searchQuery.trim().length > 0 && results.length > 0 ? results : (searchTrendingProducts.length > 0 ? searchTrendingProducts : allProducts)).slice(0, 6).map((product, idx) => (
                    <motion.div 
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group flex flex-col"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden bg-brand-cream/20 mb-4 group cursor-pointer">
                        <img 
                          src={product.image || product.images?.[0] || `https://picsum.photos/seed/${product.id}/400/500`} 
                          alt={product.name} 
                          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-500" />
                        
                        {/* Hover Actions */}
                        <div className="absolute inset-0 flex items-center justify-center space-x-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0 text-white">
                           <button 
                            onClick={(e) => handleQuickAdd(product, e)}
                            className="w-12 h-12 bg-white text-brand-dark flex items-center justify-center rounded-full shadow-2xl hover:bg-brand-gold hover:text-white transition-all transform hover:scale-110"
                           >
                             <ShoppingBag size={18} strokeWidth={1.5} />
                           </button>
                           <Link 
                            to={`/product/${product.id}`}
                            onClick={() => setIsSearchOpen(false)}
                            className="w-12 h-12 bg-white text-brand-dark flex items-center justify-center rounded-full shadow-2xl hover:bg-brand-dark hover:text-white transition-all transform hover:scale-110"
                           >
                             <Eye size={18} strokeWidth={1.5} />
                           </Link>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-dark group-hover:text-brand-gold transition-colors line-clamp-1">{product.name}</h4>
                        <div className="flex justify-between items-end">
                           <p className="text-[10px] text-brand-gold font-serif">{formatPrice(product.price)}</p>
                           <p className="text-[8px] text-gray-400 uppercase tracking-widest">{product.category}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {searchQuery.trim().length === 0 && (
                   <div className="mt-16 p-12 bg-brand-cream/20 border border-brand-dark/5 rounded-sm text-center">
                      <p className="text-[10px] uppercase tracking-[0.4em] text-brand-dark/50 mb-4">Discover Your Infinite Style</p>
                      <button onClick={handleSearchSubmit} className="text-[11px] font-bold uppercase tracking-[0.2em] border-b-2 border-brand-gold pb-1 hover:text-brand-gold transition-colors">Start Your Journey</button>
                   </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
