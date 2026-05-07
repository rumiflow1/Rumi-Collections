import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { resolveImageUrl } from '../lib/utils';
import DynamicText from './DynamicText';

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { SiteConfig, loading } = useConfig();

  const slides = SiteConfig?.heroBanner?.slides || [];

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!SiteConfig?.heroBanner?.isVisible) return null;

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <section className="relative h-[80vh] md:h-screen overflow-hidden bg-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <Link to={slides[currentSlide]?.link || '/products'} className="absolute inset-0">
            <img 
              src={resolveImageUrl(slides[currentSlide]?.image)} 
              alt={slides[currentSlide]?.title || "Hero Slide"} 
              className="w-full h-full object-cover opacity-60"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="space-y-3 max-w-4xl"
              >
                <DynamicText 
                  id={`hero_subtitle_${currentSlide + 1}`} 
                  defaultContent={slides[currentSlide]?.subtitle || ''} 
                  className="text-brand-gold text-[14px] md:text-xs font-bold tracking-[0.5em] uppercase block"
                  style={{ 
                    color: slides[currentSlide]?.subtitleColor || undefined,
                    fontSize: slides[currentSlide]?.subtitleFontSize || undefined
                  }}
                />
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                >
                  <DynamicText 
                    id={`hero_title_${currentSlide + 1}`} 
                    defaultContent={slides[currentSlide]?.title || ''} 
                    as="h2"
                    className="text-2xl md:text-6xl text-white font-serif font-bold leading-tight"
                    style={{
                      color: slides[currentSlide]?.titleColor || undefined,
                      fontSize: slides[currentSlide]?.titleFontSize || undefined,
                      fontFamily: slides[currentSlide]?.titleFontFamily || undefined
                    }}
                  />
                </motion.div>
                <div className="pt-4">
                  <DynamicText 
                    id={`hero_btn_${currentSlide + 1}`} 
                    defaultContent={slides[currentSlide]?.btnText || "Explore Now"} 
                    className="btn-primary !py-4 !px-10 text-xs md:text-sm inline-flex items-center group"
                    style={{
                      color: slides[currentSlide]?.btnColor || undefined,
                      background: slides[currentSlide]?.btnBackground || undefined
                    }}
                  />
                </div>
              </motion.div>
            </div>
          </Link>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <div className="absolute inset-x-4 md:inset-x-8 top-1/2 -translate-y-1/2 flex justify-between z-20">
        <button onClick={prevSlide} className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-brand-dark transition-all">
          <ChevronLeft size={24} />
        </button>
        <button onClick={nextSlide} className="p-3 rounded-full bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-brand-dark transition-all">
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            className={`h-1 transition-all duration-500 ${currentSlide === i ? 'w-12 bg-brand-gold' : 'w-6 bg-white/30'}`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 right-10 text-white/50 flex flex-col items-center z-20 hidden md:flex"
      >
        <span className="text-[10px] uppercase tracking-widest mb-2">Scroll</span>
        <div className="w-[1px] h-12 bg-white/30"></div>
      </motion.div>
    </section>
  );
}
