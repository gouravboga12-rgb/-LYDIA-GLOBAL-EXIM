import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, Search, User, UserPlus, Package, MapPin, 
  CreditCard, Truck, CheckCircle2, ChevronRight, Store, Loader2, X, Link as LinkIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AddressAutocomplete from "../../components/AddressAutocomplete";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";

export function AdminCreateOrderPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [successData, setSuccessData] = useState(null); // stores { payment_link_url, order_id }

  // Data sources
  const [allProducts, setAllProducts] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);

  // Form State
  const [orderType, setOrderType] = useState("shipping"); // 'shipping' | 'pickup'
  const [paymentMethod, setPaymentMethod] = useState("offline"); // 'offline' | 'payment_link'
  
  // Shipping Options
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [shippingInsurance, setShippingInsurance] = useState(false);

  // Customer State
  const [customerMode, setCustomerMode] = useState("search"); // 'search' | 'manual'
  const [searchCustomerQuery, setSearchCustomerQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Address State
  const [useDefaultAddress, setUseDefaultAddress] = useState(true);
  const [manualCustomer, setManualCustomer] = useState({
    name: "", email: "", mobile: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India"
  });

  // Product Search State
  const [searchProductQuery, setSearchProductQuery] = useState("");
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  // Cart State
  const [cart, setCart] = useState([]); // { product, variant, size, qty }

  // Pricing State
  const [manualTax, setManualTax] = useState(false);
  const [taxAmount, setTaxAmount] = useState(8.25); // Default tax 8.25% or amount depending on logic
  const [manualShipping, setManualShipping] = useState(false);
  const [shippingFee, setShippingFee] = useState(6.00); // Default shipping $6
  const [discountType, setDiscountType] = useState('amount'); // 'amount' | 'percentage'
  const [discountValue, setDiscountValue] = useState(0);
  const [couponCode, setCouponCode] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const [productsRes, usersRes] = await Promise.all([
          fetch(`${BACKEND_URL}/admin/products`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${BACKEND_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const productsData = await productsRes.json();
        const usersData = await usersRes.json();
        
        setAllProducts(productsData.products || []);
        setAllCustomers(usersData.users || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const parseArray = (str) => {
    try { return typeof str === 'string' ? JSON.parse(str) : (Array.isArray(str) ? str : []); }
    catch { return []; }
  };

  const filteredCustomers = allCustomers.filter(c => 
    c.name?.toLowerCase().includes(searchCustomerQuery.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchCustomerQuery.toLowerCase()) ||
    c.phone?.includes(searchCustomerQuery)
  );

  const filteredProducts = allProducts.filter(p => {
    const search = searchProductQuery.toLowerCase();
    const variants = parseArray(p.variants);
    const hasCode = variants.some(v => (v.sizes || []).some(s => s.code?.toLowerCase().includes(search)));
    return p.name?.toLowerCase().includes(search) || p.product_code?.toLowerCase().includes(search) || hasCode;
  });

  const addToCart = (product, variant, size, qty = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.size.size === size.size && item.variant.color === variant.color);
      if (existing) {
        return prev.map(item => item === existing ? { ...item, qty: item.qty + qty } : item);
      }
      return [...prev, { product, variant, size, qty }];
    });
    setSearchProductQuery("");
    setShowProductDropdown(false);
  };

  const updateCartQty = (index, delta) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart[index].qty += delta;
      if (newCart[index].qty <= 0) {
        newCart.splice(index, 1);
      }
      return newCart;
    });
  };

  const removeCartItem = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.size.our_price || item.size.mrp || item.size.price || item.product.price || 0) * item.qty, 0);
  
  const discountAmt = discountType === 'percentage' ? subtotal * (Number(discountValue) / 100) : Number(discountValue);
  
  // Auto tax uses taxAmount state as percentage if not manual
  const calculatedTax = manualTax ? Number(taxAmount) : (subtotal - discountAmt) * (Number(taxAmount) / 100);
  
  // Auto shipping incorporates signature and insurance
  const signatureFee = signatureRequired ? 6 : 0;
  const insuranceFee = shippingInsurance ? (subtotal * 0.015) : 0;
  const baseShipping = manualShipping ? Number(shippingFee) : (subtotal > 200 ? 0 : 6);
  const calculatedShipping = orderType === 'pickup' ? 0 : (baseShipping + signatureFee + insuranceFee);

  const total = Math.max(0, subtotal + calculatedTax + calculatedShipping - discountAmt);

  const handleSubmit = async () => {
    setError("");
    if (cart.length === 0) return setError("Cart is empty");
    if (customerMode === 'search' && !selectedCustomer) return setError("Please select a customer");
    
    let addressPayload = {};
    if (customerMode === 'manual') {
      if (!manualCustomer.name || !manualCustomer.email || !manualCustomer.mobile || (orderType === 'shipping' && !manualCustomer.line1)) {
        return setError("Please fill all required manual customer details");
      }
      addressPayload = { 
        ...manualCustomer,
        signature_required: signatureRequired,
        signature_fee: signatureRequired ? 6.00 : 0,
        insurance_requested: shippingInsurance,
        insurance_amount: shippingInsurance ? (subtotal - discountAmt) * 0.015 : 0,
        insurance_fee: shippingInsurance ? (subtotal - discountAmt) * 0.015 : 0
      };
    } else {
      if (orderType === 'shipping' && !useDefaultAddress && !manualCustomer.line1) {
        return setError("Please provide a shipping address for the existing customer");
      }
      addressPayload = {
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        mobile: selectedCustomer.phone || '',
        user_id: selectedCustomer.id,
        ...(orderType === 'shipping' && !useDefaultAddress ? {
          line1: manualCustomer.line1,
          line2: manualCustomer.line2,
          city: manualCustomer.city,
          state: manualCustomer.state,
          pincode: manualCustomer.pincode,
          country: manualCustomer.country
        } : {}),
        signature_required: signatureRequired,
        signature_fee: signatureRequired ? 6.00 : 0,
        insurance_requested: shippingInsurance,
        insurance_amount: shippingInsurance ? (subtotal - discountAmt) * 0.015 : 0,
        insurance_fee: shippingInsurance ? (subtotal - discountAmt) * 0.015 : 0
      };
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      
      const orderPayload = {
        user_id: addressPayload.user_id || null,
        items: cart.map(item => ({
          product: item.product,
          variant: {
            color: item.variant.color,
            size: item.size.size,
            price: Number(item.size.our_price || item.size.mrp || item.size.price || item.product.price || 0),
            size_code: item.size.code,
            image: (item.variant.images && item.variant.images.length > 0) ? item.variant.images[0] : (item.product.images && item.product.images.length > 0) ? item.product.images[0] : item.product.image_url
          },
          qty: item.qty
        })),
        address: addressPayload,
        total: total,
        subtotal: subtotal,
        tax_amount: calculatedTax,
        shipping_fee: calculatedShipping,
        discount_amount: discountAmt,
        coupon_code: couponCode,
        order_type: orderType,
        payment_method: paymentMethod, // 'offline' or 'payment_link'
        is_admin_created: true,
        balance_due: paymentMethod === 'payment_link' ? total : 0,
        signature_fee: signatureRequired ? 6.00 : 0,
        insurance_fee: shippingInsurance ? (subtotal - discountAmt) * 0.015 : 0
      };

      const endpoint = `${BACKEND_URL}/admin/orders`;
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(orderPayload)
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create order");
      }
      
      const successData = await res.json();
      const orderId = successData.order?.id || successData.order_id;
      let pLink = successData.order?.payment_link_url || successData.payment_link_url;

      // If payment link is requested but not returned, try to generate it
      if (paymentMethod === 'payment_link' && orderId && !pLink) {
        try {
          const linkRes = await fetch(`${BACKEND_URL}/admin/orders/${orderId}/resend-payment-link`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          const linkData = await linkRes.json();
          if (linkData.success && linkData.payment_link_url) {
            pLink = linkData.payment_link_url;
          }
        } catch (err) {
          console.error("Failed to generate payment link", err);
        }
      }

      setSuccessData({
        order_id: orderId,
        payment_link_url: pLink,
        balance_due: total
      });

      // If payment link is requested, trigger the email automatically
      if (paymentMethod === 'payment_link' && orderId && pLink) {
        fetch(`${BACKEND_URL}/admin/orders/${orderId}/email-payment-link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
          body: JSON.stringify({ payment_link_url: pLink, balance_due: total })
        }).catch(err => console.error("Failed to trigger email", err));
      }

      setSuccess(true);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#45055B]" />
      </div>
    );
  }

  const sendPaymentLinkWhatsApp = (link, balance) => {
    const msg = encodeURIComponent(`Hi, your order has been created. A balance of ₹${balance.toFixed(2)} is due. Please pay here: ${link}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleMarkAsPaid = async (orderId) => {
    if (!window.confirm("Mark this order as paid?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/admin/orders/${orderId}/mark-balance-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ method: 'cash' })
      });
      if (res.ok) {
        alert("Order marked as paid!");
        setSuccessData(prev => ({ ...prev, balance_due: 0 }));
      }
    } catch (err) {
      console.error(err);
      alert("Failed to mark as paid");
    }
  };

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto mt-12 bg-white rounded-3xl shadow-xl p-8 sm:p-12 text-center border border-[#45055B]/10">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-serif font-bold text-[#45055B] mb-4">Order Created Successfully!</h2>
        <p className="text-gray-500 mb-8">The manual order has been successfully placed in the system.</p>
        
        {successData?.payment_link_url && successData?.balance_due > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 sm:p-6 text-left mb-8 space-y-4">
            <h3 className="font-bold text-amber-900 text-lg border-b border-amber-200/50 pb-3">Payment Details</h3>
            <p className="text-sm font-semibold text-amber-800">Balance Due: ${successData.balance_due.toFixed(2)}</p>
            <div className="bg-white p-3 rounded-lg border border-amber-100 break-all">
              <a href={successData.payment_link_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 font-semibold underline flex items-center gap-2">
                <LinkIcon className="w-4 h-4 shrink-0" />
                {successData.payment_link_url}
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <button onClick={() => sendPaymentLinkWhatsApp(successData.payment_link_url, successData.balance_due)} className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded-xl text-xs font-bold transition-colors">
                WhatsApp
              </button>
              <button onClick={() => navigator.clipboard.writeText(successData.payment_link_url)} className="flex items-center justify-center gap-2 bg-[#45055B] hover:bg-[#122A5C] text-white py-2 rounded-xl text-xs font-bold transition-colors">
                Copy Link
              </button>
              <button onClick={() => handleMarkAsPaid(successData.order_id)} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold transition-colors">
                Mark as Paid
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={() => window.location.href = '/admin/orders'} className="px-6 py-3 bg-[#45055B] text-white rounded-xl font-semibold hover:bg-[#122A5C] transition-all">View All Orders</button>
          <button onClick={() => { setSuccess(false); setCart([]); setSelectedCustomer(null); setSuccessData(null); }} className="px-6 py-3 bg-gray-100 text-[#45055B] rounded-xl font-semibold hover:bg-gray-200 transition-all">Create Another</button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-[#45055B]">Create New Order</h1>
        <p className="text-[#45055B]/60">Manually draft an order on behalf of a customer.</p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Config */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Customer Selection */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-serif font-bold text-[#45055B] mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" /> Customer Details
            </h2>
            
            <div className="flex bg-gray-100 p-1 rounded-xl mb-6 w-full sm:w-fit">
              <button 
                onClick={() => setCustomerMode('search')}
                className={`flex-1 sm:flex-none px-6 py-2 text-sm font-medium rounded-lg transition-all ${customerMode === 'search' ? 'bg-white text-[#45055B] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Existing Customer
              </button>
              <button 
                onClick={() => setCustomerMode('manual')}
                className={`flex-1 sm:flex-none px-6 py-2 text-sm font-medium rounded-lg transition-all ${customerMode === 'manual' ? 'bg-white text-[#45055B] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Guest / Manual
              </button>
            </div>

            {customerMode === 'search' ? (
              <div className="relative">
                {selectedCustomer ? (
                  <div className="space-y-4">
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-emerald-900">{selectedCustomer.name}</p>
                        <p className="text-sm text-emerald-700">{selectedCustomer.email} • {selectedCustomer.phone || 'No phone'}</p>
                      </div>
                      <button onClick={() => setSelectedCustomer(null)} className="text-emerald-700 hover:text-emerald-900 text-sm font-semibold underline">Change</button>
                    </div>

                    {orderType === 'shipping' && (
                      <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl space-y-4 mt-4">
                        <p className="text-sm font-bold text-[#45055B]">Shipping Address</p>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" checked={useDefaultAddress} onChange={() => setUseDefaultAddress(true)} className="accent-[#45055B]" />
                            Use Customer's Default Address
                          </label>
                          <label className="flex items-center gap-2 text-sm cursor-pointer">
                            <input type="radio" checked={!useDefaultAddress} onChange={() => setUseDefaultAddress(false)} className="accent-[#45055B]" />
                            Provide New Address
                          </label>
                        </div>
                        
                        {!useDefaultAddress && (
                          <div className="mt-4 border-t border-gray-200 pt-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                              <div className="sm:col-span-2">
                                <AddressAutocomplete 
                                  value={manualCustomer.line1} 
                                  onChange={(val) => setManualCustomer({...manualCustomer, line1: val})}
                                  onSelect={(place) => {
                                    setManualCustomer({ ...manualCustomer, line1: place.line1, city: place.city, state: place.state, pincode: place.pincode, country: place.country });
                                  }}
                                />
                              </div>
                              <input type="text" value={manualCustomer.city} onChange={e => setManualCustomer({...manualCustomer, city: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#45055B]" placeholder="City" />
                              <input type="text" value={manualCustomer.state} onChange={e => setManualCustomer({...manualCustomer, state: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#45055B]" placeholder="State" />
                              <input type="text" value={manualCustomer.pincode} onChange={e => setManualCustomer({...manualCustomer, pincode: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#45055B]" placeholder="Zip / Postal Code" />
                              <input type="text" value={manualCustomer.country} onChange={e => setManualCustomer({...manualCustomer, country: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#45055B]" placeholder="Country" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search by name, email, or phone..." 
                      value={searchCustomerQuery}
                      onChange={(e) => setSearchCustomerQuery(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#45055B]"
                    />
                    {searchCustomerQuery && (
                      <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                          <li key={c.id}>
                            <button onClick={() => { setSelectedCustomer(c); setSearchCustomerQuery(""); }} className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0">
                              <p className="font-bold text-sm text-[#45055B]">{c.name}</p>
                              <p className="text-xs text-gray-500">{c.email} {c.phone ? `• ${c.phone}` : ''}</p>
                            </button>
                          </li>
                        )) : (
                          <li className="px-4 py-3 text-sm text-gray-500">No customers found.</li>
                        )}
                      </ul>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">Full Name *</label>
                  <input type="text" value={manualCustomer.name} onChange={e => setManualCustomer({...manualCustomer, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#45055B]" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">Email Address *</label>
                  <input type="email" value={manualCustomer.email} onChange={e => setManualCustomer({...manualCustomer, email: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#45055B]" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 mb-1.5 block">Phone Number *</label>
                  <input type="tel" value={manualCustomer.mobile} onChange={e => setManualCustomer({...manualCustomer, mobile: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#45055B]" placeholder="+1 234 567 8900" />
                </div>
                <div className="sm:col-span-2 mt-2">
                  <p className="text-sm font-bold text-[#45055B] mb-3">Shipping Address {orderType === 'pickup' && '(Optional for Pickup)'}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div className="sm:col-span-2">
                      <AddressAutocomplete 
                        value={manualCustomer.line1} 
                        onChange={(val) => setManualCustomer({...manualCustomer, line1: val})}
                        onSelect={(place) => {
                          setManualCustomer({ ...manualCustomer, line1: place.line1, city: place.city, state: place.state, pincode: place.pincode, country: place.country });
                        }}
                      />
                    </div>
                    <div>
                      <input type="text" value={manualCustomer.city} onChange={e => setManualCustomer({...manualCustomer, city: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#45055B]" placeholder="City" />
                    </div>
                    <div>
                      <input type="text" value={manualCustomer.state} onChange={e => setManualCustomer({...manualCustomer, state: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#45055B]" placeholder="State" />
                    </div>
                    <div>
                      <input type="text" value={manualCustomer.pincode} onChange={e => setManualCustomer({...manualCustomer, pincode: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#45055B]" placeholder="Zip / Postal Code" />
                    </div>
                    <div>
                      <input type="text" value={manualCustomer.country} onChange={e => setManualCustomer({...manualCustomer, country: e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#45055B]" placeholder="Country" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Product Selection */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-serif font-bold text-[#45055B] mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" /> Add Products
            </h2>
            
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search products by name or code..." 
                value={searchProductQuery}
                onFocus={() => setShowProductDropdown(true)}
                onChange={(e) => { setSearchProductQuery(e.target.value); setShowProductDropdown(true); }}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-1 focus:ring-[#45055B]"
              />
              {showProductDropdown && searchProductQuery && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                  <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-200 sticky top-0">
                    <span className="text-xs font-bold text-gray-500 uppercase">Search Results</span>
                    <button onClick={() => setShowProductDropdown(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                  </div>
                  {filteredProducts.length > 0 ? filteredProducts.map(p => {
                    const variants = parseArray(p.variants);
                    return variants.map(v => (
                      (v.sizes || []).map(s => (
                        <div key={`${p.id}-${v.color}-${s.size}`} className="flex items-center justify-between p-3 border-b border-gray-50 hover:bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                              {(v.images && v.images.length > 0) ? <img src={v.images[0]} alt={p.name} className="w-full h-full object-cover" /> : (p.images && parseArray(p.images)[0]) ? <img src={parseArray(p.images)[0]} alt={p.name} className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-gray-400" />}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-[#45055B]">{p.name}</p>
                              <p className="text-xs text-gray-500">{v.color} • {s.size} {s.code ? `• Code: ${s.code}` : ''}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-[#45055B]">₹{s.our_price || s.mrp || s.price || p.price || 0}</span>
                            <button 
                              onClick={() => addToCart(p, v, s)}
                              className="px-3 py-1.5 bg-[#45055B] text-white text-xs font-bold rounded-lg hover:bg-[#122A5C] transition-colors"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ))
                    ));
                  }) : (
                    <div className="p-4 text-center text-gray-500 text-sm">No products found.</div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length > 0 && (
              <div className="mt-6 space-y-3">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 p-1">
                        {(item.variant.images && item.variant.images.length > 0) ? <img src={item.variant.images[0]} className="w-full h-full object-contain" alt="" /> : (item.product.images && parseArray(item.product.images)[0]) ? <img src={parseArray(item.product.images)[0]} className="w-full h-full object-contain" alt="" /> : <Package className="w-full h-full text-gray-300" />}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-[#45055B]">{item.product.name}</p>
                        <p className="text-xs text-gray-500">{item.variant.color} • {item.size.size} {item.size.code ? `• ${item.size.code}` : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-bold text-[#45055B]">₹{item.size.our_price || item.size.mrp || item.size.price || item.product.price || 0}</span>
                      <div className="flex items-center bg-white border border-gray-200 rounded-lg h-8">
                        <button onClick={() => updateCartQty(idx, -1)} className="px-2.5 text-gray-500 hover:text-[#45055B]">-</button>
                        <span className="text-sm font-bold w-6 text-center">{item.qty}</span>
                        <button onClick={() => updateCartQty(idx, 1)} className="px-2.5 text-gray-500 hover:text-[#45055B]">+</button>
                      </div>
                      <button onClick={() => removeCartItem(idx)} className="text-red-400 hover:text-red-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-serif font-bold text-[#45055B] mb-6 flex items-center gap-2">
              <Store className="w-5 h-5 text-amber-500" /> Order Settings
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Order Type */}
              <div>
                <label className="text-sm font-bold text-[#45055B] mb-3 block">Fulfillment Method</label>
                <div className="py-3 px-4 rounded-xl flex items-center gap-2 border border-[#45055B] bg-[#45055B]/5 text-[#45055B]">
                  <Truck className="w-5 h-5" />
                  <span className="text-xs font-bold">Delivery Shipping (Direct Delivery)</span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-sm font-bold text-[#45055B] mb-3 block">Payment Method</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="paymentMethod" value="offline" checked={paymentMethod === 'offline'} onChange={() => setPaymentMethod('offline')} className="w-4 h-4 accent-[#45055B]" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#45055B]">Offline / Cash</span>
                      <span className="text-[10px] text-gray-500">Mark as paid immediately</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                    <input type="radio" name="paymentMethod" value="payment_link" checked={paymentMethod === 'payment_link'} onChange={() => setPaymentMethod('payment_link')} className="w-4 h-4 accent-[#45055B]" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-[#45055B]">Send Payment Link</span>
                      <span className="text-[10px] text-gray-500">Customer pays via email link</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Column: Summary */}
        <div className="lg:col-span-1">
          <div className="bg-[#FAF6F0] rounded-3xl p-6 border border-[#45055B]/5 sticky top-24">
            <h3 className="font-serif text-xl font-bold text-[#45055B] mb-6 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" /> Order Summary
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm text-[#45055B]/70">
                <span>Items ({cart.reduce((a,c)=>a+c.qty,0)})</span>
                <span className="font-bold text-[#45055B]">₹{subtotal.toFixed(2)}</span>
              </div>
              
              {/* Discount Override */}
              <div className="border-t border-gray-200/50 pt-4">
                <label className="text-xs font-bold text-[#45055B] mb-2 block">Discount Amount</label>
                <div className="flex gap-2">
                  <select value={discountType} onChange={e => setDiscountType(e.target.value)} className="bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-[#45055B] font-bold text-[#45055B]">
                    <option value="amount">₹</option>
                    <option value="percentage">%</option>
                  </select>
                  <input type="number" min="0" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#45055B]" />
                </div>
                <input type="text" placeholder="Coupon Code (Optional)" value={couponCode} onChange={e => setCouponCode(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#45055B] mt-2" />
              </div>

              {/* Shipping Options & Override */}
              {orderType === 'shipping' && (
                <div className="border-t border-gray-200/50 pt-4 space-y-3">
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={signatureRequired} onChange={e => setSignatureRequired(e.target.checked)} className="accent-[#45055B]" />
                      Signature Confirmation (+$6.00)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={shippingInsurance} onChange={e => setShippingInsurance(e.target.checked)} className="accent-[#45055B]" />
                      Shipping Insurance (+1.5%)
                    </label>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-2 flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-[#45055B] flex items-center gap-1.5">
                      <input type="checkbox" checked={manualShipping} onChange={e => setManualShipping(e.target.checked)} className="accent-[#45055B]" />
                      Override Shipping Fee
                    </label>
                    {!manualShipping && <span className="text-xs font-bold text-gray-500">₹{calculatedShipping.toFixed(2)} (Auto)</span>}
                  </div>
                  {manualShipping && (
                    <input type="number" min="0" value={shippingFee} onChange={e => setShippingFee(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#45055B]" placeholder="0.00" />
                  )}
                </div>
              )}

              {/* Tax Override */}
              <div className="border-t border-gray-200/50 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-[#45055B] flex items-center gap-1.5">
                    <input type="checkbox" checked={manualTax} onChange={e => setManualTax(e.target.checked)} className="accent-[#45055B]" />
                    Override Tax Amount (Flat $)
                  </label>
                  {!manualTax && <span className="text-xs font-bold text-gray-500">₹{calculatedTax.toFixed(2)} (Auto {taxAmount}%)</span>}
                </div>
                {manualTax ? (
                  <input type="number" min="0" value={taxAmount} onChange={e => setTaxAmount(e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#45055B]" placeholder="0.00" />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Auto Tax Rate:</span>
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg px-2 text-sm focus-within:border-[#45055B]">
                      <input type="number" min="0" value={taxAmount} onChange={e => setTaxAmount(e.target.value)} className="w-16 py-1.5 focus:outline-none text-right" />
                      <span className="text-gray-500 ml-1">%</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[#45055B]/20 pt-4 flex justify-between items-end">
                <span className="font-bold text-[#45055B]">Total</span>
                <div className="text-right">
                  <span className="text-xs text-gray-500 block mb-0.5">USD</span>
                  <span className="font-serif text-3xl font-bold text-[#45055B]">₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={handleSubmit}
              disabled={submitting || cart.length === 0}
              className="w-full bg-[#45055B] text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#122A5C] transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              {submitting ? 'Creating Order...' : 'Place Manual Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
