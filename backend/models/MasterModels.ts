import mongoose from "mongoose";

// =========================================================
// --- 1. SCHEMAS (Premium Data Definitions) ---
// =========================================================

export const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  originalPrice: Number,
  discount: Number,
  image: { type: String, required: true },
  images: [String],
  category: { type: String, required: true },
  collectionName: String,
  isNewArrival: { type: Boolean, default: false },
  showOnHomePage: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  description: String,
  stock: { type: Number, default: 0 },
  sizes: [String],
  colors: [String],
  details: [String],
  fabric: String,
  style: String,
  sizeGuide: String,
  shippingPolicy: String,
  fabricCare: String,
  styleNotes: String,
  lowStockAlert: { type: Number, default: 5 },
  reviews: [{
    user: String,
    profession: String,
    rating: Number,
    comment: String,
    date: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      (ret as any).id = ret._id.toString();
      return ret;
    }
  }
});

export const UserSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  displayName: String,
  photoURL: String,
  role: { type: String, default: "user" },
  phone: String,
  addresses: Array,
  payments: Array,
  abandonedCart: { items: Array, lastUpdated: Date, emailSent: { type: Boolean, default: false } },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now }
}, {
  toJSON: {
    transform: (doc, ret) => {
      (ret as any).id = ret._id.toString();
      return ret;
    }
  }
});

export const DiscountCodeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  percent: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  minOrderAmount: { type: Number, default: 0 }
});

export const CustomerLogSchema = new mongoose.Schema({
  userId: String,
  email: String,
  action: { type: String, required: true }, 
  details: Object,
  timestamp: { type: Date, default: Date.now }
});

export const OrderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  email: { type: String, required: true },
  fullName: { type: String, required: true },
  phone: String,
  items: Array,
  totalAmount: Number,
  discountApplied: mongoose.Schema.Types.Mixed,
  status: { type: String, default: "Pending" }, 
  shippingAddress: Object,
  paymentMethod: String,
  createdAt: { type: Date, default: Date.now },
}, {
  toJSON: {
    transform: (doc, ret) => {
      (ret as any).id = ret._id.toString();
      return ret;
    }
  }
});

export const PasswordResetSchema = new mongoose.Schema({
  email: { type: String, required: true },
  code: { type: String, required: true },
  expiresAt: { type: Date, required: true }
});

export const ElementSchema = new mongoose.Schema({
  content: { type: String, default: "" },
  color: { type: String, default: "#1a1a1a" },
  fontFamily: { type: String, default: "Inter" },
  fontSize: { type: String, default: "14px" },
  link: { type: String, default: "" },
  background: { type: String, default: "transparent" },
  isVisible: { type: Boolean, default: true },
  addContent: mongoose.Schema.Types.Mixed,
  deleteContent: Boolean
});

export const ConfigSchema = new mongoose.Schema({
  key: { type: String, default: "global", unique: true },
  branding: mongoose.Schema.Types.Mixed,
  announcementBar: mongoose.Schema.Types.Mixed,
  header: mongoose.Schema.Types.Mixed,
  heroBanner: mongoose.Schema.Types.Mixed,
  collections: mongoose.Schema.Types.Mixed,
  featuredCollections: mongoose.Schema.Types.Mixed,
  newArrivals: mongoose.Schema.Types.Mixed,
  featuredArrivals: mongoose.Schema.Types.Mixed,
  customerReviews: mongoose.Schema.Types.Mixed,
  trustBadges: mongoose.Schema.Types.Mixed,
  purchaseNotifications: mongoose.Schema.Types.Mixed,
  footer: mongoose.Schema.Types.Mixed,
  marketing: { promoEmailFrequencyDays: { type: Number, default: 4 }, lastPromoEmailSent: Date },
  pages: mongoose.Schema.Types.Mixed,
  internalPages: mongoose.Schema.Types.Mixed,
  auth: mongoose.Schema.Types.Mixed,
  account: mongoose.Schema.Types.Mixed,
  elements: mongoose.Schema.Types.Mixed,
  aiConcierge: mongoose.Schema.Types.Mixed
}, { 
  minimize: false,
  timestamps: true,
  strict: false 
});

// =========================================================
// --- 2. MODELS (The Bridge to Atlas) ---
// =========================================================

export const MediaSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  data: String, // Base64
}, { timestamps: true });

export const Media = mongoose.models.Media || mongoose.model("Media", MediaSchema);

export const ContactMessageSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, required: true },
  subject: String,
  message: String,
  reply: String,
  status: { type: String, default: 'pending' }, // pending, replied
  createdAt: { type: Date, default: Date.now }
});

export const ContactMessage = mongoose.models.ContactMessage || mongoose.model("ContactMessage", ContactMessageSchema);

export const NewsletterSubscriptionSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  subscribedAt: { type: Date, default: Date.now }
});

export const NewsletterSubscription = mongoose.models.NewsletterSubscription || mongoose.model("NewsletterSubscription", NewsletterSubscriptionSchema);

export const Product = mongoose.models.Product || mongoose.model("Product", ProductSchema);
export const User = mongoose.models.User || mongoose.model("User", UserSchema);
export const DiscountCode = mongoose.models.DiscountCode || mongoose.model("DiscountCode", DiscountCodeSchema);
export const CustomerLog = mongoose.models.CustomerLog || mongoose.model("CustomerLog", CustomerLogSchema);
export const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);
export const PasswordReset = mongoose.models.PasswordReset || mongoose.model("PasswordReset", PasswordResetSchema);
export const Config = mongoose.models.Config || mongoose.model("Config", ConfigSchema);

