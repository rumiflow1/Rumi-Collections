import React, { useState, useEffect, useRef } from 'react';
import { useConfig } from '../../context/ConfigContext';
import axios from 'axios';
import * as Icons from 'lucide-react';
import { resolveImageUrl } from '../../lib/utils';
import { 
  Save, RefreshCw, Eye, EyeOff, Plus, Trash2, X, 
  Type, Palette, Link as LinkIcon, Image as ImageIcon, 
  Star, Share2, ShieldCheck, Search, Layout, Globe,
  Upload, Move, AlignCenter, Settings2, FileText,
  ShoppingCart, Heart, User, Lock, ChevronRight, Hash, Sparkles,
  MousePointer2, Layers, Bell, Truck, HelpCircle,
  Users, Instagram, Facebook, Twitter, Youtube, MessageCircle, Music2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const LucideIcon = ({ name, size = 20 }: { name: string; size?: number }) => {
  const Icon = (Icons as any)[name] || HelpCircle;
  return <Icon size={size} />;
};

export default function ContentControl() {
  const { SiteConfig, loading, refreshConfig } = useConfig();
  const [localConfig, setLocalConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('announcement');

  // Logic to Mirror Frontend Data
  useEffect(() => {
    if (SiteConfig) {
      setLocalConfig(JSON.parse(JSON.stringify(SiteConfig)));
    }
  }, [SiteConfig]);

  // --- 📸 COMPUTER SE IMAGE UPLOAD LOGIC ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, path: (string | number)[]) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('/api/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = res.data.imageUrl;

      setLocalConfig((prev: any) => {
        const updatedConfig = JSON.parse(JSON.stringify(prev));
        let current = updatedConfig;
        for (let i = 0; i < path.length - 1; i++) {
          if (!current[path[i]]) current[path[i]] = {};
          current = current[path[i]];
        }
        current[path[path.length - 1]] = imageUrl;
        return updatedConfig;
      });
      
      setMessage('Asset Uploaded Successfully!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Error: Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // --- 🔄 AUTO-SYNC COLLECTIONS FROM PRODUCTS ---
  const handleAutoSyncCollections = async () => {
    try {
      setSaving(true);
      setMessage('Syncing collections...');
      const res = await axios.get('/api/products');
      const products = res.data;
      
      // Extract unique collection names from products
      const uniqueNames: string[] = [...new Set(products.map((p: any) => p.collectionName).filter(Boolean))] as string[];
      
      const currentItems = localConfig?.featuredCollections?.items || [];
      const currentNames = currentItems.map((c: any) => c.name);
      
      const newItems = uniqueNames
        .filter(name => !currentNames.includes(name))
        .map(name => ({
          id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070',
          link: `/products?category=${name.toLowerCase().replace(/\s+/g, '-')}`,
          showInHeader: false
        }));
        
      if (newItems.length > 0) {
        const updatedItems = [...currentItems, ...newItems];
        setLocalConfig((prev: any) => ({
          ...prev,
          featuredCollections: {
            ...prev.featuredCollections,
            items: updatedItems
          }
        }));
        setMessage(`Synced ${newItems.length} new collections!`);
      } else {
        setMessage("All collection names are already present.");
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error("Collection Sync Error:", err);
      setMessage("Sync failed. Check console.");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const sanitizedConfig = JSON.parse(JSON.stringify(localConfig));
      await axios.post('/api/admin/config', sanitizedConfig);
      await refreshConfig();
      setMessage('SUCCESS: Site Updated Permanently!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error: any) {
      console.error('Error saving config:', error);
      const errorMsg = error.response?.data?.details || error.message || 'Saving failed.';
      setMessage(`Error: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section: string, field: string, value: any) => {
    setLocalConfig((prev: any) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value }
    }));
  };

  const updateGroupItemField = (section: string, group: string, index: number, field: string, value: any) => {
    setLocalConfig((prev: any) => {
      const items = [...(prev[section][group] || [])];
      if (items[index]) {
        items[index] = { ...items[index], [field]: value };
      }
      return {
        ...prev,
        [section]: { ...prev[section], [group]: items }
      };
    });
  };

  const handleGroupItemImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, section: string, group: string, index: number, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('/api/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const imageUrl = res.data.imageUrl;
      updateGroupItemField(section, group, index, field, imageUrl);
      setMessage('Social Asset Uploaded!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Error: Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (loading || !localConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#0a0a0a] space-y-4">
        <RefreshCw className="animate-spin text-brand-gold" size={48} />
        <p className="text-white/40 font-bold tracking-widest uppercase text-xs">Mirroring Frontend Content...</p>
      </div>
    );
  }

  const v = (val: any) => val ?? "";
  const homeReviews = localConfig?.customerReviews?.items || [];
  const collections = localConfig?.featuredCollections?.items || [];
  const notificationItems = localConfig?.purchaseNotifications?.items || [];
  const supportLinks = localConfig?.footer?.supportLinks || [];
  const shopLinks = localConfig?.footer?.shopLinks || [];
  const socials = localConfig?.announcementBar?.socials || [];
  const footerSocials = localConfig?.footer?.socials || [];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 space-y-8 pb-40 font-sans">
      
      {/* 🚀 TOP MASTER CONTROL BAR */}
      <div className="sticky top-0 z-[100] bg-[#0a0a0a]/90 backdrop-blur-xl p-6 border border-white/5 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-gold rounded-2xl flex items-center justify-center shadow-lg shadow-brand-gold/20">
            <Settings2 className="text-black" size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-tighter uppercase">LUXE <span className="text-brand-gold">CONTENT MASTER</span></h1>
            <p className="text-[10px] text-gray-500 font-bold tracking-[0.3em] uppercase">Enterprise Mirroring System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <AnimatePresence>
            {message && (
              <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0}} className="text-xs font-bold text-brand-gold uppercase tracking-widest bg-brand-gold/10 px-4 py-2 rounded-lg border border-brand-gold/20">
                {message}
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={handleSave} 
            disabled={saving || uploading} 
            className="group px-10 py-4 bg-brand-gold text-black rounded-2xl font-black tracking-widest uppercase text-xs hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-3 shadow-xl shadow-brand-gold/30"
          >
            {saving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} className="group-hover:rotate-12 transition-transform" />}
            Save All Permanently
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* 🧭 NAVIGATION SIDEBAR */}
        <div className="space-y-2 lg:sticky lg:top-32 h-fit">
          <TabBtn id="announcement" label="Announcement Bar" active={activeTab} onClick={setActiveTab} icon={<Share2 size={18}/>}/>
          <TabBtn id="header" label="Logo & Branding" active={activeTab} onClick={setActiveTab} icon={<Layout size={18}/>}/>
          <TabBtn id="search" label="Search Customization" active={activeTab} onClick={setActiveTab} icon={<Search size={18}/>}/>
          <TabBtn id="account" label="Account & UX" active={activeTab} onClick={setActiveTab} icon={<User size={18}/>}/>
          <TabBtn id="auth" label="Auth Interface" active={activeTab} onClick={setActiveTab} icon={<Lock size={18}/>}/>
          <TabBtn id="hero" label="Hero Banner Slider" active={activeTab} onClick={setActiveTab} icon={<ImageIcon size={18}/>}/>
          <TabBtn id="collections" label="Collections Grid" active={activeTab} onClick={setActiveTab} icon={<Layers size={18}/>}/>
          <TabBtn id="reviews" label="Customer Reviews" active={activeTab} onClick={setActiveTab} icon={<Star size={18}/>}/>
          <TabBtn id="badges" label="Trust Badges" active={activeTab} onClick={setActiveTab} icon={<ShieldCheck size={18}/>}/>
          <TabBtn id="notifications" label="Purchase Popups" active={activeTab} onClick={setActiveTab} icon={<Bell size={18}/>}/>
          <TabBtn id="ai" label="AI Concierge Settings" active={activeTab} onClick={setActiveTab} icon={<Sparkles size={18}/>}/>
          <TabBtn id="footer" label="Master Footer Control" active={activeTab} onClick={setActiveTab} icon={<FileText size={18}/>}/>
        </div>

        {/* 🏗️ DYNAMIC CONTENT PANELS */}
        <div className="lg:col-span-3 space-y-10">

          {/* 🤖 AI CONCIERGE CONTROL */}
          {activeTab === 'ai' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-[#111] p-10 rounded-[3rem] border border-white/5 space-y-10 shadow-3xl">
               <SectionHeader 
                 title="AI Stylist & Concierge Intelligence" 
                 visible={localConfig?.aiConcierge?.isEnabled} 
                 onToggle={() => updateField('aiConcierge', 'isEnabled', !localConfig?.aiConcierge?.isEnabled)} 
               />
               
               <div className="grid grid-cols-1 gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputGroup 
                      label="AI Model Selection" 
                      value={localConfig?.aiConcierge?.model || "gemini-3-flash-preview"} 
                      onChange={(v) => updateField('aiConcierge', 'model', v)} 
                    />
                    <InputGroup 
                      label="Welcome Greeting" 
                      value={localConfig?.aiConcierge?.welcomeMessage || ""} 
                      onChange={(v) => updateField('aiConcierge', 'welcomeMessage', v)} 
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Brand Voice Persona</label>
                    <textarea 
                      className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm outline-none focus:border-brand-gold text-white"
                      value={localConfig?.aiConcierge?.brandVoice || ""}
                      onChange={(e) => updateField('aiConcierge', 'brandVoice', e.target.value)}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Deep Intelligence (System Instructions)</label>
                    <textarea 
                      className="w-full h-48 bg-white/5 border border-white/10 rounded-3xl p-6 text-sm outline-none focus:border-brand-gold text-white"
                      value={localConfig?.aiConcierge?.systemInstruction || ""}
                      onChange={(e) => updateField('aiConcierge', 'systemInstruction', e.target.value)}
                    />
                  </div>
               </div>
            </motion.div>
          )}

          {/* 📢 1. ANNOUNCEMENT BAR CONTROL */}
          {activeTab === 'announcement' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-[#111] p-8 rounded-3xl border border-white/5 space-y-8">
              <SectionHeader title="Announcement Bar & Socials" visible={localConfig.announcementBar?.isVisible} 
                onToggle={() => updateField('announcementBar', 'isVisible', !localConfig.announcementBar?.isVisible)} />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputGroup label="Background Color" value={v(localConfig.announcementBar?.bgColor)} onChange={(v) => updateField('announcementBar', 'bgColor', v)} />
                <InputGroup label="Text Color" value={v(localConfig.announcementBar?.color)} onChange={(v) => updateField('announcementBar', 'color', v)} />
                <InputGroup label="Font Size" value={v(localConfig.announcementBar?.fontSize)} onChange={(v) => updateField('announcementBar', 'fontSize', v)} />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Announcement Text Slider</label>
                {(localConfig.announcementBar?.items || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group hover:border-brand-gold/30 transition-colors">
                    <input className="flex-grow bg-transparent outline-none text-sm" value={v(item.text)} onChange={(e) => {
                      const newItems = [...localConfig.announcementBar.items];
                      newItems[idx].text = e.target.value;
                      updateField('announcementBar', 'items', newItems);
                    }} placeholder="Offer text here..." />
                    <input className="w-40 bg-black/40 rounded-xl px-4 py-2 text-xs text-gray-400" value={v(item.path)} onChange={(e) => {
                      const newItems = [...localConfig.announcementBar.items];
                      newItems[idx].path = e.target.value;
                      updateField('announcementBar', 'items', newItems);
                    }} placeholder="Link path (/shop)" />
                    <button onClick={() => updateField('announcementBar', 'items', localConfig.announcementBar.items.filter((_:any,i:number)=>i!==idx))} className="text-red-500 hover:scale-110 transition-transform"><Trash2 size={18}/></button>
                  </div>
                ))}
                <button onClick={() => updateField('announcementBar', 'items', [...(localConfig.announcementBar?.items || []), {text: 'New Luxe Offer', path: '/'}])} 
                  className="flex items-center gap-2 text-xs font-bold text-brand-gold uppercase tracking-tighter hover:underline">
                  <Plus size={14}/> Add New Text Item
                </button>
              </div>

              <div className="pt-8 border-t border-white/5 space-y-6">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Global Social Icons Control</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(socials || []).map((soc: any, idx: number) => (
                    <div key={idx} className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4">
                      <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-xl"><Share2 size={18}/></div>
                      <div className="flex-grow space-y-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase">Platform</label>
                        <select 
                          className="w-full bg-transparent text-xs outline-none focus:text-brand-gold" 
                          value={soc.platform} 
                          onChange={(e) => {
                            const newSocs = [...localConfig.announcementBar.socials];
                            newSocs[idx].platform = e.target.value;
                            updateField('announcementBar', 'socials', newSocs);
                          }}
                        >
                          <option value="TikTok" className="bg-black text-white">TikTok</option>
                          <option value="Instagram" className="bg-black text-white">Instagram</option>
                          <option value="Facebook" className="bg-black text-white">Facebook</option>
                          <option value="YouTube" className="bg-black text-white">YouTube</option>
                          <option value="Snapchat" className="bg-black text-white">Snapchat</option>
                          <option value="WhatsApp" className="bg-black text-white">WhatsApp</option>
                          <option value="Phone" className="bg-black text-white">Phone</option>
                        </select>
                        <input className="w-full bg-transparent text-[10px] text-gray-400 outline-none" value={soc.url} placeholder="URL or Number" onChange={(e) => {
                          const newSocs = [...localConfig.announcementBar.socials];
                          newSocs[idx].url = e.target.value;
                          updateField('announcementBar', 'socials', newSocs);
                        }} />
                      </div>
                      <select className="bg-white/5 text-[10px] border-none outline-none rounded-lg p-2" value={soc.position} onChange={(e) => {
                        const newSocs = [...localConfig.announcementBar.socials];
                        newSocs[idx].position = e.target.value;
                        updateField('announcementBar', 'socials', newSocs);
                      }}>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                      <button onClick={() => updateField('announcementBar', 'socials', socials.filter((_:any,i:number)=>i!==idx))} className="text-red-500 hover:scale-110">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => updateField('announcementBar', 'socials', [...(localConfig.announcementBar.socials || []), {platform: 'Instagram', url: '', icon: 'Instagram', position: 'left'}])} 
                    className="border-2 border-dashed border-white/5 rounded-2xl flex items-center justify-center p-4 text-gray-600 hover:text-brand-gold transition-colors">
                    <Plus size={20}/>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 💎 2. HEADER & LOGO CONTROL (Rule of Seven Resizing) */}
          {activeTab === 'header' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-[#111] p-10 rounded-[3rem] border border-white/5 space-y-10 shadow-3xl">
               <SectionHeader title="Luxury Header & Identity" />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                     <InputGroup label="Brand Identity (Logo Text)" value={localConfig.header.logoText} onChange={(v) => updateField('header', 'logoText', v)} />
                     
                     <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                           <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Logo Alignment</p>
                           <AlignCenter size={16} className="text-brand-gold" />
                        </div>
                        <div className="flex gap-4">
                           <button 
                            onClick={() => updateField('header', 'isCentered', false)} 
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${!localConfig.header.isCentered ? 'bg-brand-gold text-black border-brand-gold' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
                           >Left</button>
                           <button 
                            onClick={() => updateField('header', 'isCentered', true)} 
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${localConfig.header.isCentered ? 'bg-brand-gold text-black border-brand-gold' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
                           >Center</button>
                        </div>
                     </div>

                     <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                        <div className="flex justify-between items-center">
                           <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Mobile Logo Alignment</p>
                           <Icons.Smartphone size={16} className="text-brand-gold" />
                        </div>
                        <div className="flex gap-4">
                           <button 
                            onClick={() => updateField('header', 'isMobileCentered', false)} 
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${!localConfig.header.isMobileCentered ? 'bg-brand-gold text-black border-brand-gold' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
                           >Left</button>
                           <button 
                            onClick={() => updateField('header', 'isMobileCentered', true)} 
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${localConfig.header.isMobileCentered ? 'bg-brand-gold text-black border-brand-gold' : 'border-white/10 text-gray-400 hover:border-white/20'}`}
                           >Center</button>
                        </div>
                     </div>

                     <div className="p-8 bg-white/[0.03] rounded-3xl border border-brand-gold/10 space-y-6 shadow-xl shadow-brand-gold/5">
                        <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-2"><Move size={14}/> Dimension & Style Control</p>
                        <div className="grid grid-cols-2 gap-6">
                          <InputGroup label="Width (px/rem)" value={localConfig.header.logoWidth || 'auto'} onChange={(v) => updateField('header', 'logoWidth', v)} />
                          <InputGroup label="Height (px)" value={localConfig.header.logoHeight || '40px'} onChange={(v) => updateField('header', 'logoHeight', v)} />
                          <InputGroup label="Padding (px)" value={localConfig.header.logoPadding || '0px'} onChange={(v) => updateField('header', 'logoPadding', v)} />
                          <InputGroup label="Hex Color" value={localConfig.header.logoColor} onChange={(v) => updateField('header', 'logoColor', v)} />
                        </div>
                        <div className="pt-4 space-y-2">
                           <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Font Family</label>
                           <select className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm" value={localConfig.header.logoFontFamily || 'serif'} onChange={(e)=>updateField('header','logoFontFamily', e.target.value)}>
                              <option value="serif">Serif (Luxury)</option>
                              <option value="sans-serif">Sans Serif (Modern)</option>
                              <option value="monospace">Monospace (Tech)</option>
                           </select>
                        </div>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <ImageManager 
                      label="Digital Signet (Logo Image)" 
                      url={localConfig.header.logoImage} 
                      onUpload={(e) => handleFileUpload(e, ['header', 'logoImage'])}
                      onChangeUrl={(val) => updateField('header', 'logoImage', val)}
                     />
                  </div>
               </div>
            </motion.div>
          )}

          {/* 🔍 3. SEARCH ENGINE CONTROL */}
          {activeTab === 'search' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-[#111] p-8 rounded-3xl border border-white/5 space-y-8">
               <SectionHeader title="Search Customization" />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <InputGroup label="Search Input Placeholder" value={localConfig.header.search?.placeholder} onChange={(v) => updateField('header', 'search', {...localConfig.header.search, placeholder: v})} />
                  <InputGroup label="Trending Section Title" value={localConfig.header.search?.trendingTitle} onChange={(v) => updateField('header', 'search', {...localConfig.header.search, trendingTitle: v})} />
               </div>
               
               <div className="space-y-4 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2"><Hash size={14}/> Trending Keywords List</label>
                  </div>
                  <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm outline-none focus:border-brand-gold h-32 resize-none" 
                    value={localConfig.header.trending?.join(', ')} 
                    onChange={(e) => updateField('header', 'trending', e.target.value.split(',').map(s=>s.trim()))} 
                    placeholder="Minimalist, Silk Gown, Spring Collection..." />
                  <p className="text-[9px] text-gray-500 italic">Keywords separated by commas will appear in the Search Sidebar.</p>
               </div>
            </motion.div>
          )}

          {/* 🛒 4. ACCOUNT, WISHLIST & CART UX */}
          {activeTab === 'account' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-[#111] p-8 rounded-3xl border border-white/5 space-y-10">
               <SectionHeader title="User Profile & Shopping UX" />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                      <ImageManager 
                        label="Sidebar Auth Image"
                        url={localConfig.header.account?.sidebarImage} 
                        onUpload={(e) => handleFileUpload(e, ['header', 'account', 'sidebarImage'])} 
                        onChangeUrl={(v) => updateField('header', 'account', {...localConfig.header.account, sidebarImage: v})}
                      />
                      <div className="grid grid-cols-2 gap-4 pt-4">
                        <InputGroup label="Login Label" value={localConfig.header.account?.loginLabel} onChange={(v) => updateField('header', 'account', {...localConfig.header.account, loginLabel: v})} />
                        <InputGroup label="Signup Label" value={localConfig.header.account?.signupLabel} onChange={(v) => updateField('header', 'account', {...localConfig.header.account, signupLabel: v})} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8 border-l border-white/5 pl-10">
                    <div className="space-y-6">
                       <h4 className="text-xs font-bold uppercase text-brand-gold flex items-center gap-2"><ShoppingCart size={14}/> Cart & Wishlist Content</h4>
                       <InputGroup label="Cart Title" value={localConfig.header.cart?.title || 'Your Cart'} onChange={(v) => updateField('header', 'cart', {...localConfig.header.cart, title: v})} />
                       <InputGroup label="Cart Empty Text" value={localConfig.header.cart?.emptyText} onChange={(v) => updateField('header', 'cart', {...localConfig.header.cart, emptyText: v})} />
                       <div className="pt-4">
                          <InputGroup label="Wishlist Title" value={localConfig.header.wishlist?.title || 'Your Wishlist'} onChange={(v) => updateField('header', 'wishlist', {...localConfig.header.wishlist, title: v})} />
                          <InputGroup label="Wishlist Empty Text" value={localConfig.header.wishlist?.emptyText || 'Nothing here yet.'} onChange={(v) => updateField('header', 'wishlist', {...localConfig.header.wishlist, emptyText: v})} />
                       </div>
                    </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* 🖼️ 5. HERO BANNER SLIDER (Full Persistence) */}
          {activeTab === 'hero' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-[#111] p-8 rounded-3xl border border-white/5 space-y-8">
               <div className="flex justify-between items-center border-b border-white/5 pb-6">
                  <SectionHeader title="Hero Banner Engine" />
                  <button onClick={() => updateField('heroBanner', 'slides', [...localConfig.heroBanner.slides, {id: Date.now(), title: 'New Arrival', subtitle: 'Luxe Collection', image: '', link: '/shop'}])} 
                    className="bg-brand-gold text-black px-8 py-3 rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-brand-gold/20 flex items-center gap-2">
                    <Plus size={16}/> Add New Slide
                  </button>
               </div>
               <div className="space-y-10">
                  {localConfig.heroBanner.slides.map((slide: any, idx: number) => (
                    <div key={idx} className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] space-y-8 relative group hover:border-brand-gold/20 transition-all">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                          <ImageManager 
                            label="Slide Image"
                            url={slide.image} 
                            onUpload={(e) => handleFileUpload(e, ['heroBanner', 'slides', idx, 'image'])} 
                            onChangeUrl={(v) => {
                              const newSlides = [...localConfig.heroBanner.slides];
                              newSlides[idx].image = v;
                              updateField('heroBanner', 'slides', newSlides);
                            }}
                          />
                        </div>
                        <div className="space-y-6">
                          <InputGroup label="Main Heading" value={v(slide.title)} onChange={(v) => {
                            const newSlides = [...localConfig.heroBanner.slides];
                            newSlides[idx].title = v;
                            updateField('heroBanner', 'slides', newSlides);
                          }} />
                          <InputGroup label="Subtitle Tagline" value={v(slide.subtitle)} onChange={(v) => {
                            const newSlides = [...localConfig.heroBanner.slides];
                            newSlides[idx].subtitle = v;
                            updateField('heroBanner', 'slides', newSlides);
                          }} />
                          <InputGroup label="Redirect Link (/products/...)" value={v(slide.link)} onChange={(v) => {
                            const newSlides = [...localConfig.heroBanner.slides];
                            newSlides[idx].link = v;
                            updateField('heroBanner', 'slides', newSlides);
                          }} />
                        </div>
                      </div>
                      <button onClick={() => updateField('heroBanner', 'slides', localConfig.heroBanner.slides.filter((_:any,i:number)=>i!==idx))} 
                        className="absolute -top-3 -right-3 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-transform opacity-0 group-hover:opacity-100">
                        <X size={20}/>
                      </button>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {/* 👤 5.2 AUTH UI CONTROL */}
          {activeTab === 'auth' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-[#111] p-8 rounded-3xl border border-white/5 space-y-8">
               <SectionHeader title="Authentication Interface Control" />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-brand-gold text-[10px] font-bold tracking-[0.3em] uppercase">Login Interface</h3>
                    <InputGroup label="Login Title" value={v(localConfig?.auth?.loginTitle)} onChange={(v) => updateField('auth', 'loginTitle', v)} />
                    <InputGroup label="Login Subtitle" value={v(localConfig?.auth?.loginSubtitle)} onChange={(v) => updateField('auth', 'loginSubtitle', v)} />
                    <InputGroup label="Identity Image (Left Side)" value={v(localConfig?.auth?.leftImage)} onChange={(v) => updateField('auth', 'leftImage', v)} />
                    <ImageManager url={v(localConfig?.auth?.leftImage)} onUpload={(e) => handleFileUpload(e, ['auth', 'leftImage'])} onChangeUrl={(v) => updateField('auth', 'leftImage', v)} />
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-brand-gold text-[10px] font-bold tracking-[0.3em] uppercase">Signup Interface</h3>
                    <InputGroup label="Signup Title" value={v(localConfig?.auth?.signupTitle)} onChange={(v) => updateField('auth', 'signupTitle', v)} />
                    <InputGroup label="Signup Subtitle" value={v(localConfig?.auth?.signupSubtitle)} onChange={(v) => updateField('auth', 'signupSubtitle', v)} />
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-brand-gold text-[10px] font-bold tracking-[0.3em] uppercase">Identity Recovery</h3>
                    <InputGroup label="Recovery Title" value={v(localConfig?.auth?.recoveryTitle)} onChange={(v) => updateField('auth', 'recoveryTitle', v)} />
                    <InputGroup label="Email Subtitle" value={v(localConfig?.auth?.recoverySubtitleEmail)} onChange={(v) => updateField('auth', 'recoverySubtitleEmail', v)} />
                    <InputGroup label="Code Subtitle" value={v(localConfig?.auth?.recoverySubtitleCode)} onChange={(v) => updateField('auth', 'recoverySubtitleCode', v)} />
                    <InputGroup label="Reset Subtitle" value={v(localConfig?.auth?.recoverySubtitleReset)} onChange={(v) => updateField('auth', 'recoverySubtitleReset', v)} />
                  </div>
               </div>
            </motion.div>
          )}

          {/* 👤 5.3 ACCOUNT UI CONTROL */}
          {activeTab === 'account' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-[#111] p-8 rounded-3xl border border-white/5 space-y-8">
               <SectionHeader title="Account Interface Control" />
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-brand-gold text-[10px] font-bold tracking-[0.3em] uppercase">Main Titles</h3>
                    <InputGroup label="Welcome Message" value={v(localConfig?.account?.welcomeMessage)} onChange={(v) => updateField('account', 'welcomeMessage', v)} />
                    <InputGroup label="Profile Title" value={v(localConfig?.account?.profileTitle)} onChange={(v) => updateField('account', 'profileTitle', v)} />
                    <InputGroup label="Wishlist Title" value={v(localConfig?.account?.wishlistTitle)} onChange={(v) => updateField('account', 'wishlistTitle', v)} />
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-brand-gold text-[10px] font-bold tracking-[0.3em] uppercase">Section Titles</h3>
                    <InputGroup label="Orders Title" value={v(localConfig?.account?.ordersTitle)} onChange={(v) => updateField('account', 'ordersTitle', v)} />
                    <InputGroup label="Addresses Title" value={v(localConfig?.account?.addressesTitle)} onChange={(v) => updateField('account', 'addressesTitle', v)} />
                    <InputGroup label="Payments Title" value={v(localConfig?.account?.paymentsTitle)} onChange={(v) => updateField('account', 'paymentsTitle', v)} />
                    <InputGroup label="Discounts Title" value={v(localConfig?.account?.discountsTitle)} onChange={(v) => updateField('account', 'discountsTitle', v)} />
                    <InputGroup label="Security Title" value={v(localConfig?.account?.securityTitle)} onChange={(v) => updateField('account', 'securityTitle', v)} />
                  </div>
               </div>
            </motion.div>
          )}

          {/* 🧩 6. FEATURED COLLECTIONS */}
          {activeTab === 'collections' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-[#111] p-8 rounded-3xl border border-white/5 space-y-8">
               <div className="flex justify-between items-center border-b border-white/5 pb-6">
                  <SectionHeader 
                    title="Collections Control Grid" 
                    visible={localConfig?.featuredCollections?.isVisible} 
                    onToggle={() => updateField('featuredCollections', 'isVisible', !localConfig?.featuredCollections?.isVisible)} 
                  />
                  <div className="flex gap-4">
                    <button 
                      onClick={handleAutoSyncCollections}
                      disabled={saving}
                      className="bg-brand-dark border border-brand-gold/30 text-brand-gold px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-brand-gold hover:text-white transition-all disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={saving ? "animate-spin" : ""}/> Auto-Sync
                    </button>
                    <button onClick={() => {
                      const currentItems = localConfig?.featuredCollections?.items || [];
                      updateField('featuredCollections', 'items', [...currentItems, {id: Date.now(), name: 'New Seasonal', image: '', link: '/', showInHeader: false}]);
                    }} 
                      className="bg-brand-gold/10 text-brand-gold px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                      <Plus size={14}/> Add New Collection
                    </button>
                  </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {(localConfig?.featuredCollections?.items || []).map((col: any, idx: number) => (
                    <div key={idx} className="p-6 bg-white/5 rounded-3xl border border-white/5 space-y-6 relative group">
                      <ImageManager 
                        url={col.image} 
                        onUpload={(e) => handleFileUpload(e, ['featuredCollections', 'items', idx, 'image'])} 
                        onChangeUrl={(v) => {
                          const items = [...(localConfig?.featuredCollections?.items || [])];
                          if (items[idx]) {
                            items[idx].image = v;
                            updateField('featuredCollections', 'items', items);
                          }
                        }}
                      />
                      <InputGroup label="Collection Name" value={v(col.name)} onChange={(v) => {
                        const items = [...(localConfig?.featuredCollections?.items || [])];
                        if (items[idx]) {
                          items[idx].name = v;
                          updateField('featuredCollections', 'items', items);
                        }
                      }} />
                      <InputGroup label="Link" value={v(col.link)} onChange={(v) => {
                        const items = [...(localConfig?.featuredCollections?.items || [])];
                        if (items[idx]) {
                          items[idx].link = v;
                          updateField('featuredCollections', 'items', items);
                        }
                      }} />
                      
                      {/* Show in Header Toggle */}
                      <div className="flex items-center justify-between p-4 bg-black/40 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2">
                          <Layout size={14} className="text-brand-gold" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Show in Header</span>
                        </div>
                        <button 
                          onClick={() => {
                            const items = [...(localConfig?.featuredCollections?.items || [])];
                            items[idx].showInHeader = !items[idx].showInHeader;
                            updateField('featuredCollections', 'items', items);
                          }}
                          className={`p-2 rounded-lg transition-all ${col.showInHeader ? 'bg-brand-gold text-black' : 'bg-white/5 text-gray-500'}`}
                        >
                          {col.showInHeader ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                      </div>

                      <button onClick={() => {
                        const items = (localConfig?.featuredCollections?.items || []).filter((_:any,i:number)=>i!==idx);
                        updateField('featuredCollections', 'items', items);
                      }} 
                        className="w-full py-2 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-all">
                        Remove Collection
                      </button>
                    </div>
                  ))}
               </div>

               {/* Featured Arrival Display Limit */}
               <div className="pt-10 border-t border-white/5">
                  <div className="bg-white/5 p-8 rounded-[2.5rem] border border-brand-gold/10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="space-y-2">
                       <h4 className="text-sm font-bold uppercase text-brand-gold flex items-center gap-2"><Sparkles size={16}/> Homepage Display Limits</h4>
                       <p className="text-xs text-gray-500">Control how many products appear in the "Featured Arrivals" section.</p>
                    </div>
                    <div className="w-full md:w-64">
                       <InputGroup 
                          label="Featured Products Limit" 
                          value={localConfig?.featuredCollections?.featuredLimit || 8} 
                          onChange={(v) => updateField('featuredCollections', 'featuredLimit', Number(v))} 
                       />
                    </div>
                  </div>
               </div>
            </motion.div>
          )}

          {/* ⭐ 7. CUSTOMER REVIEWS (Safe Logic) */}
          {activeTab === 'reviews' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-[#111] p-8 rounded-3xl border border-white/5 space-y-8">
               <div className="flex justify-between items-center">
                  <SectionHeader title="Patron Testimonials" visible={localConfig?.customerReviews?.isVisible} onToggle={() => updateField('customerReviews', 'isVisible', !localConfig.customerReviews.isVisible)} />
                  <button onClick={() => {
                    const items = localConfig.customerReviews.items || [];
                    updateField('customerReviews', 'items', [...items, {id: Date.now().toString(), user: 'New VIP', profession: 'Fashion Enthusiast', comment: '', rating: 5}]);
                  }} 
                    className="bg-brand-gold/10 text-brand-gold px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">+ Add New Review</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {(localConfig?.customerReviews?.items || []).map((rev: any, idx: number) => (
                    <div key={idx} className="p-8 bg-white/5 rounded-[2rem] border border-white/10 space-y-6 relative group">
                      <div className="grid grid-cols-2 gap-4">
                        <InputGroup label="Customer Name" value={v(rev.user)} onChange={(v) => {
                          const newRev = [...localConfig.customerReviews.items];
                          newRev[idx].user = v;
                          updateField('customerReviews', 'items', newRev);
                        }} />
                        <InputGroup label="Profession / Role" value={v(rev.profession)} onChange={(v) => {
                          const newRev = [...localConfig.customerReviews.items];
                          newRev[idx].profession = v;
                          updateField('customerReviews', 'items', newRev);
                        }} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rating (1-5)</label>
                        <input 
                          type="number" min="1" max="5"
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm outline-none focus:border-brand-gold text-brand-gold font-bold"
                          value={rev.rating || 5} 
                          onChange={(e) => {
                            const newRev = [...localConfig.customerReviews.items];
                            newRev[idx].rating = Number(e.target.value);
                            updateField('customerReviews', 'items', newRev);
                          }}
                        />
                      </div>
                      <textarea className="w-full bg-black/30 border border-white/5 rounded-2xl p-4 text-xs italic text-gray-400 h-24 resize-none focus:border-brand-gold transition-colors outline-none" 
                        placeholder="Customer review content..."
                        value={v(rev.comment || rev.content)} onChange={(e) => {
                        const newRev = [...localConfig.customerReviews.items];
                        newRev[idx].comment = e.target.value;
                        newRev[idx].content = e.target.value; // Sync both for compatibility
                        updateField('customerReviews', 'items', newRev);
                      }} />
                      <button onClick={() => updateField('customerReviews', 'items', localConfig.customerReviews.items.filter((_:any,i:number)=>i!==idx))} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-all hover:scale-110"><Trash2 size={18}/></button>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {/* 🛡️ 8. TRUST BADGES */}
          {activeTab === 'badges' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-[#111] p-8 rounded-3xl border border-white/5 space-y-8">
               <div className="flex justify-between items-center">
                  <SectionHeader title="Security & Trust Signals" visible={localConfig?.trustBadges?.isVisible} onToggle={() => updateField('trustBadges', 'isVisible', !localConfig.trustBadges.isVisible)} />
                  <button onClick={() => {
                    const items = localConfig.trustBadges.items || [];
                    updateField('trustBadges', 'items', [...items, {icon: 'ShieldCheck', title: 'Premium Secure', subtitle: 'Encrypted Checkout'}]);
                  }} 
                    className="bg-brand-gold/10 text-brand-gold px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest">+ Add New Badge</button>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {(localConfig?.trustBadges?.items || []).map((badge: any, idx: number) => (
                    <div key={idx} className="p-6 bg-white/5 border border-white/10 rounded-3xl space-y-4 relative group hover:border-brand-gold/20 transition-all">
                      <div className="flex justify-center mb-2">
                         <div className="p-4 bg-brand-gold/10 rounded-full text-brand-gold">
                            <LucideIcon name={badge.icon} />
                         </div>
                      </div>
                      <InputGroup label="Icon (Lucide Name)" value={v(badge.icon)} onChange={(v) => {
                        const newItems = [...localConfig.trustBadges.items];
                        newItems[idx].icon = v;
                        updateField('trustBadges', 'items', newItems);
                      }} />
                      <InputGroup label="Heading" value={v(badge.title)} onChange={(v) => {
                        const newItems = [...localConfig.trustBadges.items];
                        newItems[idx].title = v;
                        updateField('trustBadges', 'items', newItems);
                      }} />
                      <InputGroup label="Sub-Text" value={v(badge.subtitle)} onChange={(v) => {
                        const newItems = [...localConfig.trustBadges.items];
                        newItems[idx].subtitle = v;
                        updateField('trustBadges', 'items', newItems);
                      }} />
                      <button onClick={() => updateField('trustBadges', 'items', localConfig.trustBadges.items.filter((_:any,i:number)=>i!==idx))} className="w-full py-2 bg-red-500/10 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">Remove</button>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {/* 🔔 9. PURCHASE NOTIFICATIONS (Trust Popups) */}
          {activeTab === 'notifications' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-[#111] p-8 rounded-3xl border border-white/5 space-y-8">
               <div className="flex justify-between items-center">
                  <SectionHeader title="Purchase Notifications" visible={localConfig?.purchaseNotifications?.isVisible} onToggle={() => updateField('purchaseNotifications', 'isVisible', !localConfig.purchaseNotifications.isVisible)} />
                  <button onClick={() => {
                    const items = localConfig.purchaseNotifications?.items || [];
                    updateField('purchaseNotifications', 'items', [...items, {id: Date.now().toString(), name: 'Majid', location: 'Multan', product: 'Silk Gown', time: '32 minutes ago', image: ''}]);
                  }} 
                    className="bg-brand-gold/10 text-brand-gold px-6 py-2 rounded-xl text-[10px] font-bold uppercase">+ Add Notification</button>
               </div>
               <div className="space-y-4">
                  {(localConfig?.purchaseNotifications?.items || []).map((notif: any, idx: number) => (
                    <div key={idx} className="p-6 bg-white/5 border border-white/5 rounded-2xl grid grid-cols-1 md:grid-cols-5 gap-6 items-center relative group">
                      <div className="md:col-span-1">
                        <ImageManager 
                          url={notif.image} 
                          onUpload={(e) => handleFileUpload(e, ['purchaseNotifications', 'items', idx, 'image'])} 
                          onChangeUrl={(v) => {
                             const newItems = [...localConfig.purchaseNotifications.items];
                             newItems[idx].image = v;
                             updateField('purchaseNotifications', 'items', newItems);
                          }}
                        />
                      </div>
                      <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <InputGroup label="Name" value={v(notif.name)} onChange={(v) => {
                          const newNotifs = [...localConfig.purchaseNotifications.items];
                          newNotifs[idx].name = v;
                          updateField('purchaseNotifications', 'items', newNotifs);
                        }} />
                        <InputGroup label="Location" value={v(notif.location)} onChange={(v) => {
                          const newNotifs = [...localConfig.purchaseNotifications.items];
                          newNotifs[idx].location = v;
                          updateField('purchaseNotifications', 'items', newNotifs);
                        }} />
                        <InputGroup label="Product" value={v(notif.product)} onChange={(v) => {
                          const newNotifs = [...localConfig.purchaseNotifications.items];
                          newNotifs[idx].product = v;
                          updateField('purchaseNotifications', 'items', newNotifs);
                        }} />
                        <InputGroup label="Time" value={v(notif.time)} onChange={(v) => {
                          const newNotifs = [...localConfig.purchaseNotifications.items];
                          newNotifs[idx].time = v;
                          updateField('purchaseNotifications', 'items', newNotifs);
                        }} />
                      </div>
                      <button onClick={() => updateField('purchaseNotifications', 'items', localConfig.purchaseNotifications.items.filter((_:any,i:number)=>i!==idx))} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-all"><X size={16}/></button>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {/* 🧾 10. MASTER FOOTER & POLICY CONTENT */}
          {activeTab === 'footer' && (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-[#111] p-8 rounded-3xl border border-white/5 space-y-12">
               <SectionHeader title="Ultimate Footer Breakdown" />
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <InputGroup label="Brand Name" value={v(localConfig.footer?.brandName || localConfig.header?.logoText)} onChange={(v) => updateField('footer', 'brandName', v)} />
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Brand Narrative (Description)</label>
                    <textarea className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-sm h-32 outline-none focus:border-brand-gold" 
                      value={v(localConfig.footer?.description)} onChange={(e) => updateField('footer', 'description', e.target.value)} />
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                       <span>Newsletter Control</span>
                    </div>
                    <InputGroup label="Newsletter Heading" value={v(localConfig.footer?.newsletterTitle || 'Newsletter')} onChange={(v) => updateField('footer', 'newsletterTitle', v)} />
                    <InputGroup label="Newsletter Description" value={v(localConfig.footer?.newsletterDesc || 'Subscribe to receive updates, access to exclusive deals, and more.')} onChange={(v) => updateField('footer', 'newsletterDesc', v)} />
                  </div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                       <span>Social Links</span>
                       <button onClick={() => updateField('footer', 'socials', [...footerSocials, {platform: 'Instagram', url: ''}])} className="text-brand-gold hover:underline">+ Add Link</button>
                    </div>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {footerSocials.map((soc: any, idx: number) => (
                        <div key={idx} className="flex gap-2">
                       <select 
                        className="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-brand-gold outline-none" 
                        value={v(soc.platform)} 
                        onChange={(e) => {
                          const newSocs = [...localConfig.footer.socials];
                          newSocs[idx].platform = e.target.value;
                          updateField('footer', 'socials', newSocs);
                        }}
                       >
                        <option value="TikTok" className="bg-black text-white">TikTok</option>
                        <option value="Instagram" className="bg-black text-white">Instagram</option>
                        <option value="Facebook" className="bg-black text-white">Facebook</option>
                        <option value="YouTube" className="bg-black text-white">YouTube</option>
                        <option value="Snapchat" className="bg-black text-white">Snapchat</option>
                        <option value="WhatsApp" className="bg-black text-white">WhatsApp</option>
                        <option value="Phone" className="bg-black text-white">Phone</option>
                       </select>
                       <input className="flex-grow bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs" value={v(soc.url)} placeholder="URL" onChange={(e) => {
                          const newSocs = [...localConfig.footer.socials];
                          newSocs[idx].url = e.target.value;
                          updateField('footer', 'socials', newSocs);
                       }} />
                           <button onClick={() => updateField('footer', 'socials', localConfig.footer.socials.filter((_:any,i:number)=>i!==idx))} className="text-red-500 hover:scale-110"><Trash2 size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 border-t border-white/5">
                  <div className="space-y-6">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                       <span className="flex items-center gap-2"><ShoppingCart size={14}/> Shop Section (2 Fields)</span>
                       <button onClick={() => updateField('footer', 'shopLinks', [...shopLinks, {label: 'New Link', path: '/shop'}])} className="text-brand-gold hover:underline font-black">+ Add Shop Link</button>
                    </div>
                    <div className="space-y-3">
                      {shopLinks.map((link: any, idx: number) => (
                        <div key={idx} className="flex gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl group relative">
                           <div className="flex-grow grid grid-cols-2 gap-4">
                              <InputGroup label="Link Name" value={v(link.label)} onChange={(v) => {
                                 const newLinks = [...localConfig.footer.shopLinks];
                                 newLinks[idx].label = v;
                                 updateField('footer', 'shopLinks', newLinks);
                              }} />
                              <InputGroup label="Link URL" value={v(link.path)} onChange={(v) => {
                                 const newLinks = [...localConfig.footer.shopLinks];
                                 newLinks[idx].path = v;
                                 updateField('footer', 'shopLinks', newLinks);
                              }} />
                           </div>
                           <button onClick={() => updateField('footer', 'shopLinks', localConfig.footer.shopLinks.filter((_:any,i:number)=>i!==idx))} className="text-red-500 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all self-center"><Trash2 size={18}/></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6 pl-0 md:border-l border-white/5 md:pl-8">
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                       <span className="flex items-center gap-2"><HelpCircle size={14}/> Support Section (3 Fields)</span>
                       <button onClick={() => updateField('footer', 'supportLinks', [...supportLinks, {label: 'New Page', path: '/support', content: '# New Page\nWrite something...'}])} className="text-brand-gold hover:underline font-black">+ Add Support Item</button>
                    </div>
                    <div className="space-y-6">
                      {supportLinks.map((link: any, idx: number) => (
                        <div key={idx} className="flex flex-col gap-4 p-6 bg-white/[0.02] border border-white/5 rounded-3xl group relative">
                           <div className="grid grid-cols-2 gap-4">
                              <InputGroup label="Display Name" value={v(link.label)} onChange={(v) => {
                                 const newLinks = [...localConfig.footer.supportLinks];
                                 newLinks[idx].label = v;
                                 updateField('footer', 'supportLinks', newLinks);
                              }} />
                              <InputGroup label="URL / Path" value={v(link.path)} onChange={(v) => {
                                 const newLinks = [...localConfig.footer.supportLinks];
                                 newLinks[idx].path = v;
                                 updateField('footer', 'supportLinks', newLinks);
                              }} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Inner Page Content (Markdown)</label>
                              <textarea 
                                className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-xs h-32 focus:border-brand-gold outline-none text-gray-300 font-serif"
                                value={v(link.content)}
                                onChange={(e) => {
                                   const newLinks = [...localConfig.footer.supportLinks];
                                   newLinks[idx].content = e.target.value;
                                   updateField('footer', 'supportLinks', newLinks);
                                }}
                              />
                           </div>
                           <button onClick={() => updateField('footer', 'supportLinks', localConfig.footer.supportLinks.filter((_:any,i:number)=>i!==idx))} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 hover:scale-110 transition-all"><Trash2 size={18}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>

               <div className="pt-10 border-t border-white/5 space-y-10">
                  <h4 className="text-sm font-bold uppercase text-brand-gold flex items-center gap-2"><FileText size={16}/> Dynamic Page Content Editor</h4>
                  
                  <div className="grid grid-cols-1 gap-8">
                    {/* Shipping Policy Editor */}
                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-4 relative group">
                      <div className="flex items-center justify-between">
                         <p className="text-[10px] font-black uppercase text-brand-gold tracking-[0.2em]">1. Shipping & Logistics Policy</p>
                         <Truck size={16} className="text-brand-gold/40" />
                      </div>
                      <textarea className="w-full bg-black/50 rounded-3xl p-8 text-sm h-64 border border-white/5 focus:border-brand-gold outline-none leading-relaxed text-gray-300 font-serif" 
                        placeholder="Define your shipping methods, times, and costs here..."
                        value={localConfig.pages?.shippingPolicy || ''} 
                        onChange={(e) => setLocalConfig({...localConfig, pages: {...localConfig.pages, shippingPolicy: e.target.value}})} />
                    </div>

                    {/* Returns Policy Editor */}
                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-4 relative group">
                      <div className="flex items-center justify-between">
                         <p className="text-[10px] font-black uppercase text-brand-gold tracking-[0.2em]">2. Returns & Exchanges Logic</p>
                         <RefreshCw size={16} className="text-brand-gold/40" />
                      </div>
                      <textarea className="w-full bg-black/50 rounded-3xl p-8 text-sm h-64 border border-white/5 focus:border-brand-gold outline-none leading-relaxed text-gray-300 font-serif" 
                        placeholder="Detail your refund and exchange eligibility..."
                        value={localConfig.pages?.returnPolicy || ''} 
                        onChange={(e) => setLocalConfig({...localConfig, pages: {...localConfig.pages, returnPolicy: e.target.value}})} />
                    </div>

                    {/* FAQ Editor */}
                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-4 relative group">
                      <div className="flex items-center justify-between">
                         <p className="text-[10px] font-black uppercase text-brand-gold tracking-[0.2em]">3. Frequently Asked Questions</p>
                         <HelpCircle size={16} className="text-brand-gold/40" />
                      </div>
                      <textarea className="w-full bg-black/50 rounded-3xl p-8 text-sm h-64 border border-white/5 focus:border-brand-gold outline-none leading-relaxed text-gray-300 font-serif" 
                        placeholder="Add Q&A pairs (Tip: use markdown for structure)..."
                        value={localConfig.pages?.faq || ''} 
                        onChange={(e) => setLocalConfig({...localConfig, pages: {...localConfig.pages, faq: e.target.value}})} />
                    </div>

                    {/* Privacy Policy Editor */}
                    <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-4 relative group">
                      <div className="flex items-center justify-between">
                         <p className="text-[10px] font-black uppercase text-brand-gold tracking-[0.2em]">4. Privacy & Data Ethics</p>
                         <ShieldCheck size={16} className="text-brand-gold/40" />
                      </div>
                      <textarea className="w-full bg-black/50 rounded-3xl p-8 text-sm h-64 border border-white/5 focus:border-brand-gold outline-none leading-relaxed text-gray-300 font-serif" 
                        placeholder="Privacy policy details..."
                        value={localConfig.pages?.privacyPolicy || ''} 
                        onChange={(e) => setLocalConfig({...localConfig, pages: {...localConfig.pages, privacyPolicy: e.target.value}})} />
                    </div>
                  </div>
               </div>

               <div className="pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <InputGroup label="Copyright Disclaimer" value={localConfig.footer.copyright} onChange={(v) => updateField('footer', 'copyright', v)} />
                  <InputGroup label="Privacy Link Label" value={localConfig.footer.privacyLabel || 'Privacy Policy'} onChange={(v) => updateField('footer', 'privacyLabel', v)} />
                  <InputGroup label="Terms Link Label" value={localConfig.footer.termsLabel || 'Terms of Service'} onChange={(v) => updateField('footer', 'termsLabel', v)} />
               </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}

// --- 🏗️ REUSABLE HELPER COMPONENTS ---

function TabBtn({ id, label, active, onClick, icon }: any) {
  return (
    <button onClick={() => onClick(id)} className={`w-full flex items-center gap-4 px-7 py-5 rounded-2xl transition-all duration-500 border border-transparent ${active === id ? 'bg-brand-gold text-black font-black shadow-2xl shadow-brand-gold/20 scale-105 border-brand-gold/30' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>
      {icon} <span className="text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">{label}</span>
    </button>
  );
}

function SectionHeader({ title, visible, onToggle }: any) {
  return (
    <div className="flex justify-between items-center border-b border-white/10 pb-5">
      <h3 className="text-2xl font-serif font-bold text-white tracking-tighter">{title}</h3>
      {onToggle !== undefined && (
        <button onClick={onToggle} className={`p-3 rounded-2xl transition-all duration-300 ${visible ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
          {visible ? <Eye size={20} /> : <EyeOff size={20} />}
        </button>
      )}
    </div>
  );
}

function InputGroup({ label, value, onChange }: any) {
  return (
    <div className="space-y-3">
      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{label}</label>
      <input className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-brand-gold outline-none transition-all focus:bg-white/[0.08]" 
        value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function ImageManager({ url, onUpload, onChangeUrl, label }: { url: string, onUpload: (e: any) => void, onChangeUrl: (val: string) => void, label?: string }) {
  return (
    <div className="space-y-4">
      {label && <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">{label}</label>}
      <div className="aspect-video bg-black/60 rounded-[2.5rem] border-2 border-dashed border-white/10 overflow-hidden relative group cursor-pointer hover:border-brand-gold/30 transition-all shadow-inner">
        {url ? <img src={resolveImageUrl(url)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" /> 
             : <div className="flex flex-col items-center justify-center h-full text-white/10"><Icons.Upload size={48} className="mb-2"/> <p className="text-[9px] font-bold uppercase">Empty Slot</p></div>}
        <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all cursor-pointer">
          <div className="w-12 h-12 bg-brand-gold rounded-full flex items-center justify-center text-black shadow-2xl mb-2"><Upload size={20} /></div>
          <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest">Select From Computer</p>
          <input type="file" className="hidden" accept="image/*" onChange={onUpload} />
        </label>
      </div>
      <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-4">
        <LinkIcon size={16} className="text-brand-gold flex-shrink-0" />
        <input 
          className="bg-transparent border-none outline-none text-xs w-full text-gray-400 placeholder:text-gray-700 font-bold tracking-widest uppercase" 
          value={url} 
          placeholder="Paste external image link here..." 
          onChange={(e) => onChangeUrl(e.target.value)}
        />
      </div>
    </div>
  );
}