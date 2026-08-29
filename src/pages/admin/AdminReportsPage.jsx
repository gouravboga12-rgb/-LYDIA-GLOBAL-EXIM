import React, { useEffect, useState } from "react";
import { Download, TrendingUp, DollarSign, ShoppingBag, Users, Tag, FileText, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";

export function AdminReportsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    // Simulate fetching reports by just calling dashboard stats for now
    fetch(`${BACKEND_URL}/admin/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const convertToCSV = (objArray) => {
    if (!objArray || objArray.length === 0) return '';
    const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    const headers = Object.keys(array[0]);
    str += headers.join(',') + '\r\n';
    
    for (let i = 0; i < array.length; i++) {
      let line = '';
      for (let index in array[i]) {
        if (line !== '') line += ',';
        let val = array[i][index];
        if (val === null || val === undefined) val = '';
        if (typeof val === 'object') val = JSON.stringify(val).replace(/"/g, '""');
        if (typeof val === 'string' && val.includes(',')) val = `"${val}"`;
        line += val;
      }
      str += line + '\r\n';
    }
    return str;
  };

  const downloadCSV = (csvStr, filename) => {
    if (!csvStr) return alert("No data available for this report.");
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [downloading, setDownloading] = useState(false);

  const downloadReport = async (type) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setDownloading(true);
    try {
      let endpoint = '';
      if (type === 'revenue' || type === 'orders') endpoint = '/admin/orders';
      else if (type === 'products') endpoint = '/admin/products';
      else if (type === 'customers') endpoint = '/admin/users';
      else if (type === 'coupons') endpoint = '/admin/coupons';

      const res = await fetch(`${BACKEND_URL}${endpoint}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      
      const safeParse = (str) => { try { return typeof str === 'string' ? JSON.parse(str) : (str || {}); } catch { return {}; } };
      const parseArray = (str) => { try { return typeof str === 'string' ? JSON.parse(str) : (Array.isArray(str) ? str : []); } catch { return []; } };

      let arr = [];
      if (type === 'revenue' || type === 'orders') {
        if (data.orders) {
          arr = data.orders.map(o => {
            const addr = safeParse(o.address);
            const items = parseArray(o.items);
            return {
              'Order ID': o.id,
              'Order Number': o.order_number || '',
              'Date': new Date(o.created_at).toLocaleString(),
              'Customer Name': o.user_name || (addr.firstName ? addr.firstName + ' ' + (addr.lastName || '') : ''),
              'Customer Email': o.user_email || addr.email || '',
              'Customer Phone': addr.mobile || '',
              'Status': o.status,
              'Order Type': o.order_type,
              'Total Amount': o.total,
              'Discount Amount': o.discount_amount || 0,
              'Coupon Code': o.coupon_code || '',
              'Shipping Fee': o.shipping_fee || 0,
              'Tax Amount': o.tax_amount || 0,
              'Payment Method': o.payment_method || '',
              'Address': addr.address ? `${addr.address}, ${addr.city}, ${addr.state}, ${addr.zipCode}, ${addr.country}` : '',
              'Item Count': items.length
            };
          });
        }
      } else if (type === 'products') {
        if (data.products) {
          arr = [];
          data.products.forEach(p => {
            let variants = parseArray(p.variants);
            if (!variants || variants.length === 0) {
              variants = [{ color: p.color || '', sizes: [{ size: "Default", our_price: p.price, stock: p.stock || 0, code: p.product_code || "" }] }];
            }
            variants.forEach(v => {
              const sizes = v.sizes && v.sizes.length > 0 ? v.sizes : [{ size: "Default", our_price: p.price, stock: p.stock || 0, code: p.product_code || "" }];
              sizes.forEach(s => {
                arr.push({
                  'Product ID': p.id,
                  'Product Code': s.code || p.product_code || '',
                  'Name': p.name,
                  'Category': p.category || '',
                  'Model': p.model || '',
                  'Color': v.color || p.color || '',
                  'Size': s.size || '',
                  'Price': s.our_price || s.mrp || s.price || p.price || '',
                  'Stock': s.stock !== undefined && s.stock !== null ? s.stock : (p.stock || 0),
                  'Active': p.is_active ? 'Yes' : 'No',
                  'Bestseller': p.is_bestseller ? 'Yes' : 'No',
                  'Trending': p.is_trending ? 'Yes' : 'No',
                  'Date Added': new Date(p.created_at).toLocaleDateString()
                });
              });
            });
          });
        }
      } else if (type === 'customers') {
        if (data.users) {
          arr = data.users.map(u => ({
            'User ID': u.id,
            'Name': u.name,
            'Email': u.email,
            'Phone': u.phone || '',
            'Country': u.country || '',
            'Role': u.role,
            'Email Verified': u.email_verified ? 'Yes' : 'No',
            'Phone Verified': u.phone_verified ? 'Yes' : 'No',
            'Joined Date': new Date(u.created_at).toLocaleString()
          }));
        }
      } else if (type === 'coupons') {
        if (data.coupons) {
          arr = data.coupons.map(c => ({
            'Coupon ID': c.id,
            'Code': c.code,
            'Discount': c.discount_value + (c.discount_type === 'percentage' ? '%' : ' flat'),
            'Min Order Value': c.min_order_value || 0,
            'Min Qty': c.min_qty || 0,
            'Usage Type': c.usage_type || 'multiple',
            'Min Type': c.min_type || 'value',
            'Active': c.is_active ? 'Yes' : 'No',
            'Created At': new Date(c.created_at).toLocaleDateString(),
            'Expires At': c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'
          }));
        }
      }
      
      const csvStr = convertToCSV(arr);
      downloadCSV(csvStr, `${type}_report_${new Date().toISOString().slice(0,10)}.csv`);
    } catch (err) {
      console.error(err);
      alert('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-10 h-10 border-4 border-[#2A0845]/20 border-t-[#2A0845] rounded-full" 
      />
    </div>
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="w-full max-w-6xl mx-auto space-y-8 pb-12"
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#2A0845] tracking-tight">Reports & Analytics</h1>
          <p className="text-[#2A0845]/60 text-sm font-sans mt-2">Comprehensive overview of your store's performance and data exports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Card */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="relative overflow-hidden bg-gradient-to-br from-[#2A0845] to-[#1a3673] rounded-3xl p-8 shadow-xl shadow-[#2A0845]/10 text-white group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none transform group-hover:scale-110 transition-transform duration-500">
            <DollarSign className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
              <DollarSign className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-white/60 font-medium text-sm uppercase tracking-wider mb-2">Total Revenue</p>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold mb-8">₹{stats?.totalRevenue?.toLocaleString() || 0}</h2>
            <button 
              onClick={() => downloadReport('revenue')} 
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 bg-white text-[#2A0845] py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-all hover:shadow-lg active:scale-[0.98] disabled:opacity-70"
            >
              {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} 
              {downloading ? 'Preparing...' : 'Download Sales Report'}
            </button>
          </div>
        </motion.div>

        {/* Orders Card */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="relative overflow-hidden bg-white rounded-3xl p-8 shadow-xl shadow-[#2A0845]/5 border border-[#2A0845]/5 group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none transform group-hover:scale-110 transition-transform duration-500">
            <ShoppingBag className="w-32 h-32 text-[#2A0845]" />
          </div>
          <div className="relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF6F0] flex items-center justify-center mb-6">
              <ShoppingBag className="w-6 h-6 text-[#2A0845]" />
            </div>
            <p className="text-[#2A0845]/50 font-medium text-sm uppercase tracking-wider mb-2">Total Orders</p>
            <h2 className="text-4xl sm:text-5xl font-serif font-bold text-[#2A0845] mb-8">{stats?.totalOrders?.toLocaleString() || 0}</h2>
            <button 
              onClick={() => downloadReport('orders')} 
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 bg-[#2A0845] text-white py-3.5 rounded-xl font-bold hover:bg-[#122A5C] transition-all hover:shadow-lg hover:shadow-[#2A0845]/20 active:scale-[0.98] disabled:opacity-70"
            >
              {downloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />} 
              {downloading ? 'Preparing...' : 'Download Orders Report'}
            </button>
          </div>
        </motion.div>
      </div>

      {/* Export Data Center */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-3xl border border-[#2A0845]/10 p-8 shadow-xl shadow-[#2A0845]/5"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-serif text-2xl font-bold text-[#2A0845]">Export Data Center</h3>
            <p className="text-[#2A0845]/50 text-sm mt-1">Download comprehensive CSV reports for offline analysis.</p>
          </div>
          <div className="hidden sm:flex w-12 h-12 rounded-full bg-[#FAF6F0] items-center justify-center">
            <FileText className="w-6 h-6 text-[#2A0845]" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Products Inventory", desc: "Full catalog with stock & pricing", type: "products", icon: <TrendingUp className="w-6 h-6" /> },
            { title: "Customer Database", desc: "Registered users & profiles", type: "customers", icon: <Users className="w-6 h-6" /> },
            { title: "Coupon Usage", desc: "History of discount codes", type: "coupons", icon: <Tag className="w-6 h-6" /> }
          ].map((report, i) => (
            <motion.div 
              key={i} 
              whileHover={{ y: -4 }}
              className="flex flex-col bg-[#FAF6F0] rounded-2xl p-6 border border-[#2A0845]/5 hover:shadow-md hover:border-[#2A0845]/20 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#2A0845] mb-4 shadow-sm">
                {report.icon}
              </div>
              <h4 className="font-sans font-bold text-[#2A0845] mb-1">{report.title}</h4>
              <p className="text-xs text-[#2A0845]/60 mb-6 flex-grow">{report.desc}</p>
              
              <button 
                onClick={() => downloadReport(report.type)} 
                disabled={downloading}
                className="w-full flex items-center justify-center gap-2 bg-white border border-[#2A0845]/10 text-[#2A0845] py-2.5 rounded-xl text-sm font-semibold hover:bg-[#2A0845] hover:text-white transition-colors disabled:opacity-70"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                Export CSV
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
