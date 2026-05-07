import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ShieldCheck, Truck, Headset, Award, Star, Quote, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useConfig } from '../context/ConfigContext';
import { productApi, API_URL } from '../services/api';
import DynamicText from '../components/DynamicText';
import { resolveImageUrl } from '../lib/utils';

function TrustBadge({ icon, title, subtitle }: { icon: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="flex flex-col items-center text-center space-y-3">
      <div className="w-12 h-12 bg-brand-cream rounded-full flex items-center justify-center text-brand-gold">
        {icon}
      </div>
      <h3 className="text-[10px] font-bold tracking-widest uppercase">{title}</h3>
      <p className="text-[9px] text-gray-400 uppercase tracking-wider">{subtitle}</p>
    </div>
  );
}

function TrustBadgeMobile() {
  const [index, setIndex] = useState(0);
  const badges = [
    { icon: <ShieldCheck size={24} />, title: "Secure Payment", subtitle: "100% Secure Checkout" },
    { icon: <Truck size={24} />, title: "Free Shipping", subtitle: "On Orders Over $500" },
    { icon: <Headset size={24} />, title: "24/7 Support", subtitle: "Dedicated Assistance" },
    { icon: <Award size={24} />, title: "Premium Quality", subtitle: "Ethically Sourced" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 2) % badges.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [badges.length]);

  return (
    <div className="grid grid-cols-2 gap-8">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="contents"
        >
          <TrustBadge {...badges[index]} />
          <TrustBadge {...badges[(index + 1) % badges.length]} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const { SiteConfig } = useConfig();
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const homeReviews = SiteConfig?.customerReviews?.items || [];
  const categories = SiteConfig?.featuredCollections?.items || [];

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await productApi.getAll();
        const data = response.data.products || response.data;
        if (Array.isArray(data)) {
          const mapped = data.map((p: any) => ({
            id: p._id || p.id,
            name: p.title || p.name,
            price: Number(p.price) || 0,
            originalPrice: Number(p.originalPrice) || Number(p.price) || 0,
            image: p.images?.[0] || p.image,
            images: p.images || [],
            category: p.category,
            discount: Number(p.discount) || 0,
            isNewArrival: p.isNewArrival,
            showOnHomePage: p.isFeatured || p.showOnHomePage,
            tagline: p.tagline || '',
            colors: p.colors || [],
            sizes: p.sizes || []
          }));
          setFeaturedProducts(mapped.filter((p: any) => p.showOnHomePage));
          setNewArrivals(mapped.filter((p: any) => p.isNewArrival));
        }
        console.log("💎 System Success: Collections & Products synchronized with Master Vault.");
      } catch (err: any) {
        console.error(`Failed to fetch products from backend:`, err.message || err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const [reviewIndex, setReviewIndex] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(1);
  const [reviewsPerPage, setReviewsPerPage] = useState(1);
  const [newArrivalsIndex, setNewArrivalsIndex] = useState(0);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [categoryIndex, setCategoryIndex] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setItemsPerPage(4);
        setReviewsPerPage(4);
      } else if (window.innerWidth >= 768) {
        setItemsPerPage(2);
        setReviewsPerPage(2);
      } else {
        setItemsPerPage(2); // Mobile: 2 items for products
        setReviewsPerPage(1); // Mobile: 1 item for reviews
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- 🎭 SLIDING LOGIC (HORIZONTAL MOVE) ---
  useEffect(() => {
    if (homeReviews.length <= reviewsPerPage) return;
    const timer = setInterval(() => {
      setReviewIndex((prev) => (prev + 1) % homeReviews.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [homeReviews.length, reviewsPerPage]);

  useEffect(() => {
    if (newArrivals.length <= itemsPerPage) return;
    const timer = setInterval(() => {
      setNewArrivalsIndex((prev) => (prev + 1) % newArrivals.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [newArrivals.length, itemsPerPage]);

  useEffect(() => {
    const colItems = window.innerWidth >= 1024 ? 3 : 1;
    if (categories.length <= colItems) return;
    const timer = setInterval(() => {
      setCategoryIndex((prev) => (prev + 1) % categories.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [categories.length]);

  return (
    <main>
      <Hero />
      
      {/* New Arrivals Section */}
      <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="text-center mb-8">
          <DynamicText id="new_arrivals_tag" defaultContent="Latest Collection" className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-gold mb-2 block" />
          <DynamicText id="new_arrivals_title" defaultContent="New Arrivals" as="h2" className="text-3xl md:text-5xl font-serif font-bold" />
          <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-4"></div>
        </div>
        
        <div className="relative">
          {isLoading ? (
            <div className="w-full py-20 flex flex-col items-center justify-center space-y-4">
              <Loader2 className="animate-spin text-brand-gold" size={40} />
              <p className="text-xs font-bold tracking-widest uppercase text-gray-400">Loading New Arrivals...</p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden">
                <div 
                  className="flex transition-transform duration-1000 ease-in-out"
                  style={{ transform: `translateX(-${newArrivalsIndex * (100 / itemsPerPage)}%)` }}
                >
                  {/* To handle infinite loop seamlessly, we duplicate items at the end */}
                  {[...newArrivals, ...newArrivals.slice(0, itemsPerPage)].map((product, idx) => (
                    <div key={`${product.id}-${idx}`} className="flex-shrink-0 px-2 md:px-4" style={{ width: `${100 / itemsPerPage}%` }}>
                      <ProductCard 
                        id={product.id}
                        name={product.name}
                        price={product.price}
                        originalPrice={product.originalPrice}
                        image={product.image}
                        images={product.images}
                        category={product.category}
                        discount={product.discount}
                        isNewArrival={product.isNewArrival}
                        colors={product.colors}
                        sizes={product.sizes}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {newArrivals.length > itemsPerPage && (
                <div className="flex justify-center mt-12 space-x-2">
                  {newArrivals.map((_: any, i: number) => (
                    <button 
                      key={i} 
                      onClick={() => setNewArrivalsIndex(i)}
                      className={`h-1 transition-all duration-500 ${newArrivalsIndex === i ? 'w-8 bg-brand-gold' : 'w-2 bg-gray-200 hover:bg-gray-300'}`}
                    />
                  ))}
                </div>
              )}
              {newArrivals.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-gray-500 italic">No result found for this collection</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Featured Arrivals Section - Vertical Grid */}
      <section className="py-12 md:py-16 bg-brand-cream/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <DynamicText id="featured_arrivals_tag" defaultContent="Featured Selection" className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-gold mb-2 block" />
            <DynamicText id="featured_arrivals_title" defaultContent="Featured Arrivals" as="h2" className="text-3xl md:text-5xl font-serif font-bold" />
            <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-4"></div>
          </div>
          
          <div>
            {isLoading ? (
              <div className="w-full py-20 flex flex-col items-center justify-center space-y-4">
                <Loader2 className="animate-spin text-brand-gold" size={40} />
                <p className="text-xs font-bold tracking-widest uppercase text-gray-400">Loading Featured Collection...</p>
              </div>
            ) : (
              <>
                {/* Desktop Layout: Top 4 then rest (up to featuredLimit) */}
                <div className="hidden lg:block space-y-12">
                  <div className="grid grid-cols-4 gap-8">
                    {featuredProducts.slice(0, 4).map((product) => (
                      <ProductCard 
                        key={product.id}
                        {...product}
                      />
                    ))}
                  </div>
                  {featuredProducts.length > 4 && (
                    <div className="grid grid-cols-4 gap-8 opacity-90">
                      {featuredProducts.slice(4, (SiteConfig?.featuredCollections as any)?.featuredLimit || 12).map((product) => (
                        <ProductCard 
                          key={product.id}
                          {...product}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Mobile Layout: 2 per row (up to featuredLimit) */}
                <div className="lg:hidden grid grid-cols-2 gap-4">
                  {featuredProducts.slice(0, (SiteConfig?.featuredCollections as any)?.featuredLimit || 12).map((product) => (
                    <ProductCard 
                      key={product.id}
                      {...product}
                    />
                  ))}
                </div>

                {featuredProducts.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-gray-500 italic">No products available in this selection</p>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="mt-12 text-center">
            <Link to="/products" className="btn-outline inline-flex items-center group">
              View All Products <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {(!SiteConfig || SiteConfig?.featuredCollections?.isVisible !== false) && (
        <section className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden">
          <div className="text-center mb-8">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-gold mb-2 block">
              <DynamicText id="collections_tag" defaultContent="Browse By" />
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold">
              <DynamicText id="collections_title" defaultContent="Our Collections" />
            </h2>
            <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-4"></div>
          </div>

          <div className="relative">
            <div className="overflow-hidden">
              <div 
                className="flex transition-transform duration-1000 ease-in-out" 
                style={{ transform: `translateX(-${categoryIndex * (100 / (window.innerWidth >= 1024 ? 3 : 1))}%)` }}
              >
                {/* Looping fix for categories */}
                {[...categories, ...(categories.length > 0 ? (window.innerWidth >= 1024 ? categories.slice(0, 3) : categories.slice(0, 1)) : [])].map((cat, idx) => (
                  <div key={idx} className="flex-shrink-0 w-full lg:w-1/3 px-2 md:px-4">
                    <Link to={cat.link} className="group relative aspect-[3/4] block overflow-hidden">
                      <img 
                        src={resolveImageUrl(cat.image)} 
                        alt={cat.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <h3 className="text-white text-3xl font-serif font-bold italic tracking-wider">{cat.name}</h3>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
            
            {categories.length > (window.innerWidth >= 1024 ? 3 : 1) && (
              <div className="flex justify-center mt-8 space-x-2">
                {categories.map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCategoryIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${categoryIndex === i ? 'bg-brand-gold w-6' : 'bg-brand-dark/10'}`}
                  />
                ))}
              </div>
            )}
            {categories.length === 0 && (
              <div className="py-20 text-center">
                <p className="text-gray-500 italic">No result found for this collection</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Collection Links Carousel */}
      <section className="py-12 bg-brand-dark text-white overflow-hidden">
        <div className="flex whitespace-nowrap animate-scroll">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex space-x-12 px-6">
              {categories.map((cat, idx) => (
                <Link key={idx} to={cat.link} className="text-xl md:text-3xl font-serif italic hover:text-brand-gold transition-colors">{cat.name}</Link>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Brand Story */}
      <section className="bg-brand-dark text-white py-24 md:py-32 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-16 md:mb-0 relative z-10 text-center md:text-left">
            <motion.h2 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-7xl font-serif font-bold mb-8 leading-tight"
            >
              <DynamicText id="brand_story_title" defaultContent="Crafted with Passion" />
              <div className="w-12 h-0.5 bg-brand-gold mt-4 md:mx-0 mx-auto"></div>
            </motion.h2>
            <div className="text-gray-400 text-base md:text-lg leading-relaxed mb-10 max-w-md mx-auto md:mx-0">
              <DynamicText id="brand_story_text" defaultContent="Every piece in our collection is a testament to our commitment to quality. We source the finest materials from around the globe to ensure your comfort and style." />
            </div>
            <Link to="/about" className="btn-outline border-white text-white hover:bg-white hover:text-brand-dark">
              <DynamicText id="brand_story_btn" defaultContent="Our Story" />
            </Link>
          </div>
          <div className="md:w-1/2 relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative z-10 aspect-[4/5] w-full max-w-md mx-auto overflow-hidden"
            >
              <img 
                src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1974&auto=format&fit=crop" 
                alt="Craftsmanship" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </motion.div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-white/5 rounded-full z-0"></div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-24 bg-white border-y border-brand-dark/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-gold mb-2 block">
              <DynamicText id="trust_badges_tag" defaultContent="Our Commitment" />
            </span>
            <h2 className="text-4xl font-serif font-bold">
              <DynamicText id="trust_badges_title" defaultContent="Why Shop With Luxe Attire" />
            </h2>
            <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-4"></div>
          </div>
          
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-4 gap-8">
            <TrustBadge icon={<ShieldCheck size={24} />} title="Secure Payment" subtitle="100% Secure Checkout" />
            <TrustBadge icon={<Truck size={24} />} title="Free Shipping" subtitle="On Orders Over $500" />
            <TrustBadge icon={<Headset size={24} />} title="24/7 Support" subtitle="Dedicated Assistance" />
            <TrustBadge icon={<Award size={24} />} title="Premium Quality" subtitle="Ethically Sourced" />
          </div>

          {/* Mobile Carousel */}
          <div className="md:hidden">
            <TrustBadgeMobile />
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      {(!SiteConfig || SiteConfig?.customerReviews?.isVisible !== false) && homeReviews.length > 0 && (
        <section className="py-24 bg-brand-cream/30 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-gold mb-2 block">
                <DynamicText id="reviews_tag" defaultContent="Testimonials" />
              </span>
              <h2 className="text-4xl font-serif font-bold">
                <DynamicText id="reviews_title" defaultContent="What Our Clients Say" />
              </h2>
              <div className="w-12 h-0.5 bg-brand-gold mx-auto mt-4"></div>
            </div>

            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-1000 ease-in-out" 
                style={{ transform: `translateX(-${reviewIndex * (100 / reviewsPerPage)}%)` }}
              >
                {[...homeReviews, ...homeReviews.slice(0, reviewsPerPage)].map((review: any, idx: number) => (
                  <div key={`${review.id || idx}-${idx}`} className="flex-shrink-0 px-4 transition-all duration-500" style={{ width: `${100 / reviewsPerPage}%` }}>
                    <div className="bg-white p-8 border border-brand-dark/5 flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex text-brand-gold mb-4">
                          {[...Array(Number(review.rating) || 5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
                        </div>
                        <Quote size={24} className="text-brand-gold/20 mb-4" />
                        <p className="text-gray-600 text-sm italic leading-relaxed mb-6">"{review.content || review.comment}"</p>
                      </div>
                      <div>
                        <h4 className="font-serif font-bold text-brand-dark uppercase tracking-tight">{review.name || review.user}</h4>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{review.role || review.profession}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-center mt-12 space-x-2">
              {homeReviews.slice(0, Math.max(1, homeReviews.length - itemsPerPage + 1)).map((_: any, i: number) => (
                <button 
                  key={i} 
                  onClick={() => setReviewIndex(i)}
                  className={`h-1 transition-all duration-500 ${reviewIndex === i ? 'w-8 bg-brand-gold' : 'w-2 bg-gray-200 hover:bg-gray-300'}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
