import React, { useEffect, useState } from "react";
import { ShoppingBag, Users, TrendingUp, MessageCircle, Package, Clock } from "lucide-react";
import { motion } from "framer-motion";
import defaultProducts from "../../data/products.json";
import defaultCategories from "../../data/categories.json";
import { supabase } from "../../utils/supabase";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";
const WA_NUMBER = "919014863411";

export function AdminDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [productsCount, setProductsCount] = useState(defaultProducts?.length || 0);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    let allOrders = [];
    let allUsers = [];

    // 1. Supabase Fetch
    try {
      const [sbOrders, sbProducts, sbUsers] = await Promise.all([
        supabase.from("orders").select("*").order("id", { ascending: false }),
        supabase.from("products").select("id"),
        supabase.from("profiles").select("id")
      ]);

      if (!sbOrders.error && sbOrders.data) {
        allOrders = sbOrders.data;
      }
      if (!sbProducts.error && sbProducts.data && sbProducts.data.length > 0) {
        setProductsCount(sbProducts.data.length);
      }
      if (!sbUsers.error && sbUsers.data) {
        allUsers = sbUsers.data;
      }
    } catch (e) {
      console.warn("Supabase dashboard fetch note:", e);
    }

    // 2. Backend REST API fallback / merge
    try {
      const token = localStorage.getItem("token");
      const h = token ? { Authorization: `Bearer ${token}` } : {};
      const [od, ud, pd] = await Promise.all([
        fetch(`${BACKEND_URL}/admin/orders`, { headers: h }).then((r) => r.json()).catch(() => ({})),
        fetch(`${BACKEND_URL}/admin/users`, { headers: h }).then((r) => r.json()).catch(() => ({})),
        fetch(`${BACKEND_URL}/admin/products`, { headers: h }).then((r) => r.json()).catch(() => ({})),
      ]);

      if (od && od.orders && od.orders.length > 0) {
        const existingNos = new Set(allOrders.map(o => String(o.order_number || o.id)));
        for (const o of od.orders) {
          if (!existingNos.has(String(o.order_number || o.id))) {
            allOrders.push(o);
          }
        }
      }
      if (ud && ud.users && ud.users.length > 0 && allUsers.length === 0) {
        allUsers = ud.users;
      }
      if (pd && pd.products && pd.products.length > 0) {
        setProductsCount(pd.products.length);
      }
    } catch (err) {
      console.warn("Backend API fetch note:", err);
    }

    setOrders(allOrders);
    setUsers(allUsers);
  };

  const revenue = orders
    .filter((o) => (o.status || "").toLowerCase() !== "cancelled")
    .reduce((s, o) => s + Number(o.total || 0), 0);

  const pending = orders.filter((o) => {
    const st = (o.status || "").toLowerCase();
    return st === "paid" || st === "processing" || st === "pending" || st === "received" || st === "under processing";
  }).length;

  const stats = [
    { label: "Total Orders", value: orders.length, icon: <ShoppingBag className="w-5 h-5" />, color: "bg-[#45055B]/10 text-[#45055B]" },
    { label: "Total Revenue", value: `₹${Number(revenue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, icon: <TrendingUp className="w-5 h-5" />, color: "bg-green-100 text-green-600" },
    { label: "Customers", value: users.length, icon: <Users className="w-5 h-5" />, color: "bg-blue-100 text-blue-600" },
    { label: "Pending Orders", value: pending, icon: <Clock className="w-5 h-5" />, color: "bg-[#D4AF37]/10 text-[#D4AF37]" },
    { label: "Products", value: productsCount, icon: <Package className="w-5 h-5" />, color: "bg-purple-100 text-purple-600" },
  ];

  const notifyWhatsApp = (order) => {
    let address = {};
    try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch {}
    const phone = order.user_phone || order.customer_phone || address.mobile || address.phone || WA_NUMBER;
    const items = (typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])).map((i) => `${i.qty || 1}x ${i.product?.name || i.name || 'Jewelry'}`).join(", ");
    const msg = encodeURIComponent(`Hi ${order.user_name || order.customer_name || address.name || "Customer"}! 🙏 Your order #${order.order_number || order.id} (${items}) is being prepared and will be delivered soon. Thank you for ordering from LYDIA GLOBAL EXIM!`);
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#45055B]">Admin Dashboard</h1>
        <p className="text-xs text-[#45055B]/60 font-sans mt-0.5">Overview of store revenue, customer bookings, and inventory</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl border border-[#45055B]/10 p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-xs"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
              {s.icon}
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-sans font-bold text-[#45055B] tracking-tight">
                {s.value}
              </p>
              <p className="text-[#45055B]/60 text-[11px] font-sans font-medium mt-0.5">
                {s.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders with WhatsApp Notify */}
      <div className="bg-white rounded-2xl border border-[#45055B]/10 p-4 sm:p-6 shadow-xs">
        <h2 className="font-serif text-base sm:text-lg font-bold text-[#45055B] mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-[#45055B]/50 font-sans text-sm text-center py-8">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="w-full text-xs font-sans min-w-[480px]">
                <thead>
                  <tr className="text-[#45055B]/60 text-[10px] sm:text-[11px] uppercase tracking-wider border-b border-[#45055B]/10 font-bold">
                    <th className="text-left py-3 pr-2 sm:pr-4">Order</th>
                    <th className="text-left py-3 pr-2 sm:pr-4">Customer</th>
                    <th className="text-left py-3 pr-2 sm:pr-4">Total</th>
                    <th className="text-left py-3 pr-2 sm:pr-4">Status</th>
                    <th className="text-right py-3">Notify</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.slice(0, 8).map((order) => {
                    let address = {};
                    try { address = typeof order.address === 'string' ? JSON.parse(order.address) : (order.address || {}); } catch {}
                    const customerName = order.user_name || order.customer_name || address.name || "Customer";
                    const orderStatus = order.status || "Received";

                    return (
                      <tr key={order.id} className="hover:bg-[#FAF6F0]/40 transition-colors">
                        <td className="py-3.5 pr-2 sm:pr-4 font-mono font-bold text-[#45055B] text-xs">
                          #{order.order_number || order.id}
                        </td>
                        <td className="py-3.5 pr-2 sm:pr-4 font-medium text-[#45055B]/80 truncate max-w-[120px] sm:max-w-none">
                          {customerName}
                        </td>
                        <td className="py-3.5 pr-2 sm:pr-4 font-sans font-bold text-[#45055B] text-xs sm:text-sm">
                          ₹{Number(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-3.5 pr-2 sm:pr-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                            orderStatus.toLowerCase() === "delivered" ? "bg-emerald-100 text-emerald-800" :
                            orderStatus.toLowerCase() === "paid" || orderStatus.toLowerCase() === "dispatched" || orderStatus.toLowerCase() === "shipped" ? "bg-blue-100 text-blue-800" :
                            orderStatus.toLowerCase() === "cancelled" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {orderStatus}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            onClick={() => notifyWhatsApp(order)}
                            className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer shadow-xs"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> <span>WhatsApp</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
