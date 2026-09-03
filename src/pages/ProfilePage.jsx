import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Heart, MapPin, Settings, LogOut, ChevronRight, User, ShoppingBag, ExternalLink } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { Header } from '../components/Header';
import { useAuthStore } from '../store/useAuthStore';

export function ProfilePage() {
  const { user, token, orders, fetchProfile, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col pb-20">
        <Header title="My Profile" />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 mt-8 px-4 text-center">
          <div className="w-20 h-20 bg-brand-gold/10 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-brand-gold" />
          </div>
          <p className="text-gray-800 font-bold text-lg">Welcome to LYDIA GLOBAL EXIM</p>
          <p className="text-gray-500 text-xs max-w-xs">Log in to view your past orders, manage saved addresses, and track shipments in real time.</p>
          <Link to="/login" className="w-full max-w-xs bg-[#45055B] text-[#D4AF37] font-bold px-8 py-3.5 rounded-xl text-sm shadow-md hover:shadow-lg transition-all">Login</Link>
          <Link to="/signup" className="text-brand-dark-blue text-xs font-semibold hover:underline">Don't have an account? Sign Up</Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  const menuItems = [
    { 
      icon: Package, 
      label: 'My Orders', 
      badge: orders.length > 0 ? `${orders.length} Order${orders.length > 1 ? 's' : ''}` : null,
      action: () => navigate('/my-orders') 
    },
    { icon: Heart, label: 'Wishlist', action: () => navigate('/wishlist') },
    { icon: MapPin, label: 'Saved Addresses', action: () => navigate('/my-addresses') },
    { icon: Settings, label: 'Account Settings', action: () => navigate('/account-settings') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <Header title="My Profile" />
      
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-[#45055B] to-[#2E023D] text-white px-6 pt-6 pb-8 rounded-b-[2.5rem] shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border-2 border-[#D4AF37]/50 shrink-0">
            <User className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{user?.name || 'Customer'}</h1>
            <p className="text-xs text-white/70 mt-0.5">{user?.phone || user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <Link to="/dashboard"
                className="inline-block bg-white/15 hover:bg-white/25 text-[#D4AF37] text-[11px] font-bold px-3.5 py-1 rounded-full border border-[#D4AF37]/30 transition-colors">
                Dashboard
              </Link>
              <Link to="/my-orders"
                className="inline-block bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-white text-[11px] font-bold px-3.5 py-1 rounded-full border border-white/20 transition-colors">
                Orders ({orders.length})
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Recent Orders Card if any */}
        {orders.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#45055B]" />
                <h2 className="text-xs font-bold text-[#45055B] uppercase tracking-wider">Recent Orders ({orders.length})</h2>
              </div>
              <Link to="/my-orders" className="text-xs font-bold text-brand-gold hover:underline flex items-center gap-0.5">
                View All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2">
              {orders.slice(0, 2).map((order) => {
                let items = [];
                try { items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || []); } catch {}
                const itemsCount = items.reduce((sum, it) => sum + (it.qty || 1), 0) || items.length || 1;
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate('/my-orders')}
                    className="p-3 bg-gray-50 hover:bg-[#45055B]/5 rounded-xl border border-gray-100 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#45055B]">#{order.order_number || order.id}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {itemsCount} item{itemsCount > 1 ? 's' : ''} • {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <div className="text-right font-sans">
                      <span className="text-xs font-bold text-[#45055B] block">
                        ₹{Number(order.total || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 capitalize">
                        {order.status || 'Received'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Menu Links */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button key={index} onClick={item.action}
                className={`w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors ${index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 rounded-lg bg-[#45055B]/5 flex items-center justify-center text-[#45055B]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="text-[10px] font-bold bg-[#45055B]/10 text-[#45055B] px-2.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </button>
            );
          })}
          
          <button onClick={() => { logout(); navigate('/'); }}
            className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors border-t border-gray-100">
            <div className="flex items-center gap-3 text-red-500">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-xs font-semibold">Logout</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
