import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ChevronDown, Printer, FileText, ExternalLink, X, AlertTriangle, RefreshCcw, Pencil, Plus, Trash2, Search, Link2, History, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import logoUrl from '../../assets/logo.png';
import { ShippoConfigModal } from '../../components/admin/ShippoConfigModal';
import AddressAutocomplete from '../../components/AddressAutocomplete';
import { useLoadScript } from '@react-google-maps/api';
import { supabase } from '../../utils/supabase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";
const FROM_ADDRESS = {
  name: "LYDIA GLOBAL EXIM",
  line1: "8-20/SHR/401, Nizampet Road, Nizampet",
  city: "Hyderabad",
  state: "Telangana",
  pincode: "500090",
  phone: "+91 9014863411",
};

const SHIPPING_STATUSES = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];
const PICKUP_STATUSES = ["pending", "processing", "ready for pickup", "pickup completed", "cancelled"];
const STATUSES = [...new Set([...SHIPPING_STATUSES, ...PICKUP_STATUSES])];

const STATUS_COLORS = {
  pending: "bg-gray-100 text-gray-700",
  paid: "bg-blue-100 text-blue-700",
  processing: "bg-yellow-100 text-yellow-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  "ready for pickup": "bg-orange-100 text-orange-700",
  "pickup completed": "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

// ─── BalanceDuePanel ──────────────────────────────────────────────────────────
function BalanceDuePanel({ order, onUpdate }) {
  const balance = parseFloat(order.balance_due) || 0;
  const [busy, setBusy] = useState(false);
  const [markMethod, setMarkMethod] = useState('cash');
  const [showMarkPaid, setShowMarkPaid] = useState(false);
  const token = () => localStorage.getItem('token');

  const addr = (() => { try { return typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch { return {}; } })();
  const phone = (addr.mobile || '').replace(/\D/g, '');

  const sendWhatsApp = (link) => {
    const msg = encodeURIComponent(
      `Hi ${addr.name || order.user_name || 'Customer'}, your order #${order.order_number || order.id} has been updated.\n\n` +
      `A balance of *$${balance.toFixed(2)}* is due.\n\nPay securely here: ${link}`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handleResend = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/orders/${order.id}/resend-payment-link`, {
        method: 'POST', headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (data.success) {
        onUpdate({ ...order, payment_link_url: data.payment_link_url });
        sendWhatsApp(data.payment_link_url);
      } else alert(data.error);
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  const handleMarkPaid = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/orders/${order.id}/mark-balance-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ method: markMethod }),
      });
      const data = await res.json();
      if (data.success) {
        onUpdate({ ...order, balance_due: 0, payment_link_url: null });
        setShowMarkPaid(false);
      } else alert(data.error);
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-amber-800">💳 Balance Due: ${balance.toFixed(2)}</p>
          <p className="text-[10px] text-amber-600 mt-0.5">Customer needs to pay this amount</p>
        </div>
        <span className="text-[10px] font-bold bg-amber-200 text-amber-800 px-2 py-1 rounded-full">PENDING</span>
      </div>

      {/* Payment link row */}
      {order.payment_link_url ? (
        <div className="bg-white border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <Link2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <a href={order.payment_link_url} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-blue-600 underline truncate flex-1">{order.payment_link_url}</a>
          <button onClick={() => navigator.clipboard.writeText(order.payment_link_url)}
            className="text-[10px] font-bold text-[#45055B] bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors shrink-0">Copy</button>
        </div>
      ) : (
        <p className="text-[10px] text-amber-600">No payment link yet — click “New Link” to generate one.</p>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {order.payment_link_url && (
          <button onClick={() => sendWhatsApp(order.payment_link_url)} disabled={!phone}
            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-40">
            <MessageCircle className="w-3.5 h-3.5" /> Send via WhatsApp
          </button>
        )}
        <button onClick={handleResend} disabled={busy}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors disabled:opacity-40">
          <Link2 className="w-3.5 h-3.5" /> {order.payment_link_url ? 'New Link' : 'Generate Link'}
        </button>
        <button onClick={() => setShowMarkPaid(p => !p)}
          className="flex items-center gap-1.5 bg-[#45055B] hover:bg-[#45055B]/80 text-white text-xs font-bold px-3 py-2 rounded-lg transition-colors">
          ✓ Mark as Paid
        </button>
      </div>

      {/* Mark paid inline form */}
      {showMarkPaid && (
        <div className="bg-white border border-amber-200 rounded-lg p-3 space-y-2">
          <p className="text-xs font-bold text-[#45055B]">How was the balance paid?</p>
          <div className="flex flex-wrap gap-2">
            {['cash', 'upi', 'bank_transfer', 'stripe', 'other'].map(m => (
              <button key={m} onClick={() => setMarkMethod(m)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors capitalize ${markMethod === m ? 'bg-[#45055B] text-white border-[#45055B]' : 'bg-white text-[#45055B]/60 border-[#45055B]/20 hover:border-[#45055B]/40'
                  }`}>{m.replace('_', ' ')}</button>
            ))}
          </div>
          <button onClick={handleMarkPaid} disabled={busy}
            className="w-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-50">
            {busy ? 'Saving...' : `Confirm — ₹${balance.toFixed(2)} paid via ${markMethod.replace('_', ' ')}`}
          </button>
        </div>
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── EditOrderModal ───────────────────────────────────────────────────────────
function EditOrderModal({ order, onClose, onSaved }) {
  const parseJ = (v) => { try { return typeof v === 'string' ? JSON.parse(v) : (v || []); } catch { return []; } };
  const parseO = (v) => { try { return typeof v === 'string' ? JSON.parse(v) : (v || {}); } catch { return {}; } };

  const [items, setItems] = useState(() => parseJ(order.items));
  const [address, setAddress] = useState(() => parseO(order.address));

  // Extract country code and phone number
  const initialMobile = parseO(order.address).mobile || order.user_phone || '';
  const initialCountryCode = initialMobile.startsWith('+') ? (initialMobile.match(/^\+\d{1,3}/) || ['+1'])[0] : '+1';
  const initialPhone = initialMobile.startsWith('+') ? initialMobile.replace(/^\+\d{1,3}\s*/, '') : initialMobile;

  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [customerPhone, setCustomerPhone] = useState(initialPhone);

  const [trackingId, setTrackingId] = useState(order.tracking_id || '');
  const [trackingLink, setTrackingLink] = useState(order.tracking_link || '');

  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);

  const [applyProratedTax, setApplyProratedTax] = useState(true);
  const [applyProratedDiscount, setApplyProratedDiscount] = useState(true);
  const [emailingLink, setEmailingLink] = useState(false);

  // Product search for replacement
  const [allProducts, setAllProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [replacingIdx, setReplacingIdx] = useState(null); // index of item being replaced

  useEffect(() => {
    fetch(`${BACKEND_URL}/admin/products`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } })
      .then(r => r.json()).then(d => setAllProducts(d.products || [])).catch(() => { });
  }, []);

  const originalTax = parseFloat(order.tax_amount) || 0;
  const originalDiscount = parseFloat(order.discount_amount) || 0;
  const originalItemsTotal = parseJ(order.items).reduce((s, i) => s + (i.variant?.price || i.product?.price || 0) * (i.qty || 1), 0);

  const itemsTotal = items.reduce((s, i) => s + (i.variant?.price || i.product?.price || 0) * (i.qty || 1), 0);

  const ratio = originalItemsTotal > 0 ? (itemsTotal / originalItemsTotal) : 1;
  const currentTax = applyProratedTax ? (originalTax * ratio) : originalTax;
  const currentDiscount = applyProratedDiscount ? (originalDiscount * ratio) : originalDiscount;

  const shipping = parseFloat(order.shipping_fee) || 0;
  const addr = parseO(order.address);
  const signatureFee = parseFloat(addr.signature_fee) || 0;
  const insuranceFee = parseFloat(addr.insurance_fee) || 0;
  const newTotal = Math.max(0, itemsTotal + shipping + signatureFee + insuranceFee + currentTax - currentDiscount);
  const oldTotal = parseFloat(order.total) || 0;
  const diff = parseFloat((newTotal - oldTotal).toFixed(2));

  const filteredProducts = productSearch.trim()
    ? allProducts.flatMap(p => {
      const s = productSearch.toLowerCase();
      let variants = [];
      try { variants = typeof p.variants === 'string' ? JSON.parse(p.variants) : (p.variants || []); } catch { }

      const nameMatch = p.name?.toLowerCase().includes(s) || p.product_code?.toLowerCase().includes(s);
      let matches = [];

      if (variants.length > 0) {
        variants.forEach(v => {
          const vMatch = v.color?.toLowerCase().includes(s);
          (v.sizes || []).forEach(size => {
            if (nameMatch || vMatch || size.code?.toLowerCase().includes(s)) {
              matches.push({ product: p, variant: v, size: size });
            }
          });
        });
      } else {
        const sizes = parseJ(p.sizes);
        if (sizes.length > 0) {
          sizes.forEach(size => {
            if (nameMatch || size.code?.toLowerCase().includes(s)) {
              matches.push({ product: p, variant: null, size: size });
            }
          });
        } else if (nameMatch) {
          matches.push({ product: p, variant: null, size: null });
        }
      }
      return matches;
    }).slice(0, 15)
    : [];

  const resolvePrice = (itemData) => {
    const { size } = itemData;
    return size ? (Number(size.our_price) || Number(size.price) || 0) : 0;
  };

  const selectReplacement = (product) => {
    const variants = parseJ(product.variants);
    const sizes = parseJ(product.sizes);
    const firstVariant = variants[0];
    const firstSize = firstVariant?.sizes?.[0];
    const price = firstSize
      ? (Number(firstSize.our_price) || Number(firstSize.price) || 0)
      : (Number(sizes?.[0]?.our_price) || Number(sizes?.[0]?.price) || 0);
    const newItem = {
      product: { id: product.id, name: product.name, images: parseJ(product.images), image_url: product.image_url, variants, sizes },
      variant: firstVariant ? {
        color: firstVariant.color,
        size: firstSize?.size || '',
        price,
        image: firstVariant.images?.[0] || '',
      } : { size: sizes?.[0]?.size || 'Standard', price },
      qty: 1,
    };
    if (replacingIdx === 'new') {
      setItems(prev => [...prev, newItem]);
    } else {
      setItems(prev => prev.map((it, i) => i === replacingIdx ? newItem : it));
    }
    setReplacingIdx(null);
    setProductSearch('');
  };

  const updateQty = (idx, qty) => {
    const q = Math.max(1, parseInt(qty) || 1);
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, qty: q } : it));
  };

  const updateVariantSize = (idx, size) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const variants = it.product?.variants || [];
      const sizes = it.product?.sizes || [];
      for (const v of variants) {
        const s = (v.sizes || []).find(s => s.size === size);
        if (s) return { ...it, variant: { ...it.variant, size: s.size, price: Number(s.our_price) || Number(s.price) || 0 } };
      }
      const legacySize = sizes.find(s => s.size === size);
      if (legacySize) return { ...it, variant: { ...it.variant, size: legacySize.size, price: Number(legacySize.our_price) || Number(legacySize.price) || 0 } };
      return it;
    }));
  };

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const fullPhone = customerPhone.trim() ? `${countryCode} ${customerPhone.trim()}` : '';
      const res = await fetch(`${BACKEND_URL}/admin/orders/${order.id}/edit`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          items,
          address: { ...address, mobile: fullPhone },
          customer_phone: fullPhone,
          tracking_id: trackingId,
          tracking_link: trackingLink,
          tax_amount: currentTax,
          discount_amount: currentDiscount,
          note
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data);
        onSaved({ ...order, items: JSON.stringify(items), address: JSON.stringify({ ...address, mobile: customerPhone }), total: data.new_total, balance_due: data.balance_due, payment_link_url: data.payment_link_url });
      } else {
        setResult({ error: data.error || 'Failed to update order' });
      }
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setSaving(false);
    }
  };

  const sendPaymentLinkEmail = async (url, amount) => {
    setEmailingLink(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/orders/${order.id}/email-payment-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ payment_link_url: url, balance_due: amount })
      });
      const data = await res.json();
      if (data.success) {
        alert('Payment link sent to customer email successfully!');
      } else {
        alert(data.error || 'Failed to send email');
      }
    } catch (err) {
      alert('Network error while sending email');
    } finally {
      setEmailingLink(false);
    }
  };

  const sendPaymentLinkWhatsApp = (link) => {
    const addr = parseO(order.address);
    const phone = (customerPhone || addr.mobile || '').replace(/\D/g, '');
    const msg = encodeURIComponent(`Hi ${addr.name || order.user_name || 'Customer'}, your order #${order.order_number || order.id} has been updated. A balance of ₹${diff.toFixed(2)} is due. Please pay here: ${link}`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Pencil className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#45055B]">Edit Order #{order.order_number || order.id}</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        {result ? (
          <div className="p-6 space-y-4">
            {result.error ? (
              <div className="text-center">
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 font-semibold">{result.error}</p>
                <button onClick={() => setResult(null)} className="mt-4 px-6 py-2 bg-gray-100 rounded-xl text-sm font-bold">Try Again</button>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <RefreshCcw className="w-7 h-7 text-green-600" />
                  </div>
                  <h3 className="font-bold text-lg text-[#45055B]">Order Updated!</h3>
                  <p className="text-sm text-gray-500 mt-1">New total: <strong>${result.new_total?.toFixed(2)}</strong></p>
                </div>
                {result.balance_due > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-bold text-amber-800">💳 Balance Due: ${result.balance_due?.toFixed(2)}</p>
                    {result.payment_link_url && (
                      <>
                        <a href={result.payment_link_url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 text-xs text-blue-600 font-semibold underline break-all">
                          <Link2 className="w-3.5 h-3.5 shrink-0" />{result.payment_link_url}
                        </a>
                        <button onClick={() => sendPaymentLinkWhatsApp(result.payment_link_url)}
                          className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-xs font-bold transition-colors">
                          <MessageCircle className="w-4 h-4" /> Send Payment Link via WhatsApp
                        </button>
                        <button onClick={() => sendPaymentLinkEmail(result.payment_link_url, result.balance_due)} disabled={emailingLink}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
                          <Mail className="w-4 h-4" /> {emailingLink ? 'Sending Email...' : 'Send Payment Link via Email'}
                        </button>
                        <button onClick={() => { navigator.clipboard.writeText(result.payment_link_url); }}
                          className="w-full flex items-center justify-center gap-2 bg-[#45055B] text-white py-2.5 rounded-xl text-xs font-bold transition-colors">
                          <Link2 className="w-4 h-4" /> Copy Payment Link
                        </button>
                      </>
                    )}
                  </div>
                )}
                {Number(result.refund_amount) > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-sm font-bold text-green-800">✅ Refund of ${Number(result.refund_amount).toFixed(2)} issued</p>
                    {result.refund_id && <p className="text-xs text-gray-500 font-mono mt-1">ID: {result.refund_id}</p>}
                  </div>
                )}
                {diff === 0 && <p className="text-center text-sm text-gray-500">No price change — order updated.</p>}
                <button onClick={onClose} className="w-full bg-[#45055B] text-white font-bold py-2.5 rounded-xl hover:bg-[#45055B]/80 transition-colors">Done</button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-6 space-y-6">

            {/* Items */}
            <div>
              <p className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider mb-3">Items</p>
              <div className="space-y-2">
                {items.map((item, idx) => {
                  const price = (item.variant?.price || item.product?.price || 0);
                  const img = item.variant?.image || item.product?.images?.[0] || item.product?.image_url;
                  const variants = item.product?.variants || [];
                  const legacySizes = item.product?.sizes || [];
                  const allSizes = variants.length
                    ? variants.flatMap(v => (v.sizes || []).map(s => ({ size: s.size, price: Number(s.our_price) || Number(s.price) || 0, color: v.color })))
                    : legacySizes.map(s => ({ size: s.size, price: Number(s.our_price) || Number(s.price) || 0 }));
                  return (
                    <div key={idx} className="flex gap-3 items-start p-3 bg-[#FAF6F0] rounded-xl border border-[#45055B]/10">
                      {img && <img src={img} alt="" className="w-10 h-10 object-contain rounded-lg border border-gray-100 shrink-0" />}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-sm font-bold text-[#45055B] truncate">{item.product?.name}{item.variant?.color ? ` — ${item.variant.color}` : ''}</p>
                        <div className="flex flex-wrap gap-2">
                          {allSizes.length > 0 && (
                            <select value={item.variant?.size || ''} onChange={e => updateVariantSize(idx, e.target.value)}
                              className="text-xs border border-[#45055B]/20 rounded-lg px-2 py-1 bg-white text-[#45055B] focus:outline-none">
                              {allSizes.map(s => <option key={s.size} value={s.size}>{s.size} — ${s.price}</option>)}
                            </select>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Qty:</span>
                            <input type="number" min={1} value={item.qty} onChange={e => updateQty(idx, e.target.value)}
                              className="w-14 text-xs border border-[#45055B]/20 rounded-lg px-2 py-1 bg-white text-[#45055B] focus:outline-none" />
                          </div>
                          <span className="text-xs font-bold text-[#D4AF37] self-center">${(price * item.qty).toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <button onClick={() => { setReplacingIdx(idx); setProductSearch(''); }}
                          title="Replace item" className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <RefreshCcw className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => removeItem(idx)}
                          title="Remove item" className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => { setReplacingIdx('new'); setProductSearch(''); }}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-[#45055B]/30 text-[#45055B]/60 hover:text-[#45055B] hover:bg-[#FAF6F0] hover:border-[#45055B]/50 py-2.5 rounded-xl text-sm font-semibold transition-colors mt-2">
                  <Plus className="w-4 h-4" /> Add Product
                </button>
              </div>

              {/* Product search for replacement / addition */}
              {replacingIdx !== null && (
                <div className="mt-3 border border-blue-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-200">
                    <Search className="w-4 h-4 text-blue-400 shrink-0" />
                    <input autoFocus value={productSearch} onChange={e => setProductSearch(e.target.value)}
                      placeholder={replacingIdx === 'new' ? "Search products to add..." : `Replace item ${replacingIdx + 1} — search products...`}
                      className="flex-1 bg-transparent text-sm text-[#45055B] placeholder:text-gray-400 focus:outline-none" />
                    <button onClick={() => setReplacingIdx(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                  </div>
                  {filteredProducts.length > 0 && (
                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                      {filteredProducts.map((itemData, idx) => {
                        const { product, variant, size } = itemData;
                        const p = product;
                        const img = variant?.images?.[0] || (parseJ(p.images))[0] || p.image_url;
                        const displayName = `${p.name}${variant?.color ? ` — ${variant.color}` : ''}${size?.size ? ` (${size.size})` : ''}`;
                        return (
                          <button key={`${p.id}-${idx}`} onClick={() => selectReplacement(itemData)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left">
                            {img && <img src={img} alt="" className="w-8 h-8 object-contain rounded border border-gray-100 shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#45055B] truncate">{displayName}</p>
                              <p className="text-xs text-gray-500">${resolvePrice(itemData).toFixed(2)}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {productSearch && filteredProducts.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No products found</p>
                  )}
                </div>
              )}
            </div>

            {/* Shipping Address */}
            <div>
              <p className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider mb-3">Shipping Address</p>
              <div className="grid grid-cols-2 gap-2">
                {[['name', 'Full Name'], ['line1', 'Address Line 1'], ['line2', 'Line 2 (optional)'], ['city', 'City'], ['state', 'State'], ['pincode', 'ZIP']].map(([field, label]) => (
                  <div key={field} className={field === 'line1' ? 'col-span-2' : ''}>
                    <label className="text-[10px] font-bold text-[#45055B]/50 uppercase tracking-wider block mb-1">{label}</label>
                    {field === 'line1' ? (
                      <AddressAutocomplete
                        value={address[field] || ''}
                        onChange={val => setAddress(a => ({ ...a, [field]: val }))}
                        onSelect={place => setAddress(a => ({ ...a, line1: place.line1, city: place.city, state: place.state, pincode: place.pincode, country: place.country || 'United States' }))}
                      />
                    ) : (
                      <input value={address[field] || ''} onChange={e => setAddress(a => ({ ...a, [field]: e.target.value }))}
                        className="w-full text-sm border border-[#45055B]/15 rounded-xl px-3 py-2 bg-[#FAF6F0] text-[#45055B] focus:outline-none focus:border-[#45055B]/30" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Phone */}
            <div>
              <p className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider mb-2">Customer Phone</p>
              <div className="flex gap-2">
                <select value={countryCode} onChange={e => setCountryCode(e.target.value)}
                  className="w-24 text-sm border border-[#45055B]/15 rounded-xl px-2 py-2 bg-[#FAF6F0] text-[#45055B] focus:outline-none focus:border-[#45055B]/30">
                  <option value="+1">+1 (US/CA)</option>
                  <option value="+44">+44 (UK)</option>
                  <option value="+61">+61 (AU)</option>
                  <option value="+91">+91 (IN)</option>
                  <option value="+971">+971 (UAE)</option>
                  <option value="+966">+966 (SA)</option>
                  <option value="+65">+65 (SG)</option>
                </select>
                <input value={customerPhone} onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="555 000 0000"
                  className="flex-1 text-sm border border-[#45055B]/15 rounded-xl px-3 py-2 bg-[#FAF6F0] text-[#45055B] focus:outline-none focus:border-[#45055B]/30" />
              </div>
            </div>

            {/* Manual Tracking */}
            <div>
              <p className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider mb-2">Manual Tracking (For alternative partners)</p>
              <div className="grid grid-cols-2 gap-2">
                <input value={trackingId} onChange={e => setTrackingId(e.target.value)}
                  placeholder="Tracking ID (e.g. 1Z999999999)"
                  className="w-full text-sm border border-[#45055B]/15 rounded-xl px-3 py-2 bg-[#FAF6F0] text-[#45055B] focus:outline-none focus:border-[#45055B]/30" />
                <input value={trackingLink} onChange={e => setTrackingLink(e.target.value)}
                  placeholder="Tracking Link URL (https://...)"
                  className="w-full text-sm border border-[#45055B]/15 rounded-xl px-3 py-2 bg-[#FAF6F0] text-[#45055B] focus:outline-none focus:border-[#45055B]/30" />
              </div>
            </div>

            {/* Note */}
            <div>
              <p className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider mb-2">Edit Note (internal)</p>
              <input value={note} onChange={e => setNote(e.target.value)} placeholder="Reason for edit..."
                className="w-full text-sm border border-[#45055B]/15 rounded-xl px-3 py-2 bg-[#FAF6F0] text-[#45055B] focus:outline-none focus:border-[#45055B]/30" />
            </div>

            {/* Prorating Options */}
            {(originalTax > 0 || originalDiscount > 0) && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-bold text-[#45055B]/60 uppercase tracking-wider mb-1">Price Adjustments</p>
                {originalTax > 0 && (
                  <label className="flex items-center gap-2 text-sm text-[#45055B] cursor-pointer font-medium">
                    <input type="checkbox" checked={applyProratedTax} onChange={e => setApplyProratedTax(e.target.checked)} className="w-4 h-4 rounded text-[#45055B] focus:ring-[#45055B]" />
                    Prorate Tax calculation based on new item total
                  </label>
                )}
                {originalDiscount > 0 && (
                  <label className="flex items-center gap-2 text-sm text-[#45055B] cursor-pointer font-medium">
                    <input type="checkbox" checked={applyProratedDiscount} onChange={e => setApplyProratedDiscount(e.target.checked)} className="w-4 h-4 rounded text-[#45055B] focus:ring-[#45055B]" />
                    Prorate Discount based on new item total
                  </label>
                )}
              </div>
            )}

            {/* Price diff summary */}
            <div className={`rounded-xl px-4 py-3 border flex items-center justify-between ${diff > 0 ? 'bg-amber-50 border-amber-200' : diff < 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
              }`}>
              <div>
                <p className="text-xs font-bold text-[#45055B]">New Total: ${newTotal.toFixed(2)}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">Was: ${oldTotal.toFixed(2)}</p>
              </div>
              {diff !== 0 && (
                <span className={`text-sm font-bold ${diff > 0 ? 'text-amber-700' : 'text-green-700'}`}>
                  {diff > 0 ? `+₹${diff.toFixed(2)} balance due` : `-₹${Math.abs(diff).toFixed(2)} refund`}
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-[#45055B] rounded-xl font-semibold hover:bg-gray-200 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={saving || items.length === 0}
                className="flex-1 px-4 py-2.5 bg-[#45055B] text-white rounded-xl font-bold hover:bg-[#45055B]/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

function RefundModal({ order, refunding, refundResult, onConfirm, onClose }) {
  const items = (() => { try { return typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch (e) { return []; } })();
  
  let address = {};
  try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch(e) {}
  
  const getPrice = (i) => parseFloat(i.size?.our_price || i.size?.mrp || i.size?.price || i.variant?.price || i.product?.price || 0);
  const currentItemsTotal = items.reduce((s, i) => s + getPrice(i) * i.qty, 0);

  let rHist = [];
  try { rHist = typeof order.refund_history === 'string' ? JSON.parse(order.refund_history) : (order.refund_history || []); } catch(e) {}
  
  let alreadyRefundedShipping = 0;
  let alreadyRefundedTax = 0;
  let alreadyRefundedSignature = 0;
  let alreadyRefundedInsurance = 0;
  let alreadyDeductedDiscount = 0;
  
  for (const entry of rHist) {
    if (entry.breakdown) {
      alreadyRefundedShipping += parseFloat(entry.breakdown.shipping || 0);
      alreadyRefundedTax += parseFloat(entry.breakdown.tax || 0);
      alreadyRefundedSignature += parseFloat(entry.breakdown.signature || 0);
      alreadyRefundedInsurance += parseFloat(entry.breakdown.insurance || 0);
      alreadyDeductedDiscount += parseFloat(entry.breakdown.discount_deduction || 0);
    }
  }

  const orderTotal = parseFloat(order.total) || 0;
  const originalShipping = Math.max(0, parseFloat(order.shipping_fee) || 0);
  const originalTax = Math.max(0, parseFloat(order.tax_amount) || 0);
  const originalDiscount = Math.max(0, parseFloat(order.discount_amount) || 0);
  const originalSignature = parseFloat(address.signature_fee) || 0;
  const originalInsurance = parseFloat(address.insurance_fee) || 0;

  const remainingShipping = Math.max(0, originalShipping - alreadyRefundedShipping);
  const remainingTax = Math.max(0, originalTax - alreadyRefundedTax);
  const remainingSignature = Math.max(0, originalSignature - alreadyRefundedSignature);
  const remainingInsurance = Math.max(0, originalInsurance - alreadyRefundedInsurance);
  const remainingDiscount = Math.max(0, originalDiscount - alreadyDeductedDiscount);

  let snapshotCancelled = [];
  try { snapshotCancelled = typeof order.cancelled_items_snapshot === 'string' ? JSON.parse(order.cancelled_items_snapshot) : (order.cancelled_items_snapshot || []); } catch(e) {}
  const alreadyCancelledTotal = snapshotCancelled.reduce((s, i) => s + getPrice(i) * (i.cancelQty || i.qty), 0);
  
  const originalItemsTotal = currentItemsTotal + alreadyCancelledTotal;

  const [cancelType, setCancelType] = useState('refund');
  const [selectedQty, setSelectedQty] = useState(() => Object.fromEntries(items.map((it, i) => [i, it.qty])));

  const [refundShipping, setRefundShipping] = useState(true);
  const [refundTax, setRefundTax] = useState(true);
  const [refundSignature, setRefundSignature] = useState(true);
  const [refundInsurance, setRefundInsurance] = useState(true);
  const [refundDiscount, setRefundDiscount] = useState(true);

  const [chargeType, setChargeType] = useState('flat');
  const [chargeValue, setChargeValue] = useState(0);

  const updateQty = (idx, qty) => {
    const q = Math.max(0, Math.min(items[idx].qty, parseInt(qty) || 0));
    setSelectedQty(p => ({ ...p, [idx]: q }));
  };

  const selectedItemsTotal = items.reduce((s, item, idx) => s + getPrice(item) * (selectedQty[idx] || 0), 0);
  const allSelected = items.every((item, i) => selectedQty[i] === item.qty);
  const anySelected = items.some((item, i) => selectedQty[i] > 0);
  const isFullCancel = allSelected;

  const proratedTax = originalItemsTotal > 0 ? originalTax * (selectedItemsTotal / originalItemsTotal) : remainingTax;
  const proratedDiscount = originalItemsTotal > 0 ? originalDiscount * (selectedItemsTotal / originalItemsTotal) : remainingDiscount;

  const actualShippingRefund = refundShipping ? remainingShipping : 0;
  const actualTaxRefund = refundTax ? Math.min(remainingTax, isFullCancel ? remainingTax : proratedTax) : 0;
  const actualSignatureRefund = refundSignature ? remainingSignature : 0;
  const actualInsuranceRefund = refundInsurance ? remainingInsurance : 0;
  const actualDiscountDeduction = refundDiscount ? Math.min(remainingDiscount, isFullCancel ? remainingDiscount : proratedDiscount) : 0;

  const subtotalRefund = selectedItemsTotal + actualShippingRefund + actualTaxRefund + actualSignatureRefund + actualInsuranceRefund - actualDiscountDeduction;

  const transactionCharge = chargeType === 'flat'
    ? parseFloat(chargeValue || 0)
    : Math.max(0, subtotalRefund) * (parseFloat(chargeValue || 0) / 100);

  // Hard cap on refund to prevent refunding more than the total order amount
  const maxRefundable = Math.max(0, (parseFloat(order.total) || 0) - (parseFloat(order.refund_amount) || 0));
  const calcRefundTotal = cancelType === 'refund' ? Math.max(0, subtotalRefund - transactionCharge) : 0;
  const refundTotal = Math.min(calcRefundTotal, maxRefundable);

  const handleConfirm = () => {
    const cancelledItems = items
      .filter((_, idx) => selectedQty[idx] > 0)
      .map((item, idx) => ({
        productId: item.product?.id,
        variantSize: item.variant?.size || '',
        qty: selectedQty[idx],
        cancelQty: selectedQty[idx],
        price: getPrice(item) * selectedQty[idx],
        name: item.product?.name,
        color: item.variant?.color,
        size: item.variant?.size,
      }));

    onConfirm({
      breakdown: {
        items: selectedItemsTotal,
        shipping: actualShippingRefund,
        tax: actualTaxRefund,
        signature: actualSignatureRefund,
        insurance: actualInsuranceRefund,
        discount_deduction: actualDiscountDeduction,
        transaction_charge: cancelType === 'refund' ? transactionCharge : 0,
        total: refundTotal,
      },
      cancelledItems: isFullCancel ? null : cancelledItems,
      cancelType,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <h2 className="font-serif text-lg font-bold text-[#45055B]">Cancel Order</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>

        {refundResult ? (
          <div className="p-6 text-center">
            {refundResult.success ? (
              <>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RefreshCcw className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-bold text-lg text-[#45055B] mb-1">
                  {refundResult.partial ? 'Partially Cancelled!' : 'Order Cancelled!'}
                </h3>
                {cancelType === 'refund' ? (
                  <p className="text-sm text-gray-500 mb-2">
                    Refund of <strong>${refundResult.amount?.toFixed(2)}</strong> has been processed.
                  </p>
                ) : (
                  <p className="text-sm text-amber-600 font-semibold mb-2">Cancelled without refund.</p>
                )}
                {refundResult.partial && refundResult.remainingItems > 0 && (
                  <span className="block mt-1 text-blue-600 font-medium">{refundResult.remainingItems} item(s) remain active in the order.</span>
                )}
                {refundResult.refundId && <p className="text-xs text-gray-400 font-mono">ID: {refundResult.refundId}</p>}
                <button onClick={onClose} className="mt-5 w-full bg-[#45055B] text-white font-bold py-2.5 rounded-xl hover:bg-[#45055B]/80 transition-colors">Done</button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="font-bold text-lg text-[#45055B] mb-1">Cancellation Failed</h3>
                <p className="text-sm text-red-500 mb-4">{refundResult.error}</p>
                <button onClick={onClose} className="w-full bg-gray-100 text-[#45055B] font-bold py-2.5 rounded-xl">Close</button>
              </>
            )}
          </div>
        ) : (
          <div className="p-6 space-y-5 overflow-y-auto">
            <p className="text-sm text-gray-500">Order <strong>#{order.order_number || order.id}</strong></p>

            <div>
              <p className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider mb-2">Cancellation Type</p>
              <select value={cancelType} onChange={e => setCancelType(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-[#45055B] bg-gray-50 focus:outline-none">
                <option value="refund">Cancel & Refund Payment</option>
                <option value="no_refund">Cancel Without Refund</option>
                <option value="coupon_cancel">Cancel Without Refund (Discount Coupon)</option>
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider">Select Items to Cancel</p>
              {items.map((item, idx) => {
                const price = getPrice(item) * (selectedQty[idx] || 0);
                const variantColor = (item.variant?.color || '').toLowerCase().trim();
                const matchedV = item.product?.variants?.find(v => (v.color || '').toLowerCase().trim() === variantColor);
                const img = item.variant?.image || matchedV?.images?.[0] || item.product?.images?.[0] || item.product?.image_url;
                const itemCode = item.variant?.size_code || item.variant?.code || matchedV?.sizes?.find(s => s.size === item.variant?.size)?.code;
                const isSelected = selectedQty[idx] > 0;
                return (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isSelected ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                    {img && <img src={img} alt="" className="w-10 h-10 object-contain rounded-lg border border-gray-100 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#45055B] truncate">{item.product?.name || 'Product'}{item.variant?.color ? ` — ${item.variant.color}` : ''}</p>
                      <p className="text-xs text-gray-500">{item.variant?.size || 'Standard'} {itemCode ? ` • #${itemCode}` : ''}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-bold text-[#45055B] text-sm">${price.toFixed(2)}</span>
                      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded px-1">
                        <span className="text-[10px] text-gray-400">Cancel Qty:</span>
                        <input type="number" min="0" max={item.qty} value={selectedQty[idx]}
                          onChange={(e) => updateQty(idx, e.target.value)}
                          className="w-10 text-xs text-center focus:outline-none" />
                        <span className="text-[10px] text-gray-400">/ {item.qty}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {cancelType === 'refund' && anySelected && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {remainingShipping > 0 && (
                    <label className="flex items-center justify-between p-3 bg-[#FAF6F0] rounded-xl border border-[#45055B]/10 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={refundShipping} onChange={e => setRefundShipping(e.target.checked)} className="w-4 h-4 accent-[#45055B]" />
                        <span className="text-sm font-bold text-[#45055B]">Refund Shipping Fee</span>
                      </div>
                      <span className="font-bold text-[#45055B]">${remainingShipping.toFixed(2)}</span>
                    </label>
                  )}
                  {remainingTax > 0 && (
                    <label className="flex items-center justify-between p-3 bg-[#FAF6F0] rounded-xl border border-[#45055B]/10 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={refundTax} onChange={e => setRefundTax(e.target.checked)} className="w-4 h-4 accent-[#45055B]" />
                        <span className="text-sm font-bold text-[#45055B]">Refund Tax {isFullCancel ? '' : '(Prorated)'}</span>
                      </div>
                      <span className="font-bold text-[#45055B]">${actualTaxRefund.toFixed(2)}</span>
                    </label>
                  )}
                  {remainingSignature > 0 && (
                    <label className="flex items-center justify-between p-3 bg-[#FAF6F0] rounded-xl border border-[#45055B]/10 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={refundSignature} onChange={e => setRefundSignature(e.target.checked)} className="w-4 h-4 accent-[#45055B]" />
                        <span className="text-sm font-bold text-[#45055B]">Refund Signature Fee</span>
                      </div>
                      <span className="font-bold text-[#45055B]">${actualSignatureRefund.toFixed(2)}</span>
                    </label>
                  )}
                  {remainingInsurance > 0 && (
                    <label className="flex items-center justify-between p-3 bg-[#FAF6F0] rounded-xl border border-[#45055B]/10 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={refundInsurance} onChange={e => setRefundInsurance(e.target.checked)} className="w-4 h-4 accent-[#45055B]" />
                        <span className="text-sm font-bold text-[#45055B]">Refund Insurance Fee</span>
                      </div>
                      <span className="font-bold text-[#45055B]">${actualInsuranceRefund.toFixed(2)}</span>
                    </label>
                  )}
                  {remainingDiscount > 0 && (
                    <label className="flex items-center justify-between p-3 bg-[#FAF6F0] rounded-xl border border-[#45055B]/10 cursor-pointer opacity-80">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked={refundDiscount} onChange={e => setRefundDiscount(e.target.checked)} className="w-4 h-4 accent-[#45055B]" />
                        <span className="text-sm font-bold text-[#45055B]">Deduct Applied Discount {isFullCancel ? '' : '(Prorated)'}</span>
                      </div>
                      <span className="font-bold text-red-600">-${actualDiscountDeduction.toFixed(2)}</span>
                    </label>
                  )}
                </div>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                  <p className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider">Deduct Cancellation Charge</p>
                  <div className="flex gap-2">
                    <select value={chargeType} onChange={e => setChargeType(e.target.value)}
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-[#45055B] bg-white focus:outline-none w-24">
                      <option value="flat">Flat (₹)</option>
                      <option value="percent">Percent (%)</option>
                    </select>
                    <input type="number" min="0" step="0.01" value={chargeValue} onChange={e => setChargeValue(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-[#45055B] bg-white focus:outline-none" />
                  </div>
                  {transactionCharge > 0 && (
                    <p className="text-xs text-amber-600 font-semibold text-right">Deducting: ${transactionCharge.toFixed(2)}</p>
                  )}
                </div>
              </div>
            )}

            <div className={`flex justify-between items-center border rounded-xl px-4 py-3 ${cancelType === 'refund' ? 'bg-red-50 border-red-100' : 'bg-gray-100 border-gray-200'}`}>
              <div>
                <span className={`font-bold ${cancelType === 'refund' ? 'text-red-700' : 'text-gray-700'}`}>
                  {cancelType === 'refund' ? 'Total Refund' : 'Amount to Cancel'}
                </span>
                {!isFullCancel && anySelected && (
                  <p className={`text-[10px] mt-0.5 ${cancelType === 'refund' ? 'text-red-500' : 'text-gray-500'}`}>Remaining items stay active</p>
                )}
              </div>
              <span className={`font-bold text-lg ${cancelType === 'refund' ? 'text-red-700' : 'text-gray-700'}`}>${(cancelType === 'refund' ? refundTotal : selectedItemsTotal).toFixed(2)}
              </span>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 text-[#45055B] rounded-xl font-semibold hover:bg-gray-200 transition-colors">Abort</button>
              <button onClick={handleConfirm} disabled={refunding || !anySelected || (cancelType === 'refund' && refundTotal <= 0 && selectedItemsTotal > 0)}
                className={`flex-1 px-4 py-2.5 text-white rounded-xl font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${cancelType === 'refund' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                {refunding
                  ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                  : (!isFullCancel ? 'Cancel Selected' : 'Cancel Full Order')
                }
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export function AdminOrdersPage() {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const [tracking, setTracking] = useState({});
  const [shipping, setShipping] = useState({});
  const [refundModal, setRefundModal] = useState(null); // order object
  const [refunding, setRefunding] = useState(false);
  const [refundResult, setRefundResult] = useState(null); // { success, refundId, amount }
  const [ratesModal, setRatesModal] = useState(null); // { orderId, rates }
  const [shippoConfigModal, setShippoConfigModal] = useState(null); // order object
  const [editModal, setEditModal] = useState(null); // order object
  const [sendingInvoice, setSendingInvoice] = useState({}); // tracking email sending state

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    fetch(`${BACKEND_URL}/admin/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (d.orders) {
          setOrders(d.orders);
          const t = {};
          d.orders.forEach(o => { t[o.id] = { id: o.tracking_id || "", link: o.tracking_link || "" }; });
          setTracking(t);
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const updateStatus = async (orderId, status) => {
    // Intercept cancellation — show refund modal first
    if (status === 'cancelled') {
      const order = orders.find(o => o.id === orderId);
      setRefundModal(order);
      return;
    }

    // 1. Sync with Supabase
    try {
      await supabase.from('orders').update({ status }).or(`id.eq.${orderId},order_number.eq.${orderId}`);
    } catch (sbErr) {
      console.warn("Supabase order status sync note:", sbErr);
    }

    // 2. Sync with Backend REST
    const token = localStorage.getItem("token");
    await fetch(`${BACKEND_URL}/admin/orders/${orderId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const handleRefundAndCancel = async (order, { breakdown, cancelledItems, cancelType }) => {
    setRefunding(true);
    setRefundResult(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${BACKEND_URL}/admin/orders/${order.id}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ refund_breakdown: breakdown, cancelled_items: cancelledItems, cancel_type: cancelType })
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => {
          if (o.id !== order.id) return o;
          if (data.partial && data.remaining_items > 0) {
            // partial: update items from response isn't available, just update refund info
            return { ...o, refund_id: data.refund_id };
          }
          return { ...o, status: 'cancelled', refund_id: data.refund_id };
        }));
        setRefundResult({ success: true, refundId: data.refund_id, amount: data.amount, partial: data.partial, remainingItems: data.remaining_items });
      } else {
        setRefundResult({ success: false, error: data.error });
      }
    } catch (err) {
      setRefundResult({ success: false, error: err.message });
    } finally {
      setRefunding(false);
    }
  };


  const handleOrderSaved = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o));
  };

  const fetchShippoRates = async (orderId, config) => {
    const token = localStorage.getItem("token");
    setShipping((p) => ({ ...p, [`shippo_${orderId}`]: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/admin/orders/${orderId}/shippo-rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch Shippo rates");

      setRatesModal({ orderId, rates: data.rates });
    } catch (err) {
      alert(`Shippo Error: ${err.message}`);
    } finally {
      setShipping((p) => ({ ...p, [`shippo_${orderId}`]: false }));
    }
  };

  const purchaseShippoLabel = async (orderId, rateObjectId) => {
    const token = localStorage.getItem("token");
    setShipping((p) => ({ ...p, [`shippo_buy_${orderId}`]: true }));
    try {
      const res = await fetch(`${BACKEND_URL}/admin/orders/${orderId}/shippo-label`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rateObjectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create Shippo label");

      setOrders((prev) => prev.map((o) => o.id === orderId ? {
        ...o,
        tracking_number: data.tracking_number,
        tracking_url: data.tracking_url,
        shipping_label_url: data.label_url,
        tracking_id: data.tracking_number,
        tracking_link: data.tracking_url,
        status: "shipped"
      } : o));
      setTracking((p) => ({ ...p, [orderId]: { id: data.tracking_number, link: data.tracking_url } }));
      setRatesModal(null);
      alert(`Shippo label created! Tracking: ${data.tracking_number}`);
    } catch (err) {
      alert(`Shippo Error: ${err.message}`);
    } finally {
      setShipping((p) => ({ ...p, [`shippo_buy_${orderId}`]: false }));
    }
  };

  const notifyWhatsApp = (order) => {
    let address = {};
    try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch (e) { }

    let phone = (order.user_phone || address.mobile || "0000000000").replace(/\D/g, "");
    if (phone.length === 10) phone = '1' + phone;

    const t = tracking[order.id];
    const trackMsg = t?.id ? ` Your tracking ID is ${t.id}.${t.link ? ` Track here: ${t.link}` : ""}` : "";
    const msg = encodeURIComponent(`Hi ${order.user_name || address.name || "Customer"}! Your order #${order.order_number || order.id} status is now: *${order.status}*.${trackMsg}`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const invoiceHtml = (order) => {
    let items = [];
    try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch (e) { }

    let cancelledSnap = [];
    try { cancelledSnap = typeof order.cancelled_items_snapshot === 'string' ? JSON.parse(order.cancelled_items_snapshot) : (order.cancelled_items_snapshot || []); } catch (e) { }

    const cancelledList = order.status === 'cancelled' && cancelledSnap.length === 0
      ? (typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []))
      : cancelledSnap;

    if (order.status === 'cancelled' && cancelledSnap.length === 0) {
      items = [];
    }

    let address = {};
    try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch (e) { }

    const isPickup = order.order_type === 'pickup';
    const subtotal = items.reduce((sum, item) => sum + ((item.variant?.price || item.product?.price || 0) * item.qty), 0);
    const discountAmt = parseFloat(order.discount_amount) || 0;
    const shippingCost = parseFloat(order.shipping_fee) ?? (!isPickup && Number(order.total) - subtotal > 0 ? Number(order.total) - subtotal : 0);
    const taxAmt = parseFloat(order.tax_amount) || 0;
    const refundAmt = parseFloat(order.refund_amount) || 0;
    const orderDate = order.created_at
      ? new Date(order.created_at).toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Chicago', timeZoneName: 'short' })
      : '—';

    const renderRow = (item, idx, isCancelled = false) => {
      const variantColor = (item.variant?.color || '').toLowerCase().trim();
      const matchedVariant = item.product?.variants?.find(v => (v.color || '').toLowerCase().trim() === variantColor);
      const img = item.variant?.image || matchedVariant?.images?.[0] || item.product?.images?.[0] || item.product?.image_url || item.image_url || '';
      const absImg = img && img.startsWith('http') ? img : (img ? `${window.location.origin}${img.startsWith('/') ? '' : '/'}${img}` : '');
      const code = item.variant?.size_code || item.variant?.sku || item.variant?.code || matchedVariant?.code || item.product?.product_code || item.product_code || item.sku || '';
      return `
      <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#FFFAF9'}; ${isCancelled ? 'opacity: 0.6; filter: grayscale(1);' : ''}">
        <td style="padding:10px 12px;border-bottom:1px solid #F6EFEF;vertical-align:middle;text-align:center;font-size:9pt;color:#888;">${idx + 1}
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #F6EFEF;vertical-align:middle;">
          <div style="display:flex;align-items:center;gap:10px;">${absImg ? `<img src="${absImg}" style="width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid #f0e0c0;flex-shrink:0;" />` : `<div style="width:44px;height:44px;background:#FAF6F0;border-radius:6px;border:1px solid #f0e0c0;flex-shrink:0;"></div>`}
            <div>
              <div style="font-weight:700;color:#222;font-size:9.5pt; ${isCancelled ? 'text-decoration: line-through;' : ''}">${escapeHtml(item.product?.name || item.name || '')}</div>${code ? `<div style="font-size:8pt;color:#b8860b;font-weight:600;margin-top:2px;">#${escapeHtml(code)}</div>` : ''}
              ${isCancelled ? `<div style="font-size:8pt;color:#dc2626;font-weight:600;margin-top:2px;">CANCELLED</div>` : ''}
            </div>
          </div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #F6EFEF;vertical-align:middle;text-align:center;font-size:9pt;">${escapeHtml(item.variant?.size || item.size || '—')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F6EFEF;vertical-align:middle;text-align:center;font-size:9pt;">${item.qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F6EFEF;vertical-align:middle;text-align:right;font-size:9pt;font-weight:600; ${isCancelled ? 'text-decoration: line-through;' : ''}">₹${Number(item.variant?.price || item.product?.price || item.price || 0).toLocaleString('en-IN')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F6EFEF;vertical-align:middle;text-align:right;font-size:9pt;font-weight:700;color:#45055B; ${isCancelled ? 'text-decoration: line-through;' : ''}">₹${(Number(item.variant?.price || item.product?.price || item.price || 0) * item.qty).toLocaleString('en-IN')}</td>
      </tr>`;
    };

    const activeRows = items.map((item, idx) => renderRow(item, idx, false)).join('');
    const cancelledRows = cancelledList.map((item, idx) => renderRow(item, items.length + idx, true)).join('');
    const rows = activeRows + cancelledRows;

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice #${order.order_number || order.id}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    @page { size: A4; margin: 15mm 12mm 20mm 12mm; }
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; margin: 0; padding: 20px; font-size: 10pt; line-height: 1.4; background: #fff; }
    .print-btn { text-align: center; margin: 20px 0; }
    .print-btn button { padding: 8px 24px; margin: 0 6px; border-radius: 999px; font-size: 13px; font-weight: 600; cursor: pointer; border: none; }
    .btn-print { background: #45055B; color: #D4AF37; }
    .btn-dl { background: #D4AF37; color: #45055B; }
    @media print { .print-btn { display: none !important; } * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }
  </style>
</head>
<body>

<table style="width:100%;border-collapse:collapse;border-bottom:3px solid #45055B;padding-bottom:16px;margin-bottom:20px;">
  <tr>
    <td style="vertical-align:middle;width:50%;">
      <div style="display:flex;align-items:center;gap:10px;">
        <img src="${new URL(logoUrl, window.location.href).href}" style="height:48px;width:auto;object-fit:contain;" alt="LYDIA GLOBAL EXIM Logo" />
        <div style="display:flex;flex-direction:column;">
          <span style="font-family:serif;font-weight:900;font-size:22px;color:#D4AF37;line-height:1;letter-spacing:0.12em;text-transform:uppercase;">LYDIA GLOBAL EXIM</span>
        </div>
      </div>
    </td>
    <td style="vertical-align:top;text-align:right;">
      <div style="font-size:20pt;font-weight:900;color:#45055B;letter-spacing:-0.5px;">INVOICE</div>
      <div style="font-size:9pt;color:#555;margin-top:6px;line-height:1.7;">
        <strong>Invoice No:</strong> #${escapeHtml(order.order_number || String(order.id))}<br>
        <strong>Date:</strong>${orderDate}<br>
        <strong>Order Type:</strong> <span style="font-weight:700;color:${isPickup ? '#1d4ed8' : '#059669'};">${isPickup ? '🏪 Store Pickup' : '🚚 Shipping'}</span><br>
        <strong>Status:</strong>${escapeHtml(order.status)}
        ${order.stripe_payment_intent_id ? `<br><strong>Transaction ID:</strong> <span style="font-family:monospace;font-size:8pt;color:#555;">${escapeHtml(order.stripe_payment_intent_id)}</span>` : ''}
      </div>
    </td>
  </tr>
</table>

<table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
  <tr>
    <td style="width:${isPickup ? '100%' : '50%'};vertical-align:top;padding:12px;border:1px solid #e8d5b0;background:#FFFDFD;border-radius:4px;">
      <div style="font-size:9pt;font-weight:700;color:#45055B;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e8d5b0;padding-bottom:5px;margin-bottom:8px;">From</div>
      <div style="font-size:9.5pt;color:#555;line-height:1.6;">
        <strong style="color:#45055B;">LYDIA GLOBAL EXIM</strong><br>
        Phone: +91 9014863411<br>
        Email: lydiaglobalexim@gmail.com
      </div>
    </td>${!isPickup ? `
    <td style="width:4px;"></td>
    <td style="width:50%;vertical-align:top;padding:12px;border:1px solid #e8d5b0;background:#FFFAF9;border-radius:4px;">
      <div style="font-size:9pt;font-weight:700;color:#45055B;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e8d5b0;padding-bottom:5px;margin-bottom:8px;">Ship To</div>
      <div style="font-size:9.5pt;color:#555;line-height:1.6;">
        <strong style="color:#45055B;">${escapeHtml(address.name || '')}</strong><br>${escapeHtml(address.line1 || '')}${address.line2 ? ', ' + escapeHtml(address.line2) : ''}<br>${escapeHtml(address.city || '')}, ${escapeHtml(address.state || '')} ${escapeHtml(address.pincode || '')}<br>${address.mobile ? `<strong>Phone:</strong>${escapeHtml(address.mobile)}` : ''}
      </div>
    </td>` : `
    <td style="width:4px;"></td>
    <td style="width:50%;vertical-align:top;padding:12px;border:1px solid #e8d5b0;background:#f8fafc;border-radius:4px;">
      <div style="font-size:9pt;font-weight:700;color:#45055B;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e8d5b0;padding-bottom:5px;margin-bottom:8px;">Payment Details</div>
      <div style="font-size:9.5pt;color:#555;line-height:1.6;">
        <strong>Type:</strong> <span style="text-transform:capitalize;">${escapeHtml(order.payment_method || 'Card')}</span><br>${order.stripe_payment_intent_id ? `<strong>Transaction ID:</strong> <span style="font-family:monospace;">${escapeHtml(order.stripe_payment_intent_id)}</span><br>` : ''}
        <strong>Amount Received:</strong> ₹${parseFloat(order.total || 0).toFixed(2)}
      </div>
    </td>
    `}
  </tr>
</table>${!isPickup ? `
<table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
  <tr>
    <td style="width:100%;vertical-align:top;padding:12px;border:1px solid #e8d5b0;background:#f8fafc;border-radius:4px;">
      <div style="font-size:9pt;font-weight:700;color:#45055B;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #e8d5b0;padding-bottom:5px;margin-bottom:8px;">Payment Details</div>
      <div style="font-size:9.5pt;color:#555;line-height:1.6;display:flex;justify-content:space-between;">
        <div><strong>Type:</strong> <span style="text-transform:capitalize;">${escapeHtml(order.payment_method || 'Card')}</span></div>${order.stripe_payment_intent_id ? `<div><strong>Transaction ID:</strong> <span style="font-family:monospace;">${escapeHtml(order.stripe_payment_intent_id)}</span></div>` : ''}
        <div><strong>Amount Received:</strong> ₹${parseFloat(order.total || 0).toFixed(2)}</div>
      </div>
    </td>
  </tr>
</table>
` : ''}

<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
  <thead>
    <tr style="background:#45055B;">
      <th style="padding:10px 12px;color:#D4AF37;font-size:9pt;text-align:center;width:5%;">#</th>
      <th style="padding:10px 12px;color:#D4AF37;font-size:9pt;text-align:left;width:45%;">Item</th>
      <th style="padding:10px 12px;color:#D4AF37;font-size:9pt;text-align:center;width:15%;">Size</th>
      <th style="padding:10px 12px;color:#D4AF37;font-size:9pt;text-align:center;width:10%;">Qty</th>
      <th style="padding:10px 12px;color:#D4AF37;font-size:9pt;text-align:right;width:12%;">Unit Price</th>
      <th style="padding:10px 12px;color:#D4AF37;font-size:9pt;text-align:right;width:13%;">Total</th>
    </tr>
  </thead>
  <tbody>${rows}</tbody>
</table>

<table style="width:100%;border-collapse:collapse;margin-top:8px;">
  <tr>
    <td style="width:55%;"></td>
    <td style="width:45%;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:7px 12px;text-align:right;color:#555;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">Subtotal</td><td style="padding:7px 12px;text-align:right;font-weight:600;font-size:9.5pt;border-bottom:1px solid #F6EFEF;width:110px;">₹${subtotal.toFixed(2)}</td></tr>${discountAmt > 0 ? `<tr><td style="padding:7px 12px;text-align:right;color:#059669;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">Discount${order.coupon_code ? ' (' + order.coupon_code + ')' : ''}</td><td style="padding:7px 12px;text-align:right;font-weight:600;font-size:9.5pt;border-bottom:1px solid #F6EFEF;color:#059669;">-₹${discountAmt.toFixed(2)}</td></tr>` : ''}
        ${shippingCost > 0 ? `<tr><td style="padding:7px 12px;text-align:right;color:#555;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">Shipping</td><td style="padding:7px 12px;text-align:right;font-weight:600;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">₹${shippingCost.toFixed(2)}</td></tr>` : ''}
        ${parseFloat(address.signature_fee) > 0 ? `<tr><td style="padding:7px 12px;text-align:right;color:#555;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">Signature Confirmation</td><td style="padding:7px 12px;text-align:right;font-weight:600;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">₹${parseFloat(address.signature_fee).toFixed(2)}</td></tr>` : ''}
        ${parseFloat(address.insurance_fee) > 0 ? `<tr><td style="padding:7px 12px;text-align:right;color:#555;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">Shipping Insurance</td><td style="padding:7px 12px;text-align:right;font-weight:600;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">₹${parseFloat(address.insurance_fee).toFixed(2)}</td></tr>` : ''}
        ${taxAmt > 0 ? `<tr><td style="padding:7px 12px;text-align:right;color:#555;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">Tax</td><td style="padding:7px 12px;text-align:right;font-weight:600;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">₹${taxAmt.toFixed(2)}</td></tr>` : ''}
        <tr style="background:#FAF6F0;"><td style="padding:10px 12px;text-align:right;font-weight:700;font-size:11pt;color:#45055B;border-top:2px solid #45055B;">TOTAL</td><td style="padding:10px 12px;text-align:right;font-weight:700;font-size:11pt;color:#D4AF37;border-top:2px solid #45055B;">₹${Number(order.total).toFixed(2)}</td></tr>${refundAmt > 0 ? `<tr style="background:#fef2f2;"><td style="padding:10px 12px;text-align:right;font-weight:700;font-size:10pt;color:#dc2626;border-top:1px solid #fecaca;">REFUNDED</td><td style="padding:10px 12px;text-align:right;font-weight:700;font-size:10pt;color:#dc2626;border-top:1px solid #fecaca;">-₹${refundAmt.toFixed(2)}</td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>

<div style="margin-top:30px;padding-top:12px;border-top:1px solid #e8d5b0;text-align:center;font-size:8.5pt;color:#999;">
  Thank you for shopping with LYDIA GLOBAL EXIM! &nbsp;|&nbsp; lydiaglobalexim@gmail.com &nbsp;|&nbsp; +91 9014863411
</div>

<div class="print-btn">
  <button class="btn-print" onclick="window.print()">🖨️ Print</button>
  <button class="btn-dl" onclick="window.print()">📥 Download PDF</button>
</div>
</body>
</html>`;
  };

  const openInvoice = (order) => {
    const invoiceWindow = window.open("", "_blank");
    if (invoiceWindow) {
      invoiceWindow.document.open();
      invoiceWindow.document.write(invoiceHtml(order));
      invoiceWindow.document.close();
    }
  };

  const sendInvoiceWhatsApp = (order) => {
    let items = [];
    try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch (e) { }

    let address = {};
    try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch (e) { }

    let phone = (order.user_phone || address.mobile || "0000000000").replace(/\D/g, "");
    if (phone.length === 10) phone = '1' + phone;

    const itemsText = items.map((i) => `• ${i.product?.name} ×${i.qty} — ₹${(i.variant?.price || i.product?.price || 0) * i.qty}`).join("\n");
    const msg = encodeURIComponent(
      `Hi ${order.user_name || address.name || 'Customer'}! 🙏 Please find your *Invoice* for Order *#${order.order_number || order.id}* below:\n\n` +
      `*Items:*\n${itemsText}\n\n` +
      `*Total: ₹${order.total}*\n\n` +
      `Thank you for shopping with LYDIA GLOBAL EXIM!`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const sendEmailInvoice = async (order) => {
    setSendingInvoice(p => ({ ...p, [order.id]: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/admin/orders/${order.id}/resend-invoice`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert("Email invoice sent successfully!");
      } else {
        alert("Failed to send email invoice: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      alert("Error sending email invoice");
    } finally {
      setSendingInvoice(p => ({ ...p, [order.id]: false }));
    }
  };

  const printLabel = (order) => {
    let items = [];
    try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch (e) { }
    let address = {};
    try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch (e) { }

    const itemRows = items.map((item) => {
      const unitStr = item.variant?.size ? ` (${escapeHtml(item.variant?.size)})` : '';
      return `<div style="display:flex;justify-content:space-between;padding:1.5mm 0;border-bottom:1px solid #eee;">
        <div style="font-size:8pt;font-weight:600;flex:1;padding-right:3mm;">${escapeHtml(item.product?.name)}${unitStr}</div>
        <div style="font-size:8pt;color:#555;white-space:nowrap;">x${item.qty}</div>
      </div>`;
    }).join('');

    const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Shipping Label - #${order.order_number || order.id}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:100mm 160mm;margin:0}
  body{font-family:Arial,Helvetica,sans-serif;width:100mm;background:#fff;font-size:9pt}
  .box{border:2.5px solid #111;margin:3mm;border-radius:2mm;overflow:hidden}
  .hdr{background:#C8401A;color:#fff;padding:3.5mm 4mm;display:flex;justify-content:space-between;align-items:center}
  .brand{font-size:16pt;font-weight:900;letter-spacing:-0.5px}
  .oid{background:#fff;color:#C8401A;font-size:10pt;font-weight:900;padding:1px 8px;border-radius:999px}
  .sec{padding:2.5mm 4mm;border-bottom:1px dashed #bbb}
  .lbl{font-size:5.5pt;text-transform:uppercase;letter-spacing:1px;color:#888;font-weight:700;margin-bottom:1mm}
  .val{font-size:10.5pt;font-weight:700;color:#111;line-height:1.35}
  .sm{font-size:8pt;color:#444;line-height:1.5}
  .items{padding:2.5mm 4mm}
  .ftr{background:#fef6f3;padding:3mm 4mm;border-top:1px solid #ddd;display:flex;justify-content:flex-end;align-items:center}
  .dt{font-size:7pt;color:#aaa;text-align:right;line-height:1.6}
  .no-print{text-align:center;padding:10px}
  @media print{.no-print{display:none!important}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}
</style>
</head>
<body>
<div class="box">
  <div class="hdr">
    <div class="brand">LYDIA GLOBAL EXIM</div>
    <div class="oid">#${order.order_number || order.id}</div>
  </div>
  <div class="sec">
    <div class="lbl">Ship To</div>
    <div class="val">${escapeHtml(address.name || '')}</div>
    <div class="sm">${escapeHtml(address.line1 || '')}${address.line2 ? ', ' + escapeHtml(address.line2) : ''}</div>
    <div class="sm">${escapeHtml(address.city || '')}, ${escapeHtml(address.state || '')} - ${escapeHtml(address.pincode || '')}, USA</div>${address.mobile ? '<div class="sm" style="font-weight:700;margin-top:1mm;">Ph: ' + escapeHtml(address.mobile) + '</div>' : ''}
  </div>
 
  <div class="items">
    <div class="lbl" style="margin-bottom:2mm;">Order Items (${items.length})</div>${itemRows}
  </div>
  <div class="ftr">
    <div class="dt">${new Date(order.created_at).toLocaleDateString('en-IN')}
      ${order.tracking_id ? '<br>AWB: ' + escapeHtml(order.tracking_id) : ''}
    </div>
  </div>
</div>
<div class="no-print">
  <button onclick="window.print()" style="background:#C8401A;color:#fff;border:none;padding:8px 28px;border-radius:999px;font-size:13px;font-weight:700;cursor:pointer;margin-top:4px;">
    Print Label
  </button>
</div>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=440,height=640');
    if (w) { w.document.open(); w.document.write(html); w.document.close(); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#45055B]/20 border-t-[#45055B] rounded-full animate-spin" />
    </div>
  );

  const filtered = orders.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (o.order_type === 'pickup') return false;

    if (search) {
      const q = search.toLowerCase();
      const matchId = String(o.order_number || o.id).toLowerCase().includes(q);
      const matchEmail = (o.user_email || '').toLowerCase().includes(q);

      let matchAddressEmail = false;
      try {
        const addr = typeof o.address === 'string' ? JSON.parse(o.address) : (o.address || {});
        matchAddressEmail = (addr.email || '').toLowerCase().includes(q);
      } catch (e) { }

      if (!matchId && !matchEmail && !matchAddressEmail) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedOrders = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-[#45055B]">Orders</h1>
          <p className="text-[#45055B]/40 text-xs font-sans mt-0.5">{orders.filter(o => o.order_type !== 'pickup').length} total</p>
        </div>
        <div className="relative w-full xs:w-64">
          <Search className="w-4 h-4 text-[#45055B]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Order # or Email"
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-[#45055B]/10 text-sm focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 transition-all"
          />
        </div>
      </div>

      {/* Status Filter Buttons */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {["all", ...SHIPPING_STATUSES].map((s) => {
          const shippingOrders = orders.filter(o => o.order_type !== 'pickup');
          return (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold font-sans capitalize transition-colors ${statusFilter === s
                  ? "bg-[#45055B] text-white shadow-sm"
                  : "bg-white border border-[#45055B]/20 text-[#45055B]/60 hover:border-[#45055B]/40"
                }`}>
              {s === "all" ? `All (${shippingOrders.length})` : `${s} (${shippingOrders.filter(o => o.status === s).length})`}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#45055B]/10 p-10 sm:p-12 text-center">
          <p className="text-[#45055B]/50 font-sans text-sm">
            {orders.length === 0 ? "No orders yet." : `No ${statusFilter} orders.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {paginatedOrders.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl border border-[#45055B]/10 overflow-hidden">

              <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 lg:p-5 cursor-pointer hover:bg-[#FAF6F0]/30 transition-colors"
                onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="font-serif font-bold text-[#45055B] text-sm sm:text-base">#{order.order_number || order.id}</span>
                    <span className="text-[#45055B]/50 text-[10px] sm:text-xs font-sans">
                      {new Date(order.created_at).toLocaleDateString("en-IN")}
                    </span>
                    <span className={`text-[9px] sm:text-[10px] font-bold font-sans px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || "bg-[#FAF6F0] text-gray-500"}`}>
                      {order.status}
                    </span>
                    {order.payment_method === 'cod' && !order.stripe_payment_intent_id && (
                      <span className="text-[9px] sm:text-[10px] font-bold font-sans px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Balance (${order.total - (order.advance_paid || 0)} Pending)
                      </span>
                    )}
                    {Number(order.refund_amount) > 0 && (
                      <span className="text-[9px] sm:text-[10px] font-bold font-sans px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                        Refunded ${Number(order.refund_amount).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-[#45055B]/60 text-[10px] sm:text-xs font-sans mt-0.5 truncate">
                    {order.user_name || "Guest"}
                  </p>
                </div>
                <span className="font-serif font-bold text-[#D4AF37] text-sm sm:text-base lg:text-lg flex-shrink-0">${order.total}</span>
                <ChevronDown className={`w-4 h-4 text-[#45055B]/40 transition-transform flex-shrink-0 ${expanded === order.id ? "rotate-180" : ""}`} />
              </div>

              {expanded === order.id && (
                <div className="border-t border-[#45055B]/5 p-3 sm:p-4 lg:p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-sans text-[#45055B]/40 uppercase tracking-wider mb-2">Update Status</p>
                      <select value={order.status} onChange={(e) => updateStatus(order.id, e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#FAF6F0] border border-[#45055B]/10 text-[#45055B] font-sans text-sm focus:outline-none">
                        {(order.order_type === 'pickup' ? PICKUP_STATUSES : SHIPPING_STATUSES).map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-[10px] font-sans text-[#45055B]/40 uppercase tracking-wider mb-2">Shipment</p>
                      {order.tracking_id && order.tracking_id.trim() !== "" ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                            <span className="text-green-700 font-bold font-sans text-xs truncate">AWB: {order.tracking_id}</span>
                            {order.tracking_link && (
                              <a href={order.tracking_link} target="_blank" rel="noopener noreferrer"
                                className="ml-auto flex-shrink-0 text-[#45055B] hover:opacity-80 transition-colors">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          {order.shipping_label_url && (
                            <a href={order.shipping_label_url} target="_blank" rel="noopener noreferrer" className="mt-2 w-full flex items-center justify-center gap-2 bg-[#45055B] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90">
                              📄 Download Label
                            </a>
                          )}
                          <div className="flex justify-between mt-2">
                            <button onClick={() => setShippoConfigModal(order)} disabled={shipping[`shippo_${order.id}`] || order.status === 'cancelled'}
                              className="text-[10px] font-sans text-[#45055B]/50 hover:text-[#45055B] transition-colors underline w-full text-center disabled:opacity-50 disabled:cursor-not-allowed">
                              {shipping[`shippo_${order.id}`] ? "Loading Rates..." : "Re-create Label (Shippo)"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <button onClick={() => setShippoConfigModal(order)} disabled={shipping[`shippo_${order.id}`] || order.status === 'cancelled'}
                            className="w-full flex items-center justify-center gap-2 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#45055B] px-4 py-2 rounded-xl text-xs font-semibold font-sans transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {shipping[`shippo_${order.id}`] ? "Loading Rates..." : "📦 Select Shipping Rate (Shippo)"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Balance Due Banner */}
                  {parseFloat(order.balance_due) > 0 && (
                    <BalanceDuePanel order={order} onUpdate={(updated) => setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o))} />
                  )}

                  {/* Refund Information */}
                  {(order.status === 'cancelled' || parseFloat(order.refund_amount) > 0) && (
                    <div className="pt-4 border-t border-[#45055B]/5">
                      <p className="text-[10px] font-sans text-red-600 uppercase tracking-wider mb-3 font-bold">Refund Details</p>
                      <div className="bg-red-50/50 rounded-xl p-4 border border-red-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <p className="text-[10px] font-semibold text-red-500 uppercase">Refunded Amount</p>
                          <p className="font-bold text-red-700 text-sm">${parseFloat(order.refund_amount || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-semibold text-red-500 uppercase">Transaction ID</p>
                          <p className="font-semibold text-red-700 text-xs break-all">{order.refund_id || 'N/A'}</p>
                        </div>
                        {(() => {
                          let hist = [];
                          try { hist = typeof order.refund_history === 'string' ? JSON.parse(order.refund_history) : (order.refund_history || []); } catch { }
                          const refundEvent = hist.length > 0 ? hist[hist.length - 1] : null;
                          const dateStr = refundEvent?.timestamp || order.updated_at || order.created_at;
                          return (
                            <div>
                              <p className="text-[10px] font-semibold text-red-500 uppercase">Refund Date</p>
                              <p className="font-semibold text-red-700 text-xs">{dateStr ? new Date(dateStr).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }) : 'N/A'}</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Edit History */}
                  {(() => {
                    let hist = [];
                    try { hist = typeof order.edit_history === 'string' ? JSON.parse(order.edit_history) : (order.edit_history || []); } catch { }
                    if (!hist.length) return null;
                    return (
                      <div className="pt-4 border-t border-[#45055B]/5">
                        <p className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <History className="w-3 h-3" /> Edit History
                        </p>
                        <div className="space-y-2">
                          {hist.map((h, i) => (
                            <div key={i} className="bg-[#FAF6F0] rounded-xl px-3 py-2 text-xs text-[#45055B]/70">
                              <div className="flex justify-between">
                                <span className="font-semibold">{new Date(h.timestamp).toLocaleString('en-IN')}</span>
                                <span className={h.diff > 0 ? 'text-amber-600 font-bold' : h.diff < 0 ? 'text-green-600 font-bold' : 'text-gray-400'}>
                                  {h.diff > 0 ? `+${h.diff.toFixed(2)}` : h.diff < 0 ? `-${Math.abs(h.diff).toFixed(2)}` : 'No change'}
                                </span>
                              </div>
                              {h.note && <p className="text-[#45055B]/50 mt-0.5">{h.note}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Customer Details */}
                  <div className="pt-4 border-t border-[#45055B]/5">
                    <p className="text-[10px] font-sans text-[#45055B]/40 uppercase tracking-wider mb-3">Customer Details</p>
                    {(() => {
                      let address = {};
                      try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch (e) { }
                      const name = order.user_name || address.name || 'Guest';
                      const email = order.user_email || '—';
                      const phone = order.user_phone || address.mobile || '—';
                      const addr = [address.line1, address.city, address.state, address.pincode].filter(Boolean).join(', ');
                      return (
                        <div className="bg-[#FAF6F0] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider w-14 shrink-0 mt-0.5">Name</span>
                            <span className="text-sm font-semibold text-[#45055B]">{name}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider w-14 shrink-0 mt-0.5">Phone</span>
                            <span className="text-sm font-semibold text-[#45055B]">{address.mobile || order.user_phone || '—'}</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider w-14 shrink-0 mt-0.5">Email</span>
                            <span className="text-sm font-semibold text-[#45055B] break-all">{email}</span>
                          </div>
                          {addr && (
                            <div className="flex items-start gap-2 sm:col-span-2">
                              <span className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider w-14 shrink-0 mt-0.5">Address</span>
                              <span className="text-sm font-semibold text-[#45055B]">{addr}</span>
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider w-14 shrink-0 mt-0.5">Type</span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${order.order_type === 'pickup' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                              {order.order_type === 'pickup' ? '🏪 Pickup' : '🚚 Shipping'}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider w-14 shrink-0 mt-0.5">Payment</span>
                            <span className="text-sm font-semibold text-[#45055B] capitalize">{order.payment_method === 'stripe' ? 'Online (Stripe)' : order.payment_method || '—'}</span>
                          </div>
                          {order.stripe_payment_intent_id && (
                            <div className="flex items-start gap-2 sm:col-span-2">
                              <span className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider w-14 shrink-0 mt-0.5">Txn ID</span>
                              <span className="text-xs font-mono font-semibold text-[#45055B] break-all select-all">{order.stripe_payment_intent_id}</span>
                            </div>
                          )}
                          {address.signature_required && (
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider w-14 shrink-0 mt-0.5">Extras</span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">✍️ Signature Reqd</span>
                            </div>
                          )}
                          {address.insurance_requested && (
                            <div className="flex items-start gap-2">
                              <span className="text-[10px] font-bold text-[#45055B]/40 uppercase tracking-wider w-14 shrink-0 mt-0.5">Extras</span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">🛡️ Insured (${address.insurance_amount})</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Order Items List */}
                  <div className="pt-4 border-t border-[#45055B]/5">
                    <p className="text-[10px] font-sans text-[#45055B]/40 uppercase tracking-wider mb-3">Order Items</p>
                    <div className="space-y-3">
                      {/* Cancelled Items */}
                      {(() => {
                        let cancelledSnap = [];
                        try { cancelledSnap = typeof order.cancelled_items_snapshot === 'string' ? JSON.parse(order.cancelled_items_snapshot) : (order.cancelled_items_snapshot || []); } catch (e) { }
                        if (cancelledSnap.length === 0 && order.status !== 'cancelled') return null;

                        // If fully cancelled, items are the cancelled items
                        const cancelledList = order.status === 'cancelled' && cancelledSnap.length === 0
                          ? (typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []))
                          : cancelledSnap;

                        if (cancelledList.length === 0) return null;

                        return (
                          <div className="mb-4">
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200 inline-block mb-2">Cancelled Items</span>
                            <div className="space-y-3">
                              {cancelledList.map((item, idx) => {
                                const variantColor = (item.variant?.color || '').toLowerCase().trim();
                                const matchedVariant = item.product?.variants?.find(v => (v.color || '').toLowerCase().trim() === variantColor);
                                const variantImg = item.variant?.image || matchedVariant?.images?.[0] || item.product?.images?.[0] || item.product?.image_url;
                                const itemCode = item.variant?.size_code || item.variant?.code || matchedVariant?.sizes?.find(s => s.size === item.variant?.size)?.code || matchedVariant?.code;
                                return (
                                  <div key={`cancel-${idx}`} className="flex gap-3 items-center opacity-60 grayscale">
                                    <div className="w-10 h-10 rounded bg-gray-50 border border-gray-100 flex items-center justify-center p-1 shrink-0">
                                      <img src={variantImg} alt="" className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-semibold text-gray-500 line-through truncate">{item.product?.name || item.name || 'Product'}{item.variant?.color || item.color ? ` — ${item.variant?.color || item.color}` : ''}</p>
                                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                        <p className="text-xs text-red-500 font-medium">
                                          {item.variant?.size || item.size || 'Standard'} • Cancelled Qty: {item.qty}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-sm font-bold text-gray-400 line-through">${((item.variant?.price || item.product?.price || item.price || 0) * item.qty).toFixed(2)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Active Items */}
                      {(() => {
                        let activeItems = [];
                        try { activeItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch (e) { }
                        if (order.status === 'cancelled' && activeItems.length > 0) return null; // If full cancel, they are already shown above (or we just hide active section)

                        return (
                          <div>
                            {order.cancelled_items_snapshot && activeItems.length > 0 && (
                              <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-1 rounded border border-green-200 inline-block mb-2">Active Items</span>
                            )}
                            <div className="space-y-3">
                              {activeItems.map((item, idx) => {
                                const variantColor = (item.variant?.color || '').toLowerCase().trim();
                                const matchedVariant = item.product?.variants?.find(v => (v.color || '').toLowerCase().trim() === variantColor);
                                const variantImg = item.variant?.image || matchedVariant?.images?.[0] || item.product?.images?.[0] || item.product?.image_url;
                                const itemCode = item.variant?.size_code || item.variant?.code || matchedVariant?.sizes?.find(s => s.size === item.variant?.size)?.code || matchedVariant?.code;
                                return (
                                  <div key={idx} className="flex gap-3 items-center">
                                    <div className="w-12 h-12 rounded bg-gray-50 border border-gray-100 flex items-center justify-center p-1 shrink-0">
                                      <img src={variantImg} alt="" className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      {item.product?.id ? (
                                        <Link to={`/product/${item.product.id}${itemCode ? `?variantCode=${itemCode}` : ''}`} target="_blank"
                                          className="text-sm font-semibold text-[#45055B] truncate hover:text-[#D4AF37] hover:underline transition-colors flex items-center gap-1">
                                          {item.product?.name || 'Unknown Product'}{item.variant?.color ? ` — ${item.variant.color}` : ''}
                                          <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                                        </Link>
                                      ) : (
                                        <p className="text-sm font-semibold text-[#45055B] truncate">{item.product?.name || 'Unknown Product'}{item.variant?.color ? ` — ${item.variant.color}` : ''}</p>
                                      )}
                                      <div className="flex items-center gap-2 flex-wrap mt-0.5">
                                        <p className="text-xs text-gray-500">
                                          {item.variant?.size ? `Size: ${item.variant.size}` : 'Standard'} • Qty: {item.qty}
                                        </p>
                                        {itemCode && (
                                          <span className="text-[10px] font-mono font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded">#{itemCode}</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="text-sm font-bold text-[#D4AF37]">${((item.variant?.price || item.product?.price || 0) * item.qty).toFixed(2)}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Price Summary */}
                      {(() => {
                        let activeItems = [];
                        try { activeItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch (e) { }

                        const subtotal = activeItems.reduce((sum, item) => sum + ((item.variant?.price || item.product?.price || item.price || 0) * item.qty), 0);
                        const discount = parseFloat(order.discount_amount) || 0;
                        const shipping = parseFloat(order.shipping_fee) || 0;
                        const tax = parseFloat(order.tax_amount) || 0;
                        const taxRate = subtotal > 0 && tax > 0 ? ((tax / (subtotal - discount)) * 100).toFixed(2) : null;

                        let addr = {};
                        try { addr = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch (e) { }

                        return (
                          <div className="mt-4 pt-4 border-t border-dashed border-[#45055B]/10">
                            <p className="text-[10px] font-sans text-[#45055B]/40 uppercase tracking-wider mb-2">Price Summary</p>
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs text-[#45055B]/70">
                                <span>Item Total</span>
                                <span className="font-semibold">${subtotal.toFixed(2)}</span>
                              </div>
                              {discount > 0 && (
                                <div className="flex justify-between text-xs text-green-600">
                                  <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                                  <span className="font-semibold">-${discount.toFixed(2)}</span>
                                </div>
                              )}
                              {shipping > 0 && (
                                <div className="flex justify-between text-xs text-[#45055B]/70">
                                  <span>Shipping Fee</span>
                                  <span className="font-semibold">${shipping.toFixed(2)}</span>
                                </div>
                              )}
                              {(parseFloat(order.signature_fee) || parseFloat(addr.signature_fee) || 0) > 0 && (
                                <div className="flex justify-between text-xs text-[#45055B]/70">
                                  <span>Signature Confirmation</span>
                                  <span className="font-semibold">${(parseFloat(order.signature_fee) || parseFloat(addr.signature_fee) || 0).toFixed(2)}</span>
                                </div>
                              )}
                              {(parseFloat(order.insurance_fee) || parseFloat(addr.insurance_fee) || 0) > 0 && (
                                <div className="flex justify-between text-xs text-[#45055B]/70">
                                  <span>Shipping Insurance</span>
                                  <span className="font-semibold">${(parseFloat(order.insurance_fee) || parseFloat(addr.insurance_fee) || 0).toFixed(2)}</span>
                                </div>
                              )}
                              {tax > 0 && (
                                <div className="flex justify-between text-xs text-[#45055B]/70">
                                  <span>Tax{taxRate ? ` (${taxRate}%)` : ''}</span>
                                  <span className="font-semibold">${tax.toFixed(2)}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm font-bold text-[#45055B] border-t border-[#45055B]/10 pt-2 mt-2">
                                <span>Grand Total</span>
                                <span className="text-[#D4AF37]">${Number(order.total).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-4 border-t border-[#45055B]/5">
                    <button onClick={() => setEditModal(order)}
                      className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2.5 rounded-xl text-xs font-semibold font-sans transition-colors">
                      <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">Edit Order</span>
                    </button>
                    <button onClick={() => sendEmailInvoice(order)} disabled={sendingInvoice[order.id]}
                      className="flex items-center justify-center gap-1.5 bg-[#45055B] text-white px-3 py-2.5 rounded-xl text-xs font-semibold font-sans hover:bg-[#45055B]/80 transition-colors disabled:opacity-50">
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{sendingInvoice[order.id] ? "Sending..." : "Email Invoice"}</span>
                    </button>
                    <button onClick={() => notifyWhatsApp(order)}
                      className="flex items-center justify-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-3 py-2.5 rounded-xl text-xs font-semibold font-sans transition-colors">
                      <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">Notify WA</span>
                    </button>
                    <button onClick={() => openInvoice(order)}
                      className="flex items-center justify-center gap-1.5 bg-[#D4AF37] hover:bg-amber-500 text-[#45055B] px-3 py-2.5 rounded-xl text-xs font-semibold font-sans transition-colors">
                      <Printer className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">Print Invoice</span>
                    </button>
                    <button onClick={() => sendInvoiceWhatsApp(order)}
                      className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl text-xs font-semibold font-sans transition-colors">
                      <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">WA Invoice</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-[#45055B]/60">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} orders</span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1.5 border border-[#45055B]/20 rounded-lg text-sm font-semibold text-[#45055B] bg-white hover:bg-[#FAF6F0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1.5 border border-[#45055B]/20 rounded-lg text-sm font-semibold text-[#45055B] bg-white hover:bg-[#FAF6F0] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Order Modal */}
      <AnimatePresence>
        {editModal && (
          <EditOrderModal
            order={editModal}
            onClose={() => setEditModal(null)}
            onSaved={(updated) => { handleOrderSaved(updated); setEditModal(null); }}
          />
        )}
      </AnimatePresence>

      {/* Refund Modal */}
      <AnimatePresence>
        {refundModal && (
          <RefundModal
            order={refundModal}
            refunding={refunding}
            refundResult={refundResult}
            onConfirm={(breakdown) => handleRefundAndCancel(refundModal, breakdown)}
            onClose={() => { setRefundModal(null); setRefundResult(null); }}
          />
        )}
      </AnimatePresence>

      {/* Rates Modal */}
      <AnimatePresence>
        {ratesModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="font-serif text-lg font-bold text-[#45055B]">Select Shipping Rate</h2>
                <button onClick={() => setRatesModal(null)} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-3">
                {ratesModal.rates.length === 0 ? (
                  <p className="text-center text-gray-500 py-10">No rates available for this address.</p>
                ) : (
                  ratesModal.rates.map(rate => (
                    <div key={rate.objectId} className="border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-[#D4AF37] transition-colors">
                      <div className="flex items-center gap-3">
                        {rate.providerImage75 && <img src={rate.providerImage75} alt={rate.provider} className="h-8 w-8 object-contain" />}
                        <div>
                          <p className="font-bold text-[#45055B] text-sm">{rate.provider} - {rate.servicelevel?.name}</p>
                          <p className="text-xs text-gray-500">Est. {rate.estimatedDays || '?'} days</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#D4AF37]">${rate.amount}</p>
                        <button onClick={() => purchaseShippoLabel(ratesModal.orderId, rate.objectId)}
                          disabled={shipping[`shippo_buy_${ratesModal.orderId}`]}
                          className="mt-1 text-xs bg-[#45055B] text-white px-3 py-1.5 rounded-lg hover:bg-blue-900 disabled:opacity-50">
                          {shipping[`shippo_buy_${ratesModal.orderId}`] ? 'Buying...' : 'Buy Label'}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {shippoConfigModal && (
        <ShippoConfigModal
          order={shippoConfigModal}
          onClose={() => setShippoConfigModal(null)}
          onSubmit={(config) => {
            const oId = shippoConfigModal.id;
            setShippoConfigModal(null);
            fetchShippoRates(oId, config);
          }}
        />
      )}
    </div>
  );
}
