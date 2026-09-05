import { useEffect, useState } from 'react';
import { X, Package, Truck, CheckCircle2, Clock3 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { orderApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { useAppContext } from '../context/AppContext';
import { resolveImageUrl } from '../lib/utils';

export default function OrderDetailsBridge() {
  const location = useLocation(); const { user } = useAuth(); const { formatPrice } = useAppContext();
  const [order, setOrder] = useState<any>(null); const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (location.pathname !== '/profile') return;
    const onClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement | null; const button = target?.closest('button');
      if (!button || button.textContent?.trim().toLowerCase() !== 'view details' || !user?.uid) return;
      const card = button.closest('.border.border-brand-dark\\/5'); const text = card?.textContent || '';
      const idMatch = text.match(/[a-f0-9]{24}/i); if (!idMatch) return;
      setLoading(true);
      try { const response = await orderApi.getUserOrders(user.uid); const found = (Array.isArray(response.data) ? response.data : []).find((item:any)=>String(item._id||item.id)===idMatch[0]); if(found) setOrder(found); }
      catch(error){ console.warn('[order-details] unable to load order',error); }
      finally{ setLoading(false); }
    };
    document.addEventListener('click', onClick); return () => document.removeEventListener('click', onClick);
  }, [location.pathname, user?.uid]);
  if (!order && !loading) return null;
  const status=String(order?.status||'Pending'); const steps=[['Confirmed',CheckCircle2],['Packed',Package],['Shipped',Truck],['Delivered',CheckCircle2]] as const;
  const normalized=status.toLowerCase(); const reached=(label:string)=>normalized===label.toLowerCase()||(['packed','on the way','shipped','delivered'].includes(normalized)&&['Confirmed'].includes(label))||(['on the way','shipped','delivered'].includes(normalized)&&label==='Packed')||(['delivered'].includes(normalized)&&label==='Shipped');
  return <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={()=>!loading&&setOrder(null)}>{loading&&!order?<div className="bg-white p-10 shadow-2xl"><Clock3 className="animate-spin text-brand-gold mx-auto"/></div>:<div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto bg-white shadow-2xl" onClick={e=>e.stopPropagation()}><button onClick={()=>setOrder(null)} className="absolute right-5 top-5 z-10 p-2 rounded-full bg-white border border-black/10"><X size={18}/></button><div className="bg-[#090909] text-white p-8"><p className="text-[10px] tracking-[.25em] uppercase text-brand-gold">Order details</p><h2 className="text-2xl font-serif mt-2">#{String(order._id||order.id)}</h2><p className="text-xs text-white/60 mt-2">{new Date(order.createdAt||order.date||Date.now()).toLocaleString()}</p></div><div className="p-7"><div className="grid grid-cols-4 gap-2 mb-8">{steps.map(([label,Icon])=><div key={label} className="text-center"><div className={`mx-auto w-9 h-9 rounded-full flex items-center justify-center ${reached(label)?'bg-brand-gold text-white':'bg-gray-100 text-gray-400'}`}><Icon size={17}/></div><p className="text-[9px] uppercase tracking-widest mt-2">{label}</p></div>)}</div><div className="space-y-3">{(order.items||[]).map((item:any,index:number)=><div key={index} className="flex gap-4 border-t border-black/5 pt-4"><div className="w-16 h-20 bg-brand-cream/40 shrink-0 overflow-hidden">{(item.image||item.images?.[0])&&<img src={resolveImageUrl(item.image||item.images?.[0])} alt={item.name||item.title||'Product'} className="w-full h-full object-cover"/>}</div><div className="flex-1"><p className="font-serif font-bold">{item.name||item.title||'Product'}</p><p className="text-[10px] text-gray-400 uppercase tracking-wider mt-1">Qty {item.quantity||1}{item.size?` · Size ${item.size}`:''}{item.color?` · ${item.color}`:''}</p></div><p className="font-bold text-sm">{formatPrice(Number(item.price||0)*Number(item.quantity||1),order.currency||'USD' as any)}</p></div>)}</div><div className="mt-7 pt-5 border-t border-black/10 space-y-2 text-sm"><div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatPrice(Number(order.subtotal||0),order.currency||'USD' as any)}</span></div>{Number(order.discountAmount||0)>0&&<div className="flex justify-between text-brand-gold"><span>Discount</span><span>-{formatPrice(Number(order.discountAmount),order.currency||'USD' as any)}</span></div>}<div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{Number(order.shippingCost||0)>0?formatPrice(Number(order.shippingCost),order.currency||'USD' as any):'Complimentary'}</span></div><div className="flex justify-between text-lg font-serif font-bold pt-3 border-t border-black/5"><span>Total</span><span>{formatPrice(Number(order.totalAmount||0),order.currency||'USD' as any)}</span></div></div><div className="mt-7 p-4 bg-brand-cream/30 border border-brand-gold/10 text-xs text-gray-600"><p className="font-bold text-brand-dark uppercase tracking-widest text-[9px] mb-2">Shipping address</p><p>{order.shippingAddress?.street||order.shippingDetails?.address?.line1||''}</p><p>{[order.shippingAddress?.city,order.shippingAddress?.state,order.shippingAddress?.zip,order.shippingAddress?.country].filter(Boolean).join(', ')}</p></div></div></div>}</div>;
}
