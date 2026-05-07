import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../hooks/useCart';
import { db, handleFirestoreError } from '../firebase';
import { OperationType } from '../types';
import { doc, onSnapshot } from 'firebase/firestore';
import { ShieldCheck, CreditCard, MapPin, ChevronRight, ArrowLeft, Truck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { authApi, orderApi } from '../services/api';
import axios from 'axios';

import { useConfig } from '../context/ConfigContext';
import { useAppContext } from '../context/AppContext';

export default function Checkout() {
  const { user, loading } = useAuth();
  const { cart, total, clearCart } = useCart();
  const { SiteConfig } = useConfig();
  const { formatPrice } = useAppContext();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<any>(null);
  
  // Shipping logic must use converted total for threshold comparison
  // SiteConfig threshold is in PKR
  const convertedTotal = total * 278.50; // Manual PKR rate for logic consistency
  const shippingRules = SiteConfig?.settings?.shippingRules?.domestic || { flatFee: 200, freeThreshold: 3000 };
  const shippingCost = convertedTotal >= shippingRules.freeThreshold ? 0 : (shippingRules.flatFee / 278.50);
  const finalTotal = total + shippingCost;
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOrderPlaced, setIsOrderPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod'>('card');
  const [orderId, setOrderId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    zip: '',
    country: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  useEffect(() => {
    // 🛡️ Redirect if no user (Checkout requires identity)
    if (!user && !loading) {
      console.log("[CHECKOUT]: Unauthorized access, redirecting to Auth.");
      navigate('/auth?redirect=checkout');
      return;
    }
    
    if (!user) return;
    
    console.log("[CHECKOUT]: Identity confirmed, fetching profile for:", user.email);
    const fetchProfile = async () => {
      try {
        const response = await authApi.getProfile(user.uid);
        if (response.data) {
          const data = response.data;
          setProfileData(data);
          setFormData(prev => ({
            ...prev,
            email: user.email || data.email || '',
            fullName: data.displayName || '',
            phone: data.phone || ''
          }));
          if (data.addresses?.length > 0) {
            const def = data.addresses[0];
            setSelectedAddress(def);
            setFormData(prev => ({
              ...prev,
              address: def.street,
              city: def.city,
              zip: def.zip,
              country: def.country
            }));
          }
        }
      } catch (err) {
        console.warn("Failed to fetch profile from backend API, using Firestore fallback:", err);
        // Use Firestore as fallback Source of truth
        const path = `users/${user.uid}`;
        const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnapshot) => {
          if (docSnapshot.exists()) {
            const data = docSnapshot.data();
            setProfileData(data);
            setFormData(prev => ({
              ...prev,
              email: user.email || data.email || '',
              fullName: data.displayName || '',
              phone: data.phone || ''
            }));
            if (data.addresses?.length > 0) {
              const def = data.addresses[0];
              setSelectedAddress(def);
              setFormData(prev => ({
                ...prev,
                address: def.street || def.address || '',
                city: def.city || '',
                zip: def.zip || '',
                country: def.country || ''
              }));
            }
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, path);
        });

        return () => unsubscribe();
      }
    };

    fetchProfile();
  }, [user]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      const orderData = {
        userId: user?.uid || 'GUEST',
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        shippingAddress: {
          street: formData.address,
          city: formData.city,
          zip: formData.zip,
          country: formData.country
        },
        paymentMethod,
        items: cart,
        totalAmount: finalTotal,
        status: 'Pending'
      };

      const response = await orderApi.placeOrder(orderData);
      const orderId = response.data.orderId || response.data.id || response.data._id;
      setOrderId(orderId);
      
      setIsOrderPlaced(true);
      clearCart();
    } catch (err) {
      console.error('Failed to place order:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isOrderPlaced) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream/30 px-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white p-12 text-center shadow-2xl border border-brand-dark/5"
        >
          <div className="w-20 h-20 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-8">
            <ShieldCheck size={40} />
          </div>
          <h2 className="text-3xl font-serif font-bold mb-4 uppercase tracking-wider">Order Confirmed</h2>
          {orderId && <p className="text-xs font-bold text-brand-gold mb-4 tracking-widest">ORDER #{orderId}</p>}
          <p className="text-gray-500 text-sm leading-relaxed mb-10 uppercase tracking-widest">
            Thank you for choosing Luxe Attire. Your order has been placed successfully and is being prepared for shipment.
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => navigate('/profile')}
              className="w-full btn-primary"
            >
              Track your order
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:text-brand-dark transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-serif font-bold">Your bag is empty</h2>
          <Link to="/products" className="btn-primary inline-block">Return to Shop</Link>
        </div>
      </div>
    );
  }

  if (!user && !loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-brand-cream/30 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-12">
          <Link to="/" className="mb-8">
            <h1 className="text-4xl font-serif font-bold tracking-[0.3em] uppercase">
              Luxe <span className="text-brand-gold italic">Attire</span>
            </h1>
          </Link>
          <div className="flex items-center space-x-4 text-[10px] font-bold tracking-widest uppercase text-gray-400">
            <Link to="/cart" className="hover:text-brand-dark transition-colors">Bag</Link>
            <ChevronRight size={12} />
            <span className="text-brand-dark">Checkout</span>
            <ChevronRight size={12} />
            <span>Confirmation</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Section */}
          <div className="lg:col-span-7 space-y-8">
            <form onSubmit={handlePlaceOrder} className="space-y-8">
              {/* Contact Info */}
              <section className="bg-white p-8 border border-brand-dark/5 shadow-sm">
                <h2 className="text-xl font-serif font-bold mb-6">Contact Information</h2>
                <div className="space-y-4">
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    className="input-field"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="Full Name" 
                      className="input-field"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      required
                    />
                    <input 
                      type="tel" 
                      placeholder="Phone Number" 
                      className="input-field"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Shipping Address */}
              <section className="bg-white p-8 border border-brand-dark/5 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-serif font-bold">Shipping Address</h2>
                  {profileData?.addresses?.length > 0 && (
                    <button type="button" className="text-[10px] font-bold tracking-widest uppercase text-brand-gold hover:underline">
                      Use Saved
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Street Address" 
                    className="input-field"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    required
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <input 
                      type="text" 
                      placeholder="City" 
                      className="input-field"
                      value={formData.city}
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Postal Code" 
                      className="input-field"
                      value={formData.zip}
                      onChange={(e) => setFormData({...formData, zip: e.target.value})}
                      required
                    />
                    <input 
                      type="text" 
                      placeholder="Country" 
                      className="input-field"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                      required
                    />
                  </div>
                </div>
              </section>

              {/* Payment Method */}
              <section className="bg-white p-8 border border-brand-dark/5 shadow-sm">
                <h2 className="text-xl font-serif font-bold mb-6">Payment Method</h2>
                
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 border flex flex-col items-center space-y-2 transition-all ${paymentMethod === 'card' ? 'border-brand-gold bg-brand-gold/5' : 'border-brand-dark/10 hover:border-brand-gold/50'}`}
                  >
                    <CreditCard size={20} className={paymentMethod === 'card' ? 'text-brand-gold' : 'text-gray-400'} />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Credit Card</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 border flex flex-col items-center space-y-2 transition-all ${paymentMethod === 'cod' ? 'border-brand-gold bg-brand-gold/5' : 'border-brand-dark/10 hover:border-brand-gold/50'}`}
                  >
                    <Truck size={20} className={paymentMethod === 'cod' ? 'text-brand-gold' : 'text-gray-400'} />
                    <span className="text-[10px] font-bold tracking-widest uppercase">Cash on Delivery</span>
                  </button>
                </div>

                {paymentMethod === 'card' ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Card Number" 
                        className="input-field"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                        required={paymentMethod === 'card'}
                      />
                      <CreditCard size={18} className="absolute right-0 bottom-3 text-gray-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <input 
                        type="text" 
                        placeholder="MM/YY" 
                        className="input-field"
                        value={formData.expiry}
                        onChange={(e) => setFormData({...formData, expiry: e.target.value})}
                        required={paymentMethod === 'card'}
                      />
                      <input 
                        type="password" 
                        placeholder="CVV" 
                        className="input-field"
                        value={formData.cvv}
                        onChange={(e) => setFormData({...formData, cvv: e.target.value})}
                        required={paymentMethod === 'card'}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-brand-cream/30 border border-brand-gold/10 text-center">
                    <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
                      Pay with cash upon delivery of your order. Please ensure someone is available to receive the package.
                    </p>
                  </div>
                )}

                <div className="mt-6 flex items-center text-[10px] text-gray-400 uppercase tracking-widest">
                  <ShieldCheck size={14} className="mr-2 text-brand-gold" />
                  Your payment information is encrypted and secure.
                </div>
              </section>

              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full btn-primary !py-5 text-base flex items-center justify-center"
              >
                {isProcessing ? 'Processing...' : `Place Order • ${formatPrice(finalTotal)}`}
              </button>
            </form>
          </div>

          {/* Order Summary Section */}
          <div className="lg:col-span-5">
            <div className="bg-white p-8 border border-brand-dark/5 shadow-sm sticky top-32">
              <h2 className="text-xl font-serif font-bold mb-8 border-b border-brand-dark/5 pb-4">Order Summary</h2>
              
              <div className="max-h-[400px] overflow-y-auto pr-2 space-y-6 mb-8">
                {cart.map((item) => (
                  <div key={`${item.productId}-${item.size}-${item.color}`} className="flex space-x-4">
                    <div className="w-16 aspect-[3/4] bg-gray-100 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-sm font-bold tracking-tight">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest">Qty: {item.quantity} | Size: {item.size}</p>
                      <p className="text-sm font-serif font-bold mt-1">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 border-t border-brand-dark/5 pt-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className={shippingCost === 0 ? "text-brand-gold font-bold uppercase tracking-widest text-[10px]" : "font-bold"}>
                    {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-serif font-bold pt-4 border-t border-brand-dark/5">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-brand-cream/50 border border-brand-gold/20 flex items-start space-x-3">
                <ShieldCheck size={20} className="text-brand-gold flex-shrink-0" />
                <p className="text-[10px] text-gray-500 leading-relaxed uppercase tracking-wider">
                  Luxe Attire guarantees the authenticity of every item. Your purchase includes our premium packaging and signature gift box.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
