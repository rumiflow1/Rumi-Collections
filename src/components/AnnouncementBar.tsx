import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Instagram, Youtube, MessageCircle, Music2, Send, Facebook, Twitter, Ghost, Phone } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import { useNavigate } from 'react-router-dom';

import DynamicText from './DynamicText';

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

export default function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const { formatPrice } = useAppContext();
  const { SiteConfig, loading, getElement } = useConfig();
  const navigate = useNavigate();

  let announcements = SiteConfig?.announcementBar?.items || [];
  if (SiteConfig?.notifications?.isLive && SiteConfig?.notifications?.broadcastMessage) {
    announcements = [
      { text: SiteConfig.notifications.broadcastMessage, path: '/' },
      ...announcements
    ];
  }

  useEffect(() => {
    if (announcements.length === 0) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  if (!SiteConfig?.announcementBar?.isVisible) return null;

  const handleAnnouncementClick = () => {
    const announcement = announcements[index];
    if (announcement?.path) {
      navigate(announcement.path);
    }
  };

  const dynamicId = `announcement_text_${index}`;

  return (
    <div className="h-10 bg-black sticky top-0 z-[60] overflow-hidden flex items-center justify-between px-4 sm:px-8">
      {/* Water-like flowing background with black, navy blue, and white blend */}
      <div 
        className="absolute inset-0 opacity-60 animate-gradient-xy"
        style={{
          backgroundImage: SiteConfig?.announcementBar?.bgColor || 'linear-gradient(-45deg, #000000, #000080, #ffffff, #000080, #000000)',
          backgroundSize: '400% 400%'
        }}
      ></div>
      
      {/* Wave SVG Overlay */}
      <div className="absolute bottom-0 left-0 w-full h-4 opacity-30 pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path 
            fill="#ffffff" 
            fillOpacity="1" 
            d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,218.7C960,235,1056,213,1152,186.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            className="animate-pulse"
          ></path>
        </svg>
      </div>

      {/* Left Socials */}
      <div className="flex items-center space-x-3 z-10">
        {(SiteConfig?.announcementBar?.socials || []).filter(s => s.position === 'left').map((social, i) => {
          const Icon = IconMap[social.platform] || IconMap.Default;
          return (
            <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
              <Icon size={12} />
            </a>
          );
        })}
      </div>

      {/* Center Announcement */}
      <div className="flex-1 flex justify-center items-center z-10 px-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="font-bold tracking-[0.2em] uppercase text-center cursor-pointer hover:text-brand-gold transition-colors line-clamp-1"
            onClick={handleAnnouncementClick}
          >
            <DynamicText 
              id={dynamicId} 
              defaultContent={announcements[index]?.text || ''} 
              className="font-bold tracking-[0.2em] uppercase"
              style={{
                borderColor: '#101010',
                color: '#ffffff',
                width: 'auto',
                fontSize: '11px',
                lineHeight: '21px'
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right Socials */}
      <div className="flex items-center space-x-3 z-10">
        {(SiteConfig?.announcementBar?.socials || []).filter(s => s.position === 'right').map((social, i) => {
          const Icon = IconMap[social.platform] || IconMap.Default;
          return (
            <a key={i} href={social.url} target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white transition-colors">
              <Icon size={12} />
            </a>
          );
        })}
      </div>
    </div>
  );
}
