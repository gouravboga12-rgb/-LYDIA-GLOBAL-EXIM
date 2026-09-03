import React, { useEffect, useState } from "react";
import {
  Package, Search, ChevronDown, Check, X, FileText,
  Printer, MessageCircle, ExternalLink, Pencil, RefreshCw,
  Truck, MapPin, Phone, Mail, User, Tag, Clock, CheckCircle2,
  AlertCircle, ArrowRight, Save, Link as LinkIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import logoUrl from "../../assets/logo.png";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";

const ORDER_STATUSES = [
  "Received",
  "Under Processing",
  "Dispatched",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];

const STATUS_BADGES = {
  "Received": "bg-amber-100 text-amber-800 border-amber-200",
  "pending": "bg-amber-100 text-amber-800 border-amber-200",
  "paid": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Under Processing": "bg-blue-100 text-blue-800 border-blue-200",
  "processing": "bg-blue-100 text-blue-800 border-blue-200",
  "Dispatched": "bg-purple-100 text-purple-800 border-purple-200",
  "shipped": "bg-purple-100 text-purple-800 border-purple-200",
  "Out for Delivery": "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Delivered": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "delivered": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Cancelled": "bg-red-100 text-red-800 border-red-200",
  "cancelled": "bg-red-100 text-red-800 border-red-200",
};

export function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expanded, setExpanded] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [savingTracking, setSavingTracking] = useState({});
  const [trackingInputs, setTrackingInputs] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    let allOrders = [];
    try {
      // 1. Supabase
      const { data: sbData, error } = await supabase
        .from("orders")
        .select("*")
        .order("id", { ascending: false });

      if (!error && sbData && sbData.length > 0) {
        allOrders = sbData;
      }
    } catch (e) {
      console.warn("Supabase load note:", e);
    }

    try {
      // 2. Backend REST API
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${BACKEND_URL}/admin/orders`, { headers }).catch(() => null);
      const data = res ? await res.json().catch(() => ({})) : {};

      if (data && data.orders && data.orders.length > 0) {
        const existingNos = new Set(allOrders.map(o => String(o.order_number || o.id)));
        for (const o of data.orders) {
          if (!existingNos.has(String(o.order_number || o.id))) {
            allOrders.push(o);
          }
        }
      }
    } catch (err) {
      console.error("Error loading orders:", err);
    }

    const normalized = allOrders.map(o => {
      let address = {};
      if (o.shipping_address) {
        try { address = typeof o.shipping_address === 'string' ? JSON.parse(o.shipping_address) : o.shipping_address; } catch {}
      } else if (o.address) {
        try { address = typeof o.address === 'string' ? JSON.parse(o.address) : o.address; } catch {}
      }
      let items = [];
      try { items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []); } catch {}

      // Normalize status display
      let currentStatus = o.status || 'Received';
      if (currentStatus.toLowerCase() === 'pending' || currentStatus.toLowerCase() === 'paid') currentStatus = 'Received';
      else if (currentStatus.toLowerCase() === 'processing') currentStatus = 'Under Processing';
      else if (currentStatus.toLowerCase() === 'shipped') currentStatus = 'Dispatched';
      else if (currentStatus.toLowerCase() === 'delivered') currentStatus = 'Delivered';
      else if (currentStatus.toLowerCase() === 'cancelled') currentStatus = 'Cancelled';

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
        status: currentStatus,
        tracking_id: o.tracking_number || address?.tracking_id || address?.tracking_number || o.tracking_id || '',
        tracking_link: address?.tracking_link || address?.tracking_url || o.tracking_link || o.tracking_url || '',
        created_at: o.created_at || new Date().toISOString()
      };
    });

    setOrders(normalized);
    setLoading(false);
  };

  const updateStatus = async (orderId, newStatus) => {
    // Optimistic update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    try {
      const numId = Number(orderId);
      if (!isNaN(numId)) {
        await supabase.from("orders").update({ status: newStatus }).eq("id", numId);
      }
      await supabase.from("orders").update({ status: newStatus }).eq("order_number", orderId);

      const token = localStorage.getItem("token");
      await fetch(`${BACKEND_URL}/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus }),
      }).catch(() => null);
    } catch (err) {
      console.error("Status update error:", err);
      alert("Failed to update status");
      fetchOrders();
    }
  };

  const handleSaveTracking = async (orderId) => {
    const order = orders.find(o => String(o.id) === String(orderId) || String(o.order_number) === String(orderId));
    const input = trackingInputs[orderId] || {};
    const tracking_id = (input.tracking_id !== undefined ? input.tracking_id : (order?.tracking_id || '')).trim();
    let tracking_link = (input.tracking_link !== undefined ? input.tracking_link : (order?.tracking_link || '')).trim();

    if (tracking_link && !tracking_link.startsWith('http://') && !tracking_link.startsWith('https://')) {
      tracking_link = `https://${tracking_link}`;
    }

    setSavingTracking(prev => ({ ...prev, [orderId]: true }));
    try {
      let cleanAddress = {};
      if (order?.shipping_address) {
        cleanAddress = typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : { ...order.shipping_address };
      } else if (order?.address) {
        cleanAddress = typeof order.address === 'string' ? JSON.parse(order.address) : { ...order.address };
      }

      cleanAddress.tracking_id = tracking_id;
      cleanAddress.tracking_link = tracking_link;
      cleanAddress.tracking_number = tracking_id;
      cleanAddress.tracking_url = tracking_link;

      // 1. Update in Supabase with valid columns: tracking_number and JSON stringified shipping_address
      const numId = Number(order?.id);
      const sbPayload = {
        tracking_number: tracking_id,
        shipping_address: JSON.stringify(cleanAddress)
      };

      if (!isNaN(numId)) {
        await supabase.from("orders").update(sbPayload).eq("id", numId);
      }
      if (order?.order_number) {
        await supabase.from("orders").update(sbPayload).eq("order_number", order.order_number);
      }

      // 2. Update Backend REST API
      const token = localStorage.getItem("token");
      await fetch(`${BACKEND_URL}/admin/orders/${order?.order_number || orderId}/tracking`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updateData),
      }).catch(() => null);

      // 3. Update local state
      setOrders(prev => prev.map(o => (String(o.id) === String(orderId) || String(o.order_number) === String(orderId)) ? { ...o, ...updateData, tracking_id, tracking_link } : o));
      setTrackingInputs(prev => ({
        ...prev,
        [orderId]: { tracking_id, tracking_link }
      }));

      alert("Tracking details saved successfully! It is now live on the customer side.");
    } catch (err) {
      console.error("Save tracking error:", err);
      alert("Failed to save tracking details");
    } finally {
      setSavingTracking(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const escapeHtml = (val) => String(val ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const openInvoice = (order) => {
    const items = order.items || [];
    const address = order.address || {};
    const subtotal = items.reduce((sum, item) => sum + ((item.variant?.price || item.product?.price || item.price || 0) * (item.qty || 1)), 0);
    const discountAmt = parseFloat(order.discount_amount) || 0;
    const shippingCost = parseFloat(order.shipping_fee) || 0;
    const taxAmt = parseFloat(order.tax_amount) || 0;
    const grandTotal = Number(order.total || subtotal);

    const rows = items.map((item, idx) => {
      const unitPrice = Number(item.variant?.price || item.product?.price || item.price || 0);
      const qty = Number(item.qty || 1);
      const total = unitPrice * qty;
      const size = item.variant?.size || item.size || 'Standard';
      return `
        <tr style="border-bottom: 1px solid #f0e6e6;">
          <td style="padding: 10px; text-align: center; font-size: 12px;">${idx + 1}</td>
          <td style="padding: 10px; font-size: 12px; font-weight: bold; color: #45055B;">${escapeHtml(item.product?.name || item.name || 'Jewelry Piece')}${item.variant?.color ? ` (${escapeHtml(item.variant.color)})` : ''}</td>
          <td style="padding: 10px; text-align: center; font-size: 12px;">${escapeHtml(size)}</td>
          <td style="padding: 10px; text-align: center; font-size: 12px; font-weight: bold;">${qty}</td>
          <td style="padding: 10px; text-align: right; font-size: 12px;">₹${unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
          <td style="padding: 10px; text-align: right; font-size: 12px; font-weight: bold; color: #45055B;">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
        </tr>
      `;
    }).join('');

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice #${order.order_number || order.id}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 25px; background: #fff; }
          .header { display: flex; justify-content: space-between; border-bottom: 3px solid #45055B; padding-bottom: 15px; margin-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 900; color: #45055B; letter-spacing: 1px; }
          .invoice-title { font-size: 22px; font-weight: bold; color: #D4AF37; text-align: right; }
          .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .card { background: #FAF6F0; border: 1px solid #e8d5b0; border-radius: 8px; padding: 15px; font-size: 12px; line-height: 1.6; }
          .card h4 { margin: 0 0 8px 0; color: #45055B; font-size: 13px; text-transform: uppercase; border-bottom: 1px solid #e8d5b0; padding-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #45055B; color: #D4AF37; padding: 10px; font-size: 12px; text-align: left; }
          .summary { margin-left: auto; width: 300px; font-size: 13px; line-height: 1.8; }
          .summary-row { display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 4px 0; }
          .summary-total { font-size: 16px; font-weight: bold; color: #45055B; border-top: 2px solid #45055B; border-bottom: none; margin-top: 6px; padding-top: 6px; }
          .print-btn { text-align: center; margin-top: 25px; }
          .btn { background: #45055B; color: #D4AF37; border: none; padding: 10px 24px; font-weight: bold; border-radius: 20px; cursor: pointer; font-size: 13px; }
          @media print { .print-btn { display: none; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">LYDIA GLOBAL EXIM</div>
            <div style="font-size: 11px; color: #666; margin-top: 4px;">Exclusive Handcrafted & Luxury Jewelry</div>
            <div style="font-size: 11px; color: #666;">Phone: +91 9014863411 | Email: lydiaglobalexim@gmail.com</div>
          </div>
          <div>
            <div class="invoice-title">TAX INVOICE</div>
            <div style="font-size: 12px; color: #444; margin-top: 4px;"><strong>Order #:</strong> #${escapeHtml(order.order_number || order.id)}</div>
            <div style="font-size: 12px; color: #444;"><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
            <div style="font-size: 12px; color: #444;"><strong>Status:</strong> ${escapeHtml(order.status)}</div>
          </div>
        </div>

        <div class="details-grid">
          <div class="card">
            <h4>Billed To / Delivery Address</h4>
            <strong>${escapeHtml(order.user_name || address.name || 'Customer')}</strong><br>
            ${escapeHtml(address.line1 || '')}${address.line2 ? ', ' + escapeHtml(address.line2) : ''}<br>
            ${escapeHtml(address.city || '')}, ${escapeHtml(address.state || '')} - ${escapeHtml(address.pincode || '')}<br>
            Phone: ${escapeHtml(order.user_phone || address.mobile || address.phone || 'N/A')}<br>
            Email: ${escapeHtml(order.user_email || address.email || 'N/A')}
          </div>
          <div class="card">
            <h4>Order & Tracking Details</h4>
            <strong>Payment Method:</strong> ${escapeHtml(order.payment_method || 'Online Payment')}<br>
            ${order.tracking_id ? `<strong>Tracking / AWB:</strong> ${escapeHtml(order.tracking_id)}<br>` : ''}
            ${order.tracking_link ? `<strong>Track Link:</strong> ${escapeHtml(order.tracking_link)}<br>` : ''}
            <strong>Order Channel:</strong> Delivery Shipping
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">#</th>
              <th style="width: 45%;">Item Description</th>
              <th style="width: 15%; text-align: center;">Size</th>
              <th style="width: 10%; text-align: center;">Qty</th>
              <th style="width: 12%; text-align: right;">Price</th>
              <th style="width: 13%; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row"><span>Subtotal:</span><span>₹${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
          ${discountAmt > 0 ? `<div class="summary-row" style="color: #059669;"><span>Discount:</span><span>-₹${discountAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>` : ''}
          ${shippingCost > 0 ? `<div class="summary-row"><span>Shipping Fee:</span><span>₹${shippingCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>` : ''}
          ${taxAmt > 0 ? `<div class="summary-row"><span>Tax:</span><span>₹${taxAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>` : ''}
          <div class="summary-row summary-total"><span>Grand Total:</span><span>₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
        </div>

        <div class="print-btn">
          <button class="btn" onclick="window.print()">🖨️ Print Invoice</button>
        </div>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(invoiceHtml);
      printWin.document.close();
    }
  };

  const notifyWhatsApp = (order) => {
    const address = order.address || {};
    let phone = (order.user_phone || address.mobile || "").replace(/\D/g, "");
    if (phone.length === 10) phone = '91' + phone;

    const trackMsg = order.tracking_id ? ` Tracking ID: ${order.tracking_id}.${order.tracking_link ? ` Track URL: ${order.tracking_link}` : ""}` : "";
    const msg = encodeURIComponent(`Hello ${order.user_name || "Customer"}! Your order #${order.order_number || order.id} status is: *${order.status}*.${trackMsg} Thank you for shopping with LYDIA GLOBAL EXIM!`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const idMatch = String(o.order_number || o.id).toLowerCase().includes(q);
      const nameMatch = (o.user_name || "").toLowerCase().includes(q);
      const emailMatch = (o.user_email || "").toLowerCase().includes(q);
      const phoneMatch = (o.user_phone || "").includes(q);
      if (!idMatch && !nameMatch && !emailMatch && !phoneMatch) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#45055B]">Orders Management</h1>
            <span className="bg-[#45055B]/10 text-[#45055B] font-bold text-xs px-2.5 py-0.5 rounded-full">
              {orders.length} Total
            </span>
          </div>
          <p className="text-[#45055B]/60 text-xs font-sans mt-0.5">
            View customer bookings, update tracking details, and issue invoices
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-[#45055B] hover:bg-gray-50 border border-[#45055B]/15 rounded-xl text-xs font-bold shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Orders
        </button>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#45055B]/10 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === "all" ? "bg-[#45055B] text-white shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              All ({orders.length})
            </button>
            {ORDER_STATUSES.map(s => {
              const count = orders.filter(o => o.status === s).length;
              return (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === s ? "bg-[#45055B] text-white shadow-xs" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s} ({count})
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by Order #, Name, Phone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-[#45055B] focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-[#45055B]/20 border-t-[#45055B] rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#45055B]/10 p-12 text-center">
          <Package className="w-10 h-10 text-[#45055B]/30 mx-auto mb-3" />
          <h3 className="font-bold text-[#45055B] text-base mb-1">No Orders Found</h3>
          <p className="text-xs text-gray-500">
            {search ? `No orders matched search "${search}"` : `No orders with status "${statusFilter}"`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedOrders.map((order) => {
            const isExpanded = expanded === order.id;
            const items = order.items || [];
            const address = order.address || {};
            const trackingId = trackingInputs[order.id]?.tracking_id !== undefined ? trackingInputs[order.id].tracking_id : (order.tracking_id || "");
            const trackingLink = trackingInputs[order.id]?.tracking_link !== undefined ? trackingInputs[order.id].tracking_link : (order.tracking_link || "");

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-[#45055B]/10 shadow-xs overflow-hidden transition-all"
              >
                {/* Order Row Header */}
                <div
                  onClick={() => setExpanded(isExpanded ? null : order.id)}
                  className="flex items-center justify-between gap-3 p-4 sm:p-5 cursor-pointer hover:bg-[#FAF6F0]/40 transition-colors select-none"
                >
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <span className="font-mono font-bold text-[#45055B] text-sm sm:text-base">
                      #{order.order_number || order.id}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${STATUS_BADGES[order.status] || "bg-gray-100 text-gray-700"}`}>
                      {order.status}
                    </span>
                    {order.tracking_id && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md">
                        <Truck className="w-3 h-3" /> AWB: {order.tracking_id}
                      </span>
                    )}
                    <span className="text-xs text-gray-600 truncate">
                      • {order.user_name} ({items.length} item{items.length !== 1 ? 's' : ''})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-sans font-bold text-[#45055B] text-base sm:text-lg">
                      ₹{Number(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-[#45055B]/10 p-4 sm:p-6 space-y-5 bg-[#FAF6F0]/20"
                    >
                      {/* Top Action Bar: Status & Tracking */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-[#45055B]/10 shadow-xs">
                        {/* Status Updater */}
                        <div>
                          <label className="text-[11px] font-bold text-[#45055B] uppercase tracking-wider block mb-1.5">
                            Order Status
                          </label>
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-[#45055B] focus:outline-none focus:border-[#45055B]"
                          >
                            {ORDER_STATUSES.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>

                        {/* Order Track ID */}
                        <div>
                          <label className="text-[11px] font-bold text-[#45055B] uppercase tracking-wider block mb-1.5">
                            Order Track ID / AWB #
                          </label>
                          <input
                            type="text"
                            value={trackingId}
                            onChange={(e) => setTrackingInputs(prev => ({
                              ...prev,
                              [order.id]: { ...(prev[order.id] || {}), tracking_id: e.target.value }
                            }))}
                            placeholder="e.g. BLUEDART123456"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#45055B] focus:outline-none focus:border-[#45055B]"
                          />
                        </div>

                        {/* Order Track Link & Save */}
                        <div>
                          <label className="text-[11px] font-bold text-[#45055B] uppercase tracking-wider block mb-1.5">
                            Order Track Link / URL
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={trackingLink}
                              onChange={(e) => setTrackingInputs(prev => ({
                                ...prev,
                                [order.id]: { ...(prev[order.id] || {}), tracking_link: e.target.value }
                              }))}
                              placeholder="https://track.courier.com/..."
                              className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-[#45055B] focus:outline-none focus:border-[#45055B]"
                            />
                            <button
                              onClick={() => handleSaveTracking(order.id)}
                              disabled={savingTracking[order.id]}
                              className="bg-[#45055B] hover:bg-[#5A0E72] text-[#D4AF37] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              <Save className="w-3.5 h-3.5" />
                              {savingTracking[order.id] ? "Saving..." : "Save"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Customer & Address Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Customer Information */}
                        <div className="bg-white p-4 rounded-xl border border-[#45055B]/10 space-y-2">
                          <h4 className="text-xs font-bold text-[#45055B] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
                            <User className="w-3.5 h-3.5 text-[#D4AF37]" /> Customer Details
                          </h4>
                          <div className="text-xs space-y-1.5 text-gray-700">
                            <p><strong className="text-gray-500">Name:</strong> {order.user_name || address.name || "Guest"}</p>
                            <p><strong className="text-gray-500">Phone:</strong> {order.user_phone || address.mobile || address.phone || "N/A"}</p>
                            <p><strong className="text-gray-500">Email:</strong> {order.user_email || address.email || "N/A"}</p>
                            <p><strong className="text-gray-500">Payment:</strong> <span className="capitalize">{order.payment_method || "Online"}</span></p>
                          </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="bg-white p-4 rounded-xl border border-[#45055B]/10 space-y-2">
                          <h4 className="text-xs font-bold text-[#45055B] uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-gray-100">
                            <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> Delivery Address
                          </h4>
                          <div className="text-xs text-gray-700 leading-relaxed">
                            <p className="font-semibold text-[#45055B]">{address.name || order.user_name}</p>
                            <p>{address.line1 || "Address Line 1"}{address.line2 ? `, ${address.line2}` : ""}</p>
                            <p>{address.city || ""}, {address.state || ""} {address.pincode ? `- ${address.pincode}` : ""}</p>
                            {address.country && <p>{address.country}</p>}
                          </div>
                        </div>
                      </div>

                      {/* Itemized Products List */}
                      <div className="bg-white p-4 rounded-xl border border-[#45055B]/10 space-y-3">
                        <h4 className="text-xs font-bold text-[#45055B] uppercase tracking-wider pb-2 border-b border-gray-100">
                          Ordered Items ({items.length})
                        </h4>
                        <div className="divide-y divide-gray-100">
                          {items.map((item, idx) => {
                            const variantColor = (item.variant?.color || '').toLowerCase().trim();
                            const matchedVariant = item.product?.variants?.find(v => (v.color || '').toLowerCase().trim() === variantColor);
                            const variantImg = item.variant?.image || matchedVariant?.images?.[0] || item.product?.images?.[0] || item.product?.image_url;
                            const unitPrice = Number(item.variant?.price || item.product?.price || item.price || 0);
                            const qty = Number(item.qty || 1);
                            const total = unitPrice * qty;
                            const productId = item.product?.id || item.id;

                            return (
                              <div key={idx} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                                <div className="w-12 h-12 rounded-lg bg-[#FAF6F0] border border-[#45055B]/10 overflow-hidden shrink-0 flex items-center justify-center">
                                  {variantImg ? (
                                    <img src={variantImg} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-5 h-5 text-[#45055B]/30" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0">
                                  {productId ? (
                                    <Link
                                      to={`/product/${productId}`}
                                      target="_blank"
                                      className="text-xs font-bold text-[#45055B] hover:text-[#D4AF37] hover:underline flex items-center gap-1 truncate"
                                      title="Click to view product page"
                                    >
                                      <span>{item.product?.name || item.name || "Handcrafted Jewelry"}</span>
                                      <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                                    </Link>
                                  ) : (
                                    <p className="text-xs font-bold text-[#45055B] truncate">
                                      {item.product?.name || item.name || "Handcrafted Jewelry"}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                                    <span>Size: <strong className="text-gray-700">{item.variant?.size || item.size || "Standard"}</strong></span>
                                    {item.variant?.color && <span>• Color: <strong className="text-gray-700">{item.variant.color}</strong></span>}
                                    <span>• Booked Qty: <strong className="text-[#45055B]">{qty}</strong></span>
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <p className="text-xs font-sans font-bold text-[#45055B]">
                                    ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                  </p>
                                  {qty > 1 && (
                                    <p className="text-[10px] text-gray-400">
                                      ₹{unitPrice.toLocaleString('en-IN')} each
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Price Summary & Invoice Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            onClick={() => openInvoice(order)}
                            className="bg-[#45055B] hover:bg-[#5A0E72] text-[#D4AF37] px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Print Invoice
                          </button>
                          <button
                            onClick={() => notifyWhatsApp(order)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WA Update
                          </button>
                        </div>

                        {/* Grand Total */}
                        <div className="text-right font-sans">
                          <span className="text-xs text-gray-500 mr-2">Grand Total:</span>
                          <span className="text-lg font-bold text-[#45055B]">
                            ₹{Number(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-gray-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} orders
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold bg-white disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold bg-white disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
