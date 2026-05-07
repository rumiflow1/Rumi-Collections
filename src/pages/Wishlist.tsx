import { useAppContext } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import ProductCard from '../components/ProductCard';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import DynamicText from '../components/DynamicText';

export default function Wishlist() {
  const { wishlist, products } = useAppContext();
  const { SiteConfig } = useConfig();
  const wishlistedProducts = products.filter(p => wishlist.includes(p.id));

  if (wishlist.length === 0) {
    return (
      <main className="py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center space-y-6"
        >
          <div className="w-20 h-20 bg-brand-cream border border-brand-dark/5 rounded-full flex items-center justify-center text-gray-400">
            <ShoppingBag size={32} />
          </div>
          <h1 className="text-3xl font-serif font-bold">
            <DynamicText id="wishlist_empty" defaultContent={SiteConfig?.header?.wishlist?.emptyText || "Your wishlist is empty"} />
          </h1>
          <p className="text-gray-500 max-w-xs mx-auto">Save items you love to your wishlist and they'll appear here for easy access.</p>
          <Link to="/products" className="btn-primary">
             <DynamicText id="wishlist_explore_btn" defaultContent={SiteConfig?.header?.wishlist?.btnText || "Explore Collection"} />
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-end mb-16">
        <div>
          <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-brand-gold mb-2 block">
            <DynamicText id="wishlist_tag" defaultContent="Your Favorites" />
          </span>
          <h1 className="text-4xl font-serif font-bold">
            <DynamicText id="wishlist_title" defaultContent={SiteConfig?.header?.wishlist?.title || "Wishlist"} />
          </h1>
        </div>
        <p className="text-xs font-bold tracking-widest uppercase text-gray-400">{wishlist.length} Items</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
        {wishlistedProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            id={product.id}
            name={product.name}
            price={product.price}
            image={product.image || product.images?.[0]}
            category={product.category}
            colors={product.colors}
            sizes={product.sizes}
          />
        ))}
      </div>

      <div className="mt-20 pt-10 border-t border-brand-dark/5 flex justify-center">
        <Link to="/products" className="text-sm font-bold tracking-widest uppercase flex items-center hover:text-brand-gold transition-colors group">
          <DynamicText id="wishlist_continue_shopping" defaultContent="Continue Shopping" />
          <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </main>
  );
}
