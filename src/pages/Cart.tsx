import { useState } from 'react';
import axios from 'axios';
import { useCart } from '../hooks/useCart';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useConfig } from '../context/ConfigContext';
import DynamicText from '../components/DynamicText';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, total } = useCart();
  const { addToast, formatPrice } = useAppContext();
  const { SiteConfig } = useConfig();
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const navigate = useNavigate();

  const handleApplyDiscount = async () => {
    try {
      const response = await axios.post('/api/discounts/verify', { code: discountCode });
      const { discount } = response.data;
      setDiscountAmount(total * (discount / 100));
      addToast(`${discount}% discount applied!`, 'success');
    } catch (error: any) {
      addToast(error.response?.data?.message || 'Invalid discount code.', 'error');
    }
  };

  const shippingRules = SiteConfig?.settings?.shippingRules?.domestic || { flatFee: 50, freeThreshold: 500 };
  const shippingCost = total >= shippingRules.freeThreshold ? 0 : shippingRules.flatFee;
  const finalTotal = total - discountAmount + shippingCost;

  if (cart.length === 0) {
    return (
      <main className="py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-20 h-20 bg-brand-cream border border-brand-dark/5 rounded-full flex items-center justify-center text-gray-400">
            <ShoppingBag size={32} />
          </div>
          <h1 className="text-3xl font-serif font-bold">
            <DynamicText id="cart_empty" defaultContent={SiteConfig?.header?.cart?.emptyText || "Your cart is empty"} />
          </h1>
          <p className="text-gray-500 max-w-xs mx-auto">Looks like you haven't added anything to your cart yet. Explore our collections to find something you love.</p>
          <Link to="/products" className="btn-primary">
            <DynamicText id="cart_start_shopping" defaultContent="Start Shopping" />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl font-serif font-bold mb-12">
        <DynamicText id="cart_title" defaultContent={SiteConfig?.header?.cart?.title || "Your cart"} />
      </h1>
      
      <div className="flex flex-col lg:flex-row gap-16">
        {/* Cart Items */}
        <div className="lg:w-2/3 space-y-8">
          {cart.map((item) => (
            <div key={`${item.productId}-${item.size}-${item.color}`} className="flex space-x-6 pb-8 border-b border-brand-dark/5">
              <div className="w-32 aspect-[3/4] bg-gray-100 overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-grow flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-serif font-bold mb-1">{item.name}</h3>
                    <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">
                      Size: {item.size} | Color: {item.color}
                    </p>
                  </div>
                  <p className="font-serif font-bold">{formatPrice(item.price * item.quantity)}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center border border-brand-dark/10">
                    <button 
                      onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity - 1)}
                      className="p-2 hover:bg-brand-dark hover:text-white transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-4 text-sm font-medium">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.productId, item.size, item.color, item.quantity + 1)}
                      className="p-2 hover:bg-brand-dark hover:text-white transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  
                  <button 
                    onClick={() => removeFromCart(item.productId, item.size, item.color)}
                    className="text-gray-400 hover:text-red-500 transition-colors flex items-center text-xs uppercase font-bold tracking-widest"
                  >
                    <Trash2 size={14} className="mr-2" /> <DynamicText id="cart_remove_label" defaultContent="Remove" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white p-8 border border-brand-dark/5 space-y-6">
            <h2 className="text-xl font-serif font-bold border-b border-brand-dark/5 pb-4">
               <DynamicText id="cart_summary_title" defaultContent="Order Summary" />
            </h2>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-bold">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className={shippingCost === 0 ? "text-brand-gold font-bold uppercase tracking-widest text-[10px]" : "font-bold"}>
                  {shippingCost === 0 ? 'Free' : formatPrice(shippingCost)}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-brand-gold">
                  <span className="flex items-center"><Tag size={12} className="mr-1" /> Discount</span>
                  <span className="font-bold">-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Estimated Tax</span>
                <span className="font-bold">{formatPrice(0)}</span>
              </div>
            </div>

            {/* Discount Code */}
            <div className="pt-4">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="Discount Code" 
                  className="input-field !py-2"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                />
                <button 
                  onClick={handleApplyDiscount}
                  className="btn-primary !py-2 !px-4 !text-[10px]"
                >
                  <DynamicText id="cart_apply_discount_btn" defaultContent="Apply" />
                </button>
              </div>
                  <div className="flex border-t border-brand-dark/5 pt-6 justify-between items-center bg-brand-gold/5 p-4 mt-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold">Shipping Policy</span>
                    <span className="text-xs text-brand-dark">
                      {total >= shippingRules.freeThreshold 
                        ? 'Congratulations! You qualify for Free Luxury Shipping.' 
                        : `Add ${formatPrice(shippingRules.freeThreshold - total)} more for complimentary shipping.`
                      }
                    </span>
                  </div>
                </div>
            </div>
            
            <div className="border-t border-brand-dark/5 pt-6 flex justify-between items-center">
              <span className="text-lg font-serif font-bold">Total</span>
              <span className="text-2xl font-serif font-bold">{formatPrice(finalTotal)}</span>
            </div>
            
            <button 
              onClick={() => navigate('/checkout')}
              className="w-full btn-primary flex items-center justify-center group"
            >
              <DynamicText id="cart_checkout_btn" defaultContent={SiteConfig?.header?.cart?.checkoutBtnText || "Checkout"} /> 
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <div className="pt-4 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em]">Secure Checkout Guaranteed</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
