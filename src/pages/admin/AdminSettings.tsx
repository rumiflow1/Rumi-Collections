import React, { useState, useEffect } from 'react';
import { useConfig } from '../../context/ConfigContext';
import axios from 'axios';
import { 
  Settings, Save, RefreshCw, Shield, Globe, 
  Mail, Phone, MapPin, Database, Server,
  Lock, Key, CreditCard, DollarSign, Languages, Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminSettings() {
  const { SiteConfig, loading, refreshConfig } = useConfig();
  const [localConfig, setLocalConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (SiteConfig) {
      setLocalConfig(JSON.parse(JSON.stringify(SiteConfig)));
    }
  }, [SiteConfig]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await axios.post('/api/admin/config', localConfig);
      await refreshConfig();
      setMessage('SUCCESS: System Nucleus Updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error: Nucleus sync failed.');
    } finally {
      setSaving(false);
    }
  };

  const updateSectionField = (section: string, field: string, value: any) => {
    setLocalConfig((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  if (loading || !localConfig) {
    return <div className="flex justify-center p-20"><RefreshCw className="animate-spin text-brand-gold" size={32} /></div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      
      {/* ⚙️ SYSTEM SETTINGS HEADER */}
      <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-2xl flex items-center justify-center border border-brand-gold/20">
            <Settings size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-white uppercase tracking-tighter">SYSTEM <span className="text-brand-gold">NUCLEUS</span></h2>
            <p className="text-[10px] text-gray-500 font-bold tracking-[0.3em] uppercase">Sovereign Architecture Control</p>
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
            Synchronize Nucleus
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 🏢 BRANDING IDENTITY */}
        <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 space-y-8">
          <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2"><Globe size={20} className="text-brand-gold"/> Brand Identity</h3>
          
          <div className="space-y-6">
            <InputGroup 
              label="Sovereign Brand Name" 
              value={localConfig.header.logoText} 
              onChange={(v: string) => updateSectionField('header', 'logoText', v)} 
            />
            <div className="grid grid-cols-2 gap-6">
               <InputGroup 
                label="Primary Brand Color" 
                value={localConfig.header.logoColor} 
                onChange={(v: string) => updateSectionField('header', 'logoColor', v)} 
              />
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Base Currency</label>
                 <select 
                   value={localConfig.settings?.baseCurrency || 'PKR'} 
                   onChange={(e) => setLocalConfig((prev: any) => ({ ...prev, settings: { ...prev.settings, baseCurrency: e.target.value } }))}
                   className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-brand-gold outline-none"
                 >
                   <option value="PKR">PKR (Pakistani Rupee)</option>
                   <option value="USD">USD (US Dollar)</option>
                   <option value="EUR">EUR (Euro)</option>
                   <option value="GBP">GBP (British Pound)</option>
                   <option value="INR">INR (Indian Rupee)</option>
                   <option value="SAR">SAR (Saudi Riyal)</option>
                   <option value="AED">AED (UAE Dirham)</option>
                 </select>
               </div>
            </div>
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Support Coordinates</p>
               <div className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-[9px] text-gray-500 uppercase">Support Email</label>
                   <input 
                     className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white"
                     value={localConfig.settings?.supportEmail || 'support@rumy.com'}
                     onChange={(e) => setLocalConfig((prev: any) => ({ ...prev, settings: { ...prev.settings, supportEmail: e.target.value } }))}
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[9px] text-gray-500 uppercase">Support Phone</label>
                   <input 
                     className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white"
                     value={localConfig.settings?.supportPhone || '+1 (888)'}
                     onChange={(e) => setLocalConfig((prev: any) => ({ ...prev, settings: { ...prev.settings, supportPhone: e.target.value } }))}
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[9px] text-gray-500 uppercase">Headquarters</label>
                   <input 
                     className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-xs text-white"
                     value={localConfig.settings?.hqAddress || 'Milan, Italy'}
                     onChange={(e) => setLocalConfig((prev: any) => ({ ...prev, settings: { ...prev.settings, hqAddress: e.target.value } }))}
                   />
                 </div>
               </div>
            </div>
          </div>
        </div>

        {/* 🔒 SECURITY & INFRA */}
        <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 space-y-8">
           <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2"><Lock size={20} className="text-brand-gold"/> Security & Infrastructure</h3>
           
           <div className="space-y-6">
              <div className="p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-red-500/10 text-red-500 rounded-xl"><Shield size={20}/></div>
                <div>
                  <p className="text-xs font-bold text-white">System Restriction</p>
                  <p className="text-[10px] text-gray-500 uppercase font-medium">Access limited to authorized admin email</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-brand-gold">
                      <Database size={14}/>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Database</span>
                    </div>
                    <p className="text-xs text-white font-mono">MONGODB_SRV</p>
                    <p className="text-[8px] text-green-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                      <CheckCircle2 size={8}/> Synchronized
                    </p>
                 </div>
                 <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-brand-gold">
                      <Server size={14}/>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Engine</span>
                    </div>
                    <p className="text-xs text-white font-mono">Node.js v20.x</p>
                    <p className="text-[8px] text-green-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                      <CheckCircle2 size={8}/> Operational
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* 📦 SHIPPING RULES */}
        <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 space-y-8 lg:col-span-2">
           <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2"><Truck size={20} className="text-brand-gold"/> Shipping & Logistics Control</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {['domestic', 'international'].map((type) => (
                <div key={type} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-6">
                   <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold text-brand-gold uppercase tracking-widest">{type === 'domestic' ? 'Pakistan (Domestic)' : 'International (Worldwide)'}</h4>
                      <span className="text-[8px] bg-brand-gold/10 text-brand-gold px-2 py-1 rounded-full border border-brand-gold/20 font-bold uppercase">Active Protocol</span>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                         <label className="text-[9px] text-gray-500 uppercase font-black">Free Shipping Threshold</label>
                         <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">PKR</span>
                            <input 
                              type="number"
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-10 text-sm text-white focus:border-brand-gold outline-none"
                              value={localConfig.settings?.shippingRules?.[type]?.freeThreshold || 0}
                              onChange={(e) => setLocalConfig((prev: any) => ({
                                ...prev,
                                settings: {
                                  ...prev.settings,
                                  shippingRules: {
                                    ...(prev.settings?.shippingRules || {}),
                                    [type]: { ...(prev.settings?.shippingRules?.[type] || {}), freeThreshold: Number(e.target.value) }
                                  }
                                }
                              }))}
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label className="text-[9px] text-gray-500 uppercase font-black">Standard Flat Fee</label>
                         <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">PKR</span>
                            <input 
                              type="number"
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-10 text-sm text-white focus:border-brand-gold outline-none"
                              value={localConfig.settings?.shippingRules?.[type]?.flatFee || 0}
                              onChange={(e) => setLocalConfig((prev: any) => ({
                                ...prev,
                                settings: {
                                  ...prev.settings,
                                  shippingRules: {
                                    ...(prev.settings?.shippingRules || {}),
                                    [type]: { ...(prev.settings?.shippingRules?.[type] || {}), flatFee: Number(e.target.value) }
                                  }
                                }
                              }))}
                            />
                         </div>
                      </div>
                   </div>
                   <p className="text-[9px] text-gray-500 italic">Settings are applied instantly upon synchronization.</p>
                </div>
              ))}
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

function CoordItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-brand-gold">{icon}</div>
      <div>
        <p className="text-[9px] text-gray-500 uppercase font-black tracking-tighter">{label}</p>
        <p className="text-xs text-white font-medium">{value}</p>
      </div>
    </div>
  );
}

function CheckCircle2({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
