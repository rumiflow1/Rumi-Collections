import React, { useState, useEffect } from 'react';
import { useConfig } from '../../context/ConfigContext';
import axios from 'axios';
import { 
  Bell, Save, RefreshCw, Send, Mail, MessageSquare, 
  Trash2, Plus, Megaphone, Smartphone, Info,
  CheckCircle2, AlertTriangle, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Notifications() {
  const { SiteConfig, loading, refreshConfig } = useConfig();
  const [localConfig, setLocalConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [broadcastPreview, setBroadcastPreview] = useState('');

  useEffect(() => {
    if (SiteConfig) {
      setLocalConfig(JSON.parse(JSON.stringify(SiteConfig.notifications || {
        isLive: true,
        broadcastMessage: "Exclusive: The Summer Collection is now available.",
        emailFrequency: "Weekly"
      })));
      setBroadcastPreview(SiteConfig.notifications?.broadcastMessage || '');
    }
  }, [SiteConfig]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const updatedFullConfig = { ...SiteConfig, notifications: localConfig };
      await axios.post('/api/admin/config', updatedFullConfig);
      await refreshConfig();
      setMessage('SUCCESS: Communications Strategy Updated!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving notification config:', error);
      setMessage('Error: Communication line failure.');
    } finally {
      setSaving(false);
    }
  };

  const sendGlobalBroadcast = async () => {
    setSending(true);
    try {
      // Mock endpoint or actual broadcast logic
      await axios.post('/api/marketing/broadcast', { 
        subject: "Masterpiece Update", 
        message: localConfig.broadcastMessage,
        title: "OFFICIAL ANNOUNCEMENT"
      });
      setMessage('SUCCESS: Broadcast Dispatched to all Patrons!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Broadcast failed:", err);
      setMessage('Error: Dispatch failure.');
    } finally {
      setSending(false);
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
      
      {/* 🔔 NOTIFICATIONS HEADER */}
      <div className="bg-[#111] p-8 rounded-[2.5rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-2xl flex items-center justify-center border border-brand-gold/20">
            <Bell size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-white uppercase tracking-tighter">GLOBAL <span className="text-brand-gold">NOTIFICATIONS</span></h2>
            <p className="text-[10px] text-gray-500 font-bold tracking-[0.3em] uppercase">Sovereign Communication Engine</p>
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
            Update Strategy
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 📢 SITE-WIDE BROADCAST */}
        <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 space-y-8">
          <div className="flex justify-between items-center">
             <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2"><Megaphone size={20} className="text-brand-gold"/> Digital Megaphone</h3>
             <button 
               onClick={() => updateField('isLive', !localConfig.isLive)}
               className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${localConfig.isLive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}
             >
               {localConfig.isLive ? 'On-Site Active' : 'On-Site Hidden'}
             </button>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Master Broadcast Message</label>
            <textarea 
              value={localConfig.broadcastMessage}
              onChange={(e) => updateField('broadcastMessage', e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-sm text-white h-32 resize-none outline-none focus:border-brand-gold transition-all"
              placeholder="Enter message to appear site-wide..."
            />
          </div>

          <div className="space-y-4">
             <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Visualizer</p>
             <div className="bg-brand-gold text-black p-4 rounded-xl text-center font-bold text-xs uppercase tracking-widest animate-pulse">
               {localConfig.broadcastMessage || 'No Message Configured'}
             </div>
          </div>

          <button 
            onClick={sendGlobalBroadcast}
            disabled={sending}
            className="w-full py-4 border-2 border-brand-gold text-brand-gold rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-brand-gold hover:text-black transition-all flex items-center justify-center gap-2"
          >
            {sending ? <RefreshCw className="animate-spin" size={16} /> : <Send size={16} />}
            Dispatch To All Registered Patrons
          </button>
        </div>

        {/* 📧 AUTOMATED SEQUENCES */}
        <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 space-y-8">
          <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2"><Mail size={20} className="text-brand-gold"/> Automated Editorials</h3>
          
          <div className="space-y-6">
            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Abandoned Cart Recovery</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Status: High Intensity</p>
              </div>
              <div className="w-10 h-6 bg-brand-gold rounded-full flex items-center px-1">
                <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
              </div>
            </div>

            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Post-Acquisition Gratitude</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Status: Active</p>
              </div>
              <div className="w-10 h-6 bg-brand-gold rounded-full flex items-center px-1">
                <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
              </div>
            </div>

            <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-white">Registry Welcome Kit</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">Status: Active</p>
              </div>
              <div className="w-10 h-6 bg-brand-gold rounded-full flex items-center px-1">
                <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Email Frequency</label>
              <select 
                value={localConfig.emailFrequency} 
                onChange={(e) => updateField('emailFrequency', e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-brand-gold outline-none"
              >
                <option value="Daily">Daily Summary</option>
                <option value="Weekly">Weekly Digest (Recommended)</option>
                <option value="Monthly">Monthly Editorial</option>
                <option value="Critical">Only Transactional</option>
              </select>
            </div>
          </div>

          <div className="p-6 border border-white/5 bg-white/[0.01] rounded-2xl flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Users size={20}/></div>
            <div>
              <p className="text-xs font-bold text-white">Recipient Pool</p>
              <p className="text-[10px] text-gray-500 uppercase font-medium">1,402 Subscribed Patrons</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
