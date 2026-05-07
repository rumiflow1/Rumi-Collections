import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, HelpCircle, Truck, RefreshCcw, ShieldCheck, CheckCircle2, AlertCircle as AlertCircleIcon } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const SECTIONS = [
  { id: 'contact', title: 'Contact Us', icon: Mail },
  { id: 'shipping', title: 'Shipping Policy', icon: Truck },
  { id: 'returns', title: 'Returns & Exchanges', icon: RefreshCcw },
  { id: 'faq', title: 'FAQs', icon: HelpCircle },
];

export default function Support() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('contact');
  const { SiteConfig } = useConfig();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && SECTIONS.some(s => s.id === tab)) {
      setActiveTab(tab);
    } else if (tab === 'privacy' || tab === 'terms') {
      setActiveTab(tab);
    }
  }, [location.search]);

  const getPageContent = (tabId: string) => {
    // 1. Check if there's a matching support link in global config with custom content
    const supportLink = SiteConfig?.footer?.supportLinks?.find(l => 
      l.path.includes(`tab=${tabId}`) || l.label.toLowerCase().includes(tabId.toLowerCase())
    );
    
    if (supportLink?.content) return supportLink.content;

    // 2. Fallback to the generic pages object
    if (!SiteConfig?.pages) return null;
    switch(tabId) {
      case 'shipping': return SiteConfig.pages.shippingPolicy;
      case 'returns': return SiteConfig.pages.returnPolicy;
      case 'faq': return SiteConfig.pages.faq;
      case 'privacy': return SiteConfig.pages.privacyPolicy;
      default: return null;
    }
  };

  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus('idle');
    try {
      await axios.post('/api/contact', formData);
      setSubmitStatus('success');
      setFormData({ firstName: '', lastName: '', email: '', message: '' });
    } catch (err) {
      console.error('Contact form error:', err);
      setSubmitStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream/30 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Customer Support</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">We're here to help you with any questions or concerns you may have. Choose a category below to find the information you need.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveTab(section.id)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-full text-xs font-bold tracking-widest uppercase transition-all ${
                activeTab === section.id 
                  ? 'bg-brand-dark text-white shadow-lg' 
                  : 'bg-white text-brand-dark hover:bg-brand-dark/5'
              }`}
            >
              <section.icon size={16} />
              <span>{section.title}</span>
            </button>
          ))}
        </div>

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white border border-brand-dark/5 p-8 md:p-12 shadow-sm"
        >
          {activeTab === 'contact' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-serif font-bold mb-6">Get in Touch</h2>
                  <p className="text-gray-500 mb-8">Have a specific inquiry? Fill out the form and our team will get back to you within 24 hours.</p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center text-brand-gold flex-shrink-0">
                      <Phone size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Phone</p>
                      <p className="text-sm font-medium">{SiteConfig?.footer?.phone || '+1 (555) 123-4567'}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center text-brand-gold flex-shrink-0">
                      <Mail size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Email</p>
                      <p className="text-sm font-medium">{SiteConfig?.footer?.email || 'support@rumi.com'}</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center text-brand-gold flex-shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Showroom</p>
                      <p className="text-sm font-medium">{SiteConfig?.footer?.address || '123 Fashion Ave, New York, NY 10001'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {submitStatus === 'success' && (
                  <div className="p-4 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-widest flex items-center gap-2 rounded-lg border border-green-100">
                    <CheckCircle2 size={16} /> Inquiry sent successfully! We'll be in touch soon.
                  </div>
                )}
                {submitStatus === 'error' && (
                  <div className="p-4 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-widest flex items-center gap-2 rounded-lg border border-red-100">
                    <AlertCircleIcon size={16} /> Failed to send inquiry. Please try again later.
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400">First Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="w-full bg-brand-cream/30 border-b border-brand-dark/10 py-3 px-4 focus:outline-none focus:border-brand-gold transition-colors" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Last Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="w-full bg-brand-cream/30 border-b border-brand-dark/10 py-3 px-4 focus:outline-none focus:border-brand-gold transition-colors" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Email Address</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-brand-cream/30 border-b border-brand-dark/10 py-3 px-4 focus:outline-none focus:border-brand-gold transition-colors" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Message</label>
                  <textarea 
                    rows={4} 
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="w-full bg-brand-cream/30 border-b border-brand-dark/10 py-3 px-4 focus:outline-none focus:border-brand-gold transition-colors resize-none"
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-brand-dark text-white py-4 text-xs font-bold uppercase tracking-widest transition-all hover:bg-brand-gold flex items-center justify-center disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Message'} <Send size={16} className="ml-2" />
                </button>
              </form>
            </div>
          )}

          {activeTab !== 'contact' && (
            <div className="max-w-4xl mx-auto">
              <div className="prose prose-sm md:prose-base max-w-none prose-brand">
                {getPageContent(activeTab) ? (
                   <div className="markdown-body">
                      <ReactMarkdown>{getPageContent(activeTab)}</ReactMarkdown>
                   </div>
                ) : (
                  <div className="py-20 text-center opacity-40 italic">
                    Content is currently being curated by our atelier...
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
