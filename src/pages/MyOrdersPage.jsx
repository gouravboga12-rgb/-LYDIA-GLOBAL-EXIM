import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingBag, FileText, RefreshCw, Store, Truck, MapPin, MessageCircle, CreditCard, ExternalLink, Tag } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { Header } from '../components/Header';
import { supabase } from '../utils/supabase';
import logoUrl from '../assets/logo.png';

const STATUS_COLORS = {
  received: 'bg-amber-100 text-amber-800 border-amber-200',
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  'under processing': 'bg-blue-100 text-blue-800 border-blue-200',
  processing: 'bg-blue-100 text-blue-800 border-blue-200',
  dispatched: 'bg-purple-100 text-purple-800 border-purple-200',
  shipped: 'bg-purple-100 text-purple-800 border-purple-200',
  'out for delivery': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const STATUS_STEPS = ['Received', 'Under Processing', 'Dispatched', 'Out for Delivery', 'Delivered'];

export function MyOrdersPage() {
  const navigate = useNavigate();
  const { token, orders: storeOrders, fetchProfile, user } = useAuthStore();
  const addToCart = useCartStore(state => state.addToCart);
  const [userOrders, setUserOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    let list = [];
    try {
      const { data, error } = await supabase.from('orders').select('*').order('id', { ascending: false });
      if (!error && data) {
        list = data;
      }
    } catch (e) {
      console.warn('Supabase orders load note:', e);
    }

    if (storeOrders && storeOrders.length > 0) {
      const existingNos = new Set(list.map(o => String(o.order_number || o.id)));
      for (const o of storeOrders) {
        if (!existingNos.has(String(o.order_number || o.id))) {
          list.push(o);
        }
      }
    }

    const cleanUserEmail = (user?.email || '').toLowerCase().trim();
    const cleanUserPhone = (user?.phone || '').replace(/\D/g, '').slice(-10);

    let myOrders = list;
    if (user?.role !== 'admin' && (cleanUserEmail || cleanUserPhone)) {
      const filtered = list.filter(o => {
        const oEmail = (o.customer_email || o.user_email || '').toLowerCase().trim();
        const oPhone = (o.customer_phone || o.user_phone || '').replace(/\D/g, '').slice(-10);
        let addrEmail = '', addrPhone = '';
        try {
          const addr = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : (o.shipping_address || o.address || {});
          addrEmail = (addr.email || '').toLowerCase().trim();
          addrPhone = (addr.mobile || addr.phone || '').replace(/\D/g, '').slice(-10);
        } catch {}
        return (cleanUserEmail && (oEmail === cleanUserEmail || addrEmail === cleanUserEmail)) ||
               (cleanUserPhone && (oPhone === cleanUserPhone || addrPhone === cleanUserPhone)) ||
               (o.user_id && o.user_id === user?.id);
      });
      if (filtered.length > 0) {
        myOrders = filtered;
      }
    }

    const normalized = myOrders.map(o => {
      let address = {};
      if (o.shipping_address) {
        try { address = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address; } catch {}
      } else if (o.address) {
        try { address = typeof o.address === 'string' ? JSON.parse(o.address) : o.address; } catch {}
      }
      let items = [];
      try { items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); } catch {}
      return {
        ...o,
        id: o.id || o.order_number,
        order_number: o.order_number || String(o.id),
        user_name: o.customer_name || o.user_name || address?.name || 'Customer',
        user_email: o.customer_email || o.user_email || address?.email || '',
        user_phone: o.customer_phone || o.user_phone || address?.mobile || address?.phone || '',
        address,
        shipping_address: address,
        items,
        total: Number(o.total || 0),
        subtotal: Number(o.subtotal || o.total || 0),
        discount_amount: Number(o.discount ?? o.discount_amount ?? 0),
        shipping_fee: Number(o.shipping ?? o.shipping_fee ?? 0),
        tax_amount: Number(o.tax ?? o.tax_amount ?? 0),
        status: o.status || 'paid',
        payment_status: o.payment_status || 'paid',
        payment_method: o.payment_method || 'direct_booking',
        order_type: o.order_type || 'shipping',
        tracking_id: o.tracking_id || o.tracking_number || address?.tracking_id || address?.tracking_number || '',
        tracking_link: o.tracking_link || o.tracking_url || address?.tracking_link || address?.tracking_url || '',
        created_at: o.created_at || new Date().toISOString()
      };
    });

    setUserOrders(normalized);
    setLoading(false);
  }, [storeOrders, user?.id, user?.email, user?.phone, user?.role]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchProfile().catch(() => null);
    loadOrders(true);
  }, [token]);

  useEffect(() => {
    if (token) {
      loadOrders(false);
    }
  }, [user?.id, user?.email, user?.phone, storeOrders]);

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const invoiceHtml = (order) => {
    let items = [];
    try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch(e) {}
    let address = {};
    try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch(e) {}

    const isPickup = order.order_type === 'pickup';
    const subtotal = items.reduce((sum, item) => sum + ((item.variant?.price || item.product?.price || item.price || 0) * item.qty), 0);
    const discountAmt = parseFloat(order.discount_amount) || 0;
    const shippingCost = parseFloat(order.shipping_fee) ?? (!isPickup && Number(order.total) - subtotal > 0 ? Number(order.total) - subtotal : 0);
    const taxAmt = parseFloat(order.tax_amount) || 0;
    const signatureFee = parseFloat(address.signature_fee) || 0;
    const insuranceFee = parseFloat(address.insurance_fee) || 0;
    const orderDate = order.created_at
      ? new Date(order.created_at).toLocaleString('en-US', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Chicago', timeZoneName: 'short' })
      : '—';

    const rows = items.map((item, idx) => {
      const variantColor = (item.variant?.color || '').toLowerCase().trim();
      const matchedVariant = item.product?.variants?.find(v => (v.color || '').toLowerCase().trim() === variantColor);
      const img = item.variant?.image || matchedVariant?.images?.[0] || item.product?.images?.[0] || item.product?.image_url || item.image_url || '';
      const absImg = img && img.startsWith('http') ? img : (img ? `${window.location.origin}${img.startsWith('/') ? '' : '/'}${img}` : '');
      const code = item.variant?.size_code || item.variant?.sku || item.variant?.code || matchedVariant?.code || item.product?.product_code || item.product_code || item.sku || '';
      return `
      <tr style="background:${idx % 2 === 0 ? '#ffffff' : '#FFFAF9'}">
        <td style="padding:10px 12px;border-bottom:1px solid #F6EFEF;vertical-align:middle;text-align:center;font-size:9pt;color:#888;">${idx + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F6EFEF;vertical-align:middle;">
          <div style="display:flex;align-items:center;gap:10px;">${absImg ? `<img src="${absImg}" style="width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid #f0e0c0;flex-shrink:0;" />` : `<div style="width:44px;height:44px;background:#FAF6F0;border-radius:6px;border:1px solid #f0e0c0;flex-shrink:0;"></div>`}
            <div>
              <div style="font-weight:700;color:#222;font-size:9.5pt;">${escapeHtml(item.product?.name || item.name || '')}</div>${code ? `<div style="font-size:8pt;color:#b8860b;font-weight:600;margin-top:2px;">#${escapeHtml(code)}</div>` : ''}
            </div>
          </div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #F6EFEF;vertical-align:middle;text-align:center;font-size:9pt;">${escapeHtml(item.variant?.size || item.size || '—')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F6EFEF;vertical-align:middle;text-align:center;font-size:9pt;">${item.qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F6EFEF;vertical-align:middle;text-align:right;font-size:9pt;font-weight:600;">₹${Number(item.variant?.price || item.product?.price || item.price || 0).toLocaleString('en-IN')}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F6EFEF;vertical-align:middle;text-align:right;font-size:9pt;font-weight:700;color:#45055B;">₹${(Number(item.variant?.price || item.product?.price || item.price || 0) * item.qty).toLocaleString('en-IN')}</td>
      </tr>`;
    }).join('');

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

<!-- HEADER -->
<table style="width:100%;border-collapse:collapse;border-bottom:3px solid #45055B;padding-bottom:16px;margin-bottom:20px;">
  <tr>
    <td style="vertical-align:middle;width:50%;">
      <div style="display:flex;align-items:center;gap:10px;">
        <img src="${new URL(logoUrl, window.location.href).href}" style="height:48px;width:auto;object-fit:contain;" alt="LYDIA GLOBAL EXIM Logo" />
        <div style="display:flex;flex-direction:column;">
          <span style="font-family:serif;font-weight:900;font-size:22px;color:#45055B;line-height:1;">LYDIA GLOBAL EXIM</span>
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

<!-- FROM / SHIP TO -->
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
        <strong style="color:#45055B;">${escapeHtml(address.name || user?.name || '')}</strong><br>${escapeHtml(address.line1 || '')}${address.line2 ? ', ' + escapeHtml(address.line2) : ''}<br>${escapeHtml(address.city || '')}, ${escapeHtml(address.state || '')} ${escapeHtml(address.pincode || '')}<br>${address.mobile ? `<strong>Phone:</strong>${escapeHtml(address.mobile)}` : ''}
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
 
<!-- ITEMS TABLE -->
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

<!-- TOTALS -->
<table style="width:100%;border-collapse:collapse;margin-top:8px;">
  <tr>
    <td style="width:55%;"></td>
    <td style="width:45%;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:7px 12px;text-align:right;color:#555;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">Subtotal</td><td style="padding:7px 12px;text-align:right;font-weight:600;font-size:9.5pt;border-bottom:1px solid #F6EFEF;width:110px;">₹${subtotal.toFixed(2)}</td></tr>${discountAmt > 0 ? `<tr><td style="padding:7px 12px;text-align:right;color:#059669;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">Discount${order.coupon_code ? ' (' + order.coupon_code + ')' : ''}</td><td style="padding:7px 12px;text-align:right;font-weight:600;font-size:9.5pt;border-bottom:1px solid #F6EFEF;color:#059669;">-₹${discountAmt.toFixed(2)}</td></tr>` : ''}
        ${shippingCost > 0 ? `<tr><td style="padding:7px 12px;text-align:right;color:#555;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">Shipping</td><td style="padding:7px 12px;text-align:right;font-weight:600;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">₹${shippingCost.toFixed(2)}</td></tr>` : ''}
        ${signatureFee > 0 ? `<tr><td style="padding:7px 12px;text-align:right;color:#555;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">Signature Confirmation</td><td style="padding:7px 12px;text-align:right;font-weight:600;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">₹${signatureFee.toFixed(2)}</td></tr>` : ''}
        ${insuranceFee > 0 ? `<tr><td style="padding:7px 12px;text-align:right;color:#555;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">Shipping Insurance</td><td style="padding:7px 12px;text-align:right;font-weight:600;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">₹${insuranceFee.toFixed(2)}</td></tr>` : ''}
        ${taxAmt > 0 ? `<tr><td style="padding:7px 12px;text-align:right;color:#555;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">Tax</td><td style="padding:7px 12px;text-align:right;font-weight:600;font-size:9.5pt;border-bottom:1px solid #F6EFEF;">₹${taxAmt.toFixed(2)}</td></tr>` : ''}
        <tr style="background:#FAF6F0;"><td style="padding:10px 12px;text-align:right;font-weight:700;font-size:11pt;color:#45055B;border-top:2px solid #45055B;">TOTAL</td><td style="padding:10px 12px;text-align:right;font-weight:700;font-size:11pt;color:#D4AF37;border-top:2px solid #45055B;">₹${Number(order.total).toFixed(2)}</td></tr>${parseFloat(order.refund_amount) > 0 ? `
        <tr><td colspan="2" style="padding:12px;text-align:right;border-bottom:1px solid #F6EFEF;">
          <div style="background:#FEF2F2;border:1px solid #FCA5A5;border-radius:4px;padding:8px;display:inline-block;text-align:right;min-width:200px;">
            <div style="color:#DC2626;font-size:8.5pt;text-transform:uppercase;font-weight:700;margin-bottom:4px;">Refund Processed</div>
            <div style="color:#991B1B;font-size:12pt;font-weight:800;margin-bottom:4px;">-₹${parseFloat(order.refund_amount).toFixed(2)}</div>${order.refund_id ? `<div style="color:#B91C1C;font-size:8pt;">Txn: ${escapeHtml(order.refund_id)}</div>` : ''}
          </div>
        </td></tr>` : ''}
      </table>
    </td>
  </tr>
</table>

<!-- FOOTER -->
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
    const invoiceWindow = window.open('', '_blank');
    if (invoiceWindow) {
      invoiceWindow.document.open();
      invoiceWindow.document.write(invoiceHtml(order));
      invoiceWindow.document.close();
    }
  };

  const handleReorder = async (order) => {
    let items = [];
    try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch(e) {}
    
    for (const item of items) {
      // Reconstruct the product/variant object expected by addToCart
      const productObj = item.product || { id: item.id || item.product_id, name: item.name, price: item.price, image_url: item.image_url };
      const variantObj = item.variant || { size: item.size, color: item.color, price: item.price };
      await addToCart(productObj, variantObj, item.qty || 1, item.color || variantObj?.color);
    }
    
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="My Orders" />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-serif font-bold text-[#45055B]">Order History</h2>
          <span className="text-sm font-semibold text-[#45055B]/60 bg-[#45055B]/10 px-3 py-1 rounded-full">{userOrders.length} Orders</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#45055B]/20 border-t-[#45055B] rounded-full animate-spin" />
          </div>
        ) : userOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-[#45055B]" />
            </div>
            <p className="text-[#45055B] font-bold text-lg">No orders yet</p>
            <p className="text-sm text-[#45055B]/50 text-center max-w-sm">Looks like you haven't made your first order. Explore our spiritual collection today!</p>
            <Link to="/" className="mt-4 bg-gradient-to-r from-[#45055B] to-[#D4AF37] text-white text-sm font-bold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5">
              Start Shopping
            </Link>
          </div>
        ) : (
          userOrders.map((order) => {
            const currentStatus = (order.status || 'Received').toLowerCase();
            const address = order.address || order.shipping_address || {};
            const rawTrackId = order.tracking_id || order.tracking_number || address.tracking_id || address.tracking_number || '';
            const rawTrackLink = order.tracking_link || order.tracking_url || address.tracking_link || address.tracking_url || '';
            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-gray-100 bg-[#FAF6F0]">
                  <div>
                    <p className="text-sm font-bold text-[#45055B]">Order #{order.order_number || order.id}</p>
                    <p className="text-xs text-[#45055B]/60 mt-1">
                      Placed on {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {order.stripe_payment_intent_id && (
                      <p className="text-[10px] text-gray-400 font-mono mt-1">Txn: {order.stripe_payment_intent_id}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-4 py-1.5 rounded-full border capitalize shadow-sm ${STATUS_COLORS[currentStatus] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {order.status || 'Received'}
                    </span>
                    {order.payment_method === 'cod' && !order.stripe_payment_intent_id && (
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                        Balance (₹{Number(order.total - (order.advance_paid || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })} pending)
                      </span>
                    )}
                    <p className="text-lg font-bold text-[#45055B]">₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                {currentStatus !== 'cancelled' && (
                  <div className="px-6 py-6 border-b border-gray-100 bg-white">
                    <div className="max-w-2xl mx-auto">
                      <div className="flex items-center justify-between mb-2">
                        {STATUS_STEPS.map((step, i) => {
                          const normalizedStatus = (order.status || '').toLowerCase();
                          let stepIdx = 0;
                          if (normalizedStatus.includes('processing')) stepIdx = 1;
                          else if (normalizedStatus.includes('dispatch') || normalizedStatus.includes('shipped')) stepIdx = 2;
                          else if (normalizedStatus.includes('out for delivery') || normalizedStatus.includes('near')) stepIdx = 3;
                          else if (normalizedStatus.includes('deliver')) stepIdx = 4;

                          return (
                            <div key={step} className="flex flex-col items-center flex-1 relative">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all z-10 ${
                                i <= stepIdx ? 'bg-[#45055B] border-[#45055B] text-white shadow-md' : 'bg-white border-gray-200 text-gray-400'
                              }`}>
                                {i < stepIdx ? '✓' : i + 1}
                              </div>
                              {i < STATUS_STEPS.length - 1 && (
                                <div className={`absolute top-4 left-1/2 w-full h-0.5 -z-0 ${i < stepIdx ? 'bg-[#45055B]' : 'bg-gray-200'}`} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center mt-2">
                        {STATUS_STEPS.map((step, i) => {
                          const normalizedStatus = (order.status || '').toLowerCase();
                          let stepIdx = 0;
                          if (normalizedStatus.includes('processing')) stepIdx = 1;
                          else if (normalizedStatus.includes('dispatch') || normalizedStatus.includes('shipped')) stepIdx = 2;
                          else if (normalizedStatus.includes('out for delivery') || normalizedStatus.includes('near')) stepIdx = 3;
                          else if (normalizedStatus.includes('deliver')) stepIdx = 4;

                          return (
                            <span key={step} className={`text-[10px] sm:text-xs font-bold capitalize flex-1 text-center ${i <= stepIdx ? 'text-[#45055B]' : 'text-gray-400'}`}>
                              {step}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Courier Tracking Details Banner */}
                {(rawTrackId || rawTrackLink) && (
                  <div className="mx-6 my-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-start sm:items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#45055B] text-[#D4AF37] flex items-center justify-center shrink-0 shadow-xs">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#45055B]">Shipment Tracking Active</p>
                        <p className="text-xs text-purple-900 mt-0.5">
                          {rawTrackId ? (
                            <>AWB / Tracking Number: <strong className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-purple-200 text-[#45055B]">{rawTrackId}</strong></>
                          ) : (
                            <span className="text-purple-700 font-medium">Direct Live Courier Tracking Available</span>
                          )}
                        </p>
                      </div>
                    </div>
                    {rawTrackLink && (
                      <a
                        href={rawTrackLink.startsWith('http://') || rawTrackLink.startsWith('https://') ? rawTrackLink : `https://${rawTrackLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-[#45055B] hover:bg-[#5A0E72] text-[#D4AF37] text-xs font-bold px-4 py-2 rounded-xl transition-colors shrink-0 shadow-xs"
                      >
                        <span>Track Live Shipment</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}

                {/* Refund Information */}
                {(order.status === 'cancelled' || parseFloat(order.refund_amount) > 0) && (
                  <div className="mx-6 mb-4 bg-red-50/50 rounded-xl p-4 border border-red-100">
                    <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider mb-3">Refund Details</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-[10px] font-semibold text-red-500 uppercase">Refunded Amount</p>
                        <p className="font-bold text-red-700 text-lg">₹{parseFloat(order.refund_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-red-500 uppercase">Transaction ID</p>
                        <p className="font-semibold text-red-700 text-sm">{order.refund_id || 'N/A'}</p>
                      </div>
                      {(() => {
                        let hist = [];
                        try { hist = typeof order.refund_history === 'string' ? JSON.parse(order.refund_history) : (order.refund_history || []); } catch {}
                        const refundEvent = hist.length > 0 ? hist[hist.length - 1] : null;
                        const dateStr = refundEvent?.timestamp || order.updated_at || order.created_at;
                        return (
                          <div>
                            <p className="text-[10px] font-semibold text-red-500 uppercase">Refund Date</p>
                            <p className="font-semibold text-red-700 text-sm">{dateStr ? new Date(dateStr).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="px-6 py-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Cancelled Items */}
                    {(() => {
                      let cancelledSnap = [];
                      try { cancelledSnap = typeof order.cancelled_items_snapshot === 'string' ? JSON.parse(order.cancelled_items_snapshot) : (order.cancelled_items_snapshot || []); } catch(e) {}
                      if (cancelledSnap.length === 0 && order.status !== 'cancelled') return null;
                      
                      const cancelledList = order.status === 'cancelled' && cancelledSnap.length === 0 
                        ? (typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])) 
                        : cancelledSnap;
                      
                      if (cancelledList.length === 0) return null;

                      return cancelledList.map((item, i) => {
                        const variantImg = item.image || null;
                        const productName = item.product?.name || item.name || 'Product';
                        return (
                          <div key={`c-${i}`} className="flex items-start gap-4 p-3 rounded-xl border border-red-50 bg-red-50/20 grayscale opacity-60">
                            <div className="w-16 h-16 bg-[#FAF6F0] rounded-xl flex items-center justify-center shrink-0 border border-[#45055B]/10 overflow-hidden">
                              {variantImg ? <img src={variantImg} alt={productName} className="w-full h-full object-cover" /> : <Package className="w-8 h-8 text-[#45055B]/40" />}
                            </div>
                            <div className="flex-1 min-w-0 pt-1">
                              <p className="text-sm font-bold text-gray-500 line-clamp-1 line-through">{productName}{item.color || item.variant?.color ? ` — ${item.color || item.variant?.color}` : ''}</p>
                              <p className="text-xs text-red-500 font-medium mt-1">
                                {item.size || item.variantSize || 'Standard'} • Cancelled Qty: {item.cancelQty || item.qty}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1.5 line-through">
                                <span className="text-xs font-bold text-gray-400">-₹{parseFloat(item.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}

                    {/* Active Items */}
                    {(() => {
                      let parsedItems = [];
                      try { parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch(e) {}
                      if (order.status === 'cancelled' && parsedItems.length > 0) return null;
                      return parsedItems.map((item, i) => {
                        const variantColor = (item.variant?.color || '').toLowerCase().trim();
                        const matchedVariant = item.product?.variants?.find(v => (v.color || '').toLowerCase().trim() === variantColor);
                        const variantImg = item.variant?.image || matchedVariant?.images?.[0] || item.product?.images?.[0] || item.product?.image_url;
                        const variantCode = item.variant?.code || matchedVariant?.code;
                        const sizeCode = item.variant?.size ? matchedVariant?.sizes?.find(s => s.size === item.variant.size)?.code : null;
                        const urlCode = sizeCode || variantCode || variantColor;
                        const productName = item.product?.name || item.name || 'Product';
                        const productId = item.product?.id || item.id;
                        const unitPrice = Number(item.variant?.price || item.product?.price || item.price || 0);
                        const qty = item.qty || 1;
                        return (
                        <div key={i} className="flex items-start gap-4 p-3 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors">
                          <div className="w-16 h-16 bg-[#FAF6F0] rounded-xl flex items-center justify-center shrink-0 border border-[#45055B]/10 overflow-hidden">
                            {variantImg ? (
                              <img src={variantImg} alt={productName} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-8 h-8 text-[#45055B]/40" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <p className="text-sm font-bold text-[#45055B] line-clamp-1">
                              <Link to={`/product/${productId}${urlCode ? `?variantCode=${urlCode}` : ''}`} className="hover:text-[#D4AF37] transition-colors">
                                {productName}{item.variant?.color ? ` — ${item.variant.color}` : ''}
                              </Link>
                            </p>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              {(item.size || item.variant?.size) && (
                                <span className="text-xs text-[#45055B]/60 bg-white px-2 py-0.5 rounded-md border border-gray-100">{item.size || item.variant?.size}</span>
                              )}
                              {variantCode && (
                                <span className="text-xs text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-2 py-0.5 rounded-md border border-[#D4AF37]/20">#{variantCode}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-1.5 font-sans">
                              <span className="text-xs text-[#45055B]/50">₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })} × {qty}</span>
                              <span className="text-xs text-[#45055B]/30">=</span>
                              <span className="text-xs font-bold text-[#45055B]">₹{(unitPrice * qty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    });
                    })()}
                  </div>
                </div>

                {/* Price Summary */}
                {(() => {
                  let parsedItems = [];
                  try { parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch(e) {}
                  const subtotal = parsedItems.reduce((sum, item) => sum + (Number(item.variant?.price || item.product?.price || item.price || 0) * (item.qty || 1)), 0);
                  const discount = parseFloat(order.discount_amount) || 0;
                  const shipping = parseFloat(order.shipping_fee) || 0;
                  const tax = parseFloat(order.tax_amount) || 0;
                  const taxRate = subtotal > 0 && tax > 0 ? ((tax / (subtotal - discount)) * 100).toFixed(2) : null;
                  return (
                    <div className="mx-6 mb-4 rounded-xl border border-gray-100 overflow-hidden">
                      <div className="px-4 py-2 bg-[#45055B]/5 border-b border-gray-100">
                        <p className="text-[10px] font-bold text-[#45055B]/50 uppercase tracking-wider">Price Summary</p>
                      </div>
                      <div className="px-4 py-3 space-y-2 bg-white font-sans">
                        {/* Per-item breakdown */}
                        {parsedItems.map((item, i) => {
                          const unitPrice = Number(item.variant?.price || item.product?.price || item.price || 0);
                          const qty = item.qty || 1;
                          const name = item.product?.name || item.name || 'Item';
                          return (
                            <div key={i} className="flex justify-between text-xs text-[#45055B]/70">
                              <span className="truncate max-w-[60%]">{name}{qty > 1 ? ` ×${qty}` : ''}</span>
                              <span className="font-semibold shrink-0">
                                {qty > 1 ? <span className="text-[#45055B]/40 mr-1">₹{unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })} ea</span> : null}
                                ₹{(unitPrice * qty).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          );
                        })}
                        <div className="border-t border-dashed border-gray-100 pt-2 mt-1 space-y-1.5">
                          <div className="flex justify-between text-xs text-[#45055B]/70">
                            <span>Item Total</span>
                            <span className="font-semibold">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                          </div>
                          {discount > 0 && (
                            <div className="flex justify-between text-xs text-green-600">
                              <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{order.coupon_code ? `Discount (${order.coupon_code})` : 'Discount'}</span>
                              <span className="font-semibold">-₹{discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {shipping > 0 && (
                            <div className="flex justify-between text-xs text-[#45055B]/70">
                              <span>Shipping Fee</span>
                              <span className="font-semibold">₹{shipping.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                          {tax > 0 && (
                            <div className="flex justify-between text-xs text-[#45055B]/70">
                              <span>Tax{taxRate ? ` (${taxRate}%)` : ''}</span>
                              <span className="font-semibold">₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between text-sm font-bold text-[#45055B] border-t border-gray-200 pt-2 mt-1">
                          <span>Grand Total</span>
                          <span className="font-bold text-base text-[#45055B]">₹{Number(order.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <p className="text-center text-[10px] text-[#45055B]/40 pt-1">🔒 100% Secure Transaction</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Payment Details */}
                <div className="mx-6 mb-4 rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 py-2 bg-[#45055B]/5 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-[#45055B]/50 uppercase tracking-wider">Payment Details</p>
                  </div>
                  <div className="px-4 py-3 bg-white space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#45055B]/60">Payment Mode</span>
                      <span className="text-xs font-bold text-[#45055B] capitalize flex items-center gap-1.5">
                        {order.stripe_payment_intent_id || order.payment_method === 'stripe' ? (
                          <><CreditCard className="w-3.5 h-3.5 text-[#635BFF]" /> Online (Card)</>  
                        ) : order.payment_method === 'cod' ? (
                          <>💵 Cash on Delivery</>
                        ) : (
                          order.payment_method || '—'
                        )}
                      </span>
                    </div>
                    {order.card_last4 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#45055B]/60">Card</span>
                        <span className="text-xs font-bold text-[#45055B] font-mono flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-[#45055B]/40" />
                          •••• •••• •••• {order.card_last4}
                          {order.card_brand && <span className="text-[#45055B]/40 font-sans capitalize ml-1">{order.card_brand}</span>}
                        </span>
                      </div>
                    )}
                    {order.payment_method === 'cod' && !order.stripe_payment_intent_id && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#45055B]/60">Amount Pending</span>
                        <span className="text-xs font-bold text-amber-600">${(Number(order.total) - Number(order.advance_paid || 0)).toFixed(2)}</span>
                      </div>
                    )}
                    {order.stripe_payment_intent_id && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-xs text-[#45055B]/60 shrink-0">Transaction ID</span>
                        <span className="text-[10px] font-mono text-[#45055B]/70 truncate">{order.stripe_payment_intent_id}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tracking Section — shipping orders only */}
                {order.order_type !== 'pickup' && (order.tracking_id || order.tracking_link) && (
                  <div className="mx-6 mb-4 rounded-xl border border-purple-100 overflow-hidden">
                    <div className="px-4 py-2 bg-purple-50 border-b border-purple-100 flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-purple-600" />
                      <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Shipment Tracking</p>
                    </div>
                    <div className="px-4 py-3 bg-white space-y-2">
                      {order.tracking_id && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#45055B]/60">Tracking ID</span>
                          <span className="text-xs font-mono font-bold text-[#45055B]">{order.tracking_id}</span>
                        </div>
                      )}
                      {order.tracking_link && (
                        <a href={order.tracking_link} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-between w-full mt-1 px-3 py-2 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                          <span className="text-xs font-bold text-purple-700">Track Package</span>
                          <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 px-6 py-4 bg-[#FAF6F0] border-t border-[#45055B]/10">
                  <button onClick={() => openInvoice(order)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-[#45055B] border border-[#45055B]/20 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#45055B]/5 transition-colors shadow-sm">
                    <FileText className="w-4 h-4 text-[#45055B]" /> Download Invoice
                  </button>
                  <button onClick={() => handleReorder(order)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#45055B] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#D4AF37] transition-colors shadow-sm">
                    <RefreshCw className="w-4 h-4" /> Reorder Items
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
