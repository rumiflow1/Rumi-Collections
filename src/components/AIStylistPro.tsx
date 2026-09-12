import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, X, Loader2, Volume2, VolumeX, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useConfig } from '../context/ConfigContext';
import { useAppContext, convertCurrency } from '../context/AppContext';
import { BRAND, BRAND_LOGO_URL } from '../config/brand';

// SAFE TEXT PARSER: Prevents React Error #31 by forcing everything to a safe string
const safeText = (value: any, fallback = ''): string => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (value && typeof value === 'object') return String(value.text || value.message || value.name || value.title || fallback);
  return String(fallback);
};

// Clean markdown-like symbols for a premium look without raw # or **
const cleanResponse = (value: any): string => {
  const text = safeText(value);
  return text
    .replace(/^#{1,6}\s*/gm, '') // Remove heading hashes
    .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers
    .replace(/`([^`]+)`/g, '$1') // Remove inline code ticks
    .trim();
};

export default function AIStylistPro() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  
  const { SiteConfig } = useConfig();
  const runtimeBrand = safeText(SiteConfig?.branding?.brandName || SiteConfig?.branding?.name || BRAND.name, BRAND.name);
  const runtimeLogo = safeText(SiteConfig?.branding?.logoUrl || SiteConfig?.header?.logoImage || BRAND_LOGO_URL, BRAND_LOGO_URL);
  const { products, currency } = useAppContext();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const liveProducts = useMemo(() => 
    Array.isArray(products) ? products.filter((p: any) => p && (p.id || p._id) && (p.name || p.title)).slice(0, 30) : [], 
  [products]);

  const trending = useMemo(() => 
    [...liveProducts].sort((a: any, b: any) => Number(Boolean(b.isTrending || b.isFeatured || b.isNewArrival)) - Number(Boolean(a.isTrending || a.isFeatured || a.isNewArrival))).slice(0, 4), 
  [liveProducts]);

  const hasUserMessage = messages.some(m => m.role === 'user');

  const quickSuggestions = useMemo(() => 
    [...new Set([
      ...trending.slice(0, 3).map((p: any) => `Show ${safeText(p.name || p.title, 'this piece')}`),
      ...(trending.some((p: any) => p.isNewArrival) ? ['New arrivals'] : []),
      'Help me choose a style'
    ])].slice(0, 5), 
  [trending]);

  useEffect(() => {
    if (messages.length === 0 && SiteConfig) {
      setMessages([{ role: 'ai', text: `Welcome to ${runtimeBrand}. I am your personal style concierge. How may I assist you in discovering our latest collections today?` }]);
    }
  }, [SiteConfig, runtimeBrand, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (preset?: string) => {
    const userMessage = String(preset ?? input).trim();
    if (!userMessage || isLoading) return;
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const history = messages.slice(-4).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
      
      const response = await axios.post('/api/ai/stylist', { 
        message: userMessage, 
        history,
        currency 
      }, { timeout: 15000 });

      // STRICTLY extract string to prevent React #31
      const rawText = response.data?.text || response.data?.message || 'I apologize, but I am currently unable to process that request.';
      const aiText = cleanResponse(rawText);

      setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
    } catch (error: any) {
      console.error('AI Assistant error:', error);
      const fallback = cleanResponse(error?.response?.data?.error || 'The stylist is momentarily unavailable. Please try again in a few seconds.');
      setMessages(prev => [...prev, { role: 'ai', text: fallback }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button 
        initial={{ scale: 0, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        whileHover={{ scale: 1.05 }} 
        whileTap={{ scale: 0.95 }} 
        onClick={() => setIsOpen(true)} 
        className="fixed bottom-6 right-6 z-[60] bg-[#0B1220] text-white p-4 rounded-full shadow-2xl border border-white/10"
        aria-label="Open personal concierge"
      >
        <img src={runtimeLogo} alt={runtimeBrand} className="w-8 h-8 object-contain rounded-full bg-white" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 20 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.96, y: 20 }} 
            className="fixed bottom-24 right-4 md:right-8 z-[100] w-[calc(100%-2rem)] md:w-[480px] h-[650px] max-h-[80vh] bg-white shadow-2xl flex flex-col overflow-hidden border border-gray-200 rounded-2xl"
          >
            {/* Header */}
            <div className="bg-[#0B1220] text-white p-4 flex justify-between items-center border-b border-white/10">
              <div className="flex items-center gap-3">
                <img src={runtimeLogo} alt={runtimeBrand} className="w-10 h-10 object-contain rounded-lg bg-white p-1" />
                <div>
                  <div className="font-serif font-bold tracking-[0.15em] text-sm">CONCIERGE</div>
                  <div className="text-[9px] uppercase tracking-[0.2em] text-gray-400">{runtimeBrand} Private Desk</div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {/* Trending Suggestions (Only shown BEFORE first user message) */}
            {!hasUserMessage && (
              <div className="px-4 pt-4 bg-[#F9F8F6] border-b border-gray-100">
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-500">Curated Live Picks</div>
                    <div className="text-sm font-serif font-bold text-[#0B1220] mt-1">Trending Now</div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2 pb-4">
                  {trending.map((p: any) => (
                    <button key={String(p.id || p._id)} onClick={() => { navigate(`/product/${p.id || p._id}`); setIsOpen(false); }} className="text-left group">
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-white border border-gray-100">
                        <img src={safeText(p.image || p.images?.[0])} alt={safeText(p.name || p.title, 'Product')} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="text-[9px] font-semibold text-[#0B1220] truncate mt-1.5">{safeText(p.name || p.title, 'Piece')}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-white">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3.5 text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-[#0B1220] text-white rounded-2xl rounded-br-sm' 
                      : 'bg-[#F9F8F6] text-gray-800 border border-gray-100 rounded-2xl rounded-bl-sm'
                  }`}>
                    {/* STRICT STRING RENDERING HERE PREVENTS REACT #31 */}
                    {String(msg.text)}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#F9F8F6] p-3.5 rounded-2xl flex items-center gap-2 text-xs text-gray-500 border border-gray-100">
                    <Loader2 size={16} className="animate-spin text-[#0B1220]" /> 
                    <span>Consulting the atelier...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="px-4 pt-3 bg-white border-t border-gray-100">
              {!hasUserMessage && (
                <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                  {quickSuggestions.map((s: string, idx: number) => (
                    <button key={idx} onClick={() => handleSend(s)} disabled={isLoading} className="shrink-0 rounded-full border border-gray-200 bg-[#F9F8F6] px-3 py-1.5 text-[10px] font-semibold tracking-wide text-[#0B1220] hover:border-[#0B1220] hover:bg-[#0B1220] hover:text-white transition-all disabled:opacity-50">
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <div className="pb-4 flex gap-2">
                <input 
                  type="text" 
                  value={input} 
                  onChange={e => setInput(e.target.value)} 
                  onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} 
                  placeholder="Ask your concierge..." 
                  className="flex-grow text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#0B1220] focus:ring-1 focus:ring-[#0B1220] bg-white transition-all"
                />
                <button 
                  onClick={() => handleSend()} 
                  disabled={isLoading || !input.trim()} 
                  className="w-12 h-12 rounded-xl bg-[#0B1220] text-white flex items-center justify-center hover:bg-[#1a253a] disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
                  aria-label="Send"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
