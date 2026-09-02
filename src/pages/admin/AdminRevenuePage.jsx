import React, { useEffect, useState, useMemo } from "react";
import {
  TrendingUp, IndianRupee, ShoppingBag, Calendar, ArrowUpRight,
  Download, Filter, RefreshCw, CheckCircle2, Clock, XCircle,
  Truck, Store, Layers, Search, ChevronDown, DollarSign, Percent,
  PieChart, BarChart2, ShieldCheck, ArrowDownRight
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../utils/supabase";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";

export function AdminRevenuePage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("all"); // today, yesterday, week, month, year, custom, all
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [statusFilter, setStatusFilter] = useState("valid"); // valid (paid+shipped+delivered+processing), all, delivered, paid, pending, cancelled
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("date"); // date, total, items
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    let allOrders = [];
    try {
      // 1. Try Supabase
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
      // 2. Try Backend REST API
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
      console.error("Error loading orders for revenue calculation:", err);
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
      return {
        ...o,
        id: o.id || o.order_number,
        order_number: o.order_number || String(o.id),
        customer_name: o.customer_name || o.user_name || address?.name || 'Customer',
        customer_email: o.customer_email || o.user_email || address?.email || '',
        customer_phone: o.customer_phone || o.user_phone || address?.mobile || address?.phone || '',
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
        created_at: o.created_at || new Date().toISOString()
      };
    });

    setOrders(normalized);
    setLoading(false);
  };

  // Helper function to safely parse nested JSON / addresses
  const safeParse = (val) => {
    if (!val) return {};
    if (typeof val === "object") return val;
    try {
      return JSON.parse(val);
    } catch {
      return {};
    }
  };

  const parseItems = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  };

  // Filter Orders based on selected TimeRange, Status, and Order Type
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const weekStart = now.getTime() - 7 * 86400000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const yearStart = new Date(now.getFullYear(), 0, 1).getTime();

    return orders.filter((order) => {
      const orderDate = new Date(order.created_at || order.date || Date.now()).getTime();

      // 1. Time Range Filter
      if (timeRange === "today" && orderDate < todayStart) return false;
      if (timeRange === "yesterday" && (orderDate < yesterdayStart || orderDate >= todayStart)) return false;
      if (timeRange === "week" && orderDate < weekStart) return false;
      if (timeRange === "month" && orderDate < monthStart) return false;
      if (timeRange === "year" && orderDate < yearStart) return false;
      if (timeRange === "custom") {
        if (customStart && orderDate < new Date(customStart).getTime()) return false;
        if (customEnd && orderDate > new Date(customEnd + "T23:59:59").getTime()) return false;
      }

      // 2. Status Filter
      const st = (order.status || "").toLowerCase();
      if (statusFilter === "valid" && st === "cancelled") return false;
      if (statusFilter === "paid" && st !== "paid" && st !== "delivered" && st !== "shipped") return false;
      if (statusFilter === "delivered" && st !== "delivered") return false;
      if (statusFilter === "pending" && st !== "pending" && st !== "processing") return false;
      if (statusFilter === "cancelled" && st !== "cancelled") return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const addr = safeParse(order.address || order.shipping_address);
        const name = (order.user_name || order.customer_name || addr.name || addr.firstName || "").toLowerCase();
        const idStr = String(order.order_number || order.id || "").toLowerCase();
        const email = (order.user_email || order.customer_email || addr.email || "").toLowerCase();
        if (!name.includes(q) && !idStr.includes(q) && !email.includes(q)) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortField === "total") {
        const valA = Number(a.total || 0);
        const valB = Number(b.total || 0);
        return sortOrder === "desc" ? valB - valA : valA - valB;
      }
      if (sortField === "items") {
        const countA = parseItems(a.items).length;
        const countB = parseItems(b.items).length;
        return sortOrder === "desc" ? countB - countA : countA - countB;
      }
      // Date sort
      const dateA = new Date(a.created_at || a.date || 0).getTime();
      const dateB = new Date(b.created_at || b.date || 0).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
  }, [orders, timeRange, customStart, customEnd, statusFilter, searchQuery, sortField, sortOrder]);

  // Financial Calculations
  const metrics = useMemo(() => {
    let grossTotal = 0;
    let netRevenue = 0;
    let totalDiscount = 0;
    let totalShipping = 0;
    let totalTax = 0;
    let totalItemsSold = 0;
    let paidCount = 0;
    let pendingRevenue = 0;
    let cancelledTotal = 0;

    const categoryBreakdown = {};
    const dailyBreakdown = {};
    const paymentMethods = {};

    filteredOrders.forEach((o) => {
      const total = Number(o.total || 0);
      const discount = Number(o.discount || o.discount_amount || 0);
      const shipping = Number(o.shipping || o.shipping_fee || 0);
      const tax = Number(o.tax || o.tax_amount || 0);
      const items = parseItems(o.items);
      const st = (o.status || "").toLowerCase();
      const method = o.payment_method || "Online Payment";

      paymentMethods[method] = (paymentMethods[method] || 0) + total;

      const dateKey = new Date(o.created_at || o.date || Date.now()).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric"
      });
      dailyBreakdown[dateKey] = (dailyBreakdown[dateKey] || 0) + total;

      items.forEach((item) => {
        const qty = Number(item.qty || item.quantity || 1);
        totalItemsSold += qty;
        const cat = item.category || "Jewelry";
        categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (Number(item.price || item.our_price || 0) * qty);
      });

      if (st === "cancelled") {
        cancelledTotal += total;
      } else {
        grossTotal += total;
        totalDiscount += discount;
        totalShipping += shipping;
        totalTax += tax;

        if (st === "delivered" || st === "paid" || st === "shipped") {
          netRevenue += total;
          paidCount++;
        } else if (st === "pending" || st === "processing" || st === "under processing" || st === "received") {
          pendingRevenue += total;
        }
      }
    });

    const averageOrderValue = filteredOrders.length > 0 ? (grossTotal / Math.max(1, filteredOrders.length)) : 0;

    return {
      grossTotal,
      netRevenue,
      totalDiscount,
      totalShipping,
      totalTax,
      totalItemsSold,
      averageOrderValue,
      pendingRevenue,
      cancelledTotal,
      paidCount,
      categoryBreakdown,
      dailyBreakdown,
      paymentMethods,
    };
  }, [filteredOrders]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      alert("No revenue data to export.");
      return;
    }

    const rows = filteredOrders.map((o) => {
      const addr = safeParse(o.address || o.shipping_address);
      const items = parseItems(o.items);
      return {
        "Order ID": o.order_number || o.id,
        "Date": new Date(o.created_at || o.date || Date.now()).toLocaleString(),
        "Customer Name": o.user_name || o.customer_name || addr.name || `${addr.firstName || ""} ${addr.lastName || ""}`.trim(),
        "Customer Email": o.user_email || o.customer_email || addr.email || "",
        "Customer Phone": o.user_phone || addr.mobile || addr.phone || "",
        "Order Type": o.order_type || "shipping",
        "Status": o.status || "pending",
        "Payment Method": o.payment_method || "Online",
        "Subtotal (₹)": o.subtotal || o.total,
        "Discount (₹)": o.discount || o.discount_amount || 0,
        "Shipping Fee (₹)": o.shipping || o.shipping_fee || 0,
        "Tax (₹)": o.tax || o.tax_amount || 0,
        "Net Total (₹)": o.total || 0,
        "Items Count": items.length
      };
    });

    const headers = Object.keys(rows[0]).join(",");
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `revenue_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#45055B]">Revenue Calculation</h1>
            <span className="bg-[#D4AF37]/15 text-[#45055B] text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
              Financial Analytics
            </span>
          </div>
          <p className="text-[#45055B]/60 text-xs sm:text-sm font-sans mt-1">
            Real-time calculation of order revenue, realized sales, taxes, discounts, and customer order values.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-[#45055B] hover:bg-gray-50 border border-[#45055B]/15 rounded-xl text-xs font-semibold shadow-sm transition-all"
            title="Refresh order calculations"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#45055B] text-white hover:bg-[#5A0E72] rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#D4AF37]" />
            Export Revenue CSV
          </button>
        </div>
      </div>

      {/* Filter Controls Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#45055B]/10 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Date Selectors */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Time" },
              { id: "today", label: "Today" },
              { id: "yesterday", label: "Yesterday" },
              { id: "week", label: "Last 7 Days" },
              { id: "month", label: "This Month" },
              { id: "year", label: "This Year" },
              { id: "custom", label: "Custom Range" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeRange(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  timeRange === t.id
                    ? "bg-[#45055B] text-[#D4AF37] shadow-sm"
                    : "bg-gray-100/80 text-[#45055B]/70 hover:bg-gray-200/70"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#D4AF37] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search order #, customer..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#45055B]"
            />
          </div>
        </div>

        {/* Custom Date Range & Secondary Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100">
          {timeRange === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50 text-[#45055B]"
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50 text-[#45055B]"
              />
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50 text-[#45055B] font-semibold"
            >
              <option value="valid">Active / Non-Cancelled</option>
              <option value="all">All Orders</option>
              <option value="delivered">Delivered</option>
              <option value="paid">Paid / Shipped</option>
              <option value="pending">Pending Processing</option>
              <option value="cancelled">Cancelled Orders</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-xs font-semibold text-gray-500">Sort by:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="px-2.5 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50 text-[#45055B] font-semibold"
            >
              <option value="date">Order Date</option>
              <option value="total">Revenue Amount</option>
              <option value="items">Items Count</option>
            </select>
            <button
              onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-bold text-[#45055B]"
              title="Toggle sort direction"
            >
              {sortOrder === "desc" ? "↓ High-to-Low" : "↑ Low-to-High"}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-[#45055B] to-[#2E023D] text-white p-5 rounded-2xl shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans text-white/70 font-semibold uppercase tracking-wider">Gross Total Sales</span>
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#D4AF37]">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="font-sans text-3xl font-bold text-[#D4AF37] tracking-tight">
              ₹{Number(metrics.grossTotal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-[11px] text-white/70 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              From {filteredOrders.length} calculated orders
            </p>
          </div>
        </motion.div>

        {/* Realized / Net Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white border border-[#45055B]/10 p-5 rounded-2xl shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans text-gray-500 font-semibold uppercase tracking-wider">Realized Revenue</span>
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="font-sans text-3xl font-bold text-emerald-600 tracking-tight">
              ₹{Number(metrics.netRevenue).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {metrics.paidCount} fulfilled / paid orders
            </p>
          </div>
        </motion.div>

        {/* Average Order Value (AOV) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-[#45055B]/10 p-5 rounded-2xl shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans text-gray-500 font-semibold uppercase tracking-wider">Avg Order Value (AOV)</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h2 className="font-sans text-3xl font-bold text-[#45055B] tracking-tight">
              ₹{Number(metrics.averageOrderValue).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
            <p className="text-[11px] text-gray-500 mt-1">
              {metrics.totalItemsSold} total jewelry units sold
            </p>
          </div>
        </motion.div>

        {/* Discounts & Pending Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-[#45055B]/10 p-5 rounded-2xl shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans text-gray-500 font-semibold uppercase tracking-wider">Discounts & Pipeline</span>
            <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-500">Discounts Given:</span>
              <span className="font-sans font-bold text-red-600">-₹{Number(metrics.totalDiscount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-500">Shipping Collected:</span>
              <span className="font-sans font-bold text-[#45055B]">₹{Number(metrics.totalShipping).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-500">Pending Pipeline:</span>
              <span className="font-sans font-bold text-amber-600">₹{Number(metrics.pendingRevenue).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Category Revenue Breakdown & Payment Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Category Contribution */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#45055B]/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-serif text-base font-bold text-[#45055B]">Revenue by Category</h3>
            </div>
            <span className="text-xs text-gray-400">Share of total sales</span>
          </div>

          <div className="space-y-3">
            {Object.entries(metrics.categoryBreakdown).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No category data recorded in selected range.</p>
            ) : (
              Object.entries(metrics.categoryBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, amount]) => {
                  const pct = metrics.grossTotal > 0 ? ((amount / metrics.grossTotal) * 100).toFixed(1) : 0;
                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-[#45055B]">
                        <span>{cat}</span>
                        <span className="font-mono">₹{amount.toLocaleString("en-IN")} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#45055B] to-[#D4AF37] h-2 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-[#45055B]/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-serif text-base font-bold text-[#45055B]">Payment Modes</h3>
            </div>
          </div>

          <div className="space-y-3">
            {Object.entries(metrics.paymentMethods).length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">No payment data recorded.</p>
            ) : (
              Object.entries(metrics.paymentMethods).map(([mode, amt]) => {
                const pct = metrics.grossTotal > 0 ? ((amt / metrics.grossTotal) * 100).toFixed(1) : 0;
                return (
                  <div key={mode} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#45055B] capitalize">{mode}</p>
                      <p className="text-[10px] text-gray-400">{pct}% of gross</p>
                    </div>
                    <span className="text-sm font-sans font-bold text-[#45055B]">
                      ₹{amt.toLocaleString("en-IN")}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Detailed Orders Revenue Breakdown Table */}
      <div className="bg-white rounded-2xl border border-[#45055B]/10 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-bold text-[#45055B]">Order Revenue Ledger</h3>
            <p className="text-xs text-gray-400">Detailed itemized list of orders contributing to the current revenue metrics</p>
          </div>
          <span className="text-xs font-bold bg-gray-100 text-[#45055B] px-3 py-1 rounded-full">
            {filteredOrders.length} Records
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#45055B]/20 border-t-[#45055B] rounded-full animate-spin" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400 space-y-2">
            <ShoppingBag className="w-8 h-8 mx-auto text-gray-300" />
            <p className="text-sm font-semibold">No orders matched the selected revenue filters.</p>
            <button
              onClick={() => {
                setTimeRange("all");
                setStatusFilter("valid");
                setOrderTypeFilter("all");
                setSearchQuery("");
              }}
              className="text-xs text-[#D4AF37] font-bold underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#FAF6F0] text-[#45055B]/70 uppercase tracking-wider font-bold border-b border-[#45055B]/10">
                <tr>
                  <th className="px-4 py-3.5">Order</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Items</th>
                  <th className="px-4 py-3.5">Discount</th>
                  <th className="px-4 py-3.5 text-right font-bold text-[#45055B]">Net Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map((order) => {
                  const addr = safeParse(order.address || order.shipping_address);
                  const items = parseItems(order.items);
                  const st = (order.status || "pending").toLowerCase();
                  const total = Number(order.total || 0);
                  const discount = Number(order.discount || order.discount_amount || 0);

                  return (
                    <tr key={order.id} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-4 py-3.5 font-bold font-mono text-[#45055B]">
                        #{order.order_number || order.id}
                      </td>
                      <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                        {new Date(order.created_at || order.date || Date.now()).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-[#45055B]">{order.user_name || order.customer_name || addr.name || `${addr.firstName || ""} ${addr.lastName || ""}`.trim() || "Customer"}</p>
                        <p className="text-[10px] text-gray-400">{addr.city || addr.state || ""}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          st === "delivered" ? "bg-green-100 text-green-700" :
                          st === "paid" || st === "shipped" ? "bg-blue-100 text-blue-700" :
                          st === "cancelled" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"
                        }`}>
                          {order.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-gray-600">
                        {items.length} item{items.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-4 py-3.5 text-red-500 font-mono">
                        {discount > 0 ? `-₹${discount.toLocaleString("en-IN")}` : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right font-sans font-bold text-sm text-[#45055B]">
                        ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
