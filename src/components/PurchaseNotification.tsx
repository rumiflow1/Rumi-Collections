import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import { resolveImageUrl } from '../lib/utils';

export default function PurchaseNotification() {
  const { SiteConfig } = useConfig();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const notifications = SiteConfig?.purchaseNotifications?.items || [];
  const globalVisible = SiteConfig?.purchaseNotifications?.isVisible;

  useEffect(() => {
    if (!globalVisible || notifications.length === 0) return;

    // First show after 8 seconds
    const startTimer = setTimeout(() => {
      triggerNotification();
    }, 8000);

    const triggerNotification = () => {
      setIsVisible(true);
      
      // Hide after 6 seconds
      setTimeout(() => {
        setIsVisible(false);
        // Prep next one
        setTimeout(() => {
          setCurrentIdx((prev) => (prev + 1) % notifications.length);
        }, 1000);
      }, 6000);
    };

    const interval = setInterval(triggerNotification, 20000); // Every 20s

    return () => {
      clearTimeout(startTimer);
      clearInterval(interval);
    };
  }, [globalVisible, notifications.length]);

  if (!globalVisible || notifications.length === 0) return null;

  const current = notifications[currentIdx];

  return (
    <div className="fixed bottom-8 left-4 md:left-8 z-[100] pointer-events-none">
      <AnimatePresence>
        {isVisible && current && (
          <motion.div
            initial={{ x: -100, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -100, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="pointer-events-auto bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-brand-gold/10 p-4 min-w-[320px] flex items-center gap-4 relative overflow-hidden group"
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-gold/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            
            <div className="w-20 h-20 bg-gray-100 rounded-2xl overflow-hidden shadow-inner flex-shrink-0">
              <img 
                src={resolveImageUrl(current.image)} 
                alt="Purchased" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="flex-grow">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-black uppercase text-brand-gold tracking-widest">Verified Multi-Buyer</p>
              </div>
              <p className="text-sm font-bold text-brand-dark leading-tight">
                <span className="font-serif italic font-black mr-1">{current.name}</span> from {current.location}
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                recently purchased <span className="text-brand-dark font-black">{current.product}</span>
              </p>
              <p className="text-[9px] text-gray-400 font-bold uppercase mt-1 tracking-tighter">
                {current.time}
              </p>
            </div>

            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-2 right-2 p-1 text-gray-300 hover:text-red-500 transition-colors"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
