import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Heart, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { useCart } from '../hooks/useCart';

import { useConfig } from '../context/ConfigContext';
import DynamicText from './DynamicText';
import { resolveImageUrl } from '../lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  discount?: number;
  isNewArrival?: boolean;
  showOnHomePage?: boolean;
  colors?: string[];
  sizes?: string[];
}

export default function ProductCard({ 
  id, name, price, originalPrice, image, images = [], 
  category, discount, isNewArrival, colors = [], sizes = [] 
}: ProductCardProps) {
  const { formatPrice, wishlist, toggleWishlist, addToast } = useAppContext();
  const { addToCart } = useCart();
  const [showOptions, setShowOptions] = useState(false);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [step, setStep] = useState<'color' | 'size'>('color');
  const isWishlisted = wishlist.includes(id);

  // No fallback, use actual data
  const availableColors = colors || [];
  const availableSizes = sizes || [];
  
  const allImages = [
    ...(images || []),
    image
  ].filter(img => img && typeof img === 'string' && img.trim() !== "")
   .map(img => resolveImageUrl(img));

  if (allImages.length === 0) {
    allImages.push("https://picsum.photos/seed/luxury/800/1000");
  }

  const productName = name || 'Luxury Item';

  useEffect(() => {
    if (allImages.length <= 1) return;
    const interval = 4000; // Change image every 4 seconds
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }, interval);
    return () => clearInterval(timer);
  }, [allImages]);

  const handleMouseEnter = () => {
    if (allImages.length > 1) {
      setDirection(1);
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // If no variants exist, add directly
    if (availableColors.length === 0 && availableSizes.length === 0) {
      addToCart({
        productId: id,
        name: productName,
        price,
        quantity: 1,
        size: 'One Size',
        color: 'Default',
        image: allImages[0]
      });
      addToast('Product added to cart', 'success');
      return;
    }

    // Determine initial step
    setStep(availableColors.length > 0 ? 'color' : 'size');
    setShowOptions(true);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(id);
    addToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'info');
  };

  const confirmAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validate if choices are required but missing
    if (availableColors.length > 0 && !selectedColor) {
      addToast('Please select a color', 'error');
      setStep('color');
      return;
    }
    if (availableSizes.length > 0 && !selectedSize) {
      addToast('Please select a size', 'error');
      setStep('size');
      return;
    }

    addToCart({
      productId: id,
      name: productName,
      price,
      quantity: 1,
      size: selectedSize || 'One Size',
      color: selectedColor || 'Default',
      image: allImages[0]
    });
    addToast('Product added to cart', 'success');
    setShowOptions(false);
    setSelectedSize('');
    setSelectedColor('');
    setStep('color');
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      onMouseEnter={handleMouseEnter}
      className="group relative"
    >
      <Link to={`/product/${id}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
          <AnimatePresence initial={false} custom={direction}>
            <motion.img 
              key={currentImageIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.5 }
              }}
              src={allImages[currentImageIndex]} 
              alt={productName} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          
          {/* Discount Badge - Top Left Red */}
          {(discount || (originalPrice && originalPrice > price)) && (
            <div className="absolute top-0 left-0 bg-red-600 text-white text-[8px] font-bold px-2 py-1 z-10">
              {discount ? `${discount}% OFF` : `${Math.round(((originalPrice! - price) / originalPrice!) * 100)}% OFF`}
            </div>
          )}

          {/* New Arrival Badge - Top Left (below discount if both exist) */}
          {isNewArrival && (
            <div className={`absolute left-0 bg-brand-gold text-black text-[8px] font-bold px-2 py-1 z-10 ${
              (discount || (originalPrice && originalPrice > price)) ? 'top-6' : 'top-0'
            }`}>
              NEW ARRIVAL
            </div>
          )}

          {/* Overlay Actions (Always visible on hover/mobile) */}
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 md:opacity-0 transition-opacity flex flex-col items-center justify-end p-4 z-10">
            <button 
              onClick={handleQuickAdd}
              className="w-full bg-white text-brand-dark py-3 text-[10px] font-bold tracking-widest uppercase flex items-center justify-center hover:bg-brand-gold hover:text-white transition-colors shadow-xl"
            >
              <ShoppingBag size={14} className="mr-2" /> 
              <DynamicText id="product_quick_add" defaultContent="Quick Add" />
            </button>
          </div>

          {/* Mobile Quick Add (Always visible) */}
          <div className="absolute bottom-4 left-4 right-4 md:hidden z-10">
            <button 
              onClick={handleQuickAdd}
              className="w-full bg-white/90 backdrop-blur-sm text-brand-dark py-2.5 text-[9px] font-bold tracking-widest uppercase flex items-center justify-center border border-brand-dark/5 shadow-lg"
            >
              <ShoppingBag size={12} className="mr-2" /> 
              <DynamicText id="product_quick_add" defaultContent="Quick Add" />
            </button>
          </div>

          {/* Quick Options Overlay - Small at bottom for mobile */}
          <AnimatePresence>
            {showOptions && (
              <motion.div 
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md z-20 p-4 border-t border-brand-dark/5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowOptions(false); }}
                  className="absolute top-2 right-2 p-1 text-gray-400 hover:text-brand-dark"
                >
                  <X size={18} />
                </button>

                <div className="space-y-4">
                  {step === 'color' && availableColors.length > 0 ? (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">Select Color</p>
                      <div className="flex flex-wrap gap-2">
                        {availableColors.map(color => (
                          <button
                            key={color}
                            onClick={(e) => { 
                              e.preventDefault(); 
                              e.stopPropagation(); 
                              setSelectedColor(color); 
                              if (availableSizes.length > 0) setStep('size');
                            }}
                            className={`px-3 py-1 text-[10px] font-bold border transition-all ${
                              selectedColor === color ? 'bg-brand-dark text-white border-brand-dark' : 'border-gray-200 hover:border-brand-gold'
                            }`}
                          >
                            {color}
                          </button>
                        ))}
                      </div>
                      {availableSizes.length === 0 && (
                        <button
                          onClick={confirmAdd}
                          disabled={!selectedColor}
                          className="w-full mt-4 bg-brand-gold text-white py-3 text-[10px] font-bold tracking-widest uppercase flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-dark transition-colors"
                        >
                          <Check size={14} className="mr-2" /> 
                          <DynamicText id="product_confirm_add" defaultContent="Confirm Add" />
                        </button>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-2">Select Size</p>
                      <div className="flex flex-wrap gap-2">
                        {availableSizes.map(size => (
                          <button
                            key={size}
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedSize(size); }}
                            className={`px-3 py-1 text-[10px] font-bold border transition-all ${
                              selectedSize === size ? 'bg-brand-dark text-white border-brand-dark' : 'border-gray-200 hover:border-brand-gold'
                            }`}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={confirmAdd}
                        disabled={(availableSizes.length > 0 && !selectedSize) || (availableColors.length > 0 && !selectedColor)}
                        className="w-full mt-4 bg-brand-gold text-white py-3 text-[10px] font-bold tracking-widest uppercase flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-brand-dark transition-colors"
                      >
                        <Check size={14} className="mr-2" /> 
                        <DynamicText id="product_confirm_add" defaultContent="Confirm Add" />
                      </button>
                      {availableColors.length > 0 && (
                        <button 
                          onClick={() => setStep('color')}
                          className="w-full mt-2 text-[8px] font-bold uppercase tracking-widest text-gray-400 hover:text-brand-dark"
                        >
                          <DynamicText id="product_back_to_color" defaultContent="Back to Color" />
                        </button>
                      )}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <button 
          onClick={handleToggleWishlist}
          className={`absolute top-4 right-4 p-2 rounded-full backdrop-blur-md transition-all duration-300 z-10 ${
            isWishlisted ? 'bg-brand-gold text-white' : 'bg-white/50 text-brand-dark hover:bg-white'
          }`}
        >
          <Heart size={16} fill={isWishlisted ? "currentColor" : "none"} strokeWidth={1.5} />
        </button>
        
        <div className="mt-4 md:mt-6 space-y-1 text-center">
          <span className="text-[8px] md:text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">{category}</span>
          <h3 className="text-xs md:text-sm font-medium tracking-tight text-brand-dark group-hover:text-brand-gold transition-colors line-clamp-1">{productName}</h3>
          <div className="flex items-center justify-center gap-2">
            {originalPrice && originalPrice > price ? (
              <>
                <p className="text-[10px] md:text-xs text-gray-400 line-through">{formatPrice(originalPrice)}</p>
                <p className="text-xs md:text-sm font-serif font-bold text-brand-gold">{formatPrice(price)}</p>
              </>
            ) : (
              <p className="text-xs md:text-sm font-serif font-bold text-brand-gold">{formatPrice(price)}</p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
