
export const BRAND_THEMES = {
    signup: { primary: "#1A5FB4", accent: "#C5A059" }, 
    login: { primary: "#4A4A4A", accent: "#888888" },  
    order: { primary: "#1E8531", accent: "#2ECC71" },  
    cart: { primary: "#D35400", accent: "#E67E22" },   
    reset: { primary: "#8E44AD", accent: "#9B59B6" },  
};

export const renderLine = () => `<div style="border-top: 1px solid #eeeeee; margin: 25px 0;"></div>`;


const normalizeUrl = (base: string, path: string) => {
    if (!path) return "";
    const cleanPath = typeof path === 'string' ? path : "";
    if (cleanPath.startsWith('http') || cleanPath.startsWith('data:')) return cleanPath;
    if (!base || typeof base !== 'string') return cleanPath; 
    
    const baseClean = base.endsWith('/') ? base.slice(0, -1) : base;
    let pathClean = cleanPath;
    
    // If it's a relative path starting with uploads/ or /uploads/
    if (pathClean.startsWith('/uploads')) {
        // Keep as /uploads...
    } else if (pathClean.startsWith('uploads/')) {
        pathClean = `/${pathClean}`;
    } else if (!pathClean.startsWith('/')) {
        pathClean = `/uploads/${pathClean}`;
    }
    
    return `${baseClean}${pathClean}`;
};

export const renderButton = (text: string, path: string, color: string, baseUrl: string) => `
    <div style="text-align: center; margin: 30px 0;">
        <a href="${normalizeUrl(baseUrl, path)}" style="background-color: ${color}; color: #ffffff !important; padding: 14px 35px; text-decoration: none; font-size: 12px; font-weight: bold; border-radius: 4px; display: inline-block;">
            ${text}
        </a>
    </div>
`;

export const renderTrendingGrid = (trendingPieces: any[], baseUrl: string) => {
    if (!trendingPieces || trendingPieces.length === 0) return '';
    
    let html = `
    <div style="margin-top: 40px;">
        <p style="text-align: center; font-size: 11px; letter-spacing: 0.2em; color: #C5A059; text-transform: uppercase; margin-bottom: 20px;">Trending Products</p>
        <table width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>`;
    
    trendingPieces.slice(0, 2).forEach(p => {
        const imgUrl = normalizeUrl(baseUrl, p.image || p.img || "");
        html += `
            <td width="50%" align="center" style="padding: 0 10px;">
                <a href="${normalizeUrl(baseUrl, `/product/${p._id || p.id}`)}" style="text-decoration: none; color: #333;">
                    <img src="${imgUrl}" width="100%" style="display: block; margin-bottom: 10px; border: 1px solid #eee;">
                    <div style="font-size: 11px; font-weight: bold;">${p.name}</div>
                    <div style="font-size: 11px; color: #C5A059; margin-top: 4px;">PKR ${p.price}</div>
                </a>
            </td>`;
    });
    
    return html + `</tr></table></div>`;
};

export const renderOrderItems = (items: any[], baseUrl: string) => {
    if (!items || items.length === 0) return '';
    
    let html = `<div style="margin-top: 30px;">
        <p style="font-size: 14px; font-weight: bold; color: #0F0F0F; margin-bottom: 15px;">Order Details</p>`;
    
    items.forEach(item => {
        const imgUrl = normalizeUrl(baseUrl, item.image || "");
        html += `
        <table width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 20px; border-bottom: 1px solid #f9f9f9; padding-bottom: 15px;">
            <tr>
                <td width="80" valign="top">
                    <img src="${imgUrl}" width="70" style="border: 1px solid #eee; display: block;">
                </td>
                <td valign="top" style="padding-left: 15px;">
                    <div style="font-size: 14px; font-weight: bold; color: #0F0F0F;">${item.name}</div>
                    <div style="font-size: 12px; color: #777; margin-top: 4px;">
                        ${item.color ? `Color: ${item.color} | ` : ''}
                        ${item.size ? `Size: ${item.size} | ` : ''}
                        Qty: ${item.quantity || 1}
                    </div>
                </td>
                <td width="80" valign="top" align="right">
                    <div style="font-size: 14px; font-weight: bold; color: #0F0F0F;">PKR ${item.price}</div>
                </td>
            </tr>
        </table>`;
    });
    
    return html + `</div>`;
};

