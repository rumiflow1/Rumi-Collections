export const productionFallbackConfig = {
  elements: {},
  branding: { brandName: "LUXE ATTIRE", name: "LUXE ATTIRE" },
  announcementBar: {
    isVisible: true,
    bgColor: "linear-gradient(-45deg, #000000, #000080, #ffffff, #000080, #000000)",
    items: [
      { text: "Complimentary shipping on orders over $500", path: "/products" },
      { text: "50% off on Men's Collection", path: "/products?category=men" },
      { text: "Discover the new Summer Collection", path: "/products?category=women" },
      { text: "Exclusive 15% off for first-time members", path: "/profile" }
    ],
    socials: [
      { platform: "TikTok", url: "https://tiktok.com", icon: "Music2", position: "left" },
      { platform: "Instagram", url: "https://instagram.com", icon: "Instagram", position: "left" },
      { platform: "YouTube", url: "https://youtube.com", icon: "Youtube", position: "right" },
      { platform: "WhatsApp", url: "https://wa.me/yournumber", icon: "MessageCircle", position: "right" }
    ]
  },
  header: {
    isVisible: true,
    isCentered: false,
    logoText: "LUXE ATTIRE",
    logoImage: "",
    logoColor: "#D4AF37",
    logoSize: "22px",
    logoWidth: "3rem",
    logoHeight: "3rem",
    logoPadding: "0px",
    logoFontFamily: "Playfair Display",
    navLinks: [
      { label: "Shop All", path: "/products" },
      { label: "Men's Collection", path: "/products?category=men" },
      { label: "Women's Collection", path: "/products?category=women" }
    ],
    search: {
      placeholder: "Search the atelier...",
      buttonText: "Search",
      trendingTitle: "Trending Now",
      trending: ["Evening Gowns", "Wool Blazers", "Cashmere", "Formal Shoes", "Accessories"],
      trendingProducts: []
    },
    account: {
      loginLabel: "Login",
      signupLabel: "Signup",
      emailLabel: "Email Address",
      passwordLabel: "Password",
      loginBtnText: "Sign In",
      signupBtnText: "Create Account"
    },
    wishlist: { title: "My Wishlist", emptyText: "Your wishlist is empty.", btnText: "Explore Collection" },
    cart: { title: "Your Selection", emptyText: "Your cart is empty.", checkoutBtnText: "Checkout Now", viewCartBtnText: "View Full Cart" }
  },
  purchaseNotifications: {
    isVisible: true,
    items: [
      { name: "Siddharth", location: "Mumbai", product: "Silk Evening Gown", time: "2 mins ago", image: "https://images.unsplash.com/photo-1539008835657-9e8e9680fe0a?q=80&w=1974&auto=format&fit=crop" },
      { name: "Priya", location: "Bangalore", product: "Leather Chelsea Boots", time: "15 mins ago", image: "https://images.unsplash.com/photo-1638247025967-b4e38f787b76?q=80&w=1935&auto=format&fit=crop" }
    ]
  },
  heroBanner: {
    isVisible: true,
    slides: [
      { id: "men", title: "Men's Collection", subtitle: "The Pinnacle of Craftsmanship", image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1964&auto=format&fit=crop", link: "/products?category=men", overlayColor: "rgba(0,0,0,0.4)", btnText: "Shop Men's" },
      { id: "women", title: "Women's Silhouette", subtitle: "Timeless Elegance Defined", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop", link: "/products?category=women", overlayColor: "rgba(0,0,0,0.4)", btnText: "Shop Women's" }
    ]
  },
  newArrivals: { isVisible: true, title: "New Arrivals", tagline: "Fresh From The Runway" },
  featuredArrivals: { isVisible: true, title: "Featured Arrivals", tagline: "Curated Selection" },
  featuredCollections: {
    isVisible: true,
    title: "Our Collections",
    items: [
      { id: "men", name: "Men's Collection", image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1964&auto=format&fit=crop", link: "/products?category=men" },
      { id: "women", name: "Women's Collection", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop", link: "/products?category=women" },
      { id: "children", name: "Children Collection", image: "https://images.unsplash.com/photo-1519233073524-d8a072927501?q=80&w=2070&auto=format&fit=crop", link: "/products?category=children" },
      { id: "accessories", name: "Accessories", image: "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=2070&auto=format&fit=crop", link: "/products?category=accessories" }
    ]
  },
  customerReviews: {
    isVisible: true,
    title: "Patron Voices",
    tagline: "Testimonials",
    items: [
      { id: "1", user: "Sarah Johnson", profession: "Fashion Designer", rating: 5, comment: "The quality of the silk evening gown I purchased is absolutely stunning. The attention to detail is unmatched.", date: "2026-03-15", location: "New York" },
      { id: "2", user: "Michael Chen", profession: "Business Executive", rating: 5, comment: "Luxe Attire's tailored wool blazer is my go-to for all my important meetings. It fits perfectly and feels incredibly premium.", date: "2026-03-20", location: "London" },
      { id: "3", user: "Emma Williams", profession: "Style Influencer", rating: 5, comment: "I've been shopping here for years and the consistency in quality and service is what keeps me coming back.", date: "2026-03-25", location: "Paris" }
    ]
  },
  trustBadges: {
    isVisible: true,
    items: [
      { icon: "Truck", title: "Free Shipping", subtitle: "On orders over $500" },
      { icon: "ShieldCheck", title: "Secure Payment", subtitle: "100% secure payment" },
      { icon: "RefreshCw", title: "Easy Returns", subtitle: "30-day return policy" }
    ]
  },
  footer: {
    isVisible: true,
    brandName: "RUMI",
    description: "Elevating your style with premium fabrics and timeless designs. Experience the pinnacle of luxury fashion.",
    copyright: "© 2026 RUMI. All rights reserved.",
    newsletterTitle: "Newsletter",
    newsletterDesc: "Subscribe to receive updates, access to exclusive deals, and more.",
    phone: "+1 (555) 123-4567",
    email: "support@rumi.com",
    address: "123 Fashion Ave, New York, NY 10001",
    privacyLabel: "Privacy Policy",
    termsLabel: "Terms of Service",
    shopLinks: [
      { label: "Men's Collection", path: "/products?category=men" },
      { label: "Women's Collection", path: "/products?category=women" },
      { label: "Accessories", path: "/products?category=accessories" }
    ],
    supportLinks: [
      { label: "Shipping Policy", path: "/support?tab=shipping" },
      { label: "Returns & Exchanges", path: "/support?tab=returns" },
      { label: "FAQs", path: "/support?tab=faq" },
      { label: "Contact Us", path: "/support?tab=contact" }
    ],
    socials: [
      { platform: "Instagram", url: "https://instagram.com", icon: "Instagram" },
      { platform: "Facebook", url: "https://facebook.com", icon: "Facebook" },
      { platform: "Twitter", url: "https://twitter.com", icon: "Twitter" },
      { platform: "YouTube", url: "https://youtube.com", icon: "Youtube" }
    ]
  },
  aiConcierge: {
    isEnabled: true,
    brandVoice: "Sophisticated, confident, and professional",
    systemInstruction: "You are the Elite AI Stylist. Be transparent that you are an AI assistant. Be sophisticated, confident, concise and helpful.",
    model: "gemini-1.5-flash",
    welcomeMessage: "Greetings. I am your personal AI stylist. How may I assist your style journey today?"
  },
  notifications: { isLive: true, broadcastMessage: "Exclusive: The Summer Collection is now available for early access.", emailFrequency: "Weekly" },
  settings: {
    baseCurrency: "PKR",
    shippingRules: {
      domestic: { name: "Pakistan", freeThreshold: 3000, flatFee: 200 },
      international: { name: "International", freeThreshold: 20000, flatFee: 2500 }
    }
  },
  pages: {
    shippingPolicy: "Our luxury items are handled with extreme care. Complimentary shipping over Rs. 3000 for domestic orders. Standard delivery 3-5 business days.",
    privacyPolicy: "Your privacy is our priority. We use industry-standard encryption to protect your data.",
    returnPolicy: "Complimentary 30-day returns for all patrons in the inner circle.",
    termsOfService: "By using our service, you agree to our elite standards of conduct.",
    faq: "### Frequently Asked Questions\n\n**Q: How do I know my size?**\nA: We provide a detailed size guide on every product page."
  }
};
