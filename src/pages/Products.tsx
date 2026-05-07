import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Filter, ChevronDown, Loader2 } from 'lucide-react';
import { productApi, API_URL } from '../services/api';

export default function Products() {
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');
  const searchQuery = searchParams.get('search');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  const collectionBanners: Record<string, string> = {
    'men': 'https://images.unsplash.com/photo-1488161628813-04466f872be2?q=80&w=1964&auto=format&fit=crop',
    'women': 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop',
    'children': 'https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?q=80&w=2070&auto=format&fit=crop',
    'all': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop'
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const response = await productApi.getAll();
        const rawData = response.data.products || response.data;
        
        if (!Array.isArray(rawData)) {
          throw new Error('Invalid data format received from server');
        }

        let data = rawData.map((p: any) => ({
          id: p._id || p.id,
          name: p.title || p.name,
          price: p.price,
          originalPrice: p.originalPrice,
          image: p.images?.[0] || p.image,
          images: p.images || [],
          category: p.category,
          discount: p.discount,
          isNewArrival: p.isNewArrival,
          colors: p.colors || [],
          sizes: p.sizes || [],
          showOnHomePage: p.isFeatured || p.showOnHomePage
        }));
        
        if (categoryFilter) {
          const filter = categoryFilter.toLowerCase();
          data = data.filter((p: any) => {
            const cat = (p.category || '').toLowerCase();
            if (cat === 'all') return true;
            if (filter === 'men') return cat === 'men' || cat === 'both';
            if (filter === 'women') return cat === 'women' || cat === 'both';
            return cat === filter;
          });
        }
        
        if (searchQuery) {
          data = data.filter((p: any) => 
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        // Sorting
        if (sortBy === 'price-low') data.sort((a: any, b: any) => a.price - b.price);
        if (sortBy === 'price-high') data.sort((a: any, b: any) => b.price - a.price);
        
        setProducts(data);
      } catch (err: any) {
        console.error(`Failed to fetch products from backend:`, err.message || err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [categoryFilter, searchQuery, sortBy]);

  const bannerImage = categoryFilter ? collectionBanners[categoryFilter.toLowerCase()] : collectionBanners['all'];
  const collectionTitle = searchQuery ? `Search Results for "${searchQuery}"` : categoryFilter ? `${categoryFilter} Collection` : 'Shop All';

  return (
    <main className="pb-24">
      <div className="relative h-[60vh] w-full overflow-hidden mb-12">
        <img src={bannerImage} alt={collectionTitle} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white">
          <h1 className="text-5xl md:text-7xl font-serif font-bold italic tracking-wider uppercase">{collectionTitle}</h1>
          <div className="w-24 h-1 bg-brand-gold mt-6"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 space-y-6 md:space-y-0">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-2">{collectionTitle}</h2>
            <p className="text-gray-500 text-sm">Discover our full range of premium apparel and accessories.</p>
          </div>
          
          <div className="flex space-x-4 w-full md:w-auto">
            <button className="flex-grow md:flex-grow-0 flex items-center justify-center space-x-2 border border-brand-dark/10 px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-brand-dark hover:text-white transition-colors">
              <Filter size={16} /> <span>Filters</span>
            </button>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-grow md:flex-grow-0 flex items-center justify-center space-x-2 border border-brand-dark/10 px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-brand-dark hover:text-white transition-colors bg-white outline-none"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 md:gap-x-8 gap-y-12 md:gap-y-16">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              id={product.id}
              name={product.name}
              price={product.price}
              originalPrice={product.originalPrice}
              image={product.image}
              images={product.images}
              category={product.category}
              discount={product.discount}
              isNewArrival={product.isNewArrival}
              colors={product.colors}
              sizes={product.sizes}
            />
          ))}
        </div>
        
        {products.length === 0 && !loading && (
          <div className="py-32 text-center">
            <p className="text-gray-500 italic">No result found for this collection</p>
          </div>
        )}
      </div>
    </main>
  );
}