export const renderCustomerDetails = (order: any) => {
    const addr = order.shippingAddress || {};
    return `
    <div style="margin-top: 30px; background-color: #FDFCFB; padding: 25px; border: 1px solid #F3E5D8;">
        <p style="font-size: 12px; color: #C5A059; letter-spacing: 0.1em; text-transform: uppercase; margin: 0 0 15px 0;">Order & Shipping Details</p>
        <div style="margin-bottom: 20px;">
            <p style="margin: 2px 0; font-size: 13px; color: #555;"><b>Recipient:</b> ${order.fullName}</p>
            <p style="margin: 2px 0; font-size: 13px; color: #555;"><b>Email:</b> ${order.email}</p>
            <p style="margin: 2px 0; font-size: 13px; color: #555;"><b>Contact:</b> ${order.phone || 'N/A'}</p>
        </div>
        <div style="margin-bottom: 20px;">
            <p style="margin: 2px 0; font-size: 11px; color: #999; text-transform: uppercase; letter-spacing: 0.05em;">Shipping Address</p>
            <p style="margin: 2px 0; font-size: 13px; color: #555;">${addr.address || 'N/A'}</p>
            <p style="margin: 2px 0; font-size: 13px; color: #555;">${addr.city || ''}${addr.state ? `, ${addr.state}` : ''} ${addr.postalCode || ''}</p>
            <p style="margin: 2px 0; font-size: 13px; color: #555; font-weight: bold;">${addr.country || ''}</p>
        </div>
        <div>
            <p style="margin: 2px 0; font-size: 13px; color: #555;"><b>Payment Method:</b> ${order.paymentMethod || 'Secure Transaction'}</p>
        </div>
    </div>
    `;
};

export const emailBase = (content: string, brandName: string, baseUrl: string, logoUrl?: string) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: sans-serif; -webkit-font-smoothing: antialiased;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4; padding: 30px 0;">
        <tr>
            <td align="center">
                <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #dddddd; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    <tr>
                        <td align="center" style="padding: 40px 0; border-bottom: 1px solid #f5f5f5;">
                            <a href="${baseUrl}" style="text-decoration: none;">
                                ${logoUrl ? `<img src="${logoUrl}" alt="${brandName}" style="max-height: 50px; display: block; margin: 0 auto;">` : `<span style="font-size: 28px; color: #000; font-weight: bold; text-transform: uppercase;">${brandName}</span>`}
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 50px 60px;">
                            ${content}
                        </td>
                    </tr>
                    <tr>
                        <td align="center" style="padding: 40px; background-color: #fafafa; border-top: 1px solid #eeeeee;">
                            <div style="font-size: 11px; color: #999999; letter-spacing: 0.1em; margin-bottom: 15px;">
                                &copy; 2026 ${brandName.toUpperCase()}. All Rights Reserved.
                            </div>
                            <div style="font-size: 10px; color: #bbbbbb;">
                                <a href="${baseUrl}/privacy" style="color: #bbbbbb; text-decoration: underline;">Privacy Policy</a> | 
                                <a href="${baseUrl}/returns" style="color: #bbbbbb; text-decoration: underline;">Returns</a>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;


export const getContactConfirmationEmail = (name: string, brandName: string, baseUrl: string) => {
    const theme = BRAND_THEMES.signup;
    const content = `
        <h2 style="color: ${theme.primary}; font-size: 28px; font-weight: bold; margin-bottom: 25px;">Hello ${name}</h2>
        <p style="color: #555; line-height: 1.8;">Thank you for contacting ${brandName}. We have received your message and we will get back to you soon.</p>
        <p style="color: #555; line-height: 1.8;">Our team usually responds within 24 to 48 hours.</p>
        ${renderLine()}
        ${renderButton("Visit Shop", "/", theme.primary, baseUrl)}
    `;
    return emailBase(content, brandName, baseUrl);
};

