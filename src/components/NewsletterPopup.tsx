import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Sparkles, Send, CheckCircle2 } from 'lucide-react';
import axios from 'axios';
import { useAppContext } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';

export default function NewsletterPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [discountCode, setDiscountCode] = useState<string | null>(null);
  const { addToast } = useAppContext();
  const { SiteConfig } = useConfig();

  useEffect(() => {
    const hasSeen = localStorage.getItem('newsletter_popup_seen');
    if (hasSeen) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 5000); // 5 second delay

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('newsletter_popup_seen', 'true');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      await axios.post('/api/newsletter/subscribe', { email });
      setStatus('success');
      // For demo purposes, we'll give a 5% discount code
      setDiscountCode('WELCOME5');
      addToast('Thank you for joining our circle!', 'success');
    } catch (error: any) {
      console.error('Subscription error:', error);
      setStatus('error');
      addToast(error.response?.data?.error || 'Subscription failed. Please try again.', 'error');
    }
  };

  if (!isVisible && status !== 'success') return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={handleClose}
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_30px_100px_rgba(0,0,0,0.5)] border border-white/20"
          >
            {/* Close Button */}
            <button 
              onClick={handleClose}
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-black/5 text-gray-400 hover:text-brand-dark rounded-full transition-all z-10"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col">
              {/* Image Section */}
              <div className="h-64 relative bg-gray-900">
                <img 
                  src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop" 
                  alt="Luxury Fashion" 
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex items-center space-x-2 text-brand-gold mb-2">
                    <Sparkles size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Exclusive Access</span>
                  </div>
                  <h2 className="text-3xl font-serif font-bold text-white tracking-tight">JOIN THE CIRCLE</h2>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-10 space-y-6">
                {status === 'success' ? (
                  <div className="text-center space-y-6 py-4 animate-in fade-in zoom-in duration-500">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-serif font-bold mb-2">Welcome to Luxe Attire</h3>
                      <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
                        Your exclusive invitation is confirmed. Use the code below for 5% off your first order.
                      </p>
                    </div>
                    <div className="p-4 bg-brand-gold/5 border-2 border-dashed border-brand-gold/20 rounded-xl">
                      <span className="text-2xl font-serif font-bold tracking-[0.2em] text-brand-dark">{discountCode}</span>
                    </div>
                    <button 
                      onClick={handleClose}
                      className="w-full py-4 bg-brand-dark text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-xl hover:bg-brand-gold transition-all"
                    >
                      Enter the Store
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 leading-relaxed text-center">
                      Unlock early access to new collections, private sales, and sartorial inspiration. <br/>
                      <span className="font-bold text-brand-gold">Sign up today and enjoy 5% off your first acquisition.</span>
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="email" 
                          required
                          placeholder="Your email address"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-brand-gold focus:bg-white outline-none transition-all"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full py-4 bg-brand-dark text-white text-[10px] font-bold uppercase tracking-[0.3em] rounded-xl hover:bg-brand-gold transition-all shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50"
                      >
                        {status === 'loading' ? (
                          <span className="animate-pulse">Processing...</span>
                        ) : (
                          <>
                            <span>Join Now</span>
                            <Send size={14} />
                          </>
                        )}
                      </button>
                    </form>

                    <p className="text-[9px] text-gray-400 text-center uppercase tracking-widest">
                      By signing up, you agree to our privacy policy. No spam, only style.
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
