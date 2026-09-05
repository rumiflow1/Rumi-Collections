import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, HelpCircle, Truck, RefreshCcw, ShieldCheck, CheckCircle2, AlertCircle as AlertCircleIcon, FileText } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const SECTIONS = [
  { id: 'contact', title: 'Contact Us', icon: Mail },
  { id: 'shipping', title: 'Shipping Policy', icon: Truck },
  { id: 'returns', title: 'Returns & Exchanges', icon: RefreshCcw },
  { id: 'faq', title: 'FAQs', icon: HelpCircle },
  { id: 'privacy', title: 'Privacy', icon: ShieldCheck },
  { id: 'terms', title: 'Terms', icon: FileText },
];

const DEFAULT_PAGES: Record<string, string> = {
  faq: '# Frequently Asked Questions\n\n## Orders\n**How do I place an order?** Browse the live collection, choose your piece and size, add it to your selection, then continue to secure checkout.\n\n**Can I track my order?** Open your account to view available order information and status updates.\n\n## Shipping\n**When will my order ship?** Shipping timelines are shown in the store policies and order communications.\n\n## Returns\n**Can I return an item?** Please review the current Returns & Exchanges policy before sending an item back.\n\n## Need help?\nIf you cannot find an answer, use Contact Us and our team will assist you.',
  privacy: '# Privacy Policy\n\nWe respect your privacy and use customer information only to provide, secure and improve the ${BRAND_PLACEHOLDER} shopping experience. For account or privacy requests, contact our support team.',
  terms: '# Terms of Service\n\nBy using this website, you agree to our current shopping, payment, delivery and returns terms. Please contact support if you need clarification before placing an order.',
};

export default function Support() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('contact');
  const { SiteConfig } = useConfig();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && SECTIONS.some(s => s.id === tab)) setActiveTab(tab);
  }, [location.search]);

  const getPageContent = (tabId: string) => {
    const supportLink = SiteConfig?.footer?.supportLinks?.find((l: any) => l?.path?.includes(`tab=${tabId}`) || String(l?.label || '').toLowerCase().includes(tabId.toLowerCase()));
    if (supportLink?.content) return supportLink.content;
    const configured = SiteConfig?.pages?.[tabId === 'returns' ? 'returnPolicy' : tabId === 'shipping' ? 'shippingPolicy' : tabId === 'faq' ? 'faq' : tabId === 'privacy' ? 'privacyPolicy' : tabId === 'terms' ? 'termsOfService' : ''];
    return configured || DEFAULT_PAGES[tabId] || null;
  };

  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true); setSubmitStatus('idle');
    try { await axios.post('/api/contact', formData); setSubmitStatus('success'); setFormData({ firstName: '', lastName: '', email: '', message: '' }); }
    catch (err) { console.error('Contact form error:', err); setSubmitStatus('error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-brand-cream/30 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-brand-gold text-[10px] font-bold tracking-[0.35em] uppercase mb-3">The House Support Desk</p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Customer Support</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">Clear answers, current policies and direct assistance—organized in one place.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {SECTIONS.map((section) => <button key={section.id} onClick={() => setActiveTab(section.id)} className={`flex items-center gap-2 px-5 py-3 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === section.id ? 'bg-brand-dark text-white shadow-lg' : 'bg-white text-brand-dark hover:bg-brand-dark/5 border border-brand-dark/5'}`}><section.icon size={15} /><span>{section.title}</span></button>)}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white border border-brand-dark/5 p-7 md:p-12 shadow-sm">
          {activeTab === 'contact' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div><h2 className="text-2xl font-serif font-bold mb-4">Get in Touch</h2><p className="text-gray-500">Have a specific inquiry? Send a message and our team will get back to you as soon as possible.</p></div>
                <div className="space-y-6">
                  <div className="flex items-start gap-4"><div className="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center text-brand-gold"><Phone size={18} /></div><div><p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Phone</p><p className="text-sm font-medium">{SiteConfig?.footer?.phone || 'Contact us through the support desk'}</p></div></div>
                  <div className="flex items-start gap-4"><div className="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center text-brand-gold"><Mail size={18} /></div><div><p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Email</p><p className="text-sm font-medium">{SiteConfig?.footer?.email || 'support@denfit.shop'}</p></div></div>
                  <div className="flex items-start gap-4"><div className="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center text-brand-gold"><MapPin size={18} /></div><div><p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Showroom</p><p className="text-sm font-medium">{SiteConfig?.footer?.address || 'Please check the current store configuration'}</p></div></div>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {submitStatus === 'success' && <div className="p-4 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-widest flex items-center gap-2 rounded-lg"><CheckCircle2 size={16} /> Inquiry sent successfully.</div>}
                {submitStatus === 'error' && <div className="p-4 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-widest flex items-center gap-2 rounded-lg"><AlertCircleIcon size={16} /> Failed to send inquiry. Please try again.</div>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6"><div><label className="text-[10px] font-bold tracking-widest uppercase text-gray-400">First Name</label><input type="text" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full bg-brand-cream/30 border-b border-brand-dark/10 py-3 px-4 focus:outline-none focus:border-brand-gold" /></div><div><label className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Last Name</label><input type="text" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full bg-brand-cream/30 border-b border-brand-dark/10 py-3 px-4 focus:outline-none focus:border-brand-gold" /></div></div>
                <div><label className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Email Address</label><input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-brand-cream/30 border-b border-brand-dark/10 py-3 px-4 focus:outline-none focus:border-brand-gold" /></div>
                <div><label className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Message</label><textarea rows={4} required value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="w-full bg-brand-cream/30 border-b border-brand-dark/10 py-3 px-4 focus:outline-none focus:border-brand-gold resize-none" /></div>
                <button type="submit" disabled={submitting} className="w-full bg-brand-dark text-white py-4 text-xs font-bold uppercase tracking-widest hover:bg-brand-gold transition-all flex items-center justify-center disabled:opacity-50">{submitting ? 'Sending...' : 'Send Message'} <Send size={16} className="ml-2" /></button>
              </form>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-brand-cream flex items-center justify-center text-brand-gold">{(() => { const Icon = SECTIONS.find(s => s.id === activeTab)?.icon || FileText; return <Icon size={18} />; })()}</div><div><p className="text-[10px] uppercase tracking-[0.25em] text-brand-gold font-bold">Current information</p><h2 className="text-2xl md:text-3xl font-serif font-bold">{SECTIONS.find(s => s.id === activeTab)?.title}</h2></div></div>
              <div className="prose prose-sm md:prose-base max-w-none prose-headings:font-serif prose-headings:text-brand-dark prose-a:text-brand-gold prose-strong:text-brand-dark prose-p:text-gray-600 prose-li:text-gray-600"><ReactMarkdown>{String(getPageContent(activeTab) || '')}</ReactMarkdown></div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
