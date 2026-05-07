export const ATELIER_CONFIG = {
    brandName: "LUXE ATTIRE",
    frontendUrl: process.env.APP_URL || "http://localhost:3000",
    themeColor: "#0F0F0F",
    accentColor: "#C5A059"
};

export const ATELIER_THEMES = {
    signup: { primary: "#0F0F0F", accent: "#C5A059" },
    login: { primary: "#0F0F0F", accent: "#666666" },
    order: { primary: "#1E8531", accent: "#C5A059" },
    cart: { primary: "#0F0F0F", accent: "#C5A059" },
    reset: { primary: "#0F0F0F", accent: "#C5A059" }
};

export const TRENDING_PIECES = [
    { id: "1", name: "Silk Evening Gown", price: "1,200", img: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=80&w=1000" },
    { id: "2", name: "Wool Tailored Blazer", price: "850", img: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?q=80&w=1000" }
];
