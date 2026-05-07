import React, { useState, useEffect } from 'react';
import { useConfig } from '../../context/ConfigContext';
import axios from 'axios';
import { 
  Sparkles, Save, RefreshCw, Eye, EyeOff, Bot, 
  MessageSquare, Settings2, ShieldAlert, Zap,
  BarChart3, History, Wand2, Languages, Lock, Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AIConcierge() {
  const { SiteConfig, loading, refreshConfig } = useConfig();
  const [localConfig, setLocalConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (SiteConfig) {
      setLocalConfig(JSON.parse(JSON.stringify(SiteConfig.aiConcierge || {
        isEnabled: true,
        brandVoice: "Polite and professional",
        systemInstruction: "You are an AI Assistant for our store...",
        model: "gemini-1.5-flash",
        welcomeMessage: "Hello. I am your personal shopping assistant."
      })));
    }
  }, [SiteConfig]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const updatedFullConfig = { ...SiteConfig, aiConcierge: localConfig };
      await axios.post('/api/admin/config', updatedFullConfig);
      await refreshConfig();
      setMessage('SUCCESS: AI Updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving AI config:', error);
      setMessage('Error: Connection failed.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setLocalConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  if (loading || !localConfig) {
    return <div className="flex justify-center p-20"><RefreshCw className="animate-spin text-brand-gold" size={32} /></div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      
      {/* 🤖 MASTER AI HEADER */}
      <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-2xl flex items-center justify-center border border-brand-gold/20">
            <Bot size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-white uppercase tracking-tighter">AI <span className="text-brand-gold">ASSISTANT</span></h2>
            <p className="text-[10px] text-gray-500 font-bold tracking-[0.3em] uppercase">AI Management v1.5</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <AnimatePresence>
            {message && (
              <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0}} className="text-xs font-bold text-brand-gold uppercase tracking-widest bg-brand-gold/10 px-4 py-2 rounded-lg border border-brand-gold/20">
                {message}
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="px-8 py-3 bg-brand-gold text-black rounded-xl font-bold uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2"
          >
            {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
            Synchronize AI
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 🛠️ CORE SETTINGS */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-5">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2"><Settings2 size={20} className="text-brand-gold"/> AI Settings</h3>
              <button 
                onClick={() => updateField('isEnabled', !localConfig.isEnabled)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${localConfig.isEnabled ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
              >
                {localConfig.isEnabled ? <Eye size={14}/> : <EyeOff size={14}/>}
                {localConfig.isEnabled ? 'Active' : 'Offline'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AI Model</label>
                <select 
                  value={localConfig.model} 
                  onChange={(e) => updateField('model', e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-brand-gold outline-none"
                >
                  <option value="gemini-3-flash-preview">Gemini 3 Flash (Fastest & Latest)</option>
                  <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Most Intelligent)</option>
                  <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Experimental)</option>
                </select>
              </div>

              <div className="space-y-2">
                <InputGroup 
                  label="Welcome Message" 
                  value={localConfig.welcomeMessage} 
                  onChange={(v: string) => updateField('welcomeMessage', v)} 
                  placeholder="Hello. I am your personal shopping assistant..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <InputGroup 
                label="Brand Voice" 
                value={localConfig.brandVoice} 
                onChange={(v: string) => updateField('brandVoice', v)} 
                placeholder="Polite and professional..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Wand2 size={12}/> System Instructions (The AI's Personality)
              </label>
              <textarea 
                value={localConfig.systemInstruction}
                onChange={(e) => updateField('systemInstruction', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm text-gray-400 h-64 resize-none leading-relaxed focus:border-brand-gold outline-none transition-all"
                placeholder="Define how the AI should behave, speak, and interact..."
              />
              <p className="text-[9px] text-gray-600 italic">This instruction is sent to Gemini on every interaction. Product data is automatically injected.</p>
            </div>
          </div>

        </div>

        {/* 📊 AI ANALYTICS SIDEBAR */}
        <div className="space-y-8">
          <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 space-y-6">
            <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2"><BarChart3 size={20} className="text-brand-gold"/> Insights</h3>
            <div className="space-y-4">
              <AnalyticItem label="Total Interactions" value="1,280" trend="+12%" />
              <AnalyticItem label="Product Requests" value="452" trend="+5%" />
              <AnalyticItem label="Conversion from AI" value="8.4%" trend="+1.2%" />
              <AnalyticItem label="Customer Satisfaction" value="4.9/5" />
            </div>
          </div>

          <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 space-y-6">
             <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2"><Zap size={20} className="text-brand-gold"/> Active Commands</h3>
             <ul className="space-y-3">
               <CommandItem label="[NAV:AUTH]" desc="Redirects to login page" />
               <CommandItem label="[NAV:PRODUCTS]" desc="Redirects to catalog" />
               <CommandItem label="[EXT:WHATSAPP]" desc="Opens direct chat" />
               <CommandItem label="[NAV:CART]" desc="Opens selection drawer" />
             </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

function InputGroup({ label, value, onChange, placeholder }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</label>
      <input 
        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-brand-gold outline-none transition-all" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function AnalyticItem({ label, value, trend }: any) {
  return (
    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{label}</p>
      <div className="text-right">
        <p className="text-sm font-bold text-white">{value}</p>
        {trend && <p className="text-[9px] text-green-500 font-bold">{trend}</p>}
      </div>
    </div>
  );
}

function CommandItem({ label, desc }: any) {
  return (
    <li className="flex items-start gap-3 p-3 bg-white/[0.02] rounded-xl border border-white/5">
      <code className="text-[10px] text-brand-gold font-bold bg-brand-gold/10 px-2 py-1 rounded">{label}</code>
      <p className="text-[10px] text-gray-500 font-medium">{desc}</p>
    </li>
  );
}
