import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Youtube, Music2, MessageCircle, Ghost, Phone, Send } from 'lucide-react';
import { useConfig } from '../context/ConfigContext';

const IconMap: { [key: string]: any } = {
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  TikTok: Music2,
  WhatsApp: MessageCircle,
  Snapchat: Ghost,
  Phone: Phone,
  Default: Send
};

export default function Footer() {
  const { SiteConfig } = useConfig();

  if (!SiteConfig?.footer?.isVisible) return null;

  const footerBrandName = SiteConfig?.footer?.brandName || SiteConfig?.header?.logoText || 'Luxe Attire';
  const newsletterTitle = SiteConfig?.footer?.newsletterTitle || 'Newsletter';
  const newsletterDesc = SiteConfig?.footer?.newsletterDesc || 'Subscribe to receive updates, access to exclusive deals, and more.';

  return (
    <footer className="bg-brand-dark text-white pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <h3 className="text-2xl font-serif font-bold tracking-tighter uppercase">{footerBrandName}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {SiteConfig?.footer?.description || 'Elevating your style with premium fabrics and timeless designs. Experience the pinnacle of luxury fashion.'}
            </p>
            <div className="flex flex-wrap gap-4">
              {(SiteConfig?.footer?.socials || []).map((social: any, idx: number) => {
                const Icon = IconMap[social.platform] || IconMap.Default;
                return (
                  <a key={idx} href={social.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-brand-gold transition-colors">
                    <Icon size={20} />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold tracking-widest uppercase mb-6">
              Shop
            </h4>
            <ul className="space-y-4 text-sm text-gray-400">
              {(SiteConfig?.footer?.shopLinks || []).length > 0 ? (SiteConfig.footer.shopLinks.map((link: any, idx: number) => (
                <li key={idx}><Link to={link.path} className="hover:text-brand-gold transition-colors">{link.label}</Link></li>
              ))) : (SiteConfig?.header?.navLinks || []).map((link: any, idx: number) => (
                <li key={idx}><Link to={link.path} className="hover:text-brand-gold transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold tracking-widest uppercase mb-6">
              Support
            </h4>
            <ul className="space-y-4 text-sm text-gray-400">
              {(SiteConfig?.footer?.supportLinks || []).map((link: any, idx: number) => (
                <li key={idx}><Link to={link.path} className="hover:text-brand-gold transition-colors">{link.label}</Link></li>
              ))}
              {(SiteConfig?.footer?.supportLinks || []).length === 0 && (
                <>
                  <li><Link to="/support?tab=shipping" className="hover:text-brand-gold transition-colors">Shipping Policy</Link></li>
                  <li><Link to="/support?tab=returns" className="hover:text-brand-gold transition-colors">Returns & Exchanges</Link></li>
                  <li><Link to="/support?tab=faq" className="hover:text-brand-gold transition-colors">FAQs</Link></li>
                  <li><Link to="/support?tab=contact" className="hover:text-brand-gold transition-colors">Contact Us</Link></li>
                </>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold tracking-widest uppercase mb-6">
              {newsletterTitle}
            </h4>
            <p className="text-gray-400 text-sm mb-4">{newsletterDesc}</p>
            <form className="flex flex-col space-y-2" onSubmit={async (e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const emailInput = form.elements.namedItem('email') as HTMLInputElement;
              const email = emailInput.value;
              if (!email) return;
              
              try {
                const response = await fetch('/api/newsletter/subscribe', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email })
                });
                if (response.ok) {
                  emailInput.value = '';
                  alert('Verification success! A welcome letter has been dispatched to your email.');
                }
              } catch (error) {
                console.error("Newsletter error:", error);
              }
            }}>
              <div className="flex">
                <input 
                  type="email" 
                  name="email"
                  required
                  placeholder="Enter your email" 
                  className="bg-transparent border-b border-gray-600 py-2 text-sm focus:outline-none focus:border-brand-gold flex-grow"
                />
                <button type="submit" className="ml-4 text-sm font-bold tracking-widest uppercase hover:text-brand-gold transition-colors">Join</button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 space-y-4 md:space-y-0">
          <p>
            {SiteConfig?.footer?.copyright || `© ${new Date().getFullYear()} ${footerBrandName}. All rights reserved.`}
          </p>
          <div className="flex space-x-6">
            <Link to="/support?tab=privacy" className="hover:text-white transition-colors">{SiteConfig?.footer?.privacyLabel || 'Privacy Policy'}</Link>
            <Link to="/support?tab=terms" className="hover:text-white transition-colors">{SiteConfig?.footer?.termsLabel || 'Terms of Service'}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
