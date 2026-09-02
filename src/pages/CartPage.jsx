import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, Store, Truck, X } from 'lucide-react';
import { Header } from '../components/Header';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import { useStoreData } from '../store/useStoreData';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, removeFromCart, updateQuantity, getSubtotal, getTotal, getDiscount, deliveryCharge, appliedCoupon, applyCoupon, removeCoupon } = useCartStore();
  const { products } = useStoreData();
  const [couponCode, setCouponCode] = useState(appliedCoupon?.code || '');
  const { showToast } = useToastStore();

  // Helper: get live stock for a cart item from the products store
  const getLiveStock = (item) => {
    const liveProduct = products.find(p => p.id === item.product.id);
    if (!liveProduct) return item.variant?.stock ?? 0;
    let variants = liveProduct.variants;
    if (typeof variants === 'string') try { variants = JSON.parse(variants); } catch { variants = []; }
    for (const v of (variants || [])) {
      const s = (v.sizes || []).find(s => s.size === item.variant?.size);
      if (s) return Number(s.stock ?? 0);
    }
    return Number(liveProduct.stock ?? 0);
  };
  
  const container = React.useRef(null);
  
  useGSAP(() => {
    if (items.length > 0) {
      gsap.from('.animate-cart-item', {
        x: -30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'power2.out',
        clearProps: 'all'
      });
      gsap.from('.animate-cart-summary', {
        y: 20,
        opacity: 0,
        duration: 0.6,
        delay: 0.3,
        ease: 'power2.out',
        clearProps: 'all'
      });
    }
  }, { scope: container });

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [pickupEnabled, setPickupEnabled] = useState(false);
  const [vacation, setVacation] = useState({ is_active: false, message: '' });
  const [showVacationModal, setShowVacationModal] = useState(false);

  useEffect(() => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/api';
    fetch(`${BACKEND_URL}/general/shipping`)
      .then(r => r.json())
      .then(d => setPickupEnabled(d.settings?.pickup_enabled ?? false))
      .catch(() => {});
    fetch(`${BACKEND_URL}/general/settings/vacation`)
      .then(r => r.json())
      .then(d => setVacation(d))
      .catch(() => {});
  }, []);

  const handleCheckout = async () => {
    if (vacation.is_active) {
      setShowVacationModal(true);
      return;
    }

    // Validate stock of all cart items before proceeding
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/api';
      const stockRes = await fetch(`${BACKEND_URL}/general/check-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (stockRes.ok) {
        const stockData = await stockRes.json();
        if (!stockData.available && stockData.unavailable && stockData.unavailable.length > 0) {
          const names = stockData.unavailable.map(u => `"${u.name}" (${u.available ?? 0} available)`).join(', ');
          showToast(`Stock unavailable: ${names} Product code: ${u.code}`, 'error');
          return;
        }
      }
    } catch (err) {
      console.warn("Stock check before checkout failed, proceeding:", err);
    }

    // Re-validate coupon conditions before proceeding
    if (appliedCoupon) {
      const cartQty = items.reduce((s, i) => s + i.qty, 0);
      try {
        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";
        const valRes = await fetch(`${BACKEND_URL}/general/validate-coupon`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            code: appliedCoupon.code, 
            cartValue: subtotal, 
            cartQty: cartQty, 
            user_id: user?.id, 
            cartItems: items 
          })
        });
        const valData = await valRes.json();
        if (valData.error) {
          removeCoupon();
          setCouponCode('');
          showToast(`Coupon removed: ${valData.error}`, 'error');
          return;
        }
      } catch (err) {
        // Validation request failed, allow to proceed but warn
        console.warn("Coupon re-validation failed, proceeding anyway", err);
      }
    }

    // If not logged in, force them to login first and return to cart
    if (!user) {
      navigate('/login?redirect=/cart');
      return;
    }

    // Navigate directly to checkout with shipping
    navigate('/checkout', { state: { couponCode, orderType: 'shipping' } });
  };

  const subtotal = getSubtotal();
  const grandTotal = getTotal();

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";
      const res = await fetch(`${BACKEND_URL}/general/validate-coupon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode, cartValue: subtotal, cartQty: items.reduce((s, i) => s + i.qty, 0), user_id: user?.id, cartItems: items })
      });
      const data = await res.json();
      if (data.success) {
        applyCoupon(data.coupon);
        showToast('Coupon applied successfully!');
      } else {
        showToast(data.error || 'Invalid coupon', 'error');
      }
    } catch (err) {
      showToast('Error validating coupon', 'error');
    }
  };

  return (
    <div ref={container} className="min-h-screen bg-brand-beige pb-36">
      <Header title={`My Cart (${items.length})`} />
      
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 mt-20 max-w-md mx-auto">
          <div className="w-24 h-24 bg-gradient-to-br from-brand-gold/10 to-brand-dark-blue/5 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <ShoppingCart className="w-12 h-12 text-brand-gold/40" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-serif font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-8 text-center text-sm">Looks like you haven't added anything to your cart yet. Discover our latest collections.</p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-brand-dark-blue text-brand-gold px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-brand-dark-blue/20 hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="p-4 md:p-8 space-y-6 md:space-y-8 md:max-w-7xl mx-auto">
          {/* Step Indicator */}
          <div className="flex justify-between items-center mb-2 px-2">
            <div className="flex flex-col items-center">
              <div className="w-6 h-6 rounded-full bg-brand-dark-blue text-brand-gold flex items-center justify-center text-xs font-bold border border-brand-gold/30">1</div>
              <span className="text-[10px] text-brand-dark-blue font-bold mt-1">Cart</span>
            </div>
            <div className="h-px bg-brand-gold/30 flex-1 mx-2"></div>
            <div className="flex flex-col items-center opacity-70">
              <div className="w-6 h-6 rounded-full bg-brand-beige-darker text-brand-dark-blue/60 flex items-center justify-center text-xs font-bold border border-brand-dark-blue/10">2</div>
              <span className="text-[10px] text-brand-dark-blue/60 font-bold mt-1">Address</span>
            </div>
            <div className="h-px bg-brand-gold/30 flex-1 mx-2"></div>
            <div className="flex flex-col items-center opacity-70">
              <div className="w-6 h-6 rounded-full bg-brand-beige-darker text-brand-dark-blue/60 flex items-center justify-center text-xs font-bold border border-brand-dark-blue/10">3</div>
              <span className="text-[10px] text-brand-dark-blue/60 font-bold mt-1">Payment</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 items-start">
            {/* Left Column: Cart Items */}
            <div className="lg:col-span-8 space-y-4">
              {items.map(item => (
              <div key={`${item.product.id}-${item.variant?.size || 'default'}`} className="animate-cart-item bg-white/60 rounded-xl shadow-sm border border-brand-gold/20 p-3 flex gap-3 relative">
                <button 
                  onClick={() => removeFromCart(item.product.id, item.variant)}
                  className="absolute top-3 right-3 text-brand-dark-blue/40 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <div className="w-20 h-20 bg-white rounded-lg shrink-0 p-1 border border-brand-gold/10">
                  <img src={item.variant?.image || (item.product.images && item.product.images.length > 0 ? item.product.images[0] : item.product.image_url)} alt={item.product.name} className="w-full h-full object-contain" />
                </div>
                
                <div className="flex flex-col justify-between py-1 flex-grow pr-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-1"><Link to={`/product/${item.product.id}`} className="hover:text-brand-gold transition-colors">{item.product.name}</Link></h3>
                    <div className="flex gap-1 flex-wrap">
                      <p className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded inline-block">
                        {item.variant?.size || 'Standard'}
                      </p>
                      {item.variant?.color && (
                        <p className="text-[10px] text-[#45055B] font-medium bg-[#45055B]/10 px-1.5 py-0.5 rounded inline-block">
                          {item.variant.color}
                        </p>
                      )}
                      {(item.variant?.size_code || item.variant?.code) && (
                        <p className="text-[10px] text-brand-gold font-mono font-bold bg-brand-gold/10 px-1.5 py-0.5 rounded inline-block">
                          {item.variant?.size_code || item.variant?.code}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="font-bold text-[#45055B] mb-2">₹{item.variant?.price || item.product.price}</div>
                  
                  <div className="flex items-center w-24 border border-brand-gold/30 rounded-lg p-0.5 bg-white">
                    <button 
                      onClick={() => updateQuantity(item.product.id, item.variant, Math.max(1, item.qty - 1))}
                      className="w-6 h-6 flex items-center justify-center text-brand-dark-blue hover:bg-brand-beige rounded transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="flex-1 text-center text-[10px] font-bold text-brand-dark-blue">{item.qty}</span>
                    <button 
                      onClick={() => {
                        const liveStock = getLiveStock(item);
                        if (item.qty >= liveStock) { showToast(`Only ${liveStock} in stock`, 'error'); return; }
                        updateQuantity(item.product.id, item.variant, item.qty + 1);
                      }}
                      className="w-6 h-6 flex items-center justify-center text-brand-dark-blue hover:bg-brand-beige rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              ))}
            </div>            {/* Right Column: Summary & Checkout */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
              {/* Bill Details */}
              <div className="animate-cart-summary bg-white/80 p-5 rounded-2xl shadow-sm border border-brand-gold/20">
                <h3 className="font-serif font-bold text-brand-dark-blue mb-4 pb-4 border-b border-brand-gold/10 text-lg">Price Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-brand-dark-blue/80">
                    <span>Item Total ({items.length} items)</span>
                    <span className="font-medium text-brand-dark-blue">₹{subtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between font-bold text-brand-dark-blue text-lg md:text-xl pt-5 mt-3 border-t border-dashed border-brand-gold/30">
                    <span>Grand Total</span>
                    <span className="text-brand-gold">₹{grandTotal.toFixed(2)}</span>
                  </div>
                  
                  <button 
                    onClick={handleCheckout}
                    className="hidden lg:flex w-full mt-6 bg-brand-dark-blue text-brand-gold font-bold text-base rounded-xl py-4 shadow-lg shadow-brand-dark-blue/20 hover:shadow-xl hover:-translate-y-0.5 transition-all items-center justify-center gap-2"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 mx-auto w-full bg-brand-beige/95 backdrop-blur-md border-t border-brand-gold/20 p-4 pb-safe z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden sm:block">
              <p className="text-[11px] font-bold text-brand-dark-blue/60 uppercase tracking-wider mb-0.5">Total Amount</p>
              <p className="text-xl font-bold text-brand-dark-blue leading-none">₹{grandTotal.toFixed(2)}</p>
            </div>
            <button 
              onClick={handleCheckout}
              className="flex-1 sm:max-w-md bg-brand-dark-blue text-brand-gold font-bold text-base rounded-xl py-4 shadow-lg shadow-brand-dark-blue/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              Proceed to Checkout
              <span className="w-1 h-1 bg-brand-gold rounded-full mx-1 opacity-50" />
              
            </button>
          </div>
        </div>
      )}


      {/* Vacation Modal */}
      {showVacationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6 text-center space-y-4">
              {/* <div className="text-5xl">🌴</div> */}
              <h2 className="font-serif text-xl font-bold text-[#45055B]">Orders are temporarily paused</h2>
              <p className="text-sm text-[#45055B]/70 leading-relaxed">
                {vacation.message || 'We are temporarily not accepting orders. Please check back soon!'}
              </p>
              <button
                onClick={() => setShowVacationModal(false)}
                className="w-full bg-[#45055B] text-[#D4AF37] font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
