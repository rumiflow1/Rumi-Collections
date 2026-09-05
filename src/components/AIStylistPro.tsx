import { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Send, X, Loader2, Volume2, VolumeX, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useConfig } from '../context/ConfigContext';
import { useAppContext } from '../context/AppContext';

export default function AIStylistPro() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const { SiteConfig } = useConfig();
  const { products } = useAppContext();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const liveProducts = useMemo(() => Array.isArray(products) ? products.filter((p: any) => p && (p.id || p._id) && (p.name || p.title)) : [], [products]);
  const quickSuggestions = useMemo(() => {
    const configured = Array.isArray(SiteConfig?.header?.search?.trending) ? SiteConfig.header.search.trending.filter(Boolean).slice(0, 4) : [];
    const productSuggestions = liveProducts.slice(0, 4).map((p: any) => `Show ${p.name || p.title}`);
    const fallback = ['New arrivals', "Men's collection", "Women's collection", 'Help me choose'];
    return [...new Set([...configured, ...productSuggestions, ...fallback])].slice(0, 5);
  }, [SiteConfig, liveProducts]);

  useEffect(() => {
    if (messages.length === 0 && SiteConfig) {
      setMessages([{ role: 'ai', text: `Hello. I am your shopping assistant for ${String(SiteConfig.header?.logoText || 'DENFIT')}. I use the live collection and current site information only.` }]);
    }
  }, [SiteConfig, messages.length]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const speak = (text: string) => {
    if (!isAudioEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
    utterance.rate = 0.98;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  const findProduct = (query: string) => {
    const q = query.toLowerCase().replace(/\b(show|open|find|give|me|please|the|a|an)\b/g, ' ').replace(/\s+/g, ' ').trim();
    if (!q) return null;
    const terms = q.split(/\s+/).filter(Boolean);
    return liveProducts
      .map((p: any) => {
        const haystack = [p.name, p.title, p.category, p.collectionName, p.description, ...(Array.isArray(p.colors) ? p.colors : []), ...(Array.isArray(p.tags) ? p.tags : [])].filter(Boolean).join(' ').toLowerCase();
        const score = terms.reduce((n, term) => n + (haystack.includes(term) ? (haystack.startsWith(term) ? 3 : 1) : 0), 0);
        return { p, score };
      })
      .filter((x: any) => x.score > 0)
      .sort((a: any, b: any) => b.score - a.score)[0]?.p || null;
  };

  const getSocial = (platform: string) => (SiteConfig?.footer?.socials || []).find((s: any) => String(s.platform || '').toLowerCase() === platform.toLowerCase() && s.url);

  const extractWhatsAppNumber = (url: string) => {
    try {
      const match = decodeURIComponent(url).match(/(?:wa\.me\/|phone=)([+\d]+)/i);
      return match?.[1] || '';
    } catch { return ''; }
  };

  const processNavigation = (text: string, originalQuery: string) => {
    const regex = /\[(NAV|EXT):([^:\]]+)(?::([^\]]+))?\]/gi;
    let navigated = false;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      const kind = match[1].toUpperCase();
      const action = match[2].toUpperCase();
      const param = match[3]?.trim();
      if (kind === 'NAV') {
        if (action === 'HOME') { navigate('/'); navigated = true; }
        else if (action === 'PRODUCTS') { navigate('/products'); navigated = true; }
        else if (action === 'CART') { navigate('/cart'); navigated = true; }
        else if (action === 'LOGIN') { navigate('/auth'); navigated = true; }
        else if (action === 'PROFILE') { navigate('/profile'); navigated = true; }
        else if (action === 'CONTACT') { navigate('/contact'); navigated = true; }
        else if (action === 'FAQ') { navigate('/support?tab=faq'); navigated = true; }
        else if (action === 'PRODUCT' && param) {
          const product = liveProducts.find((p: any) => String(p.id || p._id) === param) || findProduct(param);
          if (product) { navigate(`/product/${product.id || product._id}`); navigated = true; }
        }
      } else if (kind === 'EXT' && param) {
        window.open(param, '_blank', 'noopener,noreferrer');
        navigated = true;
      }
    }

    const q = originalQuery.toLowerCase();
    if (!navigated && /\bwhats?app\b/i.test(q)) {
      const social = getSocial('WhatsApp');
      if (social?.url) { window.open(social.url, '_blank', 'noopener,noreferrer'); navigated = true; }
    } else if (!navigated && /\btik\s*tok\b/i.test(q)) {
      const social = getSocial('TikTok');
      if (social?.url) { window.open(social.url, '_blank', 'noopener,noreferrer'); navigated = true; }
    } else if (!navigated && /\binstagram\b/i.test(q)) {
      const social = getSocial('Instagram');
      if (social?.url) { window.open(social.url, '_blank', 'noopener,noreferrer'); navigated = true; }
    } else if (!navigated && /\b(login|sign in|signin)\b/i.test(q)) {
      navigate('/auth'); navigated = true;
    } else if (!navigated && /\bprofile\b/i.test(q)) {
      navigate('/profile'); navigated = true;
    } else if (!navigated && /\bfaq|faqs\b/i.test(q)) {
      navigate('/support?tab=faq'); navigated = true;
    } else if (!navigated) {
      const product = findProduct(q);
      if (product) { navigate(`/product/${product.id || product._id}`); navigated = true; }
    }

    return navigated;
  };

  const handleSend = async (preset?: string) => {
    const userMessage = (preset ?? input).trim();
    if (!userMessage || isLoading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
      const response = await axios.post('/api/ai/stylist', {
        message: userMessage,
        history,
        products: liveProducts,
        siteConfig: { header: SiteConfig?.header, footer: SiteConfig?.footer, pages: SiteConfig?.pages }
      });
      const aiText = String(response.data?.text || 'I could not find that in the live collection.');
      processNavigation(aiText, userMessage);
      const cleanText = aiText.replace(/\[(?:NAV|EXT):[^\]]+\]/gi, '').trim();
      let displayText = cleanText;
      if (/\bwhats?app\b/i.test(userMessage)) {
        const social = getSocial('WhatsApp');
        const number = social?.url ? extractWhatsAppNumber(social.url) : '';
        if (number && !displayText.includes(number)) displayText = `${displayText}\n\nWhatsApp: ${number}`;
      }
      setMessages(prev => [...prev, { role: 'ai', text: displayText }]);
      speak(displayText);
    } catch (error) {
      console.error('AI Assistant error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: 'I am having trouble connecting right now. Please try again shortly.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return <>
    <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-[60] bg-[#000] text-white p-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-brand-gold transition-all duration-300 border border-white/10 group" aria-label="Open AI assistant">
      <Sparkles size={24} className="text-brand-gold group-hover:rotate-12 transition-transform" />
    </motion.button>

    <AnimatePresence>{isOpen && <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="fixed bottom-20 right-4 md:right-8 z-[100] w-[calc(100%-2rem)] md:w-96 h-[500px] max-h-[70vh] bg-white shadow-2xl flex flex-col overflow-hidden border border-brand-dark/5 rounded-xl">
      <div className="bg-brand-dark text-white p-4 flex justify-between items-center"><div className="flex items-center gap-3"><Sparkles size={18} className="text-brand-gold" /><span className="font-serif font-bold tracking-tight">AI ASSISTANT</span><button onClick={() => setIsAudioEnabled(v => !v)} className={`p-1.5 rounded-full ${isAudioEnabled ? 'bg-brand-gold text-black' : 'text-white/50 hover:bg-white/10'}`} aria-label="Toggle voice">{isAudioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}</button></div><button onClick={() => setIsOpen(false)} aria-label="Close"><X size={20} /></button></div>
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-brand-cream/30">
        {messages.map((msg, idx) => <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[86%] p-3 text-sm whitespace-pre-line ${msg.role === 'user' ? 'bg-brand-dark text-white rounded-l-lg rounded-tr-lg' : 'bg-white text-brand-dark border border-brand-dark/5 rounded-r-lg rounded-tl-lg'}`}>{msg.text}</div></div>)}
        {isLoading && <div className="flex justify-start"><div className="bg-white p-3 rounded-r-lg rounded-tl-lg flex items-center gap-2 text-xs text-gray-500"><Loader2 size={18} className="animate-spin text-brand-gold" /> Finding the best live match…</div></div>}
        <div ref={messagesEndRef} />
      </div>
      <div className="px-4 pt-3 bg-white border-t border-brand-dark/5">
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {quickSuggestions.map((suggestion) => <button key={suggestion} onClick={() => handleSend(suggestion)} disabled={isLoading} className="shrink-0 rounded-full border border-brand-dark/10 bg-brand-cream/30 px-3 py-1.5 text-[10px] font-semibold tracking-wide text-brand-dark hover:border-brand-gold hover:text-brand-gold disabled:opacity-50">{suggestion}</button>)}
        </div>
        <div className="pb-4"><div className="flex space-x-2"><input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} placeholder="Ask about the live collection..." className="flex-grow text-sm border-b border-brand-dark/10 py-2 focus:outline-none focus:border-brand-gold bg-transparent" /><button onClick={() => handleSend()} disabled={isLoading} className="text-brand-dark hover:text-brand-gold disabled:opacity-50" aria-label="Send"><Send size={20} /></button></div></div>
      </div>
    </motion.div>}</AnimatePresence>
  </>;
}
