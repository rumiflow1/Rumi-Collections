import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { db, handleFirestoreError } from '../firebase';
import { OperationType } from '../types';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { User, Shield, MapPin, CreditCard, LogOut, Camera, Star, ChevronRight, Heart, Package, Tag, Plus, Trash2, Check, ExternalLink, Loader2 } from 'lucide-react';
import axios from 'axios';

import { authApi, orderApi } from '../services/api';
import { useConfig } from '../context/ConfigContext';
import { resolveImageUrl } from '../lib/utils';

type Tab = 'personal' | 'security' | 'addresses' | 'payments' | 'wishlist' | 'orders' | 'discounts';

export default function Profile() {
  const { user, logout } = useAuth();
  const { SiteConfig } = useConfig();
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  const [profileData, setProfileData] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    phone: '',
    photoURL: '',
    coverURL: '',
    password: ''
  });
  const [addressForm, setAddressForm] = useState({
    label: '',
    street: '',
    city: '',
    state: '',
    zip: '',
    country: ''
  });
  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    cardholder: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  useEffect(() => {
    if (!user) return;
    const path = `users/${user.uid}`;
    const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setProfileData(data);
        setFormData({
          displayName: data.displayName || '',
          phone: data.phone || '',
          photoURL: data.photoURL || '',
          coverURL: data.coverURL || '',
          password: data.password || ''
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user || activeTab !== 'orders') return;
    
    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const response = await orderApi.getUserOrders(user.uid);
        setOrders(response.data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user, activeTab]);

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const response = await axios.get('/api/discounts');
        setProfileData((prev: any) => ({ ...prev, discounts: response.data }));
      } catch (err) {
        console.error('Failed to fetch discounts:', err);
      }
    };
    if (activeTab === 'discounts') {
      fetchDiscounts();
    }
  }, [activeTab]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: formData.displayName,
        phone: formData.phone,
        photoURL: formData.photoURL,
        coverURL: formData.coverURL,
        password: formData.password
      });
      setIsEditing(false);
      alert('Profile updated successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      const newAddresses = [...(profileData?.addresses || []), addressForm];
      await updateDoc(doc(db, 'users', user.uid), { addresses: newAddresses });
      setIsAddingAddress(false);
      setAddressForm({ label: '', street: '', city: '', state: '', zip: '', country: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const validateCard = (number: string) => {
    // Basic Luhn algorithm check
    let sum = 0;
    let shouldDouble = false;
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i));
      if (shouldDouble) {
        if ((digit *= 2) > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return (sum % 10) === 0 && number.length >= 13;
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const cleanNumber = paymentForm.cardNumber.replace(/\s/g, '');
    if (!validateCard(cleanNumber)) {
      alert('Please enter a valid credit card number.');
      return;
    }

    const path = `users/${user.uid}`;
    try {
      const newPayments = [...(profileData?.payments || []), {
        last4: cleanNumber.slice(-4),
        expiry: paymentForm.expiry,
        cardholder: paymentForm.cardholder,
        isDefault: (profileData?.payments?.length || 0) === 0
      }];
      await updateDoc(doc(db, 'users', user.uid), { payments: newPayments });
      setIsAddingPayment(false);
      setPaymentForm({ cardNumber: '', expiry: '', cvv: '', cardholder: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      alert('Passwords do not match.');
      return;
    }
    // In a real app, we'd use Firebase Auth updatePassword
    // For this demo, we'll just simulate it
    alert('Password updated successfully (simulated).');
    setIsChangingPassword(false);
    setPasswordForm({ current: '', new: '', confirm: '' });
  };

  const toggle2FA = async () => {
    if (!user) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), { twoFactorEnabled: !profileData?.twoFactorEnabled });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const path = `users/${user.uid}`;
      
      try {
        if (type === 'photo') {
          setFormData(prev => ({ ...prev, photoURL: base64String }));
          await updateDoc(doc(db, 'users', user.uid), { photoURL: base64String });
        } else {
          setFormData(prev => ({ ...prev, coverURL: base64String }));
          await updateDoc(doc(db, 'users', user.uid), { coverURL: base64String });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, path);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;

  const getTierInfo = (spend: number = 0) => {
    if (spend >= 5000) return { name: 'Golden Member', color: 'text-brand-gold', bg: 'bg-brand-gold/10' };
    if (spend >= 1000) return { name: 'Silver Member', color: 'text-gray-400', bg: 'bg-gray-400/10' };
    return { name: 'Member', color: 'text-brand-dark', bg: 'bg-brand-dark/5' };
  };

  const tier = getTierInfo(profileData?.totalSpend);

  return (
    <main className="min-h-screen bg-brand-cream/30 pb-20">
      {/* Cover Photo */}
      <div className="h-64 md:h-80 w-full relative overflow-hidden bg-brand-dark">
        {formData.coverURL ? (
          <img src={resolveImageUrl(formData.coverURL)} className="w-full h-full object-cover opacity-60" alt="Cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-brand-dark via-gray-800 to-brand-dark animate-gradient-xy opacity-50"></div>
        )}
        <label className="absolute bottom-6 right-6 bg-white/20 backdrop-blur-md text-white p-3 rounded-full hover:bg-white/40 transition-colors cursor-pointer">
          <Camera size={20} />
          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'cover')} />
        </label>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/3 space-y-6">
            <div className="bg-white p-8 border border-brand-dark/5 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gray-100">
                    <img src={resolveImageUrl(formData.photoURL || `https://ui-avatars.com/api/?name=${formData.displayName}&background=random`)} className="w-full h-full object-cover" alt="Avatar" />
                  </div>
                  <label className="absolute bottom-0 right-0 bg-brand-gold text-white p-2 rounded-full shadow-lg hover:scale-110 transition-transform cursor-pointer">
                    <Camera size={16} />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} />
                  </label>
                </div>
                
                <h2 className="text-2xl font-serif font-bold mb-1">{formData.displayName || 'Luxe Member'}</h2>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">{user.email}</p>
                
                <div className={`px-4 py-1 rounded-full ${tier.bg} ${tier.color} text-[10px] font-bold tracking-[0.2em] uppercase flex items-center`}>
                  <Star size={10} className="mr-2 fill-current" /> {tier.name}
                </div>
              </div>

              <nav className="mt-10 space-y-2">
                {[
                  { id: 'personal', label: SiteConfig?.account?.profileTitle || 'Personal Info', icon: User, path: '/profile' },
                  { id: 'wishlist', label: SiteConfig?.account?.wishlistTitle || 'Wishlist', icon: Heart, path: '/wishlist' },
                  { id: 'orders', label: SiteConfig?.account?.ordersTitle || 'Order History', icon: Package, path: null },
                  { id: 'addresses', label: SiteConfig?.account?.addressesTitle || 'Addresses', icon: MapPin, path: null },
                  { id: 'payments', label: SiteConfig?.account?.paymentsTitle || 'Payments', icon: CreditCard, path: null },
                  { id: 'discounts', label: SiteConfig?.account?.discountsTitle || 'Discounts', icon: Tag, path: null },
                  { id: 'security', label: SiteConfig?.account?.securityTitle || 'Security', icon: Shield, path: null },
                ].map((item) => (
                  item.path ? (
                    <Link
                      key={item.id}
                      to={item.path}
                      className={`w-full flex items-center justify-between p-4 text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
                        activeTab === item.id ? 'bg-brand-dark text-white' : 'hover:bg-brand-dark/5 text-brand-dark'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon size={16} className="mr-4" /> {item.label}
                      </div>
                      <ChevronRight size={14} className={activeTab === item.id ? 'opacity-100' : 'opacity-0'} />
                    </Link>
                  ) : (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id as Tab)}
                      className={`w-full flex items-center justify-between p-4 text-xs font-bold tracking-widest uppercase transition-all duration-300 ${
                        activeTab === item.id ? 'bg-brand-dark text-white' : 'hover:bg-brand-dark/5 text-brand-dark'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon size={16} className="mr-4" /> {item.label}
                      </div>
                      <ChevronRight size={14} className={activeTab === item.id ? 'opacity-100' : 'opacity-0'} />
                    </button>
                  )
                ))}
                <button 
                  onClick={logout}
                  className="w-full flex items-center p-4 text-xs font-bold tracking-widest uppercase text-red-500 hover:bg-red-50 transition-colors mt-4"
                >
                  <LogOut size={16} className="mr-4" /> Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:w-2/3">
            <div className="bg-white p-8 md:p-12 border border-brand-dark/5 shadow-sm min-h-[600px]">
              {activeTab === 'personal' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="mb-8 p-6 bg-brand-gold/5 border border-brand-gold/10 rounded-2xl">
                     <p className="text-xs font-bold tracking-[0.2em] uppercase text-brand-gold">{SiteConfig?.account?.welcomeMessage || 'Welcome back to your sanctuary.'}</p>
                  </div>
                  <div className="flex justify-between items-center mb-10">
                    <h3 className="text-3xl font-serif font-bold">{SiteConfig?.account?.profileTitle || 'Personal Information'}</h3>
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-xs font-bold tracking-widest uppercase text-brand-gold hover:underline"
                    >
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </button>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Full Name</label>
                        <input 
                          disabled={!isEditing}
                          type="text" 
                          value={formData.displayName}
                          onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                          className="input-field disabled:opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Phone Number</label>
                        <input 
                          disabled={!isEditing}
                          type="tel" 
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="input-field disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Email Address</label>
                        <input 
                          disabled
                          type="email" 
                          value={user.email || ''}
                          className="input-field opacity-50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Password</label>
                        <input 
                          disabled={!isEditing}
                          type="password" 
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          placeholder="••••••••"
                          className="input-field disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <motion.button 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        type="submit"
                        className="btn-primary"
                      >
                        Save Changes
                      </motion.button>
                    )}
                  </form>

                  <div className="mt-16 pt-10 border-t border-brand-dark/5">
                    <h4 className="text-sm font-bold tracking-widest uppercase mb-6">Membership Progress</h4>
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs mb-2">
                        <span className="text-gray-500">Total Spend</span>
                        <span className="font-bold">${(profileData?.totalSpend || 0).toLocaleString()} / $1,000</span>
                      </div>
                      <div className="h-1 w-full bg-gray-100 overflow-hidden">
                        <div 
                          className="h-full bg-brand-gold transition-all duration-1000" 
                          style={{ width: `${Math.min(((profileData?.totalSpend || 0) / 1000) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-[10px] text-gray-400 italic">Spend ${(1000 - (profileData?.totalSpend || 0)).toLocaleString()} more to reach Silver Tier.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'wishlist' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <h3 className="text-3xl font-serif font-bold">{SiteConfig?.account?.wishlistTitle || 'My Wishlist'}</h3>
                  {profileData?.wishlist?.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                      {profileData.wishlist.map((id: string) => (
                        <div key={id} className="group relative">
                          <div className="aspect-[3/4] bg-gray-100 overflow-hidden mb-4">
                            <img src={`https://images.unsplash.com/photo-${id === '1' ? '1539008835657-9e8e9680fe0a' : '1594932224826-94b2724242ee'}?q=80&w=1974&auto=format&fit=crop`} alt="Product" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          </div>
                          <h4 className="text-xs font-bold uppercase tracking-widest mb-1 group-hover:text-brand-gold transition-colors">Product {id}</h4>
                          <p className="text-xs text-brand-gold font-serif">$1,200.00</p>
                          <button className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full text-red-500 hover:bg-white transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-32 text-center border-2 border-dashed border-brand-dark/5">
                      <Heart size={48} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-sm text-gray-400 italic">Your wishlist is empty.</p>
                      <Link to="/products" className="mt-6 inline-block text-xs font-bold tracking-widest uppercase text-brand-gold border-b border-brand-gold pb-1">Start Shopping</Link>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'orders' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <h3 className="text-3xl font-serif font-bold">{SiteConfig?.account?.ordersTitle || 'Order History'}</h3>
                  <div className="space-y-8">
                    {isLoadingOrders ? (
                      <div className="py-20 text-center">
                        <Loader2 className="animate-spin mx-auto text-brand-gold mb-4" size={32} />
                        <p className="text-sm text-gray-400 italic uppercase tracking-widest">Loading your orders...</p>
                      </div>
                    ) : orders.length > 0 ? (
                      orders.map((order: any) => (
                        <div key={order.id || order._id} className="border border-brand-dark/5 bg-white overflow-hidden">
                          <div className="bg-brand-cream/20 px-6 py-4 flex justify-between items-center border-b border-brand-dark/5">
                            <div className="flex space-x-8">
                              <div>
                                <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-1">Order #</p>
                                <p className="text-xs font-bold">{order.orderNumber || order.id || order._id}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-1">Date</p>
                                <p className="text-xs font-medium">{new Date(order.createdAt || order.date).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400 mb-1">Total</p>
                                <p className="text-xs font-serif font-bold text-brand-gold">${(order.totalAmount || order.total).toLocaleString()}</p>
                              </div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-brand-gold/10 text-brand-gold'}`}>
                              {order.status}
                            </div>
                          </div>
                          <div className="p-6">
                            <div className="space-y-6 mb-8">
                              {(order.items || []).map((item: any, i: number) => (
                                <div key={i} className="flex space-x-4">
                                  <div className="w-16 h-20 bg-gray-100 overflow-hidden rounded">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="text-xs font-bold uppercase tracking-widest">{item.name}</h4>
                                    <p className="text-[10px] text-gray-400 mt-1">Size: {item.size} | Color: {item.color} | Qty: {item.quantity}</p>
                                  </div>
                                  <button className="text-[10px] font-bold tracking-widest uppercase text-brand-gold hover:underline">Track Order</button>
                                </div>
                              ))}
                            </div>
                            
                            <div className="pt-6 border-t border-brand-dark/5">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Packed</p>
                                  <p className="text-xs font-medium">{order.tracking?.packed || 'Pending'}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Shipped</p>
                                  <p className="text-xs font-medium">{order.tracking?.shipped || 'Pending'}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[9px] font-bold tracking-widest uppercase text-gray-400">Delivered</p>
                                  <p className="text-xs font-medium">{order.tracking?.delivered || 'Pending'}</p>
                                </div>
                                <div className="flex items-end">
                                  <button className="w-full py-2 bg-brand-dark text-white text-[9px] font-bold tracking-widest uppercase hover:bg-brand-gold transition-colors">
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-32 text-center border-2 border-dashed border-brand-dark/5">
                        <Package size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-sm text-gray-400 italic">You haven't placed any orders yet.</p>
                        <Link to="/products" className="mt-6 inline-block text-xs font-bold tracking-widest uppercase text-brand-gold border-b border-brand-gold pb-1">Start Shopping</Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'discounts' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <h3 className="text-3xl font-serif font-bold">{SiteConfig?.account?.discountsTitle || 'My Discounts'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(profileData?.discounts || [
                      { code: 'LUXE50', description: '50% Off on Men\'s Collection', expiry: '2026-12-31' },
                      { code: 'FIRST15', description: '15% Off on your first order', expiry: '2026-06-30' }
                    ]).map((discount: any) => (
                      <div key={discount.code} className="bg-brand-gold/5 border-2 border-dashed border-brand-gold/20 p-6 rounded-xl relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-brand-gold/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                        <Tag className="text-brand-gold mb-4" size={24} />
                        <h4 className="text-xl font-serif font-bold text-brand-dark mb-2">{discount.code}</h4>
                        <p className="text-sm text-gray-600 mb-4">{discount.description}</p>
                        <div className="flex justify-between items-center pt-4 border-t border-brand-gold/10">
                          <span className="text-[10px] font-bold text-gray-400 uppercase">Expires: {discount.expiry}</span>
                          <button className="text-brand-gold text-[10px] font-bold uppercase tracking-widest hover:underline">Copy Code</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
                  <h3 className="text-3xl font-serif font-bold">{SiteConfig?.account?.securityTitle || 'Security Settings'}</h3>
                  
                  <div className="space-y-6">
                    <div className="flex justify-between items-center p-6 border border-brand-dark/5 hover:border-brand-gold transition-colors">
                      <div>
                        <h4 className="text-sm font-bold tracking-widest uppercase mb-1">Two-Factor Authentication</h4>
                        <p className="text-xs text-gray-500">Add an extra layer of security to your account.</p>
                      </div>
                      <button 
                        onClick={toggle2FA}
                        className={`w-12 h-6 rounded-full relative transition-colors ${profileData?.twoFactorEnabled ? 'bg-brand-gold' : 'bg-gray-200'}`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${profileData?.twoFactorEnabled ? 'left-7' : 'left-1'}`}></div>
                      </button>
                    </div>

                    <div className="p-6 border border-brand-dark/5 hover:border-brand-gold transition-colors">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <h4 className="text-sm font-bold tracking-widest uppercase mb-1">Change Password</h4>
                          <p className="text-xs text-gray-500">Last updated recently.</p>
                        </div>
                        <button 
                          onClick={() => setIsChangingPassword(!isChangingPassword)}
                          className="text-xs font-bold tracking-widest uppercase text-brand-gold hover:underline"
                        >
                          {isChangingPassword ? 'Cancel' : 'Update'}
                        </button>
                      </div>

                      {isChangingPassword && (
                        <form onSubmit={handleUpdatePassword} className="space-y-4 max-w-md">
                          <input 
                            type="password" 
                            placeholder="Current Password" 
                            className="input-field"
                            value={passwordForm.current}
                            onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                            required
                          />
                          <input 
                            type="password" 
                            placeholder="New Password" 
                            className="input-field"
                            value={passwordForm.new}
                            onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                            required
                          />
                          <input 
                            type="password" 
                            placeholder="Confirm New Password" 
                            className="input-field"
                            value={passwordForm.confirm}
                            onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
                            required
                          />
                          <button type="submit" className="btn-primary w-full">Update Password</button>
                        </form>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'addresses' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-3xl font-serif font-bold">Shipping Addresses</h3>
                    <button 
                      onClick={() => setIsAddingAddress(!isAddingAddress)}
                      className="btn-primary !py-2 !px-4 !text-[10px]"
                    >
                      {isAddingAddress ? 'Cancel' : 'Add New'}
                    </button>
                  </div>

                  {isAddingAddress && (
                    <form onSubmit={handleAddAddress} className="bg-brand-cream/20 p-6 border border-brand-dark/5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          placeholder="Label (e.g. Home)" 
                          className="input-field" 
                          value={addressForm.label}
                          onChange={(e) => setAddressForm({...addressForm, label: e.target.value})}
                          required
                        />
                        <input 
                          placeholder="Country" 
                          className="input-field" 
                          value={addressForm.country}
                          onChange={(e) => setAddressForm({...addressForm, country: e.target.value})}
                          required
                        />
                      </div>
                      <input 
                        placeholder="Street Address" 
                        className="input-field" 
                        value={addressForm.street}
                        onChange={(e) => setAddressForm({...addressForm, street: e.target.value})}
                        required
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <input 
                          placeholder="City" 
                          className="input-field" 
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                          required
                        />
                        <input 
                          placeholder="State" 
                          className="input-field" 
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({...addressForm, state: e.target.value})}
                          required
                        />
                        <input 
                          placeholder="Zip" 
                          className="input-field" 
                          value={addressForm.zip}
                          onChange={(e) => setAddressForm({...addressForm, zip: e.target.value})}
                          required
                        />
                      </div>
                      <button type="submit" className="btn-primary w-full">Save Address</button>
                    </form>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {profileData?.addresses?.length > 0 ? (
                      profileData.addresses.map((addr: any, idx: number) => (
                        <div key={idx} className="p-6 border border-brand-dark/5 relative group bg-white">
                          <p className="text-xs font-bold tracking-widest uppercase mb-2">{addr.label || 'Home'}</p>
                          <p className="text-sm text-gray-500 leading-relaxed">
                            {addr.street}<br />
                            {addr.city}, {addr.state} {addr.zip}<br />
                            {addr.country}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-20 text-center border-2 border-dashed border-brand-dark/5">
                        <MapPin size={32} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-sm text-gray-400 italic">No addresses saved yet.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'payments' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
                  <div className="flex justify-between items-center">
                    <h3 className="text-3xl font-serif font-bold">Payment Methods</h3>
                    <button 
                      onClick={() => setIsAddingPayment(!isAddingPayment)}
                      className="btn-primary !py-2 !px-4 !text-[10px]"
                    >
                      {isAddingPayment ? 'Cancel' : 'Add Card'}
                    </button>
                  </div>

                  {isAddingPayment && (
                    <form onSubmit={handleAddPayment} className="bg-brand-cream/20 p-6 border border-brand-dark/5 space-y-4">
                      <input 
                        placeholder="Card Number" 
                        className="input-field" 
                        value={paymentForm.cardNumber}
                        onChange={(e) => setPaymentForm({...paymentForm, cardNumber: e.target.value})}
                        required
                      />
                      <input 
                        placeholder="Cardholder Name" 
                        className="input-field" 
                        value={paymentForm.cardholder}
                        onChange={(e) => setPaymentForm({...paymentForm, cardholder: e.target.value})}
                        required
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input 
                          placeholder="MM/YY" 
                          className="input-field" 
                          value={paymentForm.expiry}
                          onChange={(e) => setPaymentForm({...paymentForm, expiry: e.target.value})}
                          required
                        />
                        <input 
                          placeholder="CVV" 
                          className="input-field" 
                          type="password"
                          value={paymentForm.cvv}
                          onChange={(e) => setPaymentForm({...paymentForm, cvv: e.target.value})}
                          required
                        />
                      </div>
                      <button type="submit" className="btn-primary w-full">Save Card</button>
                    </form>
                  )}

                  <div className="space-y-4">
                    {profileData?.payments?.length > 0 ? (
                      profileData.payments.map((card: any, idx: number) => (
                        <div key={idx} className="p-6 border border-brand-dark/5 flex items-center justify-between bg-white">
                          <div className="flex items-center">
                            <div className="w-12 h-8 bg-brand-dark rounded flex items-center justify-center text-white mr-6">
                              <CreditCard size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold tracking-widest uppercase">•••• •••• •••• {card.last4}</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-widest">Expires {card.expiry}</p>
                            </div>
                          </div>
                          {card.isDefault && <span className="text-[9px] font-bold tracking-widest uppercase text-brand-gold border border-brand-gold px-2 py-1">Default</span>}
                        </div>
                      ))
                    ) : (
                      <div className="py-20 text-center border-2 border-dashed border-brand-dark/5">
                        <CreditCard size={32} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-sm text-gray-400 italic">No payment methods saved yet.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
