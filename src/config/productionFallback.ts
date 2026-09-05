export const productionFallbackConfig = {
  elements: {},
  branding: { brandName: "DENFIT", name: "DENFIT" },
  announcementBar: { isVisible: true, bgColor: "#0A0A0A", items: [], socials: [] },
  header: {
    isVisible: true, isCentered: false, logoText: "DENFIT", logoImage: "https://www.denfit.shop/denfit-logo.svg", logoColor: "#D4AF37", logoSize: "22px", logoWidth: "6rem", logoHeight: "4rem", logoPadding: "0px", logoFontFamily: "Playfair Display",
    navLinks: [{ label: "Shop All", path: "/products" }, { label: "Men's Collection", path: "/products?category=men" }, { label: "Women's Collection", path: "/products?category=women" }],
    search: { placeholder: "Search the collection...", buttonText: "Search", trendingTitle: "Trending Now", trending: [], trendingProducts: [] },
    account: { loginLabel: "Login", signupLabel: "Signup", emailLabel: "Email Address", passwordLabel: "Password", loginBtnText: "Sign In", signupBtnText: "Create Account" },
    wishlist: { title: "My Wishlist", emptyText: "Your wishlist is empty.", btnText: "Explore Collection" },
    cart: { title: "Your Selection", emptyText: "Your cart is empty.", checkoutBtnText: "Checkout Now", viewCartBtnText: "View Full Cart" }
  },
  purchaseNotifications: { isVisible: true, items: [] },
  heroBanner: { isVisible: true, slides: [] },
  newArrivals: { isVisible: true, title: "New Arrivals", tagline: "Fresh From The Collection" },
  featuredArrivals: { isVisible: true, title: "Featured Arrivals", tagline: "Curated Selection" },
  featuredCollections: { isVisible: true, title: "Our Collections", items: [] },
  customerReviews: { isVisible: true, title: "Customer Reviews", tagline: "What customers say", items: [] },
  trustBadges: { isVisible: true, items: [] },
  footer: { isVisible: true, brandName: "DENFIT", description: "Premium fashion, curated for you.", copyright: "© 2026 DENFIT. All rights reserved.", newsletterTitle: "Newsletter", newsletterDesc: "Subscribe for collection updates and exclusive access.", phone: "", email: "support@denfit.shop", address: "", privacyLabel: "Privacy Policy", termsLabel: "Terms of Service", shopLinks: [], supportLinks: [], socials: [] },
  aiConcierge: { isEnabled: true, brandVoice: "Sophisticated, confident, and professional", systemInstruction: "You are the premium AI shopping assistant for DENFIT. Use live store data and never invent unavailable facts.", model: "gemini-3.8-flash", welcomeMessage: "Hello. I’m your DENFIT shopping assistant." },
  notifications: { isLive: true, broadcastMessage: "", emailFrequency: "Weekly" },
  settings: { baseCurrency: "PKR", currencyOptions: ["USD", "PKR", "INR", "SAR", "EUR", "GBP", "AED"], shippingRules: { domestic: { name: "Pakistan", freeThreshold: 3000, flatFee: 200 }, international: { name: "International", freeThreshold: 20000, flatFee: 2500 } } },
  pages: { shippingPolicy: "Our luxury items are handled with extreme care. Complimentary shipping is applied according to the configured shipping rules.", privacyPolicy: "Your privacy is our priority.", returnPolicy: "Complimentary 30-day returns according to our return policy.", termsOfService: "By using our service, you agree to our terms.", faq: "### Frequently Asked Questions\n\nPlease contact support for assistance." }
};
