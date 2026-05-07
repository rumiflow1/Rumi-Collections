import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Heart, Share2, ChevronRight, Star, ShieldCheck, Truck, RefreshCcw, X, Ruler, Info, Package, Sparkles, Plus, Minus, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useCart } from '../hooks/useCart';
import ProductCard from '../components/ProductCard';
import { productApi } from '../services/api';
import VirtualTryOn from '../components/VirtualTryOn';
import { resolveImageUrl } from '../lib/utils';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatPrice, wishlist, toggleWishlist, addToast } = useAppContext();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<any>(null);
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const [isTryOnOpen, setIsTryOnOpen] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const [isZoomed, setIsZoomed] = useState(false);
  const [openSections, setOpenSections] = useState(['details']);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    
    const fetchProduct = async () => {
      try {
        const response = await productApi.getById(id);
        const data = response.data;
        setProduct({ id: data._id || data.id, ...data });
        setSelectedSize(data.sizes?.[0] || '');
        setSelectedColor(data.colors?.[0] || '');
        setActiveImage(0);
      } catch (error) {
        console.error("Error fetching product:", error);
        addToast('Product not found', 'error');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await productApi.getAll();
        const data = response.data.products || response.data;
        if (Array.isArray(data)) {
          setTrendingProducts(data.map((p: any) => ({
            id: p._id || p.id,
            name: p.title || p.name,
            price: p.price,
            originalPrice: p.originalPrice,
            image: p.images?.[0] || p.image,
            images: p.images || [],
            category: p.category,
            discount: p.discount,
            isNewArrival: p.isNewArrival,
            colors: p.colors || [],
            sizes: p.sizes || []
          })).slice(0, 6));
        }
      } catch (error) {
        console.error("Error fetching trending products:", error);
      }
    };

    fetchTrending();
  }, []);

  const [trendingIndex, setTrendingIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth >= 1024 ? 4 : 2);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (trendingProducts.length <= itemsPerPage) return;
    const timer = setInterval(() => {
      setTrendingIndex((prev) => (prev + 1) % trendingProducts.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [trendingProducts.length, itemsPerPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-4">
        <Loader2 size={48} className="text-brand-gold animate-spin" />
        <p className="text-gray-500 font-serif italic">Revealing luxury details...</p>
      </div>
    );
  }

  if (!product) return null;

  const isWishlisted = wishlist.includes(product.id);

  const toggleSection = (section: string) => {
    setOpenSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    const { left, top, width, height } = imageRef.current.getBoundingClientRect();
    const x = ((e.pageX - left) / width) * 100;
    const y = ((e.pageY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleAddToCart = () => {
    setIsAdding(true);
    setTimeout(() => {
      addToCart({
        productId: product.id,
        name: product.title || product.name,
        price: product.price,
        quantity,
        size: selectedSize,
        color: selectedColor,
        image: product.images?.[0] || product.image
      });
      addToast('Product added to bag', 'success');
      setIsAdding(false);
    }, 600);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.title || product.name,
        text: product.description,
        url: window.location.href,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      addToast('Link copied to clipboard', 'info');
    }
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product.id);
    addToast(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist', 'info');
  };

  const AccordionItem = ({ id, title, content }: { id: string, title: string, content: React.ReactNode }) => (
    <div className="border-b border-gray-100">
      <button 
        onClick={() => toggleSection(id)}
        className="w-full py-4 flex justify-between items-center text-left group"
      >
        <span className="text-[10px] font-bold tracking-widest uppercase group-hover:text-brand-gold transition-colors">{title}</span>
        {openSections.includes(id) ? <Minus size={14} /> : <Plus size={14} />}
      </button>
      <AnimatePresence>
        {openSections.includes(id) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-sm text-gray-500 leading-relaxed">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-[10px] font-bold tracking-widest uppercase text-gray-400 mb-12">
          <button onClick={() => navigate('/')} className="hover:text-brand-gold transition-colors">Home</button>
          <ChevronRight size={10} />
          <button onClick={() => navigate('/products')} className="hover:text-brand-gold transition-colors">Products</button>
          <ChevronRight size={10} />
          <span className="text-brand-dark">{product.title || product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Image Gallery */}
          <div className="space-y-6">
            <div 
              ref={imageRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              className="aspect-[3/4] overflow-hidden bg-brand-cream/30 relative cursor-zoom-in max-w-md mx-auto"
            >
              <motion.img 
                src={resolveImageUrl(product.images?.[activeImage] || product.image)} 
                alt={product.title || product.name} 
                className="w-full h-full object-cover"
                style={{
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  scale: isZoomed ? 2 : 1
                }}
                transition={{ type: 'tween', duration: 0.1 }}
                referrerPolicy="no-referrer"
              />
              {isZoomed && (
                <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm px-3 py-1 text-[8px] font-bold tracking-widest uppercase rounded-full">
                  Roll to Zoom
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
              {(product.images || [product.image]).filter(Boolean).map((img: string, i: number) => (
                <button 
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`aspect-square overflow-hidden border-2 transition-all ${activeImage === i ? 'border-brand-gold' : 'border-transparent hover:border-brand-gold/50'}`}
                >
                  <img src={resolveImageUrl(img)} alt={`${product.title || product.name} ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-10">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-gold mb-2 block">{product.category || 'Luxury Collection'}</span>
                  <h1 className="text-4xl md:text-5xl font-serif font-bold text-brand-dark">{product.title || product.name}</h1>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleToggleWishlist}
                    className={`p-3 rounded-full border transition-all ${isWishlisted ? 'bg-brand-gold border-brand-gold text-white' : 'border-brand-dark/10 hover:border-brand-gold text-brand-dark'}`}
                  >
                    <Heart size={20} fill={isWishlisted ? "currentColor" : "none"} />
                  </button>
                  <button 
                    onClick={handleShare}
                    className="p-3 rounded-full border border-brand-dark/10 hover:border-brand-gold text-brand-dark transition-all"
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex text-brand-gold">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>
                <span className="text-xs text-gray-400 font-bold tracking-widest uppercase">(24 Reviews)</span>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-3xl font-serif font-bold text-brand-gold">{formatPrice(product.price)}</p>
                {product.discountPrice && (
                  <p className="text-xl text-gray-400 line-through font-serif">{formatPrice(product.price)}</p>
                )}
              </div>
            </div>

            <p className="text-gray-500 leading-relaxed">{product.description}</p>

            <div className="space-y-8">
              {/* Color Selection */}
              {product.colors && product.colors.length > 0 && (
                <div className="space-y-4">
                  <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Color: <span className="text-brand-dark">{selectedColor}</span></p>
                  <div className="flex space-x-3">
                    {product.colors.map((color: string) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? 'border-brand-gold scale-110' : 'border-transparent hover:border-brand-dark/20'}`}
                        style={{ backgroundColor: color.toLowerCase().replace(' ', '') }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Size: <span className="text-brand-dark">{selectedSize}</span></p>
                    <button 
                      onClick={() => setIsSizeGuideOpen(true)}
                      className="text-[10px] font-bold tracking-widest uppercase text-brand-gold hover:underline flex items-center"
                    >
                      <Ruler size={12} className="mr-1" /> Size Guide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size: string) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[50px] h-12 flex items-center justify-center border text-xs font-bold transition-all ${
                          selectedSize === size 
                            ? 'bg-brand-dark text-white border-brand-dark' 
                            : 'border-brand-dark/10 hover:border-brand-gold'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity and Add to Cart */}
              <div className="flex space-x-4">
                <div className="flex items-center border border-brand-dark/10 h-14">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-4 hover:text-brand-gold transition-colors"
                  >
                    -
                  </button>
                  <span className="w-10 text-center font-bold text-sm">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-4 hover:text-brand-gold transition-colors"
                  >
                    +
                  </button>
                </div>
                <button 
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="flex-1 btn-primary flex items-center justify-center h-14"
                >
                  {isAdding ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                      <ShoppingBag size={20} />
                    </motion.div>
                  ) : (
                    <>
                      <ShoppingBag size={20} className="mr-2" />
                      Add to Bag
                    </>
                  )}
                </button>
              </div>

              {/* Virtual Try-On Button */}
              <button 
                onClick={() => setIsTryOnOpen(true)}
                className="w-full border border-brand-gold text-brand-gold py-4 text-xs font-bold tracking-widest uppercase flex items-center justify-center hover:bg-brand-gold hover:text-white transition-all group"
              >
                <Sparkles size={18} className="mr-2 group-hover:rotate-12 transition-transform" />
                Virtual Try-On
              </button>
            </div>

            {/* Accordion Sections */}
            <div className="border-t border-gray-100">
              <AccordionItem 
                id="description"
                title="Description"
                content={product.description}
              />
              {product.details && (Array.isArray(product.details) ? product.details.length > 0 : typeof product.details === 'string') && (
                <AccordionItem 
                  id="details"
                  title="Product Details"
                  content={
                    Array.isArray(product.details) ? (
                      <ul className="space-y-2 list-disc list-inside">
                        {product.details?.map((detail: string, i: number) => <li key={i}>{detail}</li>)}
                      </ul>
                    ) : (
                      <p>{product.details}</p>
                    )
                  }
                />
              )}
              <AccordionItem 
                id="shipping"
                title="Shipping & Returns"
                content={product.shipping || 'Free express shipping on all orders over $500. Standard delivery 3-5 business days.'}
              />
              <AccordionItem 
                id="care"
                title="Fabric & Care"
                content={product.fabric || 'Premium quality materials. Dry clean only recommended for longevity.'}
              />
              {product.style && (
                <AccordionItem 
                  id="style"
                  title="Style Note"
                  content={<p className="italic">"{product.style}"</p>}
                />
              )}
            </div>
          </div>
        </div>

        {/* Trending Products Section */}
        <section className="mt-32">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-gold mb-2 block">You May Also Like</span>
            <h2 className="text-3xl font-serif font-bold">Trending Products</h2>
          </div>
          
          <div className="relative overflow-hidden">
            <div 
              className="flex transition-transform duration-1000 ease-in-out"
              style={{ transform: `translateX(-${trendingIndex * (100 / itemsPerPage)}%)` }}
            >
              {[...trendingProducts, ...trendingProducts.slice(0, itemsPerPage)].map((p, idx) => (
                <div key={`${p.id}-${idx}`} className="flex-shrink-0 px-2" style={{ width: `${100 / itemsPerPage}%` }}>
                  <ProductCard 
                    id={p.id}
                    name={p.name}
                    price={p.price}
                    originalPrice={p.originalPrice}
                    image={p.images?.[0] || p.image}
                    images={p.images}
                    category={p.category}
                    discount={p.discount}
                    colors={p.colors}
                    sizes={p.sizes}
                  />
                </div>
              ))}
            </div>
            {trendingProducts.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-gray-500 italic">No result found for this collection</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {isSizeGuideOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSizeGuideOpen(false)}
              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white w-full max-w-2xl p-8 md:p-12 overflow-hidden"
            >
              <button 
                onClick={() => setIsSizeGuideOpen(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-brand-dark transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="text-center mb-10">
                <h2 className="text-3xl font-serif font-bold mb-2">Size Guide</h2>
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Measurements in Centimeters</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-brand-dark/10">
                      <th className="py-4 text-left font-bold tracking-widest uppercase text-[10px]">Size</th>
                      <th className="py-4 text-left font-bold tracking-widest uppercase text-[10px]">Chest</th>
                      <th className="py-4 text-left font-bold tracking-widest uppercase text-[10px]">Waist</th>
                      <th className="py-4 text-left font-bold tracking-widest uppercase text-[10px]">Hips</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-500">
                    <tr className="border-b border-brand-dark/5">
                      <td className="py-4 font-bold text-brand-dark">XS</td>
                      <td className="py-4">82-86</td>
                      <td className="py-4">62-66</td>
                      <td className="py-4">88-92</td>
                    </tr>
                    <tr className="border-b border-brand-dark/5">
                      <td className="py-4 font-bold text-brand-dark">S</td>
                      <td className="py-4">86-90</td>
                      <td className="py-4">66-70</td>
                      <td className="py-4">92-96</td>
                    </tr>
                    <tr className="border-b border-brand-dark/5">
                      <td className="py-4 font-bold text-brand-dark">M</td>
                      <td className="py-4">90-94</td>
                      <td className="py-4">70-74</td>
                      <td className="py-4">96-100</td>
                    </tr>
                    <tr className="border-b border-brand-dark/5">
                      <td className="py-4 font-bold text-brand-dark">L</td>
                      <td className="py-4">94-98</td>
                      <td className="py-4">74-78</td>
                      <td className="py-4">100-104</td>
                    </tr>
                    <tr>
                      <td className="py-4 font-bold text-brand-dark">XL</td>
                      <td className="py-4">98-102</td>
                      <td className="py-4">78-82</td>
                      <td className="py-4">104-108</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-10 p-6 bg-brand-cream/30 border border-brand-gold/10">
                <p className="text-xs leading-relaxed text-gray-600">
                  <span className="font-bold text-brand-dark block mb-1">How to Measure:</span>
                  For the most accurate results, measure yourself in your undergarments. Keep the tape measure firm but not tight.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Virtual Try-On Modal */}
      <AnimatePresence>
        {isTryOnOpen && (
          <VirtualTryOn 
            productImage={product.images?.[0]} 
            productName={product.name} 
            onClose={() => setIsTryOnOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