export const DEFAULT_SITE_CONFIG = {
  key: "global",
  announcementBar: {
    isVisible: true,
    bgColor: "linear-gradient(to right, #000, #1a1a1a)",
    items: [{ text: "SALE: 40% OFF", path: "/shop" }, { text: "FREE SHIPPING ON ALL ORDERS", path: "/shipping" }],
    socials: []
  },
  header: {
    isVisible: true,
    logoText: "STORE",
    logoImage: "",
    logoColor: "#C5A059",
    logoSize: "24px",
    logoFontFamily: "sans-serif",
    navLinks: [
      { label: "New Arrivals", path: "/new" },
      { label: "All Products", path: "/shop" },
      { label: "About Us", path: "/story" }
    ],
    search: { placeholder: "Search...", buttonText: "Search", trendingTitle: "Trending", trending: ["Dress", "Shirt"], trendingProducts: [] },
    account: { loginLabel: "Account", signupLabel: "Sign Up", emailLabel: "Email", passwordLabel: "Password", loginBtnText: "Login", signupBtnText: "Signup" },
    wishlist: { title: "Wishlist", emptyText: "Your wishlist is empty.", btnText: "Shop Now" },
    cart: { title: "Cart", emptyText: "Your cart is empty.", checkoutBtnText: "Checkout", viewCartBtnText: "View Cart" }
  },
  heroBanner: { isVisible: true, slides: [] },
  newArrivals: { isVisible: true, title: "NEW ARRIVALS", tagline: "Our Latest Products" },
  featuredArrivals: { isVisible: true, title: "FEATURED", tagline: "Hand-Picked For You" },
  featuredCollections: { 
    isVisible: true, 
    title: "COLLECTIONS", 
    tagline: "Explore Our Selection",
    items: [
      { id: 'men', name: "Men", image: "https://images.unsplash.com/photo-1488161628813-04466f872be2", link: "/products?category=men" },
      { id: 'women', name: "Women", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b", link: "/products?category=women" },
      { id: 'children', name: "Kids", image: "https://images.unsplash.com/photo-1519702281827-04664539860b?q=80&w=2070", link: "/products?category=children" },
      { id: 'accessories', name: "Accessories", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2099", link: "/products?category=accessories" }
    ] 
  },
  auth: {
    leftImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=2070',
    loginTitle: 'Sign In',
    loginSubtitle: 'Welcome back to our store.',
    signupTitle: 'Sign Up',
    signupSubtitle: 'Create your account',
    recoveryTitle: 'Forgot Password',
    recoverySubtitleEmail: 'Enter your email to reset password',
    recoverySubtitleCode: 'A code has been sent to your email.',
    recoverySubtitleReset: 'Enter new password'
  },
  account: {
    profileTitle: 'My Profile',
    wishlistTitle: 'My Wishlist',
    ordersTitle: 'My Orders',
    paymentsTitle: 'Payment Methods',
    addressesTitle: 'My Addresses',
    discountsTitle: 'Coupons',
    securityTitle: 'Security',
    welcomeMessage: 'Welcome back.'
  },
  customerReviews: { 
    isVisible: true, 
    title: { content: "CUSTOMER REVIEWS" }, 
    tagline: { content: "What our customers are saying" }, 
    items: [
        { id: '1', name: "John Doe", role: "Customer", rating: 5, content: "Great quality!", date: "2026-04-01" }
    ] 
  },
  trustBadges: { isVisible: true, items: [] },
  purchaseNotifications: { isVisible: true, items: [] },
  footer: { 
    isVisible: true, 
    brandName: "STORE",
    description: { content: "Quality clothing for every occasion." }, 
    copyright: { content: "© 2026 STORE. ALL RIGHTS RESERVED." },
    newsletterTitle: "Newsletter",
    newsletterDesc: "Subscribe for updates and exclusive deals.",
    privacyLabel: "Privacy Policy",
    termsLabel: "Terms of Service",
    shopLinks: [], 
    supportLinks: [], 
    socials: [] 
  },
  aiConcierge: {
    isEnabled: true,
    brandVoice: "Polite and helpful",
    systemInstruction: "You are a helpful shopping assistant. Use simple English and be professional. Assist customers in finding products and answering questions.",
    model: "gemini-1.5-flash",
    welcomeMessage: "Hello! How can I help you today?"
  },
  settings: {
    baseCurrency: 'PKR',
    supportEmail: 'support@rumy.com',
    supportPhone: '+92 000 0000000',
    hqAddress: 'Milan, Italy',
    shippingRules: {
      domestic: {
        name: "Pakistan",
        freeThreshold: 3000,
        flatFee: 200
      },
      international: {
        name: "International",
        freeThreshold: 20000,
        flatFee: 2500
      }
    }
  },
  pages: {
    shippingPolicy: "Our luxury items are handled with extreme care. Complimentary shipping over Rs. 3000 for domestic orders. Standard delivery 3-5 business days.",
    returnPolicy: "Complimentary 30-day returns for all patrons in the inner circle.",
    faq: "### Frequently Asked Questions\n\n**Q: How do I know my size?**\nA: We provide a detailed size guide on every product page.",
    privacyPolicy: "Your privacy is our priority. We use industry-standard encryption to protect your data."
  },
  elements: {}
};
