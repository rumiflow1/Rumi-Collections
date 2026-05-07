import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingBag, 
  Settings, 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  ChevronRight, 
  Search, 
  Filter,
  Eye,
  TrendingUp,
  AlertCircle,
  LogOut,
  Type,
  Palette,
  Link as LinkIcon,
  Maximize2,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  Activity,
  User,
  Loader2,
  Sparkles,
  RefreshCcw,
  Bot,
  Bell,
  Mail,
  Send
} from 'lucide-react';
import { adminApi, productApi, orderApi as orderApiService } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ContentControl from './ContentControl';
import AIConcierge from './AIConcierge';
import Notifications from './Notifications';
import AdminSettings from './AdminSettings';
import Footer from '../../components/Footer';
import { ArrowRight } from 'lucide-react';

type AdminTab = 'dashboard' | 'products' | 'customers' | 'orders' | 'content' | 'ai' | 'notifications' | 'inventory' | 'marketing' | 'settings' | 'inquiries';

export default function EAdmin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<{ logs: any[], users: any[] }>({ logs: [], users: [] });
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  
  // Edit States
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

 useEffect(() => {
    // 1. If the auth state is still loading, do nothing and wait.
    // (We use loading from the fetchData state if useAuth doesn't have one)
    if (!user && loading) return;

    // 2. If the user is definitely not logged in, or the email is wrong:
    if (!user || user.email !== 'admin@rumi.com') {
      // Small delay to ensure state is settled before redirecting
      const timer = setTimeout(() => {
        if (!user || user.email !== 'admin@rumi.com') {
          navigate('/');
        }
      }, 500); 
      return () => clearTimeout(timer);
    }

    // 3. If we are here, the email matches. Load the data.
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, orderRes, custRes, configRes, inquiryRes, subRes] = await Promise.all([
        productApi.getAll(),
        adminApi.getOrders(),
        adminApi.getCustomers(),
        adminApi.getConfig(),
        axios.get('/api/admin/contacts'),
        axios.get('/api/admin/newsletter')
      ]);
      const productsData = prodRes.data.products || prodRes.data;
      const productsWithId = Array.isArray(productsData) ? productsData.map((p: any) => ({ ...p, id: p._id || p.id })) : [];
      setProducts(productsWithId);
      setOrders(orderRes.data);
      setCustomers(custRes.data);
      setInquiries(inquiryRes.data);
      setSubscribers(subRes.data);
      setConfig(configRes.data);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await orderApiService.updateStatus(orderId, status);
      fetchData();
    } catch (error) {
      console.error("Failed to update status", error);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Robustness: ensure image is set if images array has content
      const finalImage = editingProduct.image || (editingProduct.images && editingProduct.images.length > 0 ? editingProduct.images[0] : "");
      
      const payload = {
        ...editingProduct,
        name: editingProduct.name || editingProduct.title || 'New Product',
        image: finalImage
      };

      if (!payload.name || !payload.image || !payload.category || payload.price === undefined) {
        alert("Please ensure Name, Category, Price and at least one image are provided.");
        return;
      }
      
      if (editingProduct._id || editingProduct.id) {
        await adminApi.updateProduct(editingProduct._id || editingProduct.id, payload);
      } else {
        await adminApi.addProduct(payload);
      }
      setIsProductModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save product", error);
      alert("Error saving product. Please check input values.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await adminApi.deleteProduct(id);
      fetchData();
    } catch (error) {
      console.error("Failed to delete product", error);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await adminApi.updateConfig(config);
      console.log("Configuration saved successfully!");
    } catch (error) {
      console.error("Failed to save configuration", error);
    }
  };

  const handleClearData = async (category: string) => {
    if (!window.confirm(`Are you sure you want to clear all ${category}? This action is irreversible.`)) return;
    try {
      await axios.delete(`/api/admin/clear/${category}`);
      fetchData();
    } catch (error) {
      console.error(`Failed to clear ${category}`, error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1 }}
          className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-dark text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-serif font-bold text-brand-gold tracking-tighter">STORE ADMIN</h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Store Control Center</p>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          <SidebarLink icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarLink icon={<Package size={20} />} label="Products" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
          <SidebarLink icon={<ShoppingBag size={20} />} label="Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
          <SidebarLink icon={<Users size={20} />} label="Customers" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
          <SidebarLink icon={<Sparkles size={20} />} label="Marketing" active={activeTab === 'marketing'} onClick={() => setActiveTab('marketing')} />
          <SidebarLink icon={<AlertCircle size={20} />} label="Inventory" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
          <SidebarLink icon={<Type size={20} />} label="Content Control" active={activeTab === 'content'} onClick={() => setActiveTab('content')} />
          <SidebarLink icon={<Bot size={20} />} label="AI Concierge" active={activeTab === 'ai'} onClick={() => setActiveTab('ai')} />
          <SidebarLink icon={<Mail size={20} />} label="Inquiries" active={activeTab === 'inquiries'} onClick={() => setActiveTab('inquiries')} />
          <SidebarLink icon={<Bell size={20} />} label="Notifications" active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')} />
          <SidebarLink icon={<Settings size={20} />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={() => logout().then(() => navigate('/'))}
            className="w-full flex items-center space-x-3 p-3 text-gray-400 hover:text-white hover:bg-white/5 transition-all rounded-lg"
          >
            <LogOut size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-serif font-bold text-brand-dark capitalize">{activeTab}</h2>
            <p className="text-sm text-gray-500">Manage your store</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-white p-2 rounded-full shadow-sm">
              <div className="w-10 h-10 bg-brand-gold rounded-full flex items-center justify-center text-white font-bold">A</div>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <DashboardOverview products={products} orders={orders} customers={customers} handleClearData={handleClearData} />}
            {activeTab === 'products' && <ProductManagement products={products} onEdit={(p) => { setEditingProduct(p); setIsProductModalOpen(true); }} onDelete={handleDeleteProduct} onAdd={() => { setEditingProduct({}); setIsProductModalOpen(true); }} />}
            {activeTab === 'orders' && <OrderManagement orders={orders} onUpdateStatus={handleUpdateOrderStatus} handleClearData={handleClearData} />}
            {activeTab === 'customers' && <CustomerTracking customers={customers} handleClearData={handleClearData} />}
            {activeTab === 'marketing' && <MarketingManagement customers={customers} subscribers={subscribers} />}
            {activeTab === 'inventory' && <InventoryManagement products={products} />}
            {activeTab === 'content' && <ContentControl />}
            {activeTab === 'ai' && <AIConcierge />}
            {activeTab === 'inquiries' && <InquiryManagement inquiries={inquiries} onReply={fetchData} />}
            {activeTab === 'notifications' && <Notifications />}
            {activeTab === 'settings' && <AdminSettings />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Product Modal */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsProductModalOpen(false)} />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl p-8"
          >
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h3 className="text-2xl font-serif font-bold">{editingProduct?.id ? 'Edit Product' : 'Add New Product'}</h3>
              <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} /></button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column - Images */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Main Image</label>
                    <FileUpload label="" value={editingProduct?.image || ''} onChange={(v) => setEditingProduct({...editingProduct, image: v})} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Gallery Images</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(editingProduct?.images || []).map((img: string, i: number) => (
                        <div key={i} className="aspect-square bg-gray-50 rounded-lg relative overflow-hidden group">
                          {img ? (
                            <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                               <ImageIcon className="text-gray-400" size={16} />
                            </div>
                          )}
                          <button 
                            type="button" 
                            onClick={() => {
                              const newImgs = [...editingProduct.images];
                              newImgs.splice(i, 1);
                              setEditingProduct({...editingProduct, images: newImgs});
                            }}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <div className="aspect-square bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center relative cursor-pointer hover:border-brand-gold transition-colors">
                        <Plus size={20} className="text-gray-300" />
                        <input 
                          type="file" 
                          accept="image/*"
                          multiple
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={async (e) => {
                            const files = Array.from(e.target.files || []);
                            const newImages = [...(editingProduct.images || [])];
                            for (const file of files) {
                              const formData = new FormData();
                              formData.append('image', file);
                              try {
                                const res = await axios.post('/api/admin/upload', formData, {
                                  headers: { 'Content-Type': 'multipart/form-data' }
                                });
                                newImages.push(res.data.imageUrl);
                              } catch (err) {
                                console.error("Gallery upload failed", err);
                              }
                            }
                            setEditingProduct({...editingProduct, images: newImages});
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Middle & Right Columns - Details */}
                <div className="md:col-span-2 space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <Input label="Product Name" value={editingProduct?.title || editingProduct?.name || ''} onChange={(v) => setEditingProduct({...editingProduct, title: v})} required />
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Category / Collection</label>
                      <select 
                        value={editingProduct?.category || ''} 
                        onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none text-sm bg-white"
                        required
                      >
                        <option value="">Select Collection</option>
                        {config?.featuredCollections?.items?.map((c: any) => (
                          <option key={c.id || c.name} value={c.name}>{c.name}</option>
                        ))}
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Children">Children</option>
                        <option value="Accessories">Accessories</option>
                      </select>
                    </div>
                    <Input label="Price ($)" type="number" value={editingProduct?.price || ''} onChange={(v) => setEditingProduct({...editingProduct, price: Number(v)})} required />
                    <Input label="Original Price ($)" type="number" value={editingProduct?.originalPrice || ''} onChange={(v) => setEditingProduct({...editingProduct, originalPrice: Number(v)})} />
                    <Input label="Override Discount (%)" type="number" value={editingProduct?.discount || ''} onChange={(v) => setEditingProduct({...editingProduct, discount: v ? Number(v) : undefined})} />
                    <Input label="Stock Quantity" type="number" value={editingProduct?.stock || ''} onChange={(v) => setEditingProduct({...editingProduct, stock: Number(v)})} required />
                    <Input label="Low Stock Alert" type="number" value={editingProduct?.lowStockAlert || ''} onChange={(v) => setEditingProduct({...editingProduct, lowStockAlert: Number(v)})} />
                    <Input label="Collection" value={editingProduct?.collectionName || ''} onChange={(v) => setEditingProduct({...editingProduct, collectionName: v})} />
                    <div className="flex items-center space-x-6 pt-6">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={editingProduct?.isNewArrival} onChange={(e) => setEditingProduct({...editingProduct, isNewArrival: e.target.checked})} className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">New Arrival</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={editingProduct?.showOnHomePage} onChange={(e) => setEditingProduct({...editingProduct, showOnHomePage: e.target.checked})} className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Home Page</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={editingProduct?.isFeatured} onChange={(e) => setEditingProduct({...editingProduct, isFeatured: e.target.checked})} className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Featured</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={editingProduct?.isTrending} onChange={(e) => setEditingProduct({...editingProduct, isTrending: e.target.checked})} className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Trending</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={editingProduct?.isSearchTrending} onChange={(e) => setEditingProduct({...editingProduct, isSearchTrending: e.target.checked})} className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Search Trending</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</label>
                      <textarea 
                        value={editingProduct?.description || ''} 
                        onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none min-h-[100px]"
                        placeholder="Detailed product description..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <Input label="Colors (Comma separated)" value={editingProduct?.colors?.join(', ') || ''} onChange={(v) => setEditingProduct({...editingProduct, colors: v.split(',').map(s => s.trim())})} />
                      <Input label="Sizes (Comma separated)" value={editingProduct?.sizes?.join(', ') || ''} onChange={(v) => setEditingProduct({...editingProduct, sizes: v.split(',').map(s => s.trim())})} />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Product Details (One per line)</label>
                        <textarea 
                          value={editingProduct?.details?.join('\n') || ''} 
                          onChange={(e) => setEditingProduct({...editingProduct, details: e.target.value.split('\n')})}
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none min-h-[80px]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Fabric & Care</label>
                        <textarea 
                          value={editingProduct?.fabricCare || ''} 
                          onChange={(e) => setEditingProduct({...editingProduct, fabricCare: e.target.value})}
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none min-h-[80px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <Input label="Fabric" value={editingProduct?.fabric || ''} onChange={(v) => setEditingProduct({...editingProduct, fabric: v})} />
                      <Input label="Quality" value={editingProduct?.quality || ''} onChange={(v) => setEditingProduct({...editingProduct, quality: v})} />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <Input label="Size Guide (URL or Table)" value={editingProduct?.sizeGuide || ''} onChange={(v) => setEditingProduct({...editingProduct, sizeGuide: v})} />
                      <Input label="Shipping Policy" value={editingProduct?.shippingPolicy || ''} onChange={(v) => setEditingProduct({...editingProduct, shippingPolicy: v})} />
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Customer Reviews (Fake)</label>
                        <button 
                          type="button" 
                          onClick={() => setEditingProduct({
                            ...editingProduct, 
                            reviews: [...(editingProduct.reviews || []), { user: '', profession: '', rating: 5, comment: '', date: new Date() }]
                          })}
                          className="text-[10px] font-bold text-brand-gold uppercase tracking-widest flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Review
                        </button>
                      </div>
                      <div className="space-y-4">
                        {(editingProduct?.reviews || []).map((review: any, i: number) => (
                          <div key={i} className="p-4 bg-gray-50 rounded-lg relative group space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <Input label="Customer Name" value={review.user} onChange={(v) => {
                                const newReviews = [...editingProduct.reviews];
                                newReviews[i].user = v;
                                setEditingProduct({...editingProduct, reviews: newReviews});
                              }} />
                              <Input label="Profession" value={review.profession} onChange={(v) => {
                                const newReviews = [...editingProduct.reviews];
                                newReviews[i].profession = v;
                                setEditingProduct({...editingProduct, reviews: newReviews});
                              }} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Rating (1-5)</label>
                                <input 
                                  type="number" 
                                  min="1" 
                                  max="5" 
                                  value={review.rating} 
                                  onChange={(e) => {
                                    const newReviews = [...editingProduct.reviews];
                                    newReviews[i].rating = Number(e.target.value);
                                    setEditingProduct({...editingProduct, reviews: newReviews});
                                  }}
                                  className="w-full p-2 border border-gray-200 rounded text-sm"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Comment</label>
                                <textarea 
                                  value={review.comment} 
                                  onChange={(e) => {
                                    const newReviews = [...editingProduct.reviews];
                                    newReviews[i].comment = e.target.value;
                                    setEditingProduct({...editingProduct, reviews: newReviews});
                                  }}
                                  className="w-full p-2 border border-gray-200 rounded text-sm min-h-[60px]"
                                />
                              </div>
                            </div>
                            <button 
                              type="button" 
                              onClick={() => {
                                const newReviews = [...editingProduct.reviews];
                                newReviews.splice(i, 1);
                                setEditingProduct({...editingProduct, reviews: newReviews});
                              }}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-8 border-t">
                <button type="button" onClick={() => setIsProductModalOpen(false)} className="px-8 py-3 text-sm font-bold uppercase tracking-widest text-gray-500 hover:text-brand-dark transition-colors">Cancel</button>
                <button type="submit" className="px-12 py-3 bg-brand-dark text-white text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all rounded-lg shadow-xl">Save Product</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-all ${active ? 'bg-brand-gold text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
    >
      {icon}
      <span className="text-sm font-bold uppercase tracking-widest">{label}</span>
    </button>
  );
}

function Input({ label, value, onChange, type = 'text', required = false }: { label: string, value: any, onChange: (v: string) => void, type?: string, required?: boolean }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        required={required}
        className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
      />
    </div>
  );
}

function FileUpload({ label, value, onChange }: { label: string, value: string, onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('/api/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onChange(res.data.imageUrl);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{label}</label>
      <div className="flex items-center space-x-4">
        <div className="relative w-20 h-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden group">
          {value ? (
            <img src={value} className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="text-gray-300" size={24} />
          )}
          <input 
            type="file" 
            accept="image/*" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={handleUpload}
            disabled={uploading}
          />
          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
              <Loader2 className="animate-spin text-brand-gold" size={20} />
            </div>
          )}
        </div>
        <div className="flex-1">
          <input 
            type="text" 
            value={value} 
            readOnly 
            placeholder="No file selected"
            className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-500 outline-none"
          />
          <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest">Upload from computer only</p>
        </div>
      </div>
    </div>
  );
}

function DashboardOverview({ products, orders, customers, handleClearData }: any) {
  const totalRevenue = orders.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
  const lowStock = products.filter((p: any) => p.stock <= (p.lowStockAlert || 5));
  const activeUsers = new Set(customers.logs?.map((l: any) => l.email)).size;

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <button 
          onClick={() => handleClearData('dashboard')}
          className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 size={12} />
          <span>Clear Stats</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={<TrendingUp className="text-green-500" />} trend="+12.5%" />
        <StatCard title="Total Orders" value={orders.length} icon={<ShoppingBag className="text-blue-500" />} trend="+8.2%" />
        <StatCard title="Total Products" value={products.length} icon={<Package className="text-brand-gold" />} />
        <StatCard title="Active Customers" value={activeUsers} icon={<Users className="text-purple-500" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-serif font-bold mb-6 flex items-center">
            <AlertCircle className="mr-2 text-red-500" size={20} />
            Low Stock Alerts
          </h3>
          <div className="space-y-4">
            {lowStock.length > 0 ? lowStock.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex items-center space-x-3">
                  <img 
                    src={p.image || (p.images && p.images.length > 0 ? p.images[0] : "https://picsum.photos/seed/luxury/100/100")} 
                    className="w-10 h-10 object-cover rounded shadow-sm" 
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <p className="text-sm font-bold text-brand-dark">{p.title || p.name}</p>
                    <p className="text-xs text-red-500 font-bold uppercase tracking-widest">{p.stock} remaining</p>
                  </div>
                </div>
                <button className="text-[10px] font-bold uppercase tracking-widest text-brand-gold hover:underline">Restock</button>
              </div>
            )) : (
              <div className="py-12 text-center text-gray-400">
                <CheckCircle2 size={48} className="mx-auto mb-4 opacity-20 text-green-500" />
                <p className="text-sm font-bold uppercase tracking-widest">All stock levels healthy</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-serif font-bold mb-6 flex items-center">
            <Clock className="mr-2 text-brand-gold" size={20} />
            Real-Time Activity
          </h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {customers.logs.slice(0, 10).map((log: any, i: number) => (
              <div key={i} className="flex items-center space-x-3 p-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors rounded-lg">
                <div className={`w-2 h-2 rounded-full ${
                  log.action.includes('order') ? 'bg-green-500' :
                  log.action.includes('cart') ? 'bg-blue-500' :
                  'bg-brand-gold'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-brand-dark">
                    <span className="font-bold">{log.email || 'Anonymous'}</span> 
                    <span className="ml-1 opacity-70">{log.action.replace(/_/g, ' ')}</span>
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
        {trend && <span className="text-xs font-bold text-green-500">{trend}</span>}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{title}</p>
      <p className="text-2xl font-serif font-bold text-brand-dark">{value}</p>
    </div>
  );
}

function ProductManagement({ products, onEdit, onDelete, onAdd }: any) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Search products..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border-0 rounded-lg text-sm focus:ring-2 focus:ring-brand-gold outline-none" />
        </div>
        <button onClick={onAdd} className="flex items-center space-x-2 bg-brand-dark text-white px-6 py-2 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all">
          <Plus size={18} />
          <span>Add Product</span>
        </button>
      </div>
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            <th className="px-6 py-4">Product</th>
            <th className="px-6 py-4">Category</th>
            <th className="px-6 py-4">Price</th>
            <th className="px-6 py-4">Stock</th>
            <th className="px-6 py-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {products.map((p: any) => (
            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <img 
                    src={p.images?.[0] || p.image || "https://picsum.photos/seed/luxury/100/100"} 
                    className="w-12 h-12 object-cover rounded-lg" 
                    referrerPolicy="no-referrer"
                  />
                  <span className="text-sm font-bold text-brand-dark">{p.title || p.name}</span>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">{p.category}</td>
              <td className="px-6 py-4 text-sm font-bold text-brand-gold">${p.price}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${p.stock <= 5 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                  {p.stock} in stock
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <button onClick={() => onEdit(p)} className="p-2 text-gray-400 hover:text-brand-gold transition-colors"><Edit2 size={18} /></button>
                  <button onClick={() => onDelete(p._id || p.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OrderManagement({ orders, onUpdateStatus, handleClearData }: any) {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const statusColors: any = {
    'Pending': 'bg-yellow-500/10 text-yellow-500',
    'Packed': 'bg-blue-500/10 text-blue-500',
    'On the way': 'bg-purple-500/10 text-purple-500',
    'Shipped': 'bg-indigo-500/10 text-indigo-500',
    'Delivered': 'bg-green-500/10 text-green-500',
    'Cancelled': 'bg-red-500/10 text-red-500'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={() => handleClearData('orders')}
          className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 size={12} />
          <span>Clear All Orders</span>
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              <th className="px-6 py-4">Customer / ID</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o: any) => (
              <tr key={o._id || o.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-brand-cream rounded-full flex items-center justify-center text-brand-gold font-bold">
                      {o.displayName?.[0] || o.fullName?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-brand-dark">{o.displayName || o.fullName || 'Anonymous'}</div>
                      <div className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">#{(o._id || o.id).slice(-8).toUpperCase()}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                    {o.city || (o.shippingAddress?.city)}
                    <br/>
                    <span className="opacity-60">{o.country || (o.shippingAddress?.country) || 'Global'}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="text-sm font-serif font-bold text-brand-gold">${(o.totalAmount || 0).toLocaleString()}</div>
                   <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{o.items?.length || 0} ITEMS</div>
                </td>
                <td className="px-6 py-4">
                  <select 
                    value={o.status} 
                    onChange={(e) => onUpdateStatus(o._id || o.id, e.target.value)}
                    className={`border-none text-[10px] font-black uppercase tracking-widest rounded-full px-4 py-2 outline-none focus:ring-0 cursor-pointer ${statusColors[o.status] || 'bg-gray-100 text-gray-500'}`}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Packed">Packed</option>
                    <option value="On the way">On the way</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-[10px] text-gray-400 uppercase font-bold">
                   {new Date(o.createdAt).toLocaleDateString()}
                   <br/>
                   {new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </td>
                <td className="px-6 py-4 text-right">
                   <button 
                    onClick={() => setSelectedOrder(o)}
                    className="p-2 text-gray-400 hover:text-brand-gold group-hover:bg-brand-gold/5 rounded-full transition-all"
                   >
                     <Eye size={18} />
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                   <p className="text-[10px] font-black text-brand-gold uppercase tracking-[0.2em] mb-1">Acquisition Dossier</p>
                   <h3 className="text-2xl font-serif font-black flex items-center gap-3">
                     ORDER #{(selectedOrder._id || selectedOrder.id).slice(-8).toUpperCase()}
                     <span className={`text-[10px] px-4 py-1 rounded-full ${statusColors[selectedOrder.status]}`}>
                       {selectedOrder.status}
                     </span>
                   </h3>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-3 hover:bg-white rounded-full shadow-sm transition-all text-gray-400 hover:text-black">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8 lg:p-12 space-y-12">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Customer Info */}
                    <div className="space-y-8">
                       <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-brand-dark flex items-center gap-2">
                             <User size={14}/> Patron Identity
                          </h4>
                          <div className="bg-gray-50 p-6 rounded-3xl space-y-4">
                             <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Legal Name</p>
                                <p className="text-sm font-bold">{selectedOrder.displayName || selectedOrder.fullName}</p>
                             </div>
                             <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Electronic Mail</p>
                                <p className="text-sm font-bold">{selectedOrder.email}</p>
                             </div>
                             <div>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Contact Protocol</p>
                                <p className="text-sm font-bold">{selectedOrder.phone || 'N/A'}</p>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-widest text-brand-dark flex items-center gap-2">
                             <Truck size={14}/> Delivery Logistics
                          </h4>
                          <div className="bg-gray-50 p-6 rounded-3xl space-y-2">
                             <p className="text-sm leading-relaxed font-medium text-gray-600">
                                {selectedOrder.shippingAddress?.street || selectedOrder.address}<br/>
                                {selectedOrder.shippingAddress?.city || selectedOrder.city}, {selectedOrder.shippingAddress?.zip || selectedOrder.zipCode}<br/>
                                {selectedOrder.shippingAddress?.country || selectedOrder.country || 'Global'}
                             </p>
                          </div>
                       </div>
                    </div>

                    {/* Order Items */}
                    <div className="lg:col-span-2 space-y-6">
                       <h4 className="text-xs font-black uppercase tracking-widest text-brand-dark flex items-center gap-2">
                          <ShoppingBag size={14}/> Curated Selections
                       </h4>
                       <div className="space-y-4">
                          {(selectedOrder.items || []).map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-6 p-4 border border-gray-100 rounded-3xl hover:bg-gray-50 transition-colors">
                               <div className="w-24 h-32 bg-gray-100 rounded-2xl overflow-hidden shadow-sm">
                                  <img src={item.image} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                               </div>
                               <div className="flex-grow">
                                  <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest mb-1">{item.category || 'Luxury Item'}</p>
                                  <h5 className="font-serif font-black text-lg mb-2">{item.name || item.title}</h5>
                                  <div className="flex items-center gap-4">
                                     <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-100 text-[10px] font-bold">
                                        <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}} />
                                        {item.color}
                                     </div>
                                     <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-100 text-[10px] font-bold">
                                        SIZE: {item.size}
                                     </div>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-sm font-serif font-black">${item.price}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase">Qty: {item.quantity || 1}</p>
                               </div>
                            </div>
                          ))}
                       </div>

                       <div className="bg-brand-dark text-white p-8 rounded-[2rem] mt-8 flex justify-between items-center shadow-xl">
                          <div>
                             <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest mb-1">Investment Total</p>
                             <p className="text-3xl font-serif font-bold">PKR {(selectedOrder.totalAmount || 0).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-brand-gold uppercase tracking-widest mb-1">Acquisition Channel</p>
                             <p className="text-xs font-bold uppercase tracking-widest">Digital Atelier Protocol</p>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                 <div className="flex gap-4">
                    <button 
                      onClick={() => {
                        window.print();
                      }}
                      className="px-6 py-3 border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
                    >
                      Print Manifest
                    </button>
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="px-8 py-3 bg-brand-dark text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-gold transition-all"
                    >
                      Close Dossier
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomerTracking({ customers, handleClearData }: any) {
  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'directory'>('logs');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center border-b border-gray-200">
        <div className="flex space-x-4">
          <button onClick={() => setActiveSubTab('logs')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all ${activeSubTab === 'logs' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Live Behavior Log</button>
          <button onClick={() => setActiveSubTab('directory')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all ${activeSubTab === 'directory' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Customer Directory</button>
        </div>
        <button 
          onClick={() => handleClearData('customers')}
          className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors pb-4"
        >
          <Trash2 size={12} />
          <span>Clear All Customers</span>
        </button>
      </div>

      {activeSubTab === 'logs' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-serif font-bold">Real-Time Activity</h3>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Live Tracking</span>
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
            {customers.logs.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Activity className="mx-auto mb-4 opacity-20" size={48} />
                <p className="text-sm font-bold uppercase tracking-widest">No activity recorded yet</p>
              </div>
            ) : (
              customers.logs.map((log: any, i: number) => (
                <div key={i} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                      log.action === 'login' ? 'bg-blue-500' : 
                      log.action === 'add_to_cart' ? 'bg-green-500' : 
                      log.action === 'left_cart' ? 'bg-red-500' : 
                      log.action === 'order_placed' ? 'bg-brand-gold' : 'bg-gray-400'
                    }`}>
                      {log.action === 'login' ? <Users size={18} /> : 
                       log.action === 'order_placed' ? <Package size={18} /> :
                       <ShoppingBag size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-dark">{log.email}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        <span className="font-bold uppercase tracking-widest text-[9px] mr-2">{log.action.replace(/_/g, ' ')}</span>
                        {log.details && <span className="opacity-70">- {log.details}</span>}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 uppercase font-bold">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Total Orders</th>
                <th className="px-6 py-4">Total Spent</th>
                <th className="px-6 py-4">Last Active</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {customers.users.map((customer: any) => (
                <tr key={customer._id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-brand-cream flex items-center justify-center text-brand-gold font-bold text-xs">
                        {customer.email?.[0]?.toUpperCase() || 'P'}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-dark">{customer.email}</p>
                        <p className="text-[10px] text-gray-400">ID: {customer._id.slice(-6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-brand-dark">{customer.totalOrders || 0}</td>
                  <td className="px-6 py-4 text-sm font-serif font-bold text-brand-gold">${(customer.totalSpent || 0).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-brand-dark font-medium">
                      {new Date(customer.lastActive || customer.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                      {new Date(customer.lastActive || customer.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={async () => {
                        if (window.confirm(`Permanently exclude ${customer.email} from the luxury database?`)) {
                          try {
                            await axios.delete(`/api/admin/users/${customer.uid}`);
                            alert('Patron excluded successfully.');
                            window.location.reload(); // Simple refresh to show updated list
                          } catch (err) {
                            console.error('Exclusion failure:', err);
                          }
                        }
                      }}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InventoryManagement({ products }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((p: any) => (
        <div key={p._id || p.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center space-x-4 mb-6">
            <img 
              src={p.images?.[0] || p.image || "https://picsum.photos/seed/luxury/200/200"} 
              className="w-16 h-16 object-cover rounded-xl" 
              referrerPolicy="no-referrer"
            />
            <div>
              <h4 className="font-serif font-bold text-brand-dark">{p.title || p.name}</h4>
              <p className="text-xs text-gray-400 uppercase tracking-widest">{p.category}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Stock Level</span>
              <span className={`text-sm font-bold ${p.stock <= 5 ? 'text-red-500' : 'text-green-500'}`}>{p.stock} units</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (p.stock / 50) * 100)}%` }}
                className={`h-full ${p.stock <= 5 ? 'bg-red-500' : 'bg-brand-gold'}`}
              />
            </div>
            {p.stock <= 5 && (
              <div className="flex items-center space-x-2 text-red-500 bg-red-50 p-2 rounded-lg">
                <AlertCircle size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Out of Stock Warning</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MarketingManagement({ customers, subscribers }: any) {
  const [isSending, setIsSending] = useState(false);
  const [promoCode, setPromoCode] = useState('LUXE20');
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [newDiscount, setNewDiscount] = useState({ name: '', discount: 20, minOrderAmount: 0, startDate: '', endDate: '' });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const res = await axios.get('/api/admin/discounts');
      setDiscounts(res.data);
    } catch (e) {
      console.error("Failed to fetch discounts", e);
    }
  };

  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/discounts', newDiscount);
      setNewDiscount({ name: '', discount: 20, minOrderAmount: 0, startDate: '', endDate: '' });
      fetchDiscounts();
      alert("Discount code added successfully!");
    } catch (e) {
      console.error("Failed to create discount", e);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!window.confirm("Delete this discount code?")) return;
    try {
      await axios.delete(`/api/admin/discounts/${id}`);
      fetchDiscounts();
    } catch (e) {
      console.error("Failed to delete discount", e);
    }
  };

  const sendPromotionalBlast = async () => {
    setIsSending(true);
    try {
      const allRecipients = [
        ...customers.users.map((c: any) => ({ email: c.email, name: c.displayName })),
        ...subscribers.map((s: any) => ({ email: s.email, name: 'Patron' }))
      ];
      
      for (const recipient of allRecipients) {
        await axios.post('/api/marketing/promotional', { 
          email: recipient.email, 
          displayName: recipient.name,
          offerCode: promoCode 
        });
      }
      alert("Promotional blast dispatched successfully to all customers and subscribers!");
    } catch (error) {
      console.error("Failed to dispatch promotional blast.", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Active Discount Codes List */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center justify-between mb-4">
             <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-50 text-indigo-500 rounded-xl">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold">Active Discounts</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">Manage your promo codes</p>
                </div>
             </div>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {discounts.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-10">No active discount codes</p>
            ) : discounts.map((d) => (
              <div key={d._id} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between group">
                <div>
                  <p className="text-sm font-bold text-brand-dark uppercase tracking-widest">{d.name}</p>
                  <p className="text-[10px] text-brand-gold font-bold">
                    {d.discount}% OFF • Min Order: {d.minOrderAmount || 0} PKR • Exp: {new Date(d.endDate).toLocaleDateString()}
                  </p>
                </div>
                <button onClick={() => handleDeleteDiscount(d._id)} className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Discount */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-xl font-serif font-bold">Create Discount</h3>
          <form onSubmit={handleCreateDiscount} className="space-y-4">
            <Input label="Code Name" value={newDiscount.name} onChange={(v) => setNewDiscount({...newDiscount, name: v.toUpperCase()})} required />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Discount %" type="number" value={newDiscount.discount} onChange={(v) => setNewDiscount({...newDiscount, discount: Number(v)})} required />
              <Input label="Min Order Amount (PKR)" type="number" value={newDiscount.minOrderAmount} onChange={(v) => setNewDiscount({...newDiscount, minOrderAmount: Number(v)})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date" type="date" value={newDiscount.startDate} onChange={(v) => setNewDiscount({...newDiscount, startDate: v})} required />
              <Input label="End Date" type="date" value={newDiscount.endDate} onChange={(v) => setNewDiscount({...newDiscount, endDate: v})} required />
            </div>
            <button type="submit" className="w-full py-3 bg-brand-gold text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-dark transition-all rounded-lg shadow-md">
              Add Discount Code
            </button>
          </form>
        </div>

        {/* Newsletter Subscribers */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
              <Mail size={24} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold">Newsletter Patrons</h3>
              <p className="text-xs text-gray-400 uppercase tracking-widest">{subscribers.length} Global Subscriptions</p>
            </div>
          </div>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {subscribers.map((s, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                <span className="text-xs font-medium text-brand-dark">{s.email}</span>
                <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">{new Date(s.subscribedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-brand-gold/10 text-brand-gold rounded-xl">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold">Promotional Campaigns</h3>
              <p className="text-xs text-gray-400 uppercase tracking-widest">Dispatch luxury offers to your inner circle</p>
            </div>
          </div>
          <div className="space-y-4">
            <Input label="Offer Code" value={promoCode} onChange={setPromoCode} />
            <button 
              onClick={sendPromotionalBlast}
              disabled={isSending}
              className="w-full py-4 bg-brand-dark text-white text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all rounded-lg flex items-center justify-center space-x-2 shadow-lg"
            >
              {isSending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span>Dispatch Global Blast</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InquiryManagement({ inquiries = [], onReply }: any) {
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Safely get inquiries length
  const inquiriesArray = Array.isArray(inquiries) ? inquiries : [];

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      await adminApi.replyToInquiry({
        id: replyingTo._id || replyingTo.id,
        reply: replyMessage
      });
      setReplyingTo(null);
      setReplyMessage('');
      onReply();
      alert('Reply sent successfully!');
    } catch (err) {
      console.error('Failed to send reply', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="text-xl font-serif font-bold">Patron Inquiries</h3>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">{inquiriesArray.length} Messages</span>
        </div>
        <div className="divide-y divide-gray-100">
          {inquiriesArray.length === 0 ? (
            <div className="p-20 text-center text-gray-400 italic">No inquiries found.</div>
          ) : inquiriesArray.map((mq: any) => (
            <div key={mq._id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center font-bold">
                    {mq.firstName?.[0] || 'P'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-brand-dark">{mq.firstName || 'Patron'} {mq.lastName || ''}</h4>
                    <p className="text-[10px] text-gray-400 font-mono">{mq.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                    mq.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-brand-gold/10 text-brand-gold'
                  }`}>
                    {mq.status === 'replied' ? 'Answered' : 'New Inquiry'}
                  </span>
                  <span className="text-[8px] text-gray-400 font-bold uppercase">{new Date(mq.createdAt).toLocaleString()}</span>
                </div>
              </div>
              <div className="pl-14 space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-brand-gold/20 pl-4">"{mq.message}"</p>
                
                {mq.status === 'replied' ? (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">Your Response:</p>
                    <p className="text-xs text-gray-600">{mq.reply}</p>
                    <p className="text-[8px] text-gray-400 flex items-center">
                       <Clock size={8} className="mr-1" /> Replied on {new Date(mq.repliedAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <button 
                    onClick={() => setReplyingTo(mq)}
                    className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest text-brand-gold hover:text-brand-dark transition-colors"
                  >
                    <Mail size={12} />
                    <span>Compose Reply</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {replyingTo && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setReplyingTo(null)} />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-8"
            >
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                  <h3 className="text-xl font-serif font-bold">Reply to Dispatch</h3>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">Recipient: {replyingTo.email}</p>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100 italic text-sm text-gray-500">
                "{replyingTo.message}"
              </div>

              <form onSubmit={handleReply} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Response Message</label>
                  <textarea 
                    rows={6}
                    required
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Compose an elegant response..."
                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold outline-none resize-none text-sm"
                  ></textarea>
                </div>
                <button 
                  type="submit" 
                  disabled={sending}
                  className="w-full py-4 bg-brand-dark text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-brand-gold transition-all shadow-xl disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {sending ? <Loader2 className="animate-spin" size={18} /> : <Send size={16} />}
                  <span>Dispatch Response</span>
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RuleOfSeven({ config, setConfig, onSave }: any) {
  const [selectedSection, setSelectedSection] = useState<string>('elements');
  const [selectedElement, setSelectedElement] = useState<string>('');
  
  const elements = [
    { key: 'announcement_text_0', label: 'Announcement Bar Text 1' },
    { key: 'announcement_text_1', label: 'Announcement Bar Text 2' },
    { key: 'announcement_text_2', label: 'Announcement Bar Text 3' },
    { key: 'announcement_text_3', label: 'Announcement Bar Text 4' },
    { key: 'search_placeholder', label: 'Search Placeholder' },
    { key: 'search_btn', label: 'Search Button Text' },
    { key: 'search_trending_title', label: 'Search Trending Title' },
    { key: 'search_results_label', label: 'Search Results Label' },
    { key: 'search_trending_label', label: 'Search Trending Section Label' },
    { key: 'search_trending_products_label', label: 'Search Trending Products Label' },
    { key: 'account_login_label', label: 'Account Login Label' },
    { key: 'account_signup_label', label: 'Account Signup Label' },
    { key: 'account_email_label', label: 'Account Email Label' },
    { key: 'account_password_label', label: 'Account Password Label' },
    { key: 'wishlist_title', label: 'Wishlist Title' },
    { key: 'wishlist_empty', label: 'Wishlist Empty Text' },
    { key: 'cart_title', label: 'Cart Title' },
    { key: 'cart_empty', label: 'Cart Empty Text' },
    { key: 'cart_checkout_btn', label: 'Cart Checkout Button' },
    { key: 'hero_title_1', label: 'Hero Slide 1 Title' },
    { key: 'hero_subtitle_1', label: 'Hero Slide 1 Subtitle' },
    { key: 'hero_btn_1', label: 'Hero Slide 1 Button' },
    { key: 'hero_title_2', label: 'Hero Slide 2 Title' },
    { key: 'hero_subtitle_2', label: 'Hero Slide 2 Subtitle' },
    { key: 'hero_btn_2', label: 'Hero Slide 2 Button' },
    { key: 'new_arrivals_tag', label: 'New Arrivals Tagline' },
    { key: 'new_arrivals_title', label: 'New Arrivals Title' },
    { key: 'featured_arrivals_tag', label: 'Featured Arrivals Tagline' },
    { key: 'featured_arrivals_title', label: 'Featured Arrivals Title' },
    { key: 'collections_title', label: 'Collections Section Title' },
    { key: 'collections_tag', label: 'Collections Section Tagline' },
    { key: 'reviews_title', label: 'Reviews Section Title' },
    { key: 'reviews_tag', label: 'Reviews Section Tagline' },
    { key: 'trust_badges_title', label: 'Trust Badges Title' },
    { key: 'trust_badges_tag', label: 'Trust Badges Tagline' },
    { key: 'footer_desc', label: 'Footer Description' },
    { key: 'footer_copyright', label: 'Footer Copyright' },
    { key: 'product_quick_add', label: 'Product Card Quick Add' },
    { key: 'product_confirm_add', label: 'Product Card Confirm Add' },
    { key: 'product_back_to_color', label: 'Product Card Back to Color' },
  ];

  const updateElement = (field: string, value: any) => {
    const newElements = { ...(config.elements || {}) };
    if (!newElements[selectedElement]) {
      newElements[selectedElement] = { content: '', color: '', fontFamily: '', fontSize: '', link: '', background: '', isVisible: true };
    }
    newElements[selectedElement][field] = value;
    setConfig({ ...config, elements: newElements });
  };

  const updateConfig = (section: string, field: string, value: any) => {
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value
      }
    });
  };

  const currentElement = config?.elements?.[selectedElement] || { content: '', color: '', fontFamily: '', fontSize: '', link: '', background: '', isVisible: true };

  return (
    <div className="space-y-8">
      <div className="flex space-x-4 border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <button onClick={() => setSelectedSection('elements')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedSection === 'elements' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Text Elements</button>
        <button onClick={() => setSelectedSection('announcement')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedSection === 'announcement' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Announcement Bar</button>
        <button onClick={() => setSelectedSection('header')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedSection === 'header' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Header</button>
        <button onClick={() => setSelectedSection('search')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedSection === 'search' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Search</button>
        <button onClick={() => setSelectedSection('account')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedSection === 'account' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Account</button>
        <button onClick={() => setSelectedSection('wishlist')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedSection === 'wishlist' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Wishlist</button>
        <button onClick={() => setSelectedSection('cart')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedSection === 'cart' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Cart</button>
        <button onClick={() => setSelectedSection('collectionLinks')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedSection === 'collectionLinks' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Collection Links</button>
        <button onClick={() => setSelectedSection('logo')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedSection === 'logo' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Logo</button>
        <button onClick={() => setSelectedSection('hero')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedSection === 'hero' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Hero Banner</button>
        <button onClick={() => setSelectedSection('newArrivals')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedSection === 'newArrivals' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>New Arrivals</button>
        <button onClick={() => setSelectedSection('featuredCollections')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedSection === 'featuredCollections' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Collections</button>
        <button onClick={() => setSelectedSection('customerReviews')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedSection === 'customerReviews' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Home Reviews</button>
        <button onClick={() => setSelectedSection('trustBadges')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedSection === 'trustBadges' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Trust Badges</button>
        <button onClick={() => setSelectedSection('footer')} className={`pb-4 px-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${selectedSection === 'footer' ? 'border-b-2 border-brand-gold text-brand-gold' : 'text-gray-400'}`}>Footer</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {selectedSection === 'elements' && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-serif font-bold">Elements List</h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {elements.map((el) => (
                  <button 
                    key={el.key}
                    onClick={() => setSelectedElement(el.key)}
                    className={`w-full text-left p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${selectedElement === el.key ? 'bg-brand-gold/5 border-r-4 border-brand-gold' : ''}`}
                  >
                    <span className="text-sm font-bold text-brand-dark">{el.label}</span>
                    <ChevronRight size={16} className="text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              {!selectedElement ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                  <Type size={48} />
                  <p className="text-sm font-bold uppercase tracking-widest">Select an element to edit its Rule of Seven</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-serif font-bold">Editing: {elements.find(e => e.key === selectedElement)?.label}</h3>
                    <button onClick={onSave} className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg">
                      <Save size={18} />
                      <span>Save Changes</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 flex items-center">
                          <Type size={14} className="mr-2" /> Content
                        </label>
                        <textarea 
                          value={currentElement.content} 
                          onChange={(e) => updateElement('content', e.target.value)}
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none min-h-[100px]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Color (Hex)" value={currentElement.color} onChange={(v) => updateElement('color', v)} />
                        <Input label="Background (Hex/CSS)" value={currentElement.background} onChange={(v) => updateElement('background', v)} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Input label="Font Family" value={currentElement.fontFamily} onChange={(v) => updateElement('fontFamily', v)} />
                        <Input label="Font Size" value={currentElement.fontSize} onChange={(v) => updateElement('fontSize', v)} />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <Input label="Link Path" value={currentElement.link} onChange={(v) => updateElement('link', v)} />
                      
                      <div className="p-6 bg-gray-50 rounded-xl space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Visibility & Status</p>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={currentElement.isVisible} 
                            onChange={(e) => updateElement('isVisible', e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 text-brand-gold focus:ring-brand-gold"
                          />
                          <span className="text-sm font-bold text-brand-dark">Element is Visible</span>
                        </label>
                      </div>

                      <div className="p-6 border border-brand-gold/20 rounded-xl bg-brand-cream/10">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gold mb-4">Live Preview</p>
                        <div 
                          style={{ 
                            color: currentElement.color, 
                            fontFamily: currentElement.fontFamily, 
                            fontSize: currentElement.fontSize,
                            background: currentElement.background,
                            display: currentElement.isVisible ? 'block' : 'none',
                            padding: '1rem',
                            borderRadius: '0.5rem'
                          }}
                        >
                          {currentElement.content || 'Preview Text'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {selectedSection === 'search' && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold">Search Settings</h3>
              <button onClick={onSave} className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg">
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <Input label="Placeholder Text" value={config.header.search.placeholder} onChange={(v) => updateConfig('header', 'search', { ...config.header.search, placeholder: v })} />
                <Input label="Button Text" value={config.header.search.buttonText} onChange={(v) => updateConfig('header', 'search', { ...config.header.search, buttonText: v })} />
                <Input label="Trending Title" value={config.header.search.trendingTitle} onChange={(v) => updateConfig('header', 'search', { ...config.header.search, trendingTitle: v })} />
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Trending Keywords (Comma separated)</label>
                  <textarea 
                    value={config.header.search.trending.join(', ')} 
                    onChange={(e) => updateConfig('header', 'search', { ...config.header.search, trending: e.target.value.split(',').map(s => s.trim()) })} 
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none min-h-[100px]" 
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'account' && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold">Account & Auth Labels</h3>
              <button onClick={onSave} className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg">
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <Input label="Login Tab Label" value={config.header.account.loginLabel} onChange={(v) => updateConfig('header', 'account', { ...config.header.account, loginLabel: v })} />
                <Input label="Signup Tab Label" value={config.header.account.signupLabel} onChange={(v) => updateConfig('header', 'account', { ...config.header.account, signupLabel: v })} />
                <Input label="Email Input Label" value={config.header.account.emailLabel} onChange={(v) => updateConfig('header', 'account', { ...config.header.account, emailLabel: v })} />
              </div>
              <div className="space-y-6">
                <Input label="Password Input Label" value={config.header.account.passwordLabel} onChange={(v) => updateConfig('header', 'account', { ...config.header.account, passwordLabel: v })} />
                <Input label="Login Button Text" value={config.header.account.loginBtnText} onChange={(v) => updateConfig('header', 'account', { ...config.header.account, loginBtnText: v })} />
                <Input label="Signup Button Text" value={config.header.account.signupBtnText} onChange={(v) => updateConfig('header', 'account', { ...config.header.account, signupBtnText: v })} />
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'announcement' && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold">Announcement Bar Settings</h3>
              <button onClick={onSave} className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg">
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <label className="flex items-center space-x-3 cursor-pointer p-4 bg-gray-50 rounded-lg">
                  <input type="checkbox" checked={config.announcementBar.isVisible} onChange={(e) => updateConfig('announcementBar', 'isVisible', e.target.checked)} className="w-5 h-5 rounded text-brand-gold focus:ring-brand-gold" />
                  <span className="text-sm font-bold text-brand-dark">Show Announcement Bar</span>
                </label>
                <Input label="Background Gradient/Color" value={config.announcementBar.bgColor} onChange={(v) => updateConfig('announcementBar', 'bgColor', v)} />
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Announcement Items</p>
                  {config.announcementBar.items.map((item: any, i: number) => (
                    <div key={i} className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg relative group">
                      <Input label="Text" value={item.text} onChange={(v) => {
                        const newItems = [...config.announcementBar.items];
                        newItems[i].text = v;
                        updateConfig('announcementBar', 'items', newItems);
                      }} />
                      <Input label="Link" value={item.path} onChange={(v) => {
                        const newItems = [...config.announcementBar.items];
                        newItems[i].path = v;
                        updateConfig('announcementBar', 'items', newItems);
                      }} />
                      <button onClick={() => {
                        const newItems = [...config.announcementBar.items];
                        newItems.splice(i, 1);
                        updateConfig('announcementBar', 'items', newItems);
                      }} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                    </div>
                  ))}
                  <button onClick={() => updateConfig('announcementBar', 'items', [...config.announcementBar.items, { text: '', path: '' }])} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-all">Add Item</button>
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Social Links</p>
                {config.announcementBar.socials.map((social: any, i: number) => (
                  <div key={i} className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg relative group">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Platform</label>
                      <select value={social.platform} onChange={(e) => {
                        const newSocials = [...config.announcementBar.socials];
                        newSocials[i].platform = e.target.value;
                        newSocials[i].icon = e.target.value === 'TikTok' ? 'Music2' : e.target.value;
                        updateConfig('announcementBar', 'socials', newSocials);
                      }} className="w-full p-2 bg-white border border-gray-200 rounded text-xs">
                        <option value="TikTok">TikTok</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Youtube">YouTube</option>
                        <option value="MessageCircle">WhatsApp</option>
                      </select>
                    </div>
                    <Input label="URL" value={social.url} onChange={(v) => {
                      const newSocials = [...config.announcementBar.socials];
                      newSocials[i].url = v;
                      updateConfig('announcementBar', 'socials', newSocials);
                    }} />
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Position</label>
                      <select value={social.position} onChange={(e) => {
                        const newSocials = [...config.announcementBar.socials];
                        newSocials[i].position = e.target.value;
                        updateConfig('announcementBar', 'socials', newSocials);
                      }} className="w-full p-2 bg-white border border-gray-200 rounded text-xs">
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                    <button onClick={() => {
                      const newSocials = [...config.announcementBar.socials];
                      newSocials.splice(i, 1);
                      updateConfig('announcementBar', 'socials', newSocials);
                    }} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                  </div>
                ))}
                <button onClick={() => updateConfig('announcementBar', 'socials', [...config.announcementBar.socials, { platform: 'Instagram', url: '', icon: 'Instagram', position: 'left' }])} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-all">Add Social Link</button>
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'header' && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold">Header Settings</h3>
              <button onClick={onSave} className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg">
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <FileUpload label="Logo Image (Optional)" value={config.header.logoImage || ''} onChange={(v) => updateConfig('header', 'logoImage', v)} />
                <Input label="Logo Text" value={config.header.logoText} onChange={(v) => updateConfig('header', 'logoText', v)} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Logo Color" value={config.header.logoColor} onChange={(v) => updateConfig('header', 'logoColor', v)} />
                  <Input label="Logo Font Size" value={config.header.logoSize} onChange={(v) => updateConfig('header', 'logoSize', v)} />
                </div>
                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Navigation Links</p>
                  {config.header.navLinks.map((link: any, i: number) => (
                    <div key={i} className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg relative group">
                      <Input label="Label" value={link.label} onChange={(v) => {
                        const newLinks = [...config.header.navLinks];
                        newLinks[i].label = v;
                        updateConfig('header', 'navLinks', newLinks);
                      }} />
                      <Input label="Path" value={link.path} onChange={(v) => {
                        const newLinks = [...config.header.navLinks];
                        newLinks[i].path = v;
                        updateConfig('header', 'navLinks', newLinks);
                      }} />
                      <button onClick={() => {
                        const newLinks = [...config.header.navLinks];
                        newLinks.splice(i, 1);
                        updateConfig('header', 'navLinks', newLinks);
                      }} className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                    </div>
                  ))}
                  <button onClick={() => updateConfig('header', 'navLinks', [...config.header.navLinks, { label: '', path: '' }])} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-all">Add Nav Link</button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Trending Searches (Comma separated)</label>
                  <textarea value={config.header.trending.join(', ')} onChange={(e) => updateConfig('header', 'trending', e.target.value.split(',').map(s => s.trim()))} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Trending Products (Comma separated names)</label>
                  <textarea value={config.header.trendingProducts.join(', ')} onChange={(e) => updateConfig('header', 'trendingProducts', e.target.value.split(',').map(s => s.trim()))} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none min-h-[100px]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'wishlist' && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold">Wishlist Settings</h3>
              <button onClick={onSave} className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg">
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <Input label="Wishlist Title" value={config.header.wishlist.title} onChange={(v) => updateConfig('header', 'wishlist', { ...config.header.wishlist, title: v })} />
                <Input label="Empty State Text" value={config.header.wishlist.emptyText} onChange={(v) => updateConfig('header', 'wishlist', { ...config.header.wishlist, emptyText: v })} />
              </div>
              <div className="space-y-6">
                <Input label="Explore Button Text" value={config.header.wishlist.btnText} onChange={(v) => updateConfig('header', 'wishlist', { ...config.header.wishlist, btnText: v })} />
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'cart' && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold">Cart Settings</h3>
              <button onClick={onSave} className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg">
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <Input label="Cart Title" value={config.header.cart.title} onChange={(v) => updateConfig('header', 'cart', { ...config.header.cart, title: v })} />
                <Input label="Empty State Text" value={config.header.cart.emptyText} onChange={(v) => updateConfig('header', 'cart', { ...config.header.cart, emptyText: v })} />
              </div>
              <div className="space-y-6">
                <Input label="Checkout Button Text" value={config.header.cart.checkoutBtnText} onChange={(v) => updateConfig('header', 'cart', { ...config.header.cart, checkoutBtnText: v })} />
                <Input label="View Cart Button Text" value={config.header.cart.viewCartBtnText} onChange={(v) => updateConfig('header', 'cart', { ...config.header.cart, viewCartBtnText: v })} />
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'collectionLinks' && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold">Collection Navigation Links</h3>
              <button onClick={onSave} className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg">
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>
            <div className="space-y-4">
              {config.header.navLinks.map((link: any, i: number) => (
                <div key={i} className="p-6 bg-gray-50 rounded-xl space-y-4 relative group">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input label="Label" value={link.label} onChange={(v) => {
                      const newLinks = [...config.header.navLinks];
                      newLinks[i].label = v;
                      updateConfig('header', 'navLinks', newLinks);
                    }} />
                    <Input label="Path" value={link.path} onChange={(v) => {
                      const newLinks = [...config.header.navLinks];
                      newLinks[i].path = v;
                      updateConfig('header', 'navLinks', newLinks);
                    }} />
                    <div className="grid grid-cols-2 gap-2">
                       <Input label="Color" value={link.color || ''} onChange={(v) => {
                        const newLinks = [...config.header.navLinks];
                        newLinks[i].color = v;
                        updateConfig('header', 'navLinks', newLinks);
                      }} />
                       <Input label="Font Size" value={link.fontSize || ''} onChange={(v) => {
                        const newLinks = [...config.header.navLinks];
                        newLinks[i].fontSize = v;
                        updateConfig('header', 'navLinks', newLinks);
                      }} />
                    </div>
                  </div>
                  <button onClick={() => {
                    const newLinks = [...config.header.navLinks];
                    newLinks.splice(i, 1);
                    updateConfig('header', 'navLinks', newLinks);
                  }} className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14} /></button>
                </div>
              ))}
              <button onClick={() => updateConfig('header', 'navLinks', [...config.header.navLinks, { label: '', path: '', color: '', fontSize: '' }])} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-all">Add New Collection Link</button>
            </div>
          </div>
        )}

        {selectedSection === 'logo' && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold">Logo Settings</h3>
              <button onClick={onSave} className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg">
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <FileUpload label="Logo Image (Priority over Text)" value={config.header.logoImage} onChange={(v) => updateConfig('header', 'logoImage', v)} />
                <Input label="Logo Text" value={config.header.logoText} onChange={(v) => updateConfig('header', 'logoText', v)} />
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Logo Color" value={config.header.logoColor} onChange={(v) => updateConfig('header', 'logoColor', v)} />
                  <Input label="Logo Font Size" value={config.header.logoSize} onChange={(v) => updateConfig('header', 'logoSize', v)} />
                </div>
                <Input label="Logo Font Family" value={config.header.logoFontFamily} onChange={(v) => updateConfig('header', 'logoFontFamily', v)} />
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'hero' && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold">Hero Banner Slides</h3>
              <button onClick={onSave} className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg">
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {config.heroBanner.slides.map((slide: any, i: number) => (
                <div key={i} className="p-6 bg-gray-50 rounded-xl relative group space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-brand-gold">Slide {i + 1}</h4>
                    <button onClick={() => {
                      const newSlides = [...config.heroBanner.slides];
                      newSlides.splice(i, 1);
                      updateConfig('heroBanner', 'slides', newSlides);
                    }} className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"><Trash2 size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Title" value={slide.title} onChange={(v) => {
                      const newSlides = [...config.heroBanner.slides];
                      newSlides[i].title = v;
                      updateConfig('heroBanner', 'slides', newSlides);
                    }} />
                    <Input label="Subtitle" value={slide.subtitle} onChange={(v) => {
                      const newSlides = [...config.heroBanner.slides];
                      newSlides[i].subtitle = v;
                      updateConfig('heroBanner', 'slides', newSlides);
                    }} />
                  </div>
                  <FileUpload label="Slide Image" value={slide.image} onChange={(v) => {
                    const newSlides = [...config.heroBanner.slides];
                    newSlides[i].image = v;
                    updateConfig('heroBanner', 'slides', newSlides);
                  }} />
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Link" value={slide.link} onChange={(v) => {
                      const newSlides = [...config.heroBanner.slides];
                      newSlides[i].link = v;
                      updateConfig('heroBanner', 'slides', newSlides);
                    }} />
                    <Input label="Overlay Color" value={slide.overlayColor} onChange={(v) => {
                      const newSlides = [...config.heroBanner.slides];
                      newSlides[i].overlayColor = v;
                      updateConfig('heroBanner', 'slides', newSlides);
                    }} />
                  </div>
                </div>
              ))}
              <button onClick={() => updateConfig('heroBanner', 'slides', [...config.heroBanner.slides, { id: Date.now().toString(), title: '', subtitle: '', image: '', link: '', overlayColor: 'rgba(0,0,0,0.4)' }])} className="aspect-video border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-all">
                <Plus size={32} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest">Add New Slide</span>
              </button>
            </div>
          </div>
        )}

        {selectedSection === 'footer' && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold">Footer Management</h3>
              <button onClick={onSave} className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg">
                <Save size={18} />
                <span>Save Footer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <Input label="Brand Name" value={config.footer.brandName} onChange={(v) => updateConfig('footer', 'brandName', v)} />
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</label>
                  <textarea value={config.footer.description} onChange={(e) => updateConfig('footer', 'description', e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none min-h-[100px]" />
                </div>
                <Input label="Copyright Text" value={config.footer.copyright} onChange={(v) => updateConfig('footer', 'copyright', v)} />
              </div>

              <div className="space-y-6">
                <Input label="Newsletter Title" value={config.footer.newsletterTitle} onChange={(v) => updateConfig('footer', 'newsletterTitle', v)} />
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Newsletter Description</label>
                  <textarea value={config.footer.newsletterDesc} onChange={(e) => updateConfig('footer', 'newsletterDesc', e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none h-24" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 border-t border-gray-100">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Shop Links</p>
                  <button onClick={() => updateConfig('footer', 'shopLinks', [...(config.footer.shopLinks || []), { label: 'New Link', path: '/shop' }])} className="text-[10px] text-brand-gold font-bold uppercase">+ Add</button>
                </div>
                {(config.footer.shopLinks || []).map((link: any, i: number) => (
                  <div key={i} className="flex space-x-2 items-end">
                    <div className="flex-grow"><Input label="Label" value={link.label} onChange={(v) => {
                      const newLinks = [...config.footer.shopLinks];
                      newLinks[i].label = v;
                      updateConfig('footer', 'shopLinks', newLinks);
                    }} /></div>
                    <div className="flex-grow"><Input label="Path" value={link.path} onChange={(v) => {
                      const newLinks = [...config.footer.shopLinks];
                      newLinks[i].path = v;
                      updateConfig('footer', 'shopLinks', newLinks);
                    }} /></div>
                    <button onClick={() => {
                      const newLinks = config.footer.shopLinks.filter((_: any, idx: number) => idx !== i);
                      updateConfig('footer', 'shopLinks', newLinks);
                    }} className="p-3 text-red-500 hover:text-red-700 transition-colors"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Support Pages & Content</p>
                  <button onClick={() => updateConfig('footer', 'supportLinks', [...(config.footer.supportLinks || []), { label: 'New Page', path: '/support', content: '# New Page\nEdit content here...' }])} className="text-[10px] text-brand-gold font-bold uppercase">+ Add Page</button>
                </div>
                {(config.footer.supportLinks || []).map((link: any, i: number) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg space-y-4 relative group">
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Label" value={link.label} onChange={(v) => {
                        const newLinks = [...config.footer.supportLinks];
                        newLinks[i].label = v;
                        updateConfig('footer', 'supportLinks', newLinks);
                      }} />
                      <Input label="Path" value={link.path} onChange={(v) => {
                        const newLinks = [...config.footer.supportLinks];
                        newLinks[i].path = v;
                        updateConfig('footer', 'supportLinks', newLinks);
                      }} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Page Content (Markdown)</label>
                      <textarea 
                        value={link.content} 
                        onChange={(e) => {
                          const newLinks = [...config.footer.supportLinks];
                          newLinks[i].content = e.target.value;
                          updateConfig('footer', 'supportLinks', newLinks);
                        }} 
                        className="w-full p-2 text-xs font-mono border border-gray-200 rounded min-h-[100px] outline-none focus:ring-1 focus:ring-brand-gold"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const newLinks = config.footer.supportLinks.filter((_: any, idx: number) => idx !== i);
                        updateConfig('footer', 'supportLinks', newLinks);
                      }} 
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-8 border-t border-gray-100">
              <div className="flex justify-between items-center mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Social Media Links</p>
                <button onClick={() => updateConfig('footer', 'socials', [...config.footer.socials, { platform: '', url: '' }])} className="text-[10px] text-brand-gold font-bold uppercase">+ Add Social</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {config.footer.socials.map((social: any, i: number) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg relative group space-y-3">
                    <Input label="Platform" value={social.platform} onChange={(v) => {
                      const newSocials = [...config.footer.socials];
                      newSocials[i].platform = v;
                      updateConfig('footer', 'socials', newSocials);
                    }} />
                    <Input label="URL" value={social.url} onChange={(v) => {
                      const newSocials = [...config.footer.socials];
                      newSocials[i].url = v;
                      updateConfig('footer', 'socials', newSocials);
                    }} />
                    <button onClick={() => {
                      const newSocials = [...config.footer.socials];
                      newSocials.splice(i, 1);
                      updateConfig('footer', 'socials', newSocials);
                    }} className="absolute top-2 right-2 p-1 bg-red-400 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={10} /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedSection === 'featuredCollections' && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold">Collections Settings</h3>
              <button onClick={onSave} className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg">
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>

            <label className="flex items-center space-x-3 cursor-pointer p-4 bg-gray-50 rounded-lg w-fit">
              <input type="checkbox" checked={config.featuredCollections.isVisible} onChange={(e) => updateConfig('featuredCollections', 'isVisible', e.target.checked)} className="w-5 h-5 rounded text-brand-gold focus:ring-brand-gold" />
              <span className="text-sm font-bold text-brand-dark">Show Collections Section</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {config.featuredCollections.items.map((item: any, i: number) => (
                <div key={i} className="p-6 bg-gray-50 rounded-xl relative group space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gold">Collection {i + 1}</h4>
                    <button onClick={() => {
                      const newItems = [...config.featuredCollections.items];
                      newItems.splice(i, 1);
                      updateConfig('featuredCollections', 'items', newItems);
                    }} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"><X size={14} /></button>
                  </div>
                  <Input label="Name" value={item.name} onChange={(v) => {
                    const newItems = [...config.featuredCollections.items];
                    newItems[i].name = v;
                    updateConfig('featuredCollections', 'items', newItems);
                  }} />
                  <FileUpload label="Collection Image" value={item.image} onChange={(v) => {
                    const newItems = [...config.featuredCollections.items];
                    newItems[i].image = v;
                    updateConfig('featuredCollections', 'items', newItems);
                  }} />
                  <Input label="Link" value={item.link} onChange={(v) => {
                    const newItems = [...config.featuredCollections.items];
                    newItems[i].link = v;
                    updateConfig('featuredCollections', 'items', newItems);
                  }} />
                </div>
              ))}
              <button onClick={() => updateConfig('featuredCollections', 'items', [...config.featuredCollections.items, { id: Date.now().toString(), name: '', image: '', link: '' }])} className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-all p-8">
                <Plus size={32} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest">Add New Collection</span>
              </button>
            </div>
          </div>
        )}

        {selectedSection === 'customerReviews' && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold">Home Reviews Settings</h3>
              <button onClick={onSave} className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg">
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>

            <label className="flex items-center space-x-3 cursor-pointer p-4 bg-gray-50 rounded-lg w-fit">
              <input type="checkbox" checked={config.customerReviews.isVisible} onChange={(e) => updateConfig('customerReviews', 'isVisible', e.target.checked)} className="w-5 h-5 rounded text-brand-gold focus:ring-brand-gold" />
              <span className="text-sm font-bold text-brand-dark">Show Reviews Section</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {config.customerReviews.items.map((review: any, i: number) => (
                <div key={i} className="p-6 bg-gray-50 rounded-xl relative group space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gold">Review {i + 1}</h4>
                    <button onClick={() => {
                      const newItems = [...config.customerReviews.items];
                      newItems.splice(i, 1);
                      updateConfig('customerReviews', 'items', newItems);
                    }} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="User Name" value={review.user} onChange={(v) => {
                      const newItems = [...config.customerReviews.items];
                      newItems[i].user = v;
                      updateConfig('customerReviews', 'items', newItems);
                    }} />
                    <Input label="Profession" value={review.profession} onChange={(v) => {
                      const newItems = [...config.customerReviews.items];
                      newItems[i].profession = v;
                      updateConfig('customerReviews', 'items', newItems);
                    }} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Rating (1-5)</label>
                      <input type="number" min="1" max="5" value={review.rating} onChange={(e) => {
                        const newItems = [...config.customerReviews.items];
                        newItems[i].rating = Number(e.target.value);
                        updateConfig('customerReviews', 'items', newItems);
                      }} className="w-full p-2 border border-gray-200 rounded text-sm" />
                    </div>
                    <Input label="Date" value={review.date} onChange={(v) => {
                      const newItems = [...config.customerReviews.items];
                      newItems[i].date = v;
                      updateConfig('customerReviews', 'items', newItems);
                    }} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Comment</label>
                    <textarea value={review.comment} onChange={(e) => {
                      const newItems = [...config.customerReviews.items];
                      newItems[i].comment = e.target.value;
                      updateConfig('customerReviews', 'items', newItems);
                    }} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none min-h-[80px] text-sm" />
                  </div>
                </div>
              ))}
              <button onClick={() => updateConfig('customerReviews', 'items', [...config.customerReviews.items, { id: Date.now().toString(), user: '', profession: '', rating: 5, comment: '', date: new Date().toISOString().split('T')[0] }])} className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-all p-8">
                <Plus size={32} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest">Add New Review</span>
              </button>
            </div>
          </div>
        )}

        {selectedSection === 'trustBadges' && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold">Trust Badges Settings</h3>
              <button onClick={onSave} className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg">
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>

            <label className="flex items-center space-x-3 cursor-pointer p-4 bg-gray-50 rounded-lg w-fit">
              <input type="checkbox" checked={config.trustBadges.isVisible} onChange={(e) => updateConfig('trustBadges', 'isVisible', e.target.checked)} className="w-5 h-5 rounded text-brand-gold focus:ring-brand-gold" />
              <span className="text-sm font-bold text-brand-dark">Show Trust Badges Section</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {config.trustBadges.items.map((badge: any, i: number) => (
                <div key={i} className="p-6 bg-gray-50 rounded-xl relative group space-y-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-gold">Badge {i + 1}</h4>
                    <button onClick={() => {
                      const newItems = [...config.trustBadges.items];
                      newItems.splice(i, 1);
                      updateConfig('trustBadges', 'items', newItems);
                    }} className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"><X size={14} /></button>
                  </div>
                  <Input label="Icon (Lucide Name)" value={badge.icon} onChange={(v) => {
                    const newItems = [...config.trustBadges.items];
                    newItems[i].icon = v;
                    updateConfig('trustBadges', 'items', newItems);
                  }} />
                  <Input label="Title" value={badge.title} onChange={(v) => {
                    const newItems = [...config.trustBadges.items];
                    newItems[i].title = v;
                    updateConfig('trustBadges', 'items', newItems);
                  }} />
                  <Input label="Subtitle" value={badge.subtitle} onChange={(v) => {
                    const newItems = [...config.trustBadges.items];
                    newItems[i].subtitle = v;
                    updateConfig('trustBadges', 'items', newItems);
                  }} />
                </div>
              ))}
              <button onClick={() => updateConfig('trustBadges', 'items', [...config.trustBadges.items, { icon: 'Truck', title: '', subtitle: '' }])} className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-brand-gold hover:text-brand-gold transition-all p-8">
                <Plus size={32} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest">Add New Badge</span>
              </button>
            </div>
          </div>
        )}

        {selectedSection === 'newArrivals' && (
          <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-serif font-bold">New Arrivals Settings</h3>
              <button onClick={onSave} className="flex items-center space-x-2 bg-brand-dark text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-brand-gold transition-all shadow-lg">
                <Save size={18} />
                <span>Save Changes</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <label className="flex items-center space-x-3 cursor-pointer p-4 bg-gray-50 rounded-lg">
                  <input type="checkbox" checked={config.newArrivals.isVisible} onChange={(e) => updateConfig('newArrivals', 'isVisible', e.target.checked)} className="w-5 h-5 rounded text-brand-gold focus:ring-brand-gold" />
                  <span className="text-sm font-bold text-brand-dark">Show New Arrivals Section</span>
                </label>
                <Input label="Section Title" value={config.newArrivals.title} onChange={(v) => updateConfig('newArrivals', 'title', v)} />
                <Input label="Section Tagline" value={config.newArrivals.tagline} onChange={(v) => updateConfig('newArrivals', 'tagline', v)} />
              </div>
              <div className="space-y-6">
                <div className="p-6 bg-gray-50 rounded-xl">
                  <p className="text-sm text-gray-500">This section automatically displays products marked as "New Arrival" in the Products tab. You can control the section's visibility and headings here.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
