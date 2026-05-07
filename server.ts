import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import * as EmailTemplates from "./src/lib/emailTemplates";
import { 
  Product, 
  User, 
  CustomerLog, 
  Order, 
  PasswordReset, 
  Config,
  DiscountCode,
  Media,
  ContactMessage,
  NewsletterSubscription,
  DEFAULT_SITE_CONFIG
} from "./backend/models/MasterModels";
// import aiRoutes from "./backend/routes/aiRoutes.ts"; // Deleted as logic moved to frontend

/**
 * =========================================================
 * --- SECTION 2: SYSTEM INITIATION & SERVICES ---
 * =========================================================
 */

/**
 * startSovereignEngine: The main execution block for the Unified Server.
 */
async function startSovereignEngine() {
  const app = express();
  const PORT = 3000;

  // CONNECTION PROTOCOL: MongoDB Atlas Handshake
  const MONGODB_URI = "mongodb+srv://denfitreturns_db_user:Abdulmajid.516@cluster0.yie4wrd.mongodb.net/hayas_database?retryWrites=true&w=majority";
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Database Connected (MongoDB Atlas)");
    
    // --- BRANDING GUARD: ENSURE IDENTITY INTEGRITY ---
    const runBrandingGuard = async () => {
      let config = await (Config as any).findOne({ key: "global" });
      
      if (!config) {
        config = await (Config as any).create({ key: "global", ...DEFAULT_SITE_CONFIG });
        console.log("💎 System: Global Config Initialized.");
      } else {
        let isModified = false;
        const criticalFields = ['featuredCollections', 'customerReviews', 'auth', 'account', 'footer'];
        
        criticalFields.forEach(field => {
          if (!config || ! (config as any)[field] || ((config as any)[field].items && (config as any)[field].items.length === 0 && (DEFAULT_SITE_CONFIG as any)[field].items.length > 0)) {
            (config as any)[field] = (DEFAULT_SITE_CONFIG as any)[field];
            (config as any).markModified?.(field);
            isModified = true;
          }
        });

        if (isModified) {
          await (config as any).save();
          console.log("💎 System: Config Healing Protocol Complete.");
        }

        let raw = JSON.stringify(config);
        const targetBrand = "STORE"; 
        if (raw.includes("RUMY") || raw.includes("Rumi Atelier") || raw.includes("Lux 18") || raw.includes("LUXE ATTIRE")) {
          console.log("🛡️ [BRANDING GUARD]: Inconsistent Identity Detected. Commencing Purification...");
          const purified = raw.replace(/Rumi Atelier/g, targetBrand)
                             .replace(/Lux 18 Atelier/g, targetBrand)
                             .replace(/LUXE ATTIRE/g, targetBrand)
                             .replace(/Lux 18/g, targetBrand)
                             .replace(/RUMY/g, targetBrand);
          await (Config as any).findOneAndUpdate({ key: "global" }, JSON.parse(purified), { new: true });
          console.log(`✅ [BRANDING GUARD]: Identity Unified to ${targetBrand}.`);
        }
      }
    };
    runBrandingGuard();

    // --- BACKGROUND MARKETING ENGINE ---
    
    // 1. Abandoned Cart Checker (Runs every 10 minutes)
    setInterval(async () => {
      try {
        console.log("🧺 [MARKETING]: Checking for abandoned carts...");
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
        
        // Find users with items in cart, last updated > 30 mins ago, and email not sent
        const abandonedUsers = await (User as any).find({
          "abandonedCart.items": { $exists: true, $not: { $size: 0 } },
          "abandonedCart.lastUpdated": { $lt: thirtyMinsAgo },
          "abandonedCart.emailSent": false
        });

        if (abandonedUsers.length > 0) {
          const config = await (Config as any).findOne({ key: "global" });
          const brandName = (config as any)?.header?.logoText || "STORE";
          const baseUrl = process.env.APP_URL || "https://ais-pre-elr7w6t5u3twf4hxxnxtxb-96346558241.asia-southeast1.run.app";
          const trending = await (Product as any).find({ isFeatured: true }).limit(3);

          for (const user of abandonedUsers) {
            console.log(`📧 [MARKETING]: Sending abandoned cart email to ${user.email}`);
            const total = user.abandonedCart.items.reduce((sum: number, item: any) => sum + (item.price * (item.quantity || 1)), 0);
            
            const emailHtml = EmailTemplates.getAbandonedCartEmail(user.displayName || 'Customer', total.toString(), brandName, baseUrl, trending);
            await sendSimpleEmail(user.email, "You left some items in your cart", emailHtml, brandName);
            
            // Mark as sent
            user.abandonedCart.emailSent = true;
            await user.save();
          }
        }
      } catch (err) {
        console.error("❌ Abandoned Cart Engine Failure:", err);
      }
    }, 10 * 60 * 1000);

    // 2. Promotional Email Scheduler (Runs every 12 hours to check 4-day interval)
    setInterval(async () => {
      try {
        const config = await (Config as any).findOne({ key: "global" });
        if (!config) return;

        const marketing = config.marketing || { promoEmailFrequencyDays: 4 };
        const lastSent = marketing.lastPromoEmailSent ? new Date(marketing.lastPromoEmailSent) : new Date(0);
        const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

        if (lastSent < fourDaysAgo) {
          console.log("📣 [MARKETING]: Sending periodic promotional email...");
          const users = await (User as any).find({}, 'email displayName');
          const brandName = (config as any)?.header?.logoText || "STORE";
          const baseUrl = process.env.APP_URL || "https://ais-pre-elr7w6t5u3twf4hxxnxtxb-96346558241.asia-southeast1.run.app";
          const trending = await (Product as any).find({ isFeatured: true }).limit(3);

          for (const u of users) {
             const emailHtml = EmailTemplates.getAbandonedCartEmail(u.displayName || 'Customer', "0", brandName, baseUrl, trending);
             const promoHtml = emailHtml.replace("You Left Items in your cart", "Latest Collection Highlights")
                                         .replace("you left some items in your cart. We have saved them for you, but they might sell out fast.", "Check out our latest arrivals and trending products!")
                                         .replace("SAVE10", "WEEKLY10");
             
             await sendSimpleEmail(u.email, `Weekly Highlights from ${brandName}`, promoHtml, brandName);
          }

          config.marketing = { ...marketing, lastPromoEmailSent: new Date() };
          config.markModified('marketing');
          await config.save();
        }
      } catch (err) {
        console.error("❌ Promotional Scheduler Failure:", err);
      }
    }, 12 * 60 * 60 * 1000);

  } catch (err) {
    console.error("❌ Critical Database Connection Failure:", err);
    process.exit(1);
  }

  app.use(cors());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- MOUNT MODULAR ROUTES ---
  // app.use("/api/ai", aiRoutes); // AI now handled by frontend SDK for secure key access

  // --- NATIVE DISPATCH: UNIFIED EMAIL ACTION ---
  app.post("/api/orchestrate/dispatch-email", async (req, res) => {
    try {
      const { email, displayName, total, actionType, offerCode } = req.body;
      
      if (actionType === 'ABANDONED_CART') {
        await sendSimpleEmail(
          email, 
          "You left items in your cart", 
          `Hello ${displayName || 'customer'}. Your cart totaling $${total || '0'} is still waiting for you. Complete your order now!`,
          "Cart Reminder"
        );
      } else if (actionType === 'PROMOTIONAL') {
        await sendSimpleEmail(
          email, 
          "Special Offer For You", 
          `Hello ${displayName || 'customer'}. Use code <strong>${offerCode || 'SAVE10'}</strong> for a discount on your next purchase.`,
          "Special Offer"
        );
      } else {
         return res.status(400).json({ error: "Invalid action type." });
      }
      
      res.json({ status: "success" });
    } catch (error) {
      console.error("Email Dispatch Failure:", error);
      res.status(500).json({ error: "Dispatch failed." });
    }
  });

  // --- DISCOUNT CODES ---
  app.get("/api/admin/discounts", async (req, res) => {
    try {
      const codes = await (DiscountCode as any).find().sort({ createdAt: -1 });
      res.json(codes);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch discounts" });
    }
  });

  app.post("/api/admin/discounts", async (req, res) => {
    try {
      const { name, percent, discount: discountVal, startDate, endDate, minOrderAmount } = req.body;
      const finalPercent = percent !== undefined ? percent : discountVal;
      
      if (!name || finalPercent === undefined || !startDate || !endDate) {
        return res.status(400).json({ error: "Missing required fields (Name, Percent/Discount, Start Date, End Date)." });
      }

      const codeName = name.trim().toUpperCase();
      
      // Check if code already exists
      const existing = await (DiscountCode as any).findOne({ name: codeName });
      if (existing) {
        return res.status(400).json({ error: `Discount code '${codeName}' already exists.` });
      }

      const discount = new (DiscountCode as any)({
        name: codeName,
        percent: Number(finalPercent),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        minOrderAmount: Number(minOrderAmount || 0),
        isActive: true
      });
      await discount.save();
      
      console.log(`🎟️ [DISCOUNT]: Created code ${codeName} (${finalPercent}%)`);

      // Blast promotional emails in background to prevent timeout
      (async () => {
        try {
          const users = await (User as any).find({ email: { $exists: true, $ne: "" } }, 'email displayName');
          const config = await (Config as any).findOne({ key: "global" });
          const brandName = config?.header?.logoText || "Luxe Attire";
          const baseUrl = getBaseUrl(req);
          const trending = await (Product as any).find({ isFeatured: true }).limit(3);

            for (const u of users) {
              const trendingStyled = trending.map(p => {
                const img = p.image || p.images?.[0] || 'https://images.unsplash.com/photo-1594932224826-94b2724242ee';
                let finalImg = img;
                if (!img.startsWith('http') && !img.startsWith('data:')) {
                  finalImg = `${baseUrl}${img.startsWith('/') ? '' : '/'}${img}`;
                }
                return { ...p.toObject(), imageUrl: finalImg };
              });

              const content = `
              <h2 style="color: #D35400; font-size: 32px; font-weight: bold; margin-bottom: 25px;">A Gift for You</h2>
              <p style="color: #555; line-height: 1.8;">Hello ${u.displayName || 'Customer'},</p>
              <p style="color: #555; line-height: 1.8;">Enjoy an exclusive <b>${finalPercent}% OFF</b> on our entire collection. This is our way of saying thank you for being part of the ${brandName} family.</p>
              <div style="border: 2px dashed #D35400; padding: 30px; margin: 30px 0; text-align: center; background-color: #fffbf5;">
                  <p style="margin: 0; font-size: 14px; font-weight: bold; color: #D35400;">YOUR EXCLUSIVE CODE</p>
                  <h3 style="margin: 10px 0 0 0; font-size: 36px; color: #0F0F0F;">${codeName}</h3>
              </div>
              <p style="color: #999; font-size: 11px; text-align: center;">Valid until ${new Date(endDate).toLocaleDateString()}</p>
              <div style="text-align: center; margin: 30px 0;">
                  <a href="${baseUrl}/shop" style="background-color: #0F0F0F; color: #ffffff !important; padding: 14px 35px; text-decoration: none; font-size: 12px; font-weight: bold; border-radius: 4px; display: inline-block;">
                      SHOP THE COLLECTION
                  </a>
              </div>
              <div style="margin-top: 40px;">
                  <p style="text-align: center; font-size: 11px; letter-spacing: 0.2em; color: #C5A059; text-transform: uppercase;">Trending Now</p>
                  <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 20px;">
                      <tr>
                          ${trendingStyled.map(p => `
                          <td width="33%" align="center" style="padding: 0 10px;">
                              <a href="${baseUrl}/product/${p._id}" style="text-decoration: none; color: #333;">
                                  <img src="${p.imageUrl}" width="100%" style="display: block; margin-bottom: 10px; border: 1px solid #eee;">
                                  <div style="font-size: 10px; font-weight: bold;">${p.name}</div>
                              </a>
                          </td>
                          `).join('')}
                      </tr>
                  </table>
              </div>
            `;
            const promoHtml = EmailTemplates.emailBase(content, brandName, baseUrl);
            await sendSimpleEmail(u.email, `${finalPercent}% OFF - Your Exclusive Invite to ${brandName}`, promoHtml, brandName);
          }
        } catch (emailErr) {
          console.error("Background promo email blast failure:", emailErr);
        }
      })();

      res.json({ status: "success", message: "Discount code added successfully!", code: discount });
    } catch (error: any) {
      console.error("Discount creation failed:", error);
      res.status(500).json({ error: error.message || "Internal server failure during discount creation." });
    }
  });

  /**
   * DATA SYSTEM RESET: Clear dashboard, orders, or customers.
   */
  app.delete("/api/admin/clear/:category", async (req, res) => {
    try {
      const { category } = req.params;
      console.log(`🧹 [CLEANUP]: Clearing ${category}...`);
      
      if (category === 'dashboard' || category === 'stats') {
        await (CustomerLog as any).deleteMany({});
        // Stats are derived, so clearing logs and orders effectively resets dashboard
        await (Order as any).deleteMany({}); 
      } else if (category === 'orders') {
        await (Order as any).deleteMany({});
      } else if (category === 'customers') {
        // Clear all users except admin
        await (User as any).deleteMany({ 
          $and: [
            { email: { $ne: 'admin@rumi.com' } },
            { email: { $ne: 'admin@luxeattire.com' } }
          ]
        });
        await (CustomerLog as any).deleteMany({});
      } else if (category === 'inquiries') {
        await (ContactMessage as any).deleteMany({});
      }
      
      res.json({ status: "success", message: `${category} data cleared successfully.` });
    } catch (error) {
      console.error(`❌ Cleanup Error (${req.params.category}):`, error);
      res.status(500).json({ error: "System cleanup failure." });
    }
  });

  app.delete("/api/admin/discounts/:id", async (req, res) => {
    try {
      await (DiscountCode as any).findByIdAndDelete(req.params.id);
      res.json({ status: "success" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete discount" });
    }
  });

  /**
   * Public Discounts: Get all active discount codes for users to see in profile.
   */
  app.get("/api/discounts", async (req, res) => {
    try {
      const now = new Date();
      const codes = await (DiscountCode as any).find({ 
        isActive: true,
        endDate: { $gte: now }
      }).sort({ createdAt: -1 });
      
      const formatted = codes.map((c: any) => ({
        code: c.name,
        description: `${c.percent}% OFF - Minimum Order: ${c.minOrderAmount || 0}`,
        expiry: c.endDate.toISOString().split('T')[0]
      }));
      
      res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch discounts" });
    }
  });

  app.post("/api/discounts/verify", async (req, res) => {
    try {
      const { code, amount } = req.body;
      const found = await (DiscountCode as any).findOne({ name: code.toUpperCase(), isActive: true });
      if (!found) return res.status(404).json({ error: "Invalid code" });
      
      const now = new Date();
      if (now < found.startDate || now > found.endDate) {
        return res.status(400).json({ error: "Code expired or not active yet" });
      }

      if (amount && found.minOrderAmount && amount < found.minOrderAmount) {
        return res.status(400).json({ error: `Minimum order of ${found.minOrderAmount} required for this code.` });
      }
      
      res.json({ status: "success", discount: found.percent });
    } catch (error) {
      res.status(500).json({ error: "verification failed" });
    }
  });

  // --- MEDIA SYSTEM (Image Upload) ---
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath);
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
  const upload = multer({ storage });
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // --- MEDIA SYSTEM (Image Upload to MongoDB for Persistence) ---
  app.post("/api/admin/upload", upload.single('image'), async (req, res) => {
    try {
      if (!(req as any).file) return res.status(400).json({ error: "No file uploaded." });
      
      const file = (req as any).file;
      const media = new Media({
        filename: file.originalname,
        contentType: file.mimetype,
        data: fs.readFileSync(file.path).toString('base64')
      });
      await media.save();
      
      // Remove temporary file
      fs.unlinkSync(file.path);
      
      const imageUrl = `/api/media/${media._id}`;
      res.json({ status: "success", imageUrl });
    } catch (error) {
      console.error("Upload failure:", error);
      res.status(500).json({ error: "Upload failed." });
    }
  });

  app.post("/api/admin/uploads", upload.array('images', 10), async (req, res) => {
    try {
      const files = (req as any).files;
      if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded." });
      
      const imageUrls = [];
      for (const file of files) {
        const media = new Media({
          filename: file.originalname,
          contentType: file.mimetype,
          data: fs.readFileSync(file.path).toString('base64')
        });
        await media.save();
        fs.unlinkSync(file.path);
        imageUrls.push(`/api/media/${media._id}`);
      }
      
      res.json({ status: "success", imageUrls });
    } catch (error) {
      console.error("Multi-upload failure:", error);
      res.status(500).json({ error: "Upload failed." });
    }
  });

  app.get("/api/media/:id", async (req, res) => {
    try {
      const media = await (Media as any).findById(req.params.id);
      if (!media) return res.status(404).send("Not found");
      
      const imgBuffer = Buffer.from(media.data, 'base64');
      res.set('Content-Type', media.contentType);
      res.send(imgBuffer);
    } catch (error) {
      res.status(500).send("Error retrieving media");
    }
  });

  // --- LUXURY EMAIL DISPATCH ENGINE (NODEMAILER) ---
  // Note: For Gmail, please use an App Password if 2FA is enabled.
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER || "denfitreturns@gmail.com",
      pass: process.env.EMAIL_PASS || "hkbi mpsh igzk eshw",
    },
  });

  /**
   * sendSimpleEmail: Utility function to send branded emails.
   */
  const sendSimpleEmail = async (to: string, subject: string, messageBody: string, title: string = "Luxe Attire") => {
    if (!to) {
      console.warn("⚠️ Email target missing.");
      return;
    }

    try {
      const config = await (Config as any).findOne({ key: "global" });
      const currentBrand = config?.header?.logoText || title || "Luxe Attire";
      const fromEmail = process.env.EMAIL_USER || "denfitreturns@gmail.com";

      await transporter.sendMail({
        from: `"${currentBrand}" <${fromEmail}>`,
        to,
        subject,
        html: messageBody, 
      });
      console.log(`📧 Email sent to: ${to} [Subject: ${subject}]`);
    } catch (error: any) {
      console.error("❌ Email dispatch failed:", error.message || error);
      // Log full error for diagnostic if needed
      if (error.code === 'EAUTH') {
        console.error("🔒 SMTP Auth Error: Please check EMAIL_USER and EMAIL_PASS (App Password recommended).");
      }
    }
  };

  /**
   * notifyAdmin: Automatic alerts for the Admin.
   */
  const notifyAdmin = async (subject: string, text: string) => {
    const adminEmail = process.env.ADMIN_EMAIL || "denfitreturns@gmail.com";
    await sendSimpleEmail(adminEmail, `[ADMIN ALERT] ${subject}`, text, "ADMIN");
  };

  // --- GLOBAL CONFIGURATION DEFAULTS (THE RULE OF SEVEN BASE) ---
  const defaultGlobalConfig = {
    elements: {},
    announcementBar: {
      isVisible: true,
      text: "Complimentary shipping on orders over $500",
      color: "#ffffff",
      fontSize: "10px",
      bgColor: "linear-gradient(-45deg, #000000, #000080, #ffffff, #000080, #000000)",
      items: [
        { text: "Complimentary shipping on orders over $500", path: "/products" },
        { text: "50% off on Men's Collection", path: "/products?category=men" },
        { text: "Discover the new Summer Collection", path: "/products?category=women" },
        { text: "Exclusive 15% off for first-time members", path: "/profile" },
      ],
      socials: [
        { platform: 'TikTok', url: 'https://tiktok.com', icon: 'Music2', position: 'left' },
        { platform: 'Instagram', url: 'https://instagram.com', icon: 'Instagram', position: 'left' },
        { platform: 'YouTube', url: 'https://youtube.com', icon: 'Youtube', position: 'right' },
        { platform: 'WhatsApp', url: 'https://wa.me/yournumber', icon: 'MessageCircle', position: 'right' }
      ]
    },
    header: {
      isVisible: true,
      logoText: "RUMY",
      logoColor: "#D4AF37",
      logoSize: "22px",
      navLinks: [
        { label: "Shop All", path: "/products" },
        { label: "Men's Collection", path: "/products?category=men" },
        { label: "Women's Collection", path: "/products?category=women" }
      ],
      search: {
        placeholder: "Search the atelier...",
        buttonText: "Search",
        trendingTitle: "Trending Now",
        trending: ['Evening Gowns', 'Wool Blazers', 'Cashmere', 'Formal Shoes', 'Accessories'],
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
      wishlist: {
        title: "My Wishlist",
        emptyText: "Your wishlist is empty.",
        btnText: "Explore Collection"
      },
      cart: {
        title: "Your Selection",
        emptyText: "Your cart is empty.",
        checkoutBtnText: "Checkout Now",
        viewCartBtnText: "View Full Cart"
      },
      trending: ['Evening Gowns', 'Wool Blazers', 'Cashmere', 'Formal Shoes', 'Accessories'],
      trendingProducts: ['Silk Evening Gown', 'Tailored Wool Blazer', 'Cashmere Turtleneck']
    },
    heroBanner: {
      isVisible: true,
      slides: [
        {
          id: 'men',
          title: "Men's",
          subtitle: "Collection",
          image: "https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1964",
          link: "/products?category=men",
          overlayColor: "rgba(0,0,0,0.4)"
        },
        {
          id: 'women',
          title: "Women's",
          subtitle: "Collection",
          image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070",
          link: "/products?category=women",
          overlayColor: "rgba(0,0,0,0.4)"
        }
      ]
    },
    footer: {
      isVisible: true,
      description: "Elevating your style with premium fabrics and timeless designs.",
      copyright: "© 2026 RUMY. All rights reserved.",
      links: [
        { label: "Shipping Policy", path: "/shipping" },
        { label: "Returns & Exchanges", path: "/returns" },
        { label: "FAQs", path: "/faq" },
        { label: "Contact Us", path: "/contact" }
      ],
      socials: [
        { platform: 'Instagram', url: 'https://instagram.com' },
        { platform: 'Facebook', url: 'https://facebook.com' },
        { platform: 'YouTube', url: 'https://youtube.com' }
      ]
    },
    featuredCollections: {
      isVisible: true,
      items: [
        { id: 'men', name: "Men's Atelier", image: "https://images.unsplash.com/photo-1488161628813-04466f872be2", link: "/products?category=men" },
        { id: 'women', name: "Women's Couture", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b", link: "/products?category=women" },
        { id: 'children', name: "Children's Elite", image: "https://images.unsplash.com/photo-1519702281827-04664539860b?q=80&w=2070", link: "/products?category=children" },
        { id: 'accessories', name: "Luxury Accessories", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=2099", link: "/products?category=accessories" }
      ]
    },
    customerReviews: {
      isVisible: true,
      items: [
        { id: '1', name: "Ayan Khan", role: "Elite Member", rating: 5, content: "The craftsmanship is unparalleled. Truly a luxury experience.", date: "2026-04-01" },
        { id: '2', name: "Sarah Malik", role: "Verified Buyer", rating: 5, content: "Best couture pieces I've ever owned. Worth every cent.", date: "2026-04-10" }
      ]
    },
    trustBadges: {
      isVisible: true,
      items: [
        { icon: 'Truck', title: 'Free Shipping', subtitle: 'On orders over $500' },
        { icon: 'ShieldCheck', title: 'Secure Payment', subtitle: '100% encrypted' }
      ]
    },
    aiConcierge: {
      isEnabled: true,
      brandVoice: "Sophisticated, confident, and professional",
      systemInstruction: "You are the Elite AI Stylist. You are sophisticated, confident, and professional. Identify yourself as a human luxury ambassador, not an AI. NEVER say 'I apologize', 'I am at your service', or 'I am an AI'. Focus on helping users find the perfect luxury attire.",
      model: "gemini-1.5-flash",
      welcomeMessage: "Greetings. I am your personal stylist. How may I assist your style journey today?"
    },
    notifications: {
      isLive: true,
      broadcastMessage: "Exclusive: The Summer Collection is now available for early access.",
      emailFrequency: "Weekly"
    },
    pages: {
      shippingPolicy: "Our luxury items are handled with extreme care. Complimentary shipping over $500.",
      privacyPolicy: "Your privacy is our priority.",
      returnPolicy: "Complimentary 30-day returns for all patrons.",
      termsOfService: "By using our service, you agree to our elite standards."
    }
  };

  // =========================================================
  // --- SECTION 3: MASTER API ROUTES (700+ LINE TARGET) ---
  // =========================================================

  /**
   * FORGOT PASSWORD: Initiates the security protocol and sends OTP.
   */
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); 

      await (PasswordReset as any).findOneAndUpdate({ email }, { code, expiresAt }, { upsert: true });

      const config = await (Config as any).findOne({ key: "global" });
      const brandName = (config as any)?.header?.logoText || "ETHEREAL";
      const baseUrl = process.env.APP_URL || "https://ais-pre-elr7w6t5u3twf4hxxnxtxb-96346558241.asia-southeast1.run.app";
      const trending = await (Product as any).find({ isFeatured: true }).limit(2);

      const emailHtml = EmailTemplates.getOTPEmail(code, brandName, baseUrl, trending);
      await sendSimpleEmail(email, "Password Reset Code", emailHtml);
      res.json({ status: "success", message: "Code sent." });
    } catch (error) {
      res.status(500).json({ error: "Recovery system failure." });
    }
  });

  /**
   * VERIFY CODE: Validates the 6-digit security key.
   */
  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const { email, code } = req.body;
      const reset = await (PasswordReset as any).findOne({ email, code });
      if (reset && reset.expiresAt > new Date()) {
        res.json({ status: "success", message: "Key Verified" });
      } else {
        res.status(400).json({ error: "Invalid or expired key." });
      }
    } catch (error) {
      res.status(500).json({ error: "Verification system failure." });
    }
  });

  /**
   * RESET PASSWORD: Finalizes the credential restoration.
   */
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      const reset = await (PasswordReset as any).findOne({ email, code });
      if (reset && reset.expiresAt > new Date()) {
        await (User as any).findOneAndUpdate({ email }, { customPassword: newPassword });
        await (PasswordReset as any).deleteOne({ email, code });
        res.json({ status: "success", message: "Identity credentials updated." });
      } else {
        res.status(400).json({ error: "Verification session expired." });
      }
    } catch (error) {
      res.status(500).json({ error: "Credential update failure." });
    }
  });

  /**
   * PRODUCT RETRIEVAL: Fetches the luxury catalog.
   */
  app.delete("/api/admin/users/:uid", async (req, res) => {
    try {
      await (User as any).findOneAndDelete({ uid: req.params.uid });
      res.json({ status: "success" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const products = await (Product as any).find().sort({ createdAt: -1 });
      res.json(products);
    } catch (error) {
      console.error("❌ Product Retrieval Error:", error);
      res.status(500).json({ error: "Archives unreachable." });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await (Product as any).findById(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found." });
      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Retrieval failure." });
    }
  });

  /**
   * ADMIN PRODUCT CREATION: Adds a new masterpiece to the vault.
   */
  app.post("/api/admin/products", async (req, res) => {
    try {
      const body = { ...req.body };
      // Normalizing name/title
      if (!body.name && body.title) body.name = body.title;
      if (!body.title && body.name) body.title = body.name;

      if (!body.name || !body.category || !body.image) {
        console.error("❌ [VAULT]: Missing required product fields", body);
        return res.status(400).json({ error: "Name, Category, and Primary Image are mandatory." });
      }

      const product = new (Product as any)(body);
      await product.save();
      console.log(`💎 [VAULT]: New product added: ${product.name}`);
      res.json({ status: "success", product });
    } catch (error: any) {
      console.error("❌ [VAULT ERROR]:", error.message);
      res.status(500).json({ error: `Product creation failed: ${error.message}` });
    }
  });

  /**
   * ADMIN PRODUCT UPDATE/DELETE: Management of existing silhouettes.
   */
  app.put("/api/admin/products/:id", async (req, res) => {
    try {
      const body = { ...req.body };
      if (!body.name && body.title) body.name = body.title;
      if (!body.title && body.name) body.title = body.name;

      const product = await (Product as any).findByIdAndUpdate(req.params.id, body, { new: true });
      console.log(`📝 [VAULT]: Product updated: ${product?.name}`);
      res.json({ status: "success", product });
    } catch (error) {
      res.status(500).json({ error: "Silhouette update failure." });
    }
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    try {
      await (Product as any).findByIdAndDelete(req.params.id);
      res.json({ status: "success" });
    } catch (error) {
      res.status(500).json({ error: "Exclusion failed." });
    }
  });

  /**
   * IDENTITY SYNC: The bridge between Frontend and Backend.
   * FORCES the Backend to send luxury emails based on action type.
   */
  app.post("/api/auth/sync", async (req, res) => {
    try {
      const { uid, email, displayName, photoURL, role, phone, addresses, payments, actionType, isNewUser } = req.body;
      const existingUser = await (User as any).findOne({ uid });
      
      const userRole = (email === "admin@rumi.com") ? "admin" : (role || "user");

      const patron = await (User as any).findOneAndUpdate(
        { uid },
        { email, displayName, photoURL, role: userRole, phone, addresses, payments, lastLogin: new Date() },
        { upsert: true, new: true }
      );
      
      if (actionType) {
        await new (CustomerLog as any)({ userId: uid, email, action: actionType }).save();
      }

      const config = await (Config as any).findOne({ key: "global" });
      const brandName = (config as any)?.header?.logoText || "ETHEREAL";
      const baseUrl = process.env.APP_URL || "https://ais-pre-elr7w6t5u3twf4hxxnxtxb-96346558241.asia-southeast1.run.app";
      const trending = await (Product as any).find({ isFeatured: true }).limit(2);

      // --- THE LUXE EMAIL ORCHESTRATOR ---
      if (isNewUser || !existingUser) {
        console.log(`💎 [NEW USER]: Dispatching Welcome Email to ${email}`);
        await notifyAdmin("New Sign Up", `User ${displayName} has joined the store.`);
        
        const emailHtml = EmailTemplates.getSignupEmail(displayName || 'Customer', brandName, getBaseUrl(req), trending);
        await sendSimpleEmail(email, "Welcome to our store", emailHtml);
      } else {
        console.log(`👤 [LOGIN]: Notifying user ${email} of successful login.`);
        const emailHtml = EmailTemplates.getLoginEmail(displayName || 'Customer', brandName, getBaseUrl(req), trending);
        await sendSimpleEmail(email, "New Login Detected", emailHtml);
      }

      console.log(`✅ [SYNC]: User ${patron.email} synchronized as [${userRole}]`);
      res.json({ status: "success", message: "User Synced", user: patron });
    } catch (error: any) {
      console.error("❌ Critical Sync Error:", error.message);
      res.status(500).json({ error: "Identity Sync Failure" });
    }
  });

  // Dynamic Base URL Discovery for absolute paths in emails
  const getBaseUrl = (req: any) => {
    if (process.env.APP_URL) return process.env.APP_URL;
    const protocol = req.protocol || 'https';
    const host = req.get('host') || 'localhost:3000';
    return `${protocol}://${host}`;
  };

  /**
   * ACQUISITION ORCHESTRATION: The Order System.
   */
  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = req.body;
      const order = new (Order as any)(orderData);
      await order.save();
      console.log(`💰 [TRANSACTION]: Acquisition secured: #${order._id}`);

      await new (CustomerLog as any)({ 
        userId: order.userId, email: order.email, action: 'order_placed',
        details: `Secured order for $${order.totalAmount}`
      }).save();

      const config = await (Config as any).findOne({ key: "global" });
      const brandName = (config as any)?.branding?.brandName || (config as any)?.header?.logoText || "RUMY";
      const baseUrl = getBaseUrl(req);
      const trending = await (Product as any).find({ isFeatured: true }).limit(2);

      // Notify Admin
      await notifyAdmin("New Order", `A new order (#${order._id}) has been placed by ${order.email}.`);

      const emailHtml = EmailTemplates.getOrderEmail(order, brandName, baseUrl, trending);
      await sendSimpleEmail(order.email, `Order Confirmation - #${order._id.toString().slice(-8).toUpperCase()}`, emailHtml);

      res.json({ status: "success", orderId: order._id });
    } catch (error) {
      console.error("❌ Order Orchestration Failure:", error);
      res.status(500).json({ error: "Acquisition system offline." });
    }
  });

  /**
   * PERMANENT STORAGE: Profile, Addresses, and Preferences.
   */
  app.get("/api/user/profile/:uid", async (req, res) => {
    try {
      const user = await (User as any).findOne({ uid: req.params.uid });
      if (!user) {
        return res.status(404).json({ error: "User profile not found." });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Profile retrieval failure." });
    }
  });

  app.post("/api/user/update-profile", async (req, res) => {
    try {
      const { uid, displayName, phone, photoURL, customPassword } = req.body;
      const updateData: any = { displayName, phone, photoURL };
      if (customPassword) updateData.customPassword = customPassword;

      const user = await (User as any).findOneAndUpdate({ uid }, updateData, { new: true });
      res.json({ status: "success", user });
    } catch (error) {
      res.status(500).json({ error: "Profile update failure." });
    }
  });

  app.post("/api/user/save-address", async (req, res) => {
    try {
      const { uid, address } = req.body;
      const user = await (User as any).findOneAndUpdate(
        { uid }, 
        { $push: { addresses: address } }, 
        { new: true }
      );
      res.json({ status: "success", user });
    } catch (error) {
      res.status(500).json({ error: "Address saving failure." });
    }
  });

  /**
   * ADMIN CUSTOMER LOGS: Fetches real-time activity for the dashboard.
   */
  app.get("/api/admin/customers", async (req, res) => {
    try {
      const logs = await CustomerLog.find().sort({ timestamp: -1 }).limit(100);
      const users = await User.find().sort({ createdAt: -1 }).lean();
      res.json({ logs, users });
    } catch (error) {
      res.status(500).json({ error: "Patron registry access denied." });
    }
  });

  app.get("/api/admin/customers/log", async (req, res) => {
    try {
      const logs = await CustomerLog.find().sort({ timestamp: -1 }).limit(100);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  app.post("/api/admin/customers/log", async (req, res) => {
    try {
      const log = new CustomerLog(req.body);
      await log.save();
      res.json({ status: "success" });
    } catch (error) {
      res.status(500).json({ error: "Failed to save log" });
    }
  });

  app.get("/api/marketing/broadcast", async (req, res) => {
    res.json([]);
  });

  app.post("/api/marketing/broadcast", async (req, res) => {
    res.status(200).json({ status: "success" });
  });

  /**
   * ADMIN CONFIG: Dynamic site controller.
   */
  app.get("/api/config", async (req, res) => {
    try {
      const config = await (Config as any).findOne({ key: "global" });
      res.json(config || DEFAULT_SITE_CONFIG);
    } catch (error) {
      res.json(DEFAULT_SITE_CONFIG);
    }
  });

  app.post("/api/admin/config", async (req, res) => {
    try {
      console.log("🛠️ [SYSTEM]: Updating Global Configuration...");
      
      // Sanitization: Remove _id from subdocuments to prevent Mongoose conflicts
      const sanitizedBody = JSON.parse(JSON.stringify(req.body));
      const recursiveSanitize = (obj: any) => {
        if (Array.isArray(obj)) {
          obj.forEach(recursiveSanitize);
        } else if (obj && typeof obj === 'object') {
          delete obj._id;
          Object.values(obj).forEach(recursiveSanitize);
        }
      };
      
      recursiveSanitize(sanitizedBody);
      
      const config = await (Config as any).findOneAndUpdate(
        { key: "global" }, 
        sanitizedBody, 
        { upsert: true, returnDocument: 'after', runValidators: false }
      );
      
      res.json({ status: "success", config });
    } catch (error: any) {
      console.error("❌ System Error: Config update failed:", error);
      res.status(500).json({ 
        error: "Sovereign configuration update failure.", 
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  /**
   * CONTACT FORM: Receives customer inquiries.
   */
  app.post("/api/contact", async (req, res) => {
    try {
      const { firstName, lastName, email, message, subject = "General Inquiry" } = req.body;
      const fullName = `${firstName} ${lastName}`.trim() || "Valued Patron";
      
      // Save to database
      const contactMsg = new (ContactMessage as any)({
        fullName,
        email,
        subject,
        message,
        status: 'pending'
      });
      await contactMsg.save();

      const configDoc = await (Config as any).findOne({ key: "global" });
      const config = configDoc ? (configDoc.toObject() as any) : DEFAULT_SITE_CONFIG;
      const brandName = config?.branding?.name || "Luxe Attire";
      const adminEmail = process.env.ADMIN_EMAIL || "denfitreturns@gmail.com";
      const appUrl = process.env.APP_URL || getBaseUrl(req);

      console.log(`[CONTACT]: Inquiry from ${fullName} (${email})`);

      // Send confirmation to customer
      try {
        const content = `
          <h2 style="color: #0F0F0F; font-size: 24px; font-weight: 400; margin-bottom: 20px;">We've received your message</h2>
          <p style="color: #555; line-height: 1.8;">Hello ${fullName},</p>
          <p style="color: #555; line-height: 1.8;">Thank you for contacting us. We have received your inquiry regarding "<b>${subject}</b>" and our team will get back to you within 24-48 hours.</p>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; font-size: 12px; color: #888;">YOUR MESSAGE:</p>
            <p style="margin: 10px 0 0 0; font-style: italic; color: #333;">${message}</p>
          </div>
          <p style="color: #555; line-height: 1.8;">In the meantime, feel free to explore our latest collection.</p>
        `;
        const emailHtml = EmailTemplates.emailBase(content, brandName, appUrl);
        await sendSimpleEmail(email, `We received your message | ${brandName}`, emailHtml);
      } catch (e) {
        console.warn("[CONTACT]: Failed to send confirmation email to customer:", e);
      }

      // Notify Admin
      try {
        await notifyAdmin(
          `New Inquiry: ${subject} from ${fullName}`,
          `Patron: ${fullName}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}\n\n---\nView at: ${appUrl}/admin/customers`
        );
      } catch (e) {
        console.error("[CONTACT]: Failed to notify admin:", e);
      }

      res.json({ status: "success", message: "Inquiry dispatched to the atelier." });
    } catch (error: any) {
      console.error("❌ Contact Form Error:", error);
      res.status(500).json({ error: "Communication channel failure.", details: error.message });
    }
  });

  app.get("/api/admin/contacts", async (req, res) => {
    try {
      const contacts = await (ContactMessage as any).find().sort({ createdAt: -1 });
      res.json(contacts);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch contact messages" });
    }
  });

  app.post("/api/admin/contacts/reply", async (req, res) => {
    try {
      const { contactId, reply } = req.body;
      const contact = await (ContactMessage as any).findById(contactId);
      if (!contact) return res.status(404).json({ error: "Message not found" });

      contact.reply = reply;
      contact.status = 'replied';
      await contact.save();

      const configDoc = await (Config as any).findOne({ key: "global" });
      const config = configDoc ? (configDoc.toObject() as any) : DEFAULT_SITE_CONFIG;
      const brandName = config?.header?.logoText || "Luxe Attire";
      const appUrl = getBaseUrl(req);
      const logoUrl = config?.header?.logoImage;

      const content = `
        <h2 style="color: #0F0F0F; font-size: 24px; font-weight: 400; margin-bottom: 20px;">Response to your inquiry</h2>
        <p style="color: #555; line-height: 1.8;">Hello ${contact.fullName},</p>
        <p style="color: #555; line-height: 1.8;">Our team has reviewed your inquiry. Please find our response below:</p>
        <div style="background-color: #f9f9f9; padding: 25px; border-left: 4px solid #C5A059; border-radius: 4px; margin: 25px 0;">
          <p style="margin: 0; color: #333; line-height: 1.8;">${reply}</p>
        </div>
        <p style="color: #555; line-height: 1.8;">If you have further questions, feel free to reply to this email.</p>
      `;
      const emailHtml = EmailTemplates.emailBase(content, brandName, appUrl, logoUrl);
      await sendSimpleEmail(contact.email, `Response from ${brandName} support`, emailHtml);

      res.json({ status: "success" });
    } catch (error) {
      res.status(500).json({ error: "Failed to send reply" });
    }
  });

  app.post("/api/newsletter/subscribe", async (req, res) => {
    try {
      const { email } = req.body;
      const existing = await (NewsletterSubscription as any).findOne({ email });
      if (existing) return res.status(200).json({ status: "success", message: "Already subscribed." });

      const sub = new (NewsletterSubscription as any)({ email });
      await sub.save();

      // Send welcome email
      const configDoc = await (Config as any).findOne({ key: "global" });
      const config = configDoc ? (configDoc.toObject() as any) : DEFAULT_SITE_CONFIG;
      const brandName = config?.header?.logoText || "Luxe Attire";
      const appUrl = getBaseUrl(req);
      const logoUrl = config?.header?.logoImage;

      const content = `
        <h2 style="color: #0F0F0F; font-size: 24px; font-weight: 400; margin-bottom: 20px;">Welcome to ${brandName}</h2>
        <p style="color: #555; line-height: 1.8;">Thank you for subscribing to our newsletter. You'll be the first to know about new collections, exclusive events, and limited-time offers.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}/shop" style="background-color: #0F0F0F; color: #ffffff !important; padding: 14px 35px; text-decoration: none; font-size: 12px; font-weight: bold; border-radius: 4px; display: inline-block;">
                DISCOVER THE ATELIER
            </a>
        </div>
      `;
      const emailHtml = EmailTemplates.emailBase(content, brandName, appUrl, logoUrl);
      await sendSimpleEmail(email, `Welcome to the ${brandName} newsletter`, emailHtml);

      res.json({ status: "success" });
    } catch (error) {
      res.status(500).json({ error: "Subscription failed" });
    }
  });

  app.get("/api/admin/newsletter", async (req, res) => {
    try {
      const subs = await (NewsletterSubscription as any).find().sort({ subscribedAt: -1 });
      res.json(subs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  /**
   * ADMIN ORDER MANAGEMENT: Status updates and Delivery notifications.
   */
  app.get("/api/admin/orders", async (req, res) => {
    try {
      const orders = await (Order as any).find().sort({ createdAt: -1 });
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Order archives unreachable." });
    }
  });

  app.put("/api/admin/orders/:id/status", async (req, res) => {
    try {
      const { status } = req.body;
      const order = await (Order as any).findByIdAndUpdate(req.params.id, { status }, { new: true });
      
      if (order) {
        const config = await (Config as any).findOne({ key: "global" });
        const brandName = (config as any)?.branding?.name || (config as any)?.header?.logoText || "Luxe Attire";
        const baseUrl = getBaseUrl(req);
        const trending = await (Product as any).find({ isFeatured: true }).limit(2);

        if (status === 'On the way' || status === 'Shipped' || status === 'On the Way') {
           const emailHtml = EmailTemplates.getShippedEmail(order, brandName, baseUrl, trending);
           await sendSimpleEmail(order.email, `Your order has shipped!`, emailHtml);
        } else if (status === 'Delivered') {
           const emailHtml = EmailTemplates.getDeliveredEmail(order, brandName, baseUrl, trending);
           await sendSimpleEmail(order.email, `Your order has been delivered`, emailHtml);
        } else {
           const emailHtml = EmailTemplates.getOrderEmail(order, brandName, baseUrl, trending);
           await sendSimpleEmail(order.email, `Order Status Update: ${status}`, emailHtml);
        }
      }
      res.json({ status: "success", order });
    } catch (error) {
      res.status(500).json({ error: "Status update failed." });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const revenueData = await (Order as any).aggregate([{ $group: { _id: null, total: { $sum: "$totalAmount" } } }]);
      const totalOrders = await (Order as any).countDocuments();
      const totalProducts = await (Product as any).countDocuments();
      const activeOrders = await (Order as any).countDocuments({ status: { $nin: ['Delivered', 'Cancelled'] } });
      const recentOrders = await (Order as any).find().sort({ createdAt: -1 }).limit(10);
      const lowStock = await (Product as any).find({ stock: { $lte: 10 } }).limit(20);

      res.json({
        revenue: revenueData[0]?.total || 0,
        orders: totalOrders,
        products: totalProducts,
        activeOrders,
        recentOrders,
        lowStock
      });
    } catch (error) {
      res.status(500).json({ error: "Stats retrieval failure." });
    }
  });

  app.get("/api/admin/customers-full", async (req, res) => {
    try {
      const users = await User.find().sort({ createdAt: -1 });
      const logs = await CustomerLog.find().sort({ timestamp: -1 }).limit(100);
      res.json({ users, logs });
    } catch (error) {
      res.status(500).json({ error: "Customer data failure." });
    }
  });

  /**
   * MARKETING ORCHESTRATION: Dispatching luxury editorals.
   */
  app.post("/api/marketing/promotional", async (req, res) => {
    try {
      const { email, displayName, offerCode } = req.body;
      await sendSimpleEmail(
        email, 
        "Special Offer | Luxe Attire", 
        `Hello ${displayName}. You are invited to use code <strong>${offerCode || 'LUXE20'}</strong> for 20% off your next order.`,
        "Luxe Attire"
      );
      res.json({ status: "success" });
    } catch (error) {
      res.status(500).json({ error: "Dispatch failure." });
    }
  });

  app.post("/api/marketing/send", async (req, res) => {
    try {
      const { email, subject, message, title } = req.body;
      await sendSimpleEmail(email, subject, message, title || "Luxe Attire");
      res.json({ status: "success" });
    } catch (error) {
      res.status(500).json({ error: "Marketing dispatch failed." });
    }
  });

  app.post("/api/admin/broadcast", async (req, res) => {
    try {
      const { subject, message, title } = req.body;
      const users = await (User as any).find({ email: { $exists: true } });
      for (const user of users) {
        await sendSimpleEmail(user.email, subject, message, title || "Luxe Attire");
      }
      res.json({ status: "success", count: users.length });
    } catch (error) {
      res.status(500).json({ error: "Broadcast failure." });
    }
  });

  app.post("/api/cart/abandoned", async (req, res) => {
    try {
      const { email, total, displayName } = req.body;
      const config = await (Config as any).findOne({ key: "global" });
      const brandName = (config as any)?.header?.logoText || "Luxe Attire";
      const baseUrl = getBaseUrl(req);
      const trending = await (Product as any).find({ isFeatured: true }).limit(2);

      const emailHtml = EmailTemplates.getAbandonedCartEmail(displayName || 'Customer', total, brandName, baseUrl, trending);
      await sendSimpleEmail(email, "You have items in your cart", emailHtml, brandName);
      res.json({ status: "success" });
    } catch (error) {
      res.status(500).json({ error: "Dispatch failure." });
    }
  });

  // =========================================================
  // --- SECTION 4: VITE SPA MIDDLEWARE INTEGRATION ---
  // =========================================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
    console.log("🛠️  [SYSTEM]: Vite Development Middleware Integrated.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
  }

  // =========================================================
  // --- SECTION 5: DEPLOYMENT & LISTEN ---
  // =========================================================

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`
    -------------------------------------------------------
    🚀 LUXE ATTIRE SYSTEM IS LIVE ON PORT ${PORT}
    🌐 URL: http://localhost:${PORT}
    👤 ADMIN IDENTIFIED: admin@luxeattire.com
    📧 SYSTEM: ALL MESSAGING CHANNELS ACTIVE
    -------------------------------------------------------
    `);
  });
}

// EXECUTE SOVEREIGN ENGINE
startSovereignEngine().catch((criticalError) => {
  console.error("❌ CRITICAL SYSTEM STARTUP ERROR DETECTED:", criticalError);
});

/**
 * END OF MASTER SERVER FILE
 * TOTAL LINES: 860+ (Expanded for absolute robustness)
 * ===============================================================================================
 */