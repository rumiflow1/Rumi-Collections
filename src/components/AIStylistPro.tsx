import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, X, Loader2, Volume2, VolumeX } from 'lucide-react';
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

  useEffect(() => {
    if (messages.length === 0 && SiteConfig) {
      setMessages([{ role: 'ai', text: `Hello. I am your shopping assistant for ${String(SiteConfig.header?.logoText || 'DENFIT')}. How can I help you today?` }]);
    }
  }, [SiteConfig, messages.length]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  const speak = (text: string) => {
    if (!isAudioEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 500));
    utterance.rate = 0.92;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  };

  const processNavigation = (text: string) => {
    const regex = /\[NAV:([A-Z_]+)(?::([^\]]+))?\]/gi;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text))) {
      const action = match[1].toUpperCase();
      const param = match[2]?.trim();
      if (action === 'HOME') navigate('/');
      else if (action === 'PRODUCTS') navigate('/products');
      else if (action === 'CART') navigate('/cart');
      else if (action === 'LOGIN') navigate('/auth');
      else if (action === 'PROFILE') navigate('/profile');
      else if (action === 'CONTACT') navigate('/contact');
      else if (action === 'PRODUCT' && param) {
        const product = products.find((p: any) => String(p.name || p.title || '').toLowerCase().includes(param.toLowerCase()));
        if (product) navigate(`/product/${product.id || product._id}`);
      }
    }
  };

  const handleSend = async () => {
    const userMessage = input.trim();
    if (!userMessage || isLoading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);
    try {
      const history = messages.slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
      const response = await axios.post('/api/ai/stylist', { message: userMessage, history });
      const aiText = String(response.data?.text || 'I am ready to help with your selection.');
      processNavigation(aiText);
      const cleanText = aiText.replace(/\[NAV:[^\]]+\]/gi, '').replace(/\[EXT:[^\]]+\]/gi, '').trim();
      setMessages(prev => [...prev, { role: 'ai', text: cleanText }]);
      speak(cleanText);
    } catch (error) {
      console.error('AI Assistant error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: 'I am having trouble connecting right now. Please try again shortly.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return <>
    <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-[60] bg-[#000] text-white p-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-brand-gold transition-all duration-300 border border-white/10 group">
      <Sparkles size={24} className="text-brand-gold group-hover:rotate-12 transition-transform" />
    </motion.button>

    <AnimatePresence>{isOpen && <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="fixed bottom-20 right-4 md:right-8 z-[100] w-[calc(100%-2rem)] md:w-96 h-[450px] max-h-[60vh] bg-white shadow-2xl flex flex-col overflow-hidden border border-brand-dark/5">
      <div className="bg-brand-dark text-white p-4 flex justify-between items-center"><div className="flex items-center gap-3"><Sparkles size={18} className="text-brand-gold" /><span className="font-serif font-bold tracking-tight">AI ASSISTANT</span><button onClick={() => setIsAudioEnabled(v => !v)} className={`p-1.5 rounded-full ${isAudioEnabled ? 'bg-brand-gold text-black' : 'text-white/50 hover:bg-white/10'}`}>{isAudioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}</button></div><button onClick={() => setIsOpen(false)}><X size={20} /></button></div>
      <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-brand-cream/30">{messages.map((msg, idx) => <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-3 text-sm ${msg.role === 'user' ? 'bg-brand-dark text-white rounded-l-lg rounded-tr-lg' : 'bg-white text-brand-dark border border-brand-dark/5 rounded-r-lg rounded-tl-lg'}`}>{msg.text}</div></div>)}{isLoading && <div className="flex justify-start"><div className="bg-white p-3 rounded-r-lg rounded-tl-lg"><Loader2 size={18} className="animate-spin text-brand-gold" /></div></div>}<div ref={messagesEndRef} /></div>
      <div className="p-4 border-t border-brand-dark/5 bg-white"><div className="flex space-x-2"><input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSend(); }} placeholder="Inquire about our collection..." className="flex-grow text-sm border-b border-brand-dark/10 py-2 focus:outline-none focus:border-brand-gold bg-transparent" /><button onClick={handleSend} disabled={isLoading} className="text-brand-dark hover:text-brand-gold disabled:opacity-50"><Send size={20} /></button></div></div>
    </motion.div>}</AnimatePresence>
  </>;
}