export const getSignupEmail = (name: string, brandName: string, baseUrl: string, trending: any[]) => {
    const theme = BRAND_THEMES.signup;
    const content = `
        <h2 style="color: ${theme.primary}; font-size: 32px; font-weight: bold; margin-bottom: 30px; line-height: 1.2;">Welcome to ${brandName}, ${name}</h2>
        <p style="color: #555; line-height: 1.8; font-size: 15px;">Thank you for joining us. Your account is now active. You can now start shopping and tracking your orders.</p>
        ${renderLine()}
        ${renderButton("View Profile", "/profile", theme.primary, baseUrl)}
        ${renderLine()}
        ${renderTrendingGrid(trending, baseUrl)}
    `;
    return emailBase(content, brandName, baseUrl);
};

export const getLoginEmail = (name: string, brandName: string, baseUrl: string, trending: any[]) => {
    const theme = BRAND_THEMES.login;
    const content = `
        <h2 style="color: #0F0F0F; font-size: 28px; font-weight: bold; margin-bottom: 30px;">Login Detected</h2>
        <p style="color: #666; line-height: 1.8; font-size: 15px;">Hello ${name}, we noticed a new login to your account.</p>
        <p style="color: #888; font-size: 13px; margin-top: 20px;">If this was not you, please change your password immediately.</p>
        ${renderLine()}
        ${renderButton("View Profile", "/profile", "#0F0F0F", baseUrl)}
        ${renderLine()}
        ${renderTrendingGrid(trending, baseUrl)}
    `;
    return emailBase(content, brandName, baseUrl);
};

export const getOrderEmail = (order: any, brandName: string, baseUrl: string, trending: any[]) => {
    const theme = BRAND_THEMES.order;
    const content = `
        <h2 style="color: ${theme.primary}; font-size: 30px; font-weight: bold; margin-bottom: 25px;">Order Confirmed</h2>
        <p style="color: #555; line-height: 1.8;">Thank you for your order, ${order.fullName}. We have received your order and we are preparing it for shipment.</p>
        ${renderLine()}
        <div style="background-color: #f9f9f9; padding: 20px; border: 1px solid #eeeeee;">
            <p style="margin: 5px 0; font-size: 14px;"><b>Order ID:</b> #${order._id ? order._id.toString().slice(-8).toUpperCase() : 'PENDING'}</p>
            <p style="margin: 5px 0; font-size: 18px; color: #0F0F0F;"><b>Total: PKR ${order.totalAmount}</b></p>
        </div>
        ${renderOrderItems(order.items, baseUrl)}
        ${renderCustomerDetails(order)}
        ${renderLine()}
        ${renderButton("Track order", "/profile", theme.primary, baseUrl)}
        ${renderLine()}
        ${renderTrendingGrid(trending, baseUrl)}
    `;
    return emailBase(content, brandName, baseUrl);
};

export const getAbandonedCartEmail = (name: string, total: string, brandName: string, baseUrl: string, trending: any[]) => {
    const theme = BRAND_THEMES.cart;
    const content = `
        <h2 style="color: ${theme.primary}; font-size: 32px; font-weight: bold; margin-bottom: 35px;">Items left in your cart</h2>
        <p style="color: #555; line-height: 1.8;">Hello ${name}, you left some items in your cart. We have saved them for you, but they might sell out fast.</p>
        <div style="border: 2px dashed #D35400; padding: 30px; margin: 30px 0; text-align: center; background-color: #fffbf5;">
            <p style="margin: 0; font-size: 14px; font-weight: bold; color: #D35400;">GET 10% OFF WITH CODE</p>
            <h3 style="margin: 10px 0 0 0; font-size: 36px; color: #0F0F0F;">SAVE10</h3>
        </div>
        ${renderLine()}
        ${renderButton("Complete order", "/cart", theme.primary, baseUrl)}
        ${renderLine()}
        ${renderTrendingGrid(trending, baseUrl)}
    `;
    return emailBase(content, brandName, baseUrl);
};

