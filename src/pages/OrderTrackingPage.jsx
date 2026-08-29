import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, ShoppingBag, Store, Truck, MapPin, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Header } from '../components/Header';
import confetti from 'canvas-confetti';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/api';

export function OrderTrackingPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = React.useState(null);

  useEffect(() => {
    // Fetch order details
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${BACKEND_URL}/general/order/${orderId}`, { headers })
      .then(r => r.json())
      .then(d => { if (d.order) setOrder(d.order); })
      .catch(() => {});

    // Fire confetti
    const end = Date.now() + 1.5 * 1000;
    const colors = ['#2A0845', '#7D2A2A', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans flex flex-col">
      <Header title="Order Confirmation" />
      
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 mt-8 max-w-2xl mx-auto w-full">
        
        <motion.div 
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
          className="relative mb-8"
        >
          <div className="absolute inset-0 bg-green-100 rounded-full blur-2xl opacity-60 scale-150"></div>
          <CheckCircle2 className="w-28 h-28 text-green-500 relative z-10 drop-shadow-md" strokeWidth={1.5} />
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center space-y-3 mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-900">Order Placed Successfully!</h1>
          <p className="text-gray-500 text-sm md:text-base">Thank you for placing your order with LYDIA GLOBAL EXIM. We're delighted to begin preparing your selection and will keep you updated throughout its journey to you.</p>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="w-full bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-gray-100 mb-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gray-50/50 rounded-bl-full -z-0"></div>
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Order Number</p>
                <p className="text-lg font-bold text-[#2A0845]">#{orderId}</p>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                order?.order_type === 'pickup' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {order?.order_type === 'pickup' ? <Store className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                {order?.order_type === 'pickup' ? 'Store Pickup' : 'Home Delivery'}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 flex flex-wrap gap-x-8 gap-y-4 border border-gray-100">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Payment Type</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">{order?.stripe_payment_intent_id ? 'Card' : (order?.payment_method || 'Card')}</p>
              </div>
              {order?.stripe_payment_intent_id && (
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Transaction ID</p>
                  <p className="text-sm font-mono text-gray-900">{order.stripe_payment_intent_id}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {order?.payment_method === 'cod' && !order?.stripe_payment_intent_id ? 'Amount Pending' : 'Total Amount Received'}
                </p>
                <p className="text-sm font-bold text-brand-gold">₹{parseFloat(order?.payment_method === 'cod' && !order?.stripe_payment_intent_id ? (order.total - (order.advance_paid || 0)) : (order?.total || 0)).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Date</p>
                <p className="text-sm font-semibold text-gray-900">
                {order?.created_at
                  ? new Date(order.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Chicago', timeZoneName: 'short' })
                  : new Date().toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'America/Chicago', timeZoneName: 'short' })}
              </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {order?.order_type === 'pickup' ? 'Pickup Status' : 'Est. Shipping'}
                </p>
                <p className="text-sm font-semibold text-gray-900">
                  {order?.order_type === 'pickup' ? 'We will contact you' : 'Within 1-3 Business Days'}
                </p>
              </div>
            </div>

            {/* Transaction ID */}
            {order?.stripe_payment_intent_id && (
              <div className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Transaction ID</p>
                <p className="text-xs font-mono text-brand-dark-blue break-all">{order.stripe_payment_intent_id}</p>
              </div>
            )}

            {/* Items */}
            {order?.items?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Items Ordered</p>
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl">
                    {(item.product?.images?.[0] || item.product?.image_url || item.image_url) && (
                      <div className="w-14 h-14 rounded-xl border border-gray-200 bg-white p-1 shrink-0 overflow-hidden">
                        <img src={item.product?.images?.[0] || item.product?.image_url || item.image_url} alt={item.product?.name || item.name} className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.product?.name || item.name}{item.variant?.color ? ` — ${item.variant.color}` : ''}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-gray-500">Qty: {item.qty || 1}</span>
                        {(item.variant?.code || item.product?.product_code || item.product_code) && (
                          <span className="text-xs font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded-md border border-[#D4AF37]/20">
                            #{item.variant?.code || item.product?.product_code || item.product_code}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-gray-800 shrink-0">₹{Number(item.variant?.price || item.product?.price || item.price || 0).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Pickup Info Banner */}
            {order?.order_type === 'pickup' && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <MessageCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-blue-800">Pickup Notification</p>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                      Once your order is ready, our team will message you for pickup via <strong>WhatsApp/Text message</strong> from <strong>+91 9014863411</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 border-t border-blue-200 pt-3">
                  <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-blue-800">Pickup Location</p>
                    <p className="text-xs text-blue-700 mt-1">2965 FM1385, Aubrey, TX 76227</p>
                    <a
                      href="https://maps.google.com/?q=2965+FM1385,+Aubrey,+TX+76227"
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-600 font-bold underline mt-1 inline-block hover:text-blue-800"
                    >
                      View on Google Maps →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="w-full space-y-4"
        >
          <button 
            onClick={() => navigate('/category/all')}
            className="w-full bg-gradient-to-r from-brand-gold to-brand-dark-blue text-white font-bold text-base rounded-2xl py-4 shadow-lg shadow-brand-gold/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
          >
            Continue Shopping
            <ShoppingBag className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-white text-gray-700 font-bold text-base rounded-2xl py-4 border border-gray-200 shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            Go to Home
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

      </div>
    </div>
  );
}
