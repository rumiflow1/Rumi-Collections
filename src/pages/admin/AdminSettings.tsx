import React, { useEffect, useState } from 'react';
import { Globe, Lock, Save, RefreshCw, Shield, Truck } from 'lucide-react';
import axios from 'axios';
import { useConfig } from '../../context/ConfigContext';
import type { Currency } from '../../context/AppContext';

const CURRENCIES: Currency[] = ['USD', 'PKR', 'EUR', 'GBP', 'INR', 'SAR', 'AED'];

export default function AdminSettings() {
  const { SiteConfig, loading, refreshConfig } = useConfig();
  const [config, setConfig] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (SiteConfig) setConfig(JSON.parse(JSON.stringify(SiteConfig)));
  }, [SiteConfig]);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await axios.post('/api/admin/config', config);
      await refreshConfig();
      setMessage('Settings synchronized.');
    } catch (error) {
      console.error('[admin-settings]', error);
      setMessage('Settings could not be synchronized.');
    } finally {
      setSaving(false);
      window.setTimeout(() => setMessage(''), 3000);
    }
  };

  const setSetting = (key: string, value: any) => setConfig((prev: any) => ({ ...prev, settings: { ...(prev?.settings || {}), [key]: value } }));
  const setShipping = (zone: string, key: string, value: number) => setConfig((prev: any) => ({ ...prev, settings: { ...(prev?.settings || {}), shippingRules: { ...(prev?.settings?.shippingRules || {}), [zone]: { ...(prev?.settings?.shippingRules?.[zone] || {}), [key]: value } } } }));

  if (loading || !config) return <div className="flex justify-center p-20"><RefreshCw className="animate-spin text-brand-gold" size={32} /></div>;
  const currency = CURRENCIES.includes(config.settings?.baseCurrency) ? config.settings.baseCurrency : 'PKR';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <section className="rounded-[2rem] bg-[#111] border border-white/5 p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div><p className="text-[10px] uppercase tracking-[.3em] text-brand-gold font-bold">DENFIT control center</p><h2 className="text-3xl font-serif font-bold text-white mt-2">Store Settings</h2><p className="text-xs text-gray-500 mt-2">Brand identity, currency and fulfilment rules.</p></div>
        <button onClick={save} disabled={saving} className="px-7 py-3 bg-brand-gold text-black rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">{saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />} Synchronize</button>
      </section>

      {message && <div className="rounded-xl border border-brand-gold/20 bg-brand-gold/5 px-5 py-3 text-xs font-bold uppercase tracking-widest text-brand-gold">{message}</div>}

      <section className="rounded-[2rem] bg-[#111] border border-white/5 p-8 space-y-6">
        <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2"><Globe size={19} className="text-brand-gold" /> Brand & Currency</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Field label="Brand Name" value={config.header?.logoText || 'DENFIT'} onChange={(value) => setConfig((p: any) => ({ ...p, header: { ...(p.header || {}), logoText: value } }))} />
          <Field label="Support Email" value={config.settings?.supportEmail || 'support@denfit.shop'} onChange={(value) => setSetting('supportEmail', value)} />
          <div><label className="block text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">Store Currency</label><select value={currency} onChange={(e) => setSetting('baseCurrency', e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-brand-gold">{CURRENCIES.map(code => <option key={code} value={code}>{code}</option>)}</select></div>
        </div>
        <div className="rounded-2xl bg-white/[.02] border border-white/5 p-5"><p className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-3">Available customer currencies</p><div className="flex flex-wrap gap-2">{CURRENCIES.map(code => <span key={code} className={`px-3 py-1 rounded-full text-[10px] font-bold border ${code === currency ? 'border-brand-gold text-brand-gold bg-brand-gold/5' : 'border-white/10 text-gray-500'}`}>{code}</span>)}</div></div>
      </section>

      <section className="rounded-[2rem] bg-[#111] border border-white/5 p-8 space-y-6">
        <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2"><Truck size={19} className="text-brand-gold" /> Shipping Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{(['domestic', 'international'] as const).map(zone => <div key={zone} className="rounded-2xl border border-white/5 bg-white/[.02] p-6 space-y-5"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-gold">{zone === 'domestic' ? 'Domestic' : 'International'}</p><p className="text-[9px] text-gray-500 mt-1">Amounts are stored in {currency} and converted for the customer's selected currency.</p></div><div className="grid grid-cols-2 gap-4"><MoneyField label="Free threshold" currency={currency} value={config.settings?.shippingRules?.[zone]?.freeThreshold || 0} onChange={(value) => setShipping(zone, 'freeThreshold', value)} /><MoneyField label="Flat fee" currency={currency} value={config.settings?.shippingRules?.[zone]?.flatFee || 0} onChange={(value) => setShipping(zone, 'flatFee', value)} /></div></div>)}</div>
      </section>

      <section className="rounded-[2rem] bg-[#111] border border-white/5 p-8"><h3 className="text-lg font-serif font-bold text-white flex items-center gap-2"><Lock size={19} className="text-brand-gold" /> Security</h3><div className="mt-5 rounded-2xl border border-red-500/10 bg-red-500/5 p-5 flex items-center gap-4"><Shield className="text-red-400" size={22} /><div><p className="text-sm font-bold text-white">Admin access protected</p><p className="text-[10px] uppercase tracking-widest text-gray-500 mt-1">Only authorized identities can access store controls.</p></div></div></section>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <div><label className="block text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">{label}</label><input value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-brand-gold" /></div>; }
function MoneyField({ label, currency, value, onChange }: { label: string; currency: string; value: number; onChange: (value: number) => void }) { return <div><label className="block text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-2">{label} ({currency})</label><input type="number" value={value} onChange={e => onChange(Number(e.target.value))} className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-sm text-white outline-none focus:border-brand-gold" /></div>; }
