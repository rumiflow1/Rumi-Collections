import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, Loader2, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useConfig } from '../context/ConfigContext';
import { useAppContext } from '../context/AppContext';
import { GoogleGenerativeAI } from "@google/generative-ai";

export default function AIStylistPro() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const { SiteConfig } = useConfig();
  const { products } = useAppContext();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  // Initialize AI safely
  const getAI = () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("AI System Key missing. Fallback mode active.");
    }
    return new GoogleGenerativeAI(key || '');
  };

  // Audio Handler - Optimized for Luxury Persona
  const speak = (text: string) => {
    if (!isAudioEnabled || !window.speechSynthesis) return;
    
    // Safety check for long texts
    const truncatedText = text.length > 500 ? text.substring(0, 500) + '...' : text;
    window.speechSynthesis.cancel();
    
    const cleanText = truncatedText
      .replace(/\[NAV:[^\]]+\]/gi, '')
      .replace(/\[EXT:[^\]]+\]/gi, '')
      .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') 
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => 
      (v.name.includes('Premium') || v.name.includes('Natural') || v.name.includes('Google UK English')) 
      && v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));
    
    if (premiumVoice) utterance.voice = premiumVoice;
    utterance.pitch = 0.98; 
    utterance.rate = 0.92;  
    utterance.volume = 1;
    
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (messages.length === 0 && SiteConfig) {
      const brandName = SiteConfig.header.logoText || "STORE";
      setMessages([
        { role: 'ai', text: `Hello. I am your shopping assistant for ${brandName}. How can I help you today?` }
      ]);
    }
  }, [SiteConfig]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || !SiteConfig) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const gConfig: any = SiteConfig.aiConcierge || {};
      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        throw new Error('AI API Key is not configured. Please check environment variables.');
      }
      
      const genAI = new GoogleGenerativeAI(key);
      const productList = products.map(p => `- ${p.name}: $${p.price} (Category: ${p.category})`).join('\n');
      const socialLinks = SiteConfig?.footer?.socials || SiteConfig?.announcementBar?.socials || [];
      const tiktokLink = socialLinks.find((s: any) => s.platform === 'TikTok')?.url || 'https://tiktok.com';
      const whatsappLink = socialLinks.find((s: any) => s.platform === 'WhatsApp')?.url || 'https://wa.me/yournumber';

      const systemInstruction = `${gConfig.systemInstruction || 'You are a helpful luxury shopping assistant.'}
      Current Brand: ${SiteConfig.header?.logoText || "Luxe Attire"}.
      Brand Voice: ${gConfig.brandVoice || 'Polite and professional'}.
      
      NAVIGATION TAGS:
      - [NAV:HOME] for home page
      - [NAV:PRODUCTS] for all products (/shop)
      - [NAV:CART] for viewing cart
      - [NAV:LOGIN] for account/login page
      - [NAV:CONTACT] for support
      - [NAV:TIKTOK] for TikTok: ${tiktokLink}
      - [NAV:WHATSAPP] for WhatsApp: ${whatsappLink}
      - [NAV:PRODUCT:Name] to recommend a specific product from our list.
      
      OUR PRODUCTS:
      ${productList}
      
      Always guide users with navigation tags when relevant.`;

      const model = genAI.getGenerativeModel({ 
        model: gConfig.model || "models/gemini-1.5-flash",
        systemInstruction: systemInstruction
      });

      const history = messages
        .slice(1) // Skip the initial welcoming message from AI
        .slice(-10)
        .map(m => ({
          role: m.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: m.text }]
        }));

      // Double check history starts with user
      const chatHistory = history.length > 0 && history[0].role === 'user' ? history : [];

      const chat = model.startChat({
        history: chatHistory,
      });

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      const aiText = response.text();

      // Process tags
      const navTagRegex = /\[NAV:([A-Z_]+)(?::([^\]]+))?\]/gi;
      let match;
      while ((match = navTagRegex.exec(aiText)) !== null) {
        const action = match[1].toUpperCase();
        const param = match[2]?.trim();
        if (action === 'HOME') navigate('/');
        else if (action === 'PRODUCTS') navigate('/shop');
        else if (action === 'CART') navigate('/cart');
        else if (action === 'LOGIN') navigate('/login');
        else if (action === 'PROFILE') navigate('/profile');
        else if (action === 'CONTACT') navigate('/contact');
        else if (action === 'TIKTOK') window.open(tiktokLink, '_blank');
        else if (action === 'WHATSAPP') window.open(whatsappLink, '_blank');
        else if (action === 'PRODUCT' && param) {
          const p = products.find(p => p.name.toLowerCase().includes(param.toLowerCase()));
          if (p) navigate(`/product/${p.id}`);
        }
      }

      const cleanText = aiText.replace(/\[NAV:[^\]]+\]/gi, '').replace(/\[EXT:[^\]]+\]/gi, '').trim();
      setMessages(prev => [...prev, { role: 'ai', text: cleanText }]);
      
      if (isAudioEnabled) speak(cleanText);

    } catch (error: any) {
      console.error('AI Assistant error:', error);
      setMessages(prev => [...prev, { role: 'ai', text: "I'm sorry, I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[60] bg-[#000] text-white p-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:bg-brand-gold transition-all duration-300 border border-white/10 group overflow-hidden"
      >
        <div className="relative z-10">
          <Sparkles size={24} className="text-brand-gold group-hover:rotate-12 transition-transform" />
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-brand-gold rounded-full animate-pulse border-2 border-black" />
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatRef}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-20 right-4 md:right-8 z-[100] w-[calc(100%-2rem)] md:w-96 h-[450px] max-h-[60vh] bg-white shadow-2xl flex flex-col overflow-hidden border border-brand-dark/5"
          >
            <div className="bg-brand-dark text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-brand-gold" />
                <span className="font-serif font-bold tracking-tight">AI ASSISTANT</span>
                <button 
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className={`p-1.5 rounded-full transition-all ${isAudioEnabled ? 'bg-brand-gold text-black' : 'hover:bg-white/10 text-white/50'}`}
                >
                  {isAudioEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                </button>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:text-brand-gold transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-brand-cream/30">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 text-sm ${
                    msg.role === 'user'
                      ? 'bg-brand-dark text-white rounded-l-lg rounded-tr-lg shadow-sm'
                      : 'bg-white text-brand-dark border border-brand-dark/5 rounded-r-lg rounded-tl-lg shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-r-lg rounded-tl-lg border border-brand-dark/5">
                    <Loader2 size={18} className="animate-spin text-brand-gold" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-brand-dark/5 bg-white">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Inquire about our collection..."
                  className="flex-grow text-sm border-b border-brand-dark/10 py-2 focus:outline-none focus:border-brand-gold bg-transparent"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading}
                  className="text-brand-dark hover:text-brand-gold transition-colors disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