export const getOTPEmail = (otp: string, brandName: string, baseUrl: string, trending: any[]) => {
    const theme = BRAND_THEMES.reset;
    const content = `
        <h2 style="color: ${theme.primary}; font-size: 28px; font-weight: bold; margin-bottom: 30px;">Forgot Password</h2>
        <p style="color: #555; line-height: 1.8;">You requested to reset your password. Use the code below to continue.</p>
        <div style="background-color: #f9f9f9; padding: 30px; font-size: 40px; letter-spacing: 0.5em; color: #000; margin: 30px 0; border: 1px solid #eeeeee; text-align: center; font-weight: bold;">
            ${otp}
        </div>
        <p style="font-size: 12px; color: #999; text-align: center;">This code will expire in 10 minutes.</p>
        ${renderLine()}
        ${renderTrendingGrid(trending, baseUrl)}
    `;
    return emailBase(content, brandName, baseUrl);
};

export const getWishlistEmail = (name: string, brandName: string, baseUrl: string, trending: any[]) => {
    const content = `
        <h2 style="color: #0F0F0F; font-size: 30px; font-weight: 400; margin-bottom: 30px;">Items in your wishlist</h2>
        <p style="color: #555; line-height: 1.8;">Hello <b>${name}</b>, the products you Liked are waiting. Don't miss out on your favorite styles.</p>
        ${renderLine()}
        ${renderButton("View Wishlist", "/wishlist", "#0F0F0F", baseUrl)}
        ${renderLine()}
        ${renderTrendingGrid(trending, baseUrl)}
    `;
    return emailBase(content, brandName, baseUrl);
};

export const getShippedEmail = (order: any, brandName: string, baseUrl: string, trending: any[]) => {
    const theme = BRAND_THEMES.signup;
    const content = `
        <h2 style="color: ${theme.primary}; font-size: 28px; font-weight: 400; margin-bottom: 25px;">On the Way, <b>${order.fullName}</b></h2>
        <p style="color: #555; line-height: 1.8;">Our team has finished preparing your order. Your items for order <b>#${order._id ? order._id.toString().slice(-8).toUpperCase() : 'PENDING'}</b> have officially left the store and are now on their way to your address.</p>
        ${renderLine()}
        <div style="text-align: center; font-size: 14px; color: #0F0F0F;"><b>STATUS:</b> <span style="color: ${theme.primary}; text-transform: uppercase;">Shipped / In Transit</span></div>
        ${renderOrderItems(order.items, baseUrl)}
        ${renderCustomerDetails(order)}
        ${renderLine()}
        ${renderButton("Track Your Order", "/profile", theme.primary, baseUrl)}
        ${renderLine()}
        ${renderTrendingGrid(trending, baseUrl)}
    `;
    return emailBase(content, brandName, baseUrl);
};

export const getDeliveredEmail = (order: any, brandName: string, baseUrl: string, trending: any[]) => {
    const theme = BRAND_THEMES.order;
    const content = `
        <h2 style="color: ${theme.primary}; font-size: 28px; font-weight: 400; margin-bottom: 25px;">Order Delivered</h2>
        <p style="color: #555; line-height: 1.8;">Hello <b>${order.fullName}</b>, your order <b>#${order._id ? order._id.toString().slice(-8).toUpperCase() : 'N/A'}</b> has been successfully delivered. We hope you love your new items.</p>
        ${renderLine()}
        ${renderOrderItems(order.items, baseUrl)}
        ${renderCustomerDetails(order)}
        <p style="font-size: 13px; font-style: italic; color: #777; text-align: center; margin-top: 25px;">Please share your feedback by leaving a review on our website.</p>
        ${renderButton("Leave a Review", "/profile", theme.primary, baseUrl)}
        ${renderLine()}
        ${renderTrendingGrid(trending, baseUrl)}
    `;
    return emailBase(content, brandName, baseUrl);
};
