import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Truck, CheckCircle, MapPin, CreditCard, ChevronLeft, ShoppingCart, Store, Pencil, X, Check, Plus } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Header } from '../components/Header';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useToastStore } from '../store/useToastStore';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useLoadScript } from '@react-google-maps/api';


const GOOGLE_MAPS_LIBRARIES = ['places'];
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

import { COUNTRIES } from '../data/countries';
import { getStatesForCountry } from '../data/states';

function extractPhone10Digits(raw) {
  if (!raw) return '';
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

function formatDisplayPhone(raw) {
  if (!raw) return '';
  const digits = extractPhone10Digits(raw);
  if (digits.length === 10) return `+91 ${digits}`;
  return String(raw).replace(/^[A-Z]{2}:/i, '').trim();
}

function getLocalPhone(phoneStr) {
  if (!phoneStr) return '';
  return extractPhone10Digits(phoneStr);
}

function getDialCountryCode(phoneStr) {
  if (!phoneStr) return 'IN';
  const clean = phoneStr.startsWith('+') ? phoneStr : '+' + phoneStr;
  const sortedCountries = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  const country = sortedCountries.find(c => clean.startsWith(c.dial));
  return country ? country.code : 'IN';
}

function flag(code) {
  return code.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

function AddressAutocomplete({ value, onChange, onSelect }) {
  const [inputVal, setInputVal] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [apiError, setApiError] = useState(false); // true when quota/API fails
  const autocompleteService = useRef(null);
  const placesService = useRef(null);
  const debounceTimer = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (window.google?.maps?.places) {
      try {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
        placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
      } catch (err) {
        setApiError(true);
      }
    } else {
      // Google Maps not loaded at all — go straight to manual mode
      setApiError(true);
    }
  }, []);

  // Sync external value into the input (but don't override if user is typing)
  useEffect(() => {
    setInputVal(value || '');
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setSuggestions([]); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleInput = (e) => {
    const v = e.target.value;
    setInputVal(v);
    onChange(v);
    if (apiError) return; // no autocomplete if API is down
    clearTimeout(debounceTimer.current);
    if (!v.trim() || !autocompleteService.current) { setSuggestions([]); return; }
    debounceTimer.current = setTimeout(() => {
      autocompleteService.current.getPlacePredictions({ input: v }, (results, status) => {
        const PS = window.google.maps.places.PlacesServiceStatus;
        if (status === PS.OK) {
          setSuggestions(results);
        } else {
          setSuggestions([]);
          // Quota exhausted or request denied → switch to manual mode permanently
          if (status === PS.OVER_QUERY_LIMIT || status === PS.REQUEST_DENIED || status === 'UNKNOWN_ERROR') {
            setApiError(true);
          }
        }
      });
    }, 300);
  };

  const handleSelect = (suggestion) => {
    setSuggestions([]);
    placesService.current.getDetails(
      { placeId: suggestion.place_id, fields: ['address_components'] },
      (place, status) => {
        const PS = window.google.maps.places.PlacesServiceStatus;
        if (status !== PS.OK) {
          // If getDetails fails, at minimum fill in what we have from the suggestion text
          const line1 = suggestion.structured_formatting.main_text;
          setInputVal(line1);
          onChange(line1);
          if (status === PS.OVER_QUERY_LIMIT || status === PS.REQUEST_DENIED) setApiError(true);
          return;
        }
        const components = place.address_components || [];
        const get = (type) => components.find(c => c.types.includes(type))?.long_name || '';
        const line1 = `${get('street_number')} ${get('route')}`.trim() || get('premise') || get('sublocality_level_1') || suggestion.structured_formatting.main_text;
        setInputVal(line1);
        onChange(line1);
        onSelect({
          line1,
          city: get('locality') || get('administrative_area_level_2') || get('postal_town'),
          state: get('administrative_area_level_1'),
          pincode: get('postal_code'),
          country: get('country'),
        });
      }
    );
  };

  return (
    <div className="relative" ref={containerRef}>
      {apiError ? (
        // ── Manual fallback mode ───────────────────────────────────────
        <div>
          <div className="flex items-center gap-2 mb-1.5 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span className="text-xs font-semibold">Address lookup unavailable. Please type your address manually.</span>
          </div>
          <input
            value={inputVal}
            onChange={handleInput}
            placeholder="Enter your full address..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all"
          />
        </div>
      ) : (
        // ── Autocomplete mode ──────────────────────────────────────────
        <div>
          <MapPin className="w-4 h-4 text-brand-gold absolute left-3.5 top-[13px] pointer-events-none" />
          <input
            value={inputVal}
            onChange={handleInput}
            placeholder="Start typing your address..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all"
          />
          <p className="text-[10px] text-gray-400 mt-1 pl-1">You can edit this field freely after selecting a suggestion.</p>
          {suggestions.length > 0 && (
            <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
              {suggestions.map((s) => (
                <li key={s.place_id}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-brand-gold/5 flex items-start gap-2.5 border-b border-gray-50 last:border-0"
                  >
                    <MapPin className="w-3.5 h-3.5 text-brand-gold shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">{s.structured_formatting.main_text}</span>
                      <span className="text-gray-400 text-xs block">{s.structured_formatting.secondary_text}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#45055B',
      fontFamily: 'inherit',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
};

function RazorpayPaymentForm({ isPlacingOrder, handlePlaceOrder, termsAccepted, setTermsAccepted, addressConfirmed, setAddressConfirmed, address, sessionSecondsLeft, onEditAddress, paymentError, onRetry, orderType, pickupContact, finalTotal }) {
  const isExpiringSoon = sessionSecondsLeft !== null && sessionSecondsLeft <= 60;
  const isPickup = orderType === 'pickup';
  // For pickup: only require termsAccepted. For shipping: also require addressConfirmed.
  const canPay = isPickup ? (termsAccepted && !isPlacingOrder) : (termsAccepted && addressConfirmed && !isPlacingOrder);
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-brand-gold" />
          </div>
          Payment & Order Confirmation
        </h2>
        {sessionSecondsLeft !== null && (
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
            isExpiringSoon ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Session expires in {Math.floor(sessionSecondsLeft/60)}:{String(sessionSecondsLeft%60).padStart(2,'0')}
          </div>
        )}
      </div>

      {/* Pickup: show contact summary. Shipping: show address confirmation block. */}
      {isPickup ? (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-600" />
            <p className="text-xs font-bold text-blue-800">Store Pickup — Contact Details</p>
          </div>
          <div className="text-xs text-blue-900 leading-relaxed">
            <p className="font-bold">{pickupContact?.name}</p>
            {pickupContact?.phone && <p>📞 {pickupContact.phone}</p>}
            {pickupContact?.email && <p>✉️ {pickupContact.email}</p>}
          </div>
          <p className="text-[10px] text-blue-700">We'll notify you on WhatsApp/Text when your order is ready for pickup.</p>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-green-800 flex items-center gap-1.5">📍 Shipping To</p>
            <button type="button" onClick={onEditAddress}
              className="text-[11px] font-bold text-brand-dark-blue underline hover:text-brand-gold transition-colors">← Edit Address</button>
          </div>
          <div className="text-xs text-green-900 leading-relaxed">
            <p className="font-bold">{address.name}</p>
            <p>{address.line1}{address.line2 ? `, ${address.line2}` : ''}</p>
            <p>{address.city}{address.state ? `, ${address.state}` : ''} {address.pincode}</p>
            <p>{address.country}</p>
            <p className="text-green-700 mt-0.5">📞 {formatDisplayPhone(address.mobile)}</p>
          </div>
          {address.line2 ? null : (
            <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              💡 No apartment/suite number provided. If applicable, please <button type="button" onClick={onEditAddress} className="underline font-bold">go back and add it</button> to ensure accurate delivery.
            </p>
          )}
          <div className="pt-3 border-t border-green-200 mt-2 space-y-3">
            <p className="text-xs text-brand-dark-blue leading-relaxed">
              To extend the life of your jewelry, avoid contact with perfume, pool water & harsh chemicals. Store in a dry place inside a sealed zip-lock cover when not in use. See our <Link to="/jewelry-care" className="underline font-bold text-brand-gold" target="_blank">Jewelry Care Tips</Link> for more details.
            </p>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={addressConfirmed} onChange={e => setAddressConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-green-700 shrink-0" />
              <span className="text-[11px] text-green-800 font-medium leading-relaxed">
                I confirm that my shipping address is accurate and complete, and I acknowledge that I have reviewed the Jewelry Care Tips.
              </span>
            </label>
          </div>
        </div>
      )}

      <div className="bg-white/90 p-5 rounded-2xl shadow-sm border border-brand-gold/20 space-y-4">
        {/* Razorpay Gateway Card */}
        <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-purple-50/80 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 shadow-md">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-brand-dark-blue">Razorpay Payment Gateway</p>
                <span className="text-[10px] font-extrabold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-300">
                  TEST MODE ACTIVE
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Pay securely using UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, NetBanking, and Wallets.
              </p>
            </div>
          </div>
          <div className="sm:text-right shrink-0">
            <span className="text-xs text-gray-500 block">Total Payable</span>
            <span className="text-lg font-bold text-brand-dark-blue">₹{Number(finalTotal).toFixed(2)}</span>
          </div>
        </div>

        {/* WhatsApp & Admin Auto-Redirection Notice */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-4 h-4 fill-emerald-600" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.96.524 1.831.799 2.796.8 3.183 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.786-5.769-5.786zm3.364 8.163c-.141.398-.711.758-1.047.818-.335.06-.729.074-2.146-.514-1.637-.68-2.695-2.336-2.776-2.446-.082-.11-1.258-1.674-1.258-3.193 0-1.52.796-2.27 1.078-2.576.282-.307.615-.384.82-.384.205 0 .41.002.59.011.19.009.444-.072.694.529.256.617.873 2.13.95 2.285.077.154.129.334.026.54-.103.205-.154.334-.308.514-.154.18-.324.402-.462.539-.154.153-.314.32-.135.628.18.307.8 1.32 1.716 2.137 1.179 1.05 2.174 1.376 2.482 1.53.308.154.488.128.667-.077.18-.205.77-0.898.975-1.206.205-.308.41-.257.693-.154.282.102 1.795.847 2.103 1.001.308.154.513.23.59.36.077.128.077.744-.064 1.142z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-900">Instant WhatsApp & Admin Sync</p>
            <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
              Upon successful payment, an instant WhatsApp order receipt will be sent to admin support (<strong>+91 9014863411</strong>) with a direct link to the Admin Panel, and you will be redirected to the orders dashboard.
            </p>
          </div>
        </div>

        {paymentError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700">Payment Failed</p>
              <p className="text-xs text-red-600 mt-0.5 leading-relaxed">{paymentError}</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl py-3 flex items-center justify-center gap-2 transition-all"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-brand-dark-blue shrink-0" />
          <span className="text-[11px] text-gray-500 leading-relaxed">
            I agree to the LYDIA GLOBAL EXIM <Link to="/terms-of-service" target="_blank" className="text-brand-dark-blue font-bold underline">Terms & Conditions</Link> and <Link to="/privacy-policy" target="_blank" className="text-brand-dark-blue font-bold underline">Privacy Policy</Link>, understand that all sales are final—no returns or exchanges—as stated in the <Link to="/shipping-policy" target="_blank" className="text-brand-dark-blue font-bold underline">Shipping Policy</Link> and <Link to="/returns-policy" target="_blank" className="text-brand-dark-blue font-bold underline">Exchange & Return Policy</Link>, and agree to contact LYDIA GLOBAL EXIM first regarding any billing issue before initiating a payment dispute or chargeback, except where permitted or required by applicable law or payment-network rules.
          </span>
        </label>
        <button
          onClick={() => handlePlaceOrder()}
          disabled={!canPay}
          className={`w-full font-bold text-base rounded-xl py-4 flex items-center justify-center gap-2 transition-all ${
            !canPay
              ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-400'
              : 'bg-brand-dark-blue text-brand-gold shadow-lg shadow-brand-dark-blue/20 hover:shadow-xl hover:-translate-y-0.5 cursor-pointer'
          }`}
        >
          {isPlacingOrder ? (
            <><div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Processing Payment...</>
          ) : `Pay ₹${Number(finalTotal).toFixed(2)} with Razorpay`}
        </button>
      </div>
    </div>
  );
}

function AddressValidationModal({ validationResult, onUseSuggested, onEdit, onProceedOriginal }) {
  if (!validationResult) return null;
  const { valid, message, suggested, hasCorrections } = validationResult;
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-lg">Address Validation</h3>
          <button onClick={onEdit}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        
        {!valid ? (
          <div className="mb-6">
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
              <span className="font-bold block mb-1">Invalid Address</span>
              {message}
            </div>
          </div>
        ) : hasCorrections ? (
          <div className="mb-6">
            <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-sm mb-4">
              <span className="font-bold block mb-1">Suggested Correction</span>
              We verified your address and found a better match. Please review the suggested changes below to ensure accurate delivery.
            </div>
            
            <div className="border border-brand-gold/30 rounded-xl overflow-hidden">
              <div className="bg-brand-gold/5 p-3 border-b border-brand-gold/20">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Suggested Address</p>
                <p className="text-sm font-medium text-gray-900">{suggested?.name}</p>
                <p className="text-sm text-gray-700">{suggested?.street1}{suggested?.street2 ? `, ${suggested.street2}` : ''}</p>
                <p className="text-sm text-gray-700">{suggested?.city}, {suggested?.state} {suggested?.zip}</p>
                <p className="text-sm text-gray-700">{suggested?.country}</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button onClick={onEdit} className="flex-1 py-3 px-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">
            Edit address
          </button>
          {hasCorrections && (
            <button onClick={() => onUseSuggested(suggested)} className="flex-1 py-3 px-2 text-sm font-bold text-white bg-brand-gold rounded-xl hover:bg-brand-gold/90 transition-colors">
              Use suggested address & update
            </button>
          )}
          {(!valid || hasCorrections) && (
            <button onClick={onProceedOriginal} className="flex-1 py-3 px-2 text-sm font-bold text-brand-dark-blue bg-brand-gold/20 rounded-xl hover:bg-brand-gold/30 transition-colors">
              Proceed with original address
            </button>
          )}
          {valid && !hasCorrections && (
            <button onClick={onProceedOriginal} className="flex-1 py-3 px-2 text-sm font-bold text-white bg-brand-gold rounded-xl hover:bg-brand-gold/90 transition-colors">
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, getTotal, getSubtotal, getDiscount, appliedCoupon, clearCart } = useCartStore();
  const { token, user, addAddress, addresses, fetchProfile, updateAddress } = useAuthStore();
  const { showToast } = useToastStore();

  const { isLoaded: mapsLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });
  
  const [orderType, setOrderType] = useState(location.state?.orderType || 'shipping');
  const [searchParams, setSearchParams] = useSearchParams();
  const stepParam = searchParams.get('step');
  const initialStep = token ? 2.5 : 1;
  const [step, setLocalStep] = useState(stepParam ? parseFloat(stepParam) : initialStep);

  const setStep = (newStep) => {
    setLocalStep(newStep);
    setSearchParams({ step: newStep });
  };

  useEffect(() => {
    if (stepParam) {
      setLocalStep(parseFloat(stepParam));
    } else {
      setSearchParams({ step: initialStep }, { replace: true });
    }
  }, [stepParam, initialStep, setSearchParams]);
  const [pickupContact, setPickupContact] = useState({ name: '', email: '', phone: '' });
  const [pickupDialCode, setPickupDialCode] = useState('US');
  const [pickupDialOpen, setPickupDialOpen] = useState(false);
  const [pickupDialSearch, setPickupDialSearch] = useState('');
  const pickupDialRef = useRef(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);
  const [pickupTermsAccepted, setPickupTermsAccepted] = useState(false);
  const [sessionSecondsLeft, setSessionSecondsLeft] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const sessionTimerRef = useRef(null);

  useEffect(() => {
    if (user) {
      setPickupContact({ name: user.name || '', email: user.email || '', phone: getLocalPhone(user.phone) });
      // Force US as default for pickup dial code (store is US-based; +1 matches both US and CA)
      setPickupDialCode('US');
      
      setAddress(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        mobile: prev.mobile || getLocalPhone(user.phone)
      }));
      setDialCountryCode(getDialCountryCode(user.phone));
    }
  }, [user]);

  useEffect(() => {
    const handler = (e) => {
      if (pickupDialRef.current && !pickupDialRef.current.contains(e.target)) setPickupDialOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!token) {
      navigate('/login?redirect=/checkout');
    } else {
      fetchProfile();
    }
  }, []);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [address, setAddress] = useState({
    name: user?.name || '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    mobile: user?.phone ? getLocalPhone(user.phone) : ''
  });
  const [dialCountryCode, setDialCountryCode] = useState(user?.phone ? getDialCountryCode(user.phone) : 'IN');
  const dialCode = COUNTRIES.find(c => c.code === dialCountryCode)?.dial || '+91';
  const [dialSearch, setDialSearch] = useState('');
  const [dialOpen, setDialOpen] = useState(false);
  const dialRef = useRef(null);
  const [countrySearch, setCountrySearch] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (countryRef.current && !countryRef.current.contains(e.target)) setCountryOpen(false);
      if (dialRef.current && !dialRef.current.contains(e.target)) setDialOpen(false);
      if (editDialRef.current && !editDialRef.current.contains(e.target)) setEditDialOpen(false);
      if (editCountryRef.current && !editCountryRef.current.contains(e.target)) setEditCountryOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const [editingAddr, setEditingAddr] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editDialCode, setEditDialCode] = useState('IN');
  const [editDialOpen, setEditDialOpen] = useState(false);
  const [editDialSearch, setEditDialSearch] = useState('');
  const editDialRef = useRef(null);
  const [editCountryOpen, setEditCountryOpen] = useState(false);
  const [editCountrySearch, setEditCountrySearch] = useState('');
  const editCountryRef = useRef(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const openEdit = (addr) => {
    const stored = addr.mobile || '';
    // Match by country name first (most reliable), then fall back to dial prefix
    const byCountry = COUNTRIES.find(c => c.name === addr.country);
    const byDial = COUNTRIES.find(c => stored.startsWith(c.dial) && c.code === (byCountry?.code || 'IN'));
    const matched = byCountry || byDial || COUNTRIES.find(c => stored.startsWith(c.dial));
    const dialPrefix = matched?.dial || '+91';
    const countryCode = matched?.code || 'IN';
    const digits = stored.startsWith(dialPrefix) ? stored.slice(dialPrefix.length) : stored;
    setEditDialCode(countryCode);
    setEditForm({ ...addr, mobile: digits });
    setEditingAddr(addr.id);
  };

  const saveEdit = async () => {
    const dial = COUNTRIES.find(c => c.code === editDialCode)?.dial || '+91';
    const fullMobile = `${dial}${editForm.mobile}`;
    const data = { ...editForm, mobile: fullMobile };
    setSavingEdit(true);
    await updateAddress(editingAddr, data);
    if (selectedSavedAddress === editingAddr) {
      setAddress({ name: data.name, line1: data.line1, line2: data.line2 || '', city: data.city, state: data.state || '', pincode: data.pincode, country: data.country || 'India', mobile: editForm.mobile });
    }
    setSavingEdit(false);
    setEditingAddr(null);
  };

  const [transactionId, setTransactionId] = useState(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [whatsappAlertUrl, setWhatsappAlertUrl] = useState(null);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saveAddress, setSaveAddress] = useState(true);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [selectedSavedAddress, setSelectedSavedAddress] = useState(null); // id of selected saved address
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  
  const overlayRef = useRef(null);
  const iconRef = useRef(null);
  const textRef = useRef(null);

  const subtotal = getSubtotal();
  const discount = getDiscount();
  
  const [shippingConfig, setShippingConfig] = useState(null);
  const [shippingFee, setShippingFee] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [taxLabel, setTaxLabel] = useState('Tax (enter pincode)');

  const [signatureRequired, setSignatureRequired] = useState(false);
  const [insuranceRequested, setInsuranceRequested] = useState(false);
  const [insuranceDeclaredValue, setInsuranceDeclaredValue] = useState("");

  const signatureFee = useMemo(() => {
    if (!signatureRequired) return 0;
    const country = address.country || dialCountryCode || 'United States';
    const isUS = (country.toLowerCase() === 'united states' || country === 'US');
    return isUS ? 4.00 : 0;
  }, [signatureRequired, address.country, dialCountryCode]);
  const insuranceFee = useMemo(() => {
    if (!insuranceRequested) return 0;
    const amount = parseFloat(insuranceDeclaredValue) || 0;
    const country = address.country || dialCountryCode || 'United States';
    const rate = (country.toLowerCase() === 'united states' || country === 'US') ? 0.0125 : 0.0150;
    return amount * rate;
  }, [insuranceRequested, insuranceDeclaredValue, address.country, dialCountryCode]);

  const finalTotal = subtotal - discount + shippingFee + taxAmount + signatureFee + insuranceFee;

  useEffect(() => {
    fetch(`${BACKEND_URL}/general/shipping`)
      .then(r => r.json())
      .then(d => {
        setShippingConfig(d);
        const allowed = d?.settings?.allowed_countries || [];
        if (allowed.length > 0 && !allowed.includes(address.country)) {
          const defaultCountryName = allowed.includes('India') ? 'India' : allowed[0];
          setAddress(a => ({ ...a, country: defaultCountryName }));
          const cObj = COUNTRIES.find(c => c.name === defaultCountryName);
          if (cObj) setDialCountryCode(cObj.code);
        }
      })
      .catch(console.error);
  }, []);

  // Recompute shipping fee whenever config loads or address changes
  useEffect(() => {
    if (orderType === 'pickup') {
      setShippingFee(0);
      return;
    }
    if (!shippingConfig?.settings) return;
    
    let threshold = parseFloat(shippingConfig.settings.free_shipping_threshold) || 0;
    let flat = parseFloat(shippingConfig.settings.flat_rate) || 0;
    
    if (address.country && shippingConfig.settings.country_fees) {
      const countryConfig = shippingConfig.settings.country_fees[address.country];
      if (countryConfig) {
        flat = countryConfig.fee !== '' && countryConfig.fee != null && !isNaN(countryConfig.fee) ? parseFloat(countryConfig.fee) : flat;
        threshold = countryConfig.threshold !== '' && countryConfig.threshold != null && !isNaN(countryConfig.threshold) ? parseFloat(countryConfig.threshold) : threshold;
      }
    }
    
    setShippingFee(threshold > 0 && (subtotal - discount) >= threshold ? 0 : flat);
  }, [shippingConfig, subtotal, discount, orderType, address.country]);

  // Tax is disabled - 0 tax
  useEffect(() => {
    setTaxAmount(0);
    setTaxLabel('');
  }, []);

  const couponCode = appliedCoupon?.code || location.state?.couponCode || '';

  // Redirect to cart if empty (only if order is not being placed and not succeeded)
  useEffect(() => {
    if (items.length === 0 && !isPlacingOrder && !orderSuccess) {
      navigate('/cart');
    }
  }, [items, navigate, isPlacingOrder, orderSuccess]);

  // If user logs in mid-way
  useEffect(() => {
    if (token && step === 1) setStep(2.5);
  }, [token, step, location.state]);

  // Auto-select saved address or show new form
  useEffect(() => {
    if (addresses.length > 0) {
      const def = addresses.find(a => a.is_default) || addresses[0];
      setSelectedSavedAddress(def.id);
      const c = COUNTRIES.find(c => c.name === def.country);
      if (c) setDialCountryCode(c.code);
      const mobileDigits = extractPhone10Digits(def.mobile);
      setAddress({ name: def.name, line1: def.line1, line2: def.line2 || '', city: def.city, state: def.state || '', pincode: def.pincode, country: def.country || 'India', mobile: mobileDigits });
      setShowNewAddressForm(false);
    } else {
      setShowNewAddressForm(true);
    }
  }, [addresses]);

  useGSAP(() => {
    if (orderSuccess) {
      const tl = gsap.timeline();
      
      tl.from(overlayRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' })
        .from(iconRef.current, { scale: 0, rotation: -180, duration: 0.6, ease: 'back.out(1.7)' })
        .from(textRef.current, { y: 20, opacity: 0, duration: 0.4, ease: 'power2.out' }, "-=0.2")
        .to(iconRef.current, { scale: 1.1, duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.inOut', delay: 0.2 });
    }
  }, { dependencies: [orderSuccess] });

  const createOrder = async (pMethod, stripePaymentIntentId, extraData = {}) => {
    const endpoint = token ? `${BACKEND_URL}/auth/orders` : `${BACKEND_URL}/general/orders`;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let finalAddress = orderType === 'pickup'
      ? { name: pickupContact.name, mobile: `${COUNTRIES.find(c=>c.code===pickupDialCode)?.dial||'+91'}${pickupContact.phone}`, email: pickupContact.email }
      : { ...address };

    if (orderType === 'shipping') {
      const c = COUNTRIES.find(c => c.name === finalAddress.country);
      const dialCode = c?.dial || '+91';
      const rawMobile = finalAddress.mobile || '';
      finalAddress.mobile = rawMobile.startsWith('+') ? rawMobile : `${dialCode}${rawMobile}`;
      
      finalAddress.signature_required = signatureRequired;
      finalAddress.signature_fee = signatureFee;
      finalAddress.insurance_requested = insuranceRequested;
      finalAddress.insurance_amount = parseFloat(insuranceDeclaredValue) || 0;
      finalAddress.insurance_fee = insuranceFee;
    }

    const orderNumber = 'LGE-' + Math.floor(100000 + Math.random() * 900000);
    const orderPayload = {
      items,
      address: finalAddress,
      total: finalTotal,
      subtotal,
      discount_amount: discount,
      coupon_code: couponCode,
      shipping_fee: shippingFee,
      tax_amount: taxAmount,
      payment_method: pMethod || 'razorpay',
      order_type: orderType,
      stripe_payment_intent_id: stripePaymentIntentId,
      razorpay_payment_id: extraData.razorpay_payment_id || (pMethod === 'razorpay' ? stripePaymentIntentId : null),
      razorpay_order_id: extraData.razorpay_order_id || null,
      status: 'paid',
      payment_status: 'paid',
      order_number: orderNumber
    };

    let backendResult = null;
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderPayload)
      });
      backendResult = await res.json();
    } catch (e) {
      console.warn("Backend order creation note:", e);
    }

    // Direct Supabase sync for redundancy
    try {
      await supabase.from('orders').insert([{
        order_number: backendResult?.order?.order_number || orderNumber,
        user_id: user?.id || null,
        customer_name: finalAddress.name || user?.name || 'Customer',
        customer_email: finalAddress.email || user?.email || '',
        customer_phone: finalAddress.mobile || user?.phone || '',
        items: JSON.stringify(items),
        shipping_address: JSON.stringify(finalAddress),
        total: Number(finalTotal),
        subtotal: Number(subtotal || finalTotal),
        discount: Number(discount || 0),
        shipping: Number(shippingFee || 0),
        tax: Number(taxAmount || 0),
        payment_method: pMethod || 'razorpay',
        payment_status: 'paid',
        status: 'paid',
        created_at: new Date().toISOString()
      }]);

      await supabase.from('enquiries').insert([{
        name: finalAddress.name || user?.name || 'Customer',
        email: finalAddress.email || user?.email || '',
        phone: finalAddress.mobile || user?.phone || '',
        subject: `New Order Placed: #${backendResult?.order?.order_number || orderNumber}`,
        message: `Order #${backendResult?.order?.order_number || orderNumber} for ₹${Number(finalTotal).toLocaleString('en-IN')} placed by ${finalAddress.name || 'Customer'} (${items.length} item${items.length !== 1 ? 's' : ''}). Channel: ${orderType === 'pickup' ? 'Store Pickup' : 'Delivery Shipping'}. Status: Paid (Razorpay Txn: ${stripePaymentIntentId}).`,
        status: 'new',
        created_at: new Date().toISOString()
      }]).catch(() => {});

      // Deduct inventory stock for each purchased item
      for (const item of items) {
        const prodId = item.id || item.product_id;
        const purchaseQty = Number(item.quantity || 1);
        if (!prodId) continue;

        const numId = Number(prodId);
        const supabaseId = !isNaN(numId) ? numId : prodId;

        const { data: pData } = await supabase.from('products').select('*').eq('id', supabaseId).single();
        if (pData) {
          let variants = Array.isArray(pData.variants) && pData.variants.length > 0 ? pData.variants : [{
            color: pData.color || "Gold",
            images: Array.isArray(pData.images) ? pData.images : (pData.image_url ? [pData.image_url] : []),
            sizes: Array.isArray(pData.sizes) && pData.sizes.length > 0 ? pData.sizes : [{ size: "Standard", mrp: 0, our_price: 0, stock: 10, code: "" }]
          }];

          let matched = false;
          variants = variants.map(v => {
            if (Array.isArray(v.sizes)) {
              return {
                ...v,
                sizes: v.sizes.map(s => {
                  const isSizeMatch = (item.size && s.size && s.size.toLowerCase() === item.size.toLowerCase()) ||
                                      (item.code && s.code && s.code.toLowerCase() === item.code.toLowerCase()) ||
                                      (!matched && variants.length === 1 && v.sizes.length === 1);
                  if (isSizeMatch && !matched) {
                    matched = true;
                    const curStock = Number(s.stock !== undefined ? s.stock : 10);
                    const newStock = Math.max(0, curStock - purchaseQty);
                    return { ...s, stock: newStock };
                  }
                  return s;
                })
              };
            }
            return v;
          });

          if (!matched && variants[0]?.sizes?.[0]) {
            const curStock = Number(variants[0].sizes[0].stock !== undefined ? variants[0].sizes[0].stock : 10);
            variants[0].sizes[0].stock = Math.max(0, curStock - purchaseQty);
          }

          await supabase.from('products').update({
            variants: variants,
            sizes: variants[0]?.sizes || []
          }).eq('id', supabaseId);
        }
      }

      // Synchronize global store with latest deducted stock
      await useStoreData.getState().fetchData().catch(() => null);
    } catch (sbErr) {
      console.warn("Supabase direct order note:", sbErr);
    }

    if (backendResult && backendResult.success) {
      return backendResult;
    }

    return {
      success: true,
      order: {
        id: Date.now().toString(),
        order_number: orderNumber,
        ...orderPayload
      }
    };
  };

  const triggerOrderWhatsAppAlert = (orderData, txnId) => {
    try {
      const orderNum = orderData?.order?.order_number || orderData?.order_number || ('LGE-' + Math.floor(100000 + Math.random() * 900000));
      const custName = (orderType === 'pickup' ? pickupContact.name : address.name) || user?.name || 'Customer';
      const custPhone = (orderType === 'pickup' ? pickupContact.phone : address.mobile) || user?.phone || 'N/A';
      const orderTot = Number(finalTotal).toLocaleString('en-IN');
      const itemsList = items.map(i => `• ${i.product?.name || i.name || 'Jewelry'} (Qty: ${i.qty || 1}${i.variant?.size ? `, Size: ${i.variant.size}` : ''})`).join('\n');
      const deliveryInfo = orderType === 'pickup' ? '🏬 Store Pickup (Aubrey, TX location)' : `📦 Delivery Address: ${address.line1 || ''}, ${address.city || ''}, ${address.state || ''} ${address.pincode || ''}, ${address.country || ''}`;

      const whatsappMessage = 
`✨ *NEW ORDER BOOKED - LYDIA GLOBAL EXIM* ✨
━━━━━━━━━━━━━━━━━━━━━━━
📦 *Order ID:* #${orderNum}
👤 *Customer Name:* ${custName}
📞 *Customer Phone:* ${custPhone}
💰 *Total Paid:* ₹${orderTot}
💳 *Payment Gateway:* Razorpay (Txn ID: ${txnId || 'Confirmed'})
🚚 *Order Mode:* ${deliveryInfo}

🛍️ *Order Items (${items.length}):*
${itemsList}

━━━━━━━━━━━━━━━━━━━━━━━
🔔 *Admin Notification:*
A new order has been placed! Please check the Admin Panel to review order details, print packing slips, update tracking, and process shipping:
👉 https://lydiaglobalexim.com/admin/orders`;

      const waUrl = `https://wa.me/919014863411?text=${encodeURIComponent(whatsappMessage)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      return { waUrl, orderNum };
    } catch (e) {
      console.warn("WhatsApp alert error:", e);
      return {};
    }
  };

  const handleProceedToPayment = async () => {
    if (orderType === 'shipping') {
      const errs = {};
      if (!address.name.trim()) errs.name = 'Full name is required';
      if (!address.line1.trim()) errs.line1 = 'Address is required';
      if (!address.city.trim()) errs.city = 'City is required';
      if (getStatesForCountry(address.country) && (!address.state || !address.state.trim())) errs.state = 'State is required';
      if (!address.pincode.trim()) errs.pincode = 'ZIP code is required';
      if (!address.country.trim()) {
        errs.country = 'Country is required';
      } else if (allowedCountries.length > 0 && !allowedCountries.includes(address.country)) {
        errs.country = (
          <span>
            Shipping to the selected country is currently unavailable through the website. Please <Link to="/contact" target="_blank" className="underline font-bold text-red-600 hover:text-red-800">contact our support team</Link> to place your order.
          </span>
        );
      }
      const mobileDigits = extractPhone10Digits(address.mobile);
      if (!address.mobile || !address.mobile.trim()) {
        errs.mobile = 'Phone number is required';
      } else if (['US', 'CA', 'IN'].includes(dialCountryCode) && mobileDigits.length !== 10) {
        errs.mobile = `Enter a valid 10-digit number`;
      } else if (!['US', 'CA', 'IN'].includes(dialCountryCode) && (mobileDigits.length < 5 || mobileDigits.length > 15)) {
        errs.mobile = 'Enter a valid phone number';
      }
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        showToast('Please fix the highlighted fields.', 'error');
        return;
      }
      setFieldErrors({});
      // Shippo address validation
      try {
        const token = localStorage.getItem('token');
        const valRes = await fetch(`${BACKEND_URL}/general/validate-address`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({
            name: address.name,
            street1: address.line1,
            street2: address.line2 || '',
            city: address.city,
            state: address.state || '',
            zip: address.pincode,
            country: address.country,
            phone: address.mobile
          })
        });
        const valData = await valRes.json();
        if (!valData.valid || valData.hasCorrections) {
          setValidationResult(valData);
          return;
        }
      } catch (e) {
        console.warn('Address validation failed, proceeding anyway:', e);
      }
    } else if (orderType === 'pickup') {
      if (!pickupContact.name.trim()) { showToast('Please enter your name.', 'error'); return; }
      if (pickupContact.phone.replace(/\D/g, '').length < 10) {
        showToast('Please enter a valid 10-digit phone number for pickup notification.', 'error');
        return;
      }
      if (!pickupTermsAccepted) {
        showToast('Please accept the Pickup Terms & Conditions to proceed.', 'error');
        return;
      }
    }
    finalizeProceedToPayment();
  };

  const finalizeProceedToPayment = (finalAddress = address, shouldUpdateSaved = false) => {
    if (orderType === 'shipping') {
      setAddress(finalAddress);
      
      const c = COUNTRIES.find(c => c.name === finalAddress.country);
      const dialCode = c?.dial || '+1';
      const rawMobile = finalAddress.mobile || '';
      const fullMobile = rawMobile.startsWith('+') ? rawMobile : `${dialCode}${rawMobile}`;

      if (token && showNewAddressForm && saveAddress) {
        addAddress({ ...finalAddress, mobile: fullMobile, is_default: saveAsDefault }).catch(() => {});
      } else if (token && !showNewAddressForm && selectedSavedAddress && shouldUpdateSaved) {
        updateAddress(selectedSavedAddress, { ...finalAddress, mobile: fullMobile }).catch(() => {});
      }
    }
    setValidationResult(null);
    setSessionSecondsLeft(SESSION_MINUTES * 60);
    setStep(3);
  };

  // Session countdown effect
  useEffect(() => {
    if (sessionSecondsLeft === null) return;
    if (sessionSecondsLeft <= 0) {
      clearInterval(sessionTimerRef.current);
      showToast('Your session has expired. Please restart checkout.', 'error');
      setStep(2.5);
      setSessionSecondsLeft(null);
      return;
    }
    sessionTimerRef.current = setInterval(() => setSessionSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(sessionTimerRef.current);
  }, [sessionSecondsLeft]);

  const handlePlaceOrder = async () => {
    if (orderType !== 'pickup' && !termsAccepted) { showToast('Please accept the Terms & Conditions to proceed.', 'error'); return; }
    if (orderType !== 'pickup' && !addressConfirmed) { showToast('Please confirm your shipping address is correct.', 'error'); return; }
    if (orderType === 'pickup' && !pickupTermsAccepted) { showToast('Please accept the Pickup Terms & Conditions to proceed.', 'error'); return; }
    setIsPlacingOrder(true);
    setPaymentError(null);
    try {
      // 1. Stock check
      try {
        const stockRes = await fetch(`${BACKEND_URL}/general/check-stock`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        });
        const stockData = await stockRes.json();
        if (stockData && stockData.available === false && stockData.unavailable?.length > 0) {
          const names = stockData.unavailable.map(u => `"${u.name}" (${u.available ?? 0} left)`).join(', ');
          showToast(`Sorry, ${names} is no longer available in the requested quantity.`, 'error');
          setIsPlacingOrder(false);
          return;
        }
      } catch (e) {
        console.warn("Stock check note:", e);
      }

      // 2. Initialize Razorpay Order via Backend
      const rzpRes = await fetch(`${BACKEND_URL}/general/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalTotal,
          currency: 'INR',
          notes: {
            customer_name: (orderType === 'pickup' ? pickupContact.name : address.name) || user?.name || 'Customer',
            order_type: orderType,
            item_count: items.length
          }
        })
      });

      const rzpData = await rzpRes.json();
      if (!rzpData.success || !rzpData.order) {
        throw new Error(rzpData.error || 'Failed to initialize payment gateway.');
      }

      // 3. Ensure Razorpay Checkout SDK is loaded
      const loadRazorpayScript = () => {
        return new Promise((resolve) => {
          if (window.Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });
      };

      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded || !window.Razorpay) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      // 4. Trigger Razorpay Checkout Modal
      const custName = (orderType === 'pickup' ? pickupContact.name : address.name) || user?.name || '';
      const custEmail = (orderType === 'pickup' ? pickupContact.email : address.email) || user?.email || '';
      const custPhone = (orderType === 'pickup' ? pickupContact.phone : address.mobile) || user?.phone || '';

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || rzpData.key_id || 'rzp_test_TYFF1ktIjHgfgu',
        amount: rzpData.order.amount,
        currency: rzpData.order.currency || 'INR',
        name: 'LYDIA GLOBAL EXIM',
        description: `Order Payment (${items.length} item${items.length !== 1 ? 's' : ''})`,
        image: '/image.png',
        order_id: rzpData.order.id,
        prefill: {
          name: custName,
          email: custEmail,
          contact: custPhone
        },
        theme: {
          color: '#45055B'
        },
        handler: async function (response) {
          setIsPlacingOrder(true);
          try {
            // Verify payment signature on backend
            await fetch(`${BACKEND_URL}/general/razorpay/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            }).catch(e => console.warn('Signature verification notice:', e));

            const transactionRef = response.razorpay_payment_id || ('RZP-' + Date.now());
            setTransactionId(transactionRef);

            // Register order
            const createOrderData = await createOrder('razorpay', transactionRef, {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id
            });

            // Open WhatsApp with admin message
            const { waUrl, orderNum } = triggerOrderWhatsAppAlert(createOrderData, transactionRef);
            setWhatsappAlertUrl(waUrl);
            setConfirmedOrderNumber(orderNum || createOrderData?.order?.order_number || transactionRef);

            setIsPlacingOrder(false);
            setOrderSuccess(true);

            // Redirect to Admin Panel Orders (if admin) or Order Tracking
            setTimeout(() => {
              clearCart();
              if (user?.role === 'admin') {
                navigate('/admin/orders');
              } else {
                navigate(`/order-tracking/${orderNum || createOrderData?.order?.order_number || transactionRef}`);
              }
            }, 3000);
          } catch (handlerErr) {
            console.error('Order registration error:', handlerErr);
            showToast(handlerErr.message || 'Error creating order after payment.', 'error');
            setIsPlacingOrder(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsPlacingOrder(false);
            showToast('Payment window closed.', 'info');
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (resp) {
        setIsPlacingOrder(false);
        setPaymentError(resp.error?.description || 'Payment transaction failed.');
        showToast(resp.error?.description || 'Payment failed. Please try again.', 'error');
      });
      razorpayInstance.open();
    } catch (err) {
      console.error('Order placement catch error:', err);
      setPaymentError(err.message || 'Error processing payment.');
      showToast(err.message || 'Error placing order. Please try again.', 'error');
      setIsPlacingOrder(false);
    }
  };

  const pickupEnabled = shippingConfig?.settings?.pickup_enabled ?? false;

  const renderStepIndicator = () => (
    <div className="flex justify-between items-center mb-6 px-2 bg-white/80 p-3 rounded-xl shadow-sm border border-brand-gold/20">
      <div className="flex flex-col items-center cursor-pointer" onClick={() => navigate('/cart')}>
        <div className="w-6 h-6 rounded-full bg-brand-dark-blue text-brand-gold flex items-center justify-center text-xs font-bold border border-brand-gold/30">✓</div>
        <span className="text-[10px] text-brand-dark-blue font-bold mt-1">Cart</span>
      </div>
      <div className={`h-px flex-1 mx-2 ${step >= 2 ? 'bg-brand-gold/40' : 'bg-brand-gold/20'}`}></div>
      <div className="flex flex-col items-center">
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-brand-dark-blue text-brand-gold border border-brand-gold/30' : 'bg-brand-beige-darker text-brand-dark-blue/50 border border-brand-dark-blue/10'}`}>
          {step > 2 ? '✓' : '1'}
        </div>
        <span className={`text-[10px] font-bold mt-1 ${step >= 2 ? 'text-brand-dark-blue' : 'text-brand-dark-blue/50'}`}>Shipping</span>
      </div>
      <div className={`h-px flex-1 mx-2 ${step >= 2.5 ? 'bg-brand-gold/40' : 'bg-brand-gold/20'}`}></div>
      <div className="flex flex-col items-center" onClick={() => { if (step === 3 && orderType !== 'pickup') { setStep(2.5); setSessionSecondsLeft(null); clearInterval(sessionTimerRef.current); setAddressConfirmed(false); setTermsAccepted(false); } }} style={{ cursor: step === 3 && orderType !== 'pickup' ? 'pointer' : 'default' }}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2.5 ? 'bg-brand-dark-blue text-brand-gold border border-brand-gold/30' : 'bg-brand-beige-darker text-brand-dark-blue/50 border border-brand-dark-blue/10'}`}>
          {step > 2.5 ? '✓' : '2'}
        </div>
        <span className={`text-[10px] font-bold mt-1 ${step >= 2.5 ? 'text-brand-dark-blue' : 'text-brand-dark-blue/50'}`}>Address</span>
      </div>
      <div className={`h-px flex-1 mx-2 ${step >= 3 ? 'bg-brand-gold/40' : 'bg-brand-gold/20'}`}></div>
      <div className={`flex flex-col items-center ${step < 3 ? 'opacity-70' : ''}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step >= 3 ? 'bg-brand-dark-blue text-brand-gold border border-brand-gold/30' : 'bg-brand-beige-darker text-brand-dark-blue/50 border border-brand-dark-blue/10'}`}>3</div>
        <span className={`text-[10px] font-bold mt-1 ${step >= 3 ? 'text-brand-dark-blue' : 'text-brand-dark-blue/50'}`}>Payment</span>
      </div>
    </div>
  );

  const SESSION_MINUTES = 5;
  const formatTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const allowedCountries = shippingConfig?.settings?.allowed_countries || [];
  const displayCountries = allowedCountries.length > 0 
    ? COUNTRIES.filter(c => allowedCountries.includes(c.name))
    : COUNTRIES;

  return (
    <div className="min-h-screen bg-brand-beige pb-36 font-sans">
      <Header title="Checkout" />
      
      <div className="p-4 md:p-8 space-y-4 md:space-y-8 md:max-w-7xl mx-auto">
        {renderStepIndicator()}

        {/* Mobile Order Summary (collapsible) */}
        <div className="lg:hidden">
          <button
            onClick={() => setSummaryOpen(o => !o)}
            className="w-full flex items-center justify-between bg-white/90 border border-brand-gold/20 rounded-2xl px-4 py-3.5 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-brand-gold" />
              <span className="text-sm font-bold text-brand-dark-blue">Order Summary</span>
              <span className="text-xs bg-brand-gold/10 text-brand-gold font-bold px-2 py-0.5 rounded-full">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-brand-gold">₹{finalTotal.toFixed(2)}</span>
              <svg className={`w-4 h-4 text-brand-dark-blue/50 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </button>

          {summaryOpen && (
            <div className="mt-2 bg-white/90 border border-brand-gold/20 rounded-2xl p-4 shadow-sm space-y-4">
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {items.map(item => (
                  <div key={`${item.product.id}-${item.variant?.size}`} className="flex gap-3">
                    <div className="w-14 h-14 bg-white rounded-xl border border-brand-gold/10 p-1 shrink-0">
                      <img src={item.variant?.image || item.product.images?.[0] || item.product.image_url} alt="" className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-brand-dark-blue line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-brand-dark-blue/60">Qty: {item.qty} | {item.variant?.size || 'Standard'}</p>
                      {(item.variant?.size_code || item.variant?.code || item.product.product_code) && (
                        <p className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded border border-[#D4AF37]/20 w-fit mt-1">#{(item.variant?.size_code || item.variant?.code || item.product.product_code)}</p>
                      )}
                      <p className="text-sm font-bold text-brand-gold">₹{((item.variant?.price || item.product.price) * item.qty).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-brand-gold/20 pt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-brand-dark-blue/70">
                  <span>Item Total</span><span className="font-medium">₹{subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-brand-gold">
                    <span>Coupon ({appliedCoupon.code})</span><span>- ${discount.toFixed(2)}</span>
                  </div>
                )}
{orderType !== 'pickup' && (
                <div className="flex justify-between text-sm text-brand-dark-blue/70">
                  <span>Shipping</span>
                  <span className="font-medium">{shippingFee === 0 && (parseFloat(shippingConfig?.settings?.free_shipping_threshold) || 0) > 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${shippingFee.toFixed(2)}`}</span>
                </div>
                )}
                {signatureFee > 0 && (
                  <div className="flex justify-between text-sm text-brand-dark-blue/70">
                    <span>Signature Confirmation</span><span className="font-medium">₹{signatureFee.toFixed(2)}</span>
                  </div>
                )}
                {insuranceFee > 0 && (
                  <div className="flex justify-between text-sm text-brand-dark-blue/70">
                    <span>Shipping Insurance</span><span className="font-medium">₹{insuranceFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-brand-dark-blue text-base pt-2 border-t border-brand-gold/20">
                  <span>Grand Total</span><span className="text-brand-gold">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-12 items-start">
          {/* Left Column: Forms */}
          <div className="lg:col-span-8 space-y-6">


            {step === 2.5 && orderType !== 'pickup' && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-xl font-bold text-brand-dark-blue flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-brand-gold" />
                </div>
                Shipping Address
              </h2>

              <div className="flex items-center gap-2 flex-wrap">
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewAddressForm(false);
                      const def = addresses.find(a => a.is_default) || addresses[0];
                      setSelectedSavedAddress(def.id);
                      const c = COUNTRIES.find(c => c.name === def.country);
                      if (c) setDialCountryCode(c.code);
                      const mobileDigits = extractPhone10Digits(def.mobile);
                      setAddress({
                        name: def.name,
                        line1: def.line1,
                        line2: def.line2 || '',
                        city: def.city,
                        state: def.state || '',
                        pincode: def.pincode,
                        country: def.country || 'India',
                        mobile: mobileDigits
                      });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      !showNewAddressForm
                        ? 'bg-brand-dark-blue text-brand-gold shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-brand-gold/50'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Saved Addresses ({addresses.length})
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedSavedAddress(null);
                    setShowNewAddressForm(true);
                    setAddress({
                      name: user?.name || '',
                      line1: '',
                      line2: '',
                      city: '',
                      state: '',
                      pincode: '',
                      country: 'India',
                      mobile: user?.phone ? getLocalPhone(user.phone) : ''
                    });
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    showNewAddressForm
                      ? 'bg-brand-dark-blue text-brand-gold shadow-sm'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-brand-gold/50'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Add New Address
                </button>
              </div>
            </div>

            {/* Saved addresses list */}
            {addresses.length > 0 && !showNewAddressForm && (
              <div className="space-y-3">
                {addresses.map(addr => (
                  <div key={addr.id}>
                    {editingAddr === addr.id ? (
                      /* Inline edit form */
                      <div className="bg-white rounded-2xl border-2 border-brand-gold p-4 space-y-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-bold text-brand-dark-blue uppercase tracking-wider">Edit Address</p>
                          <button onClick={() => setEditingAddr(null)} className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200">
                            <X className="w-3.5 h-3.5 text-gray-500" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {[['name','Full Name'],['line2','Line 2 (optional)'],['city','City'],['pincode','ZIP']].map(([key, label]) => (
                            <div key={key} className={key === 'line2' ? 'sm:col-span-2' : ''}>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
                              <input
                                value={editForm[key] || ''}
                                onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-all"
                              />
                            </div>
                          ))}
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">State</label>
                            {(() => {
                              const states = getStatesForCountry(editForm.country);
                              return states ? (
                                <select value={editForm.state || ''} onChange={e => setEditForm(f => ({ ...f, state: e.target.value }))}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-all">
                                  <option value="">Select state</option>
                                  {states.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
                                </select>
                              ) : (
                                <input value={editForm.state || ''} onChange={e => setEditForm(f => ({ ...f, state: e.target.value }))} placeholder="State (optional)"
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-all" />
                              );
                            })()}
                          </div>
                          {/* Address Line 1 with autocomplete */}
                          <div className="sm:col-span-2 order-first">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Address Line 1</label>
                            {mapsLoaded ? (
                              <AddressAutocomplete
                                value={editForm.line1 || ''}
                                onChange={v => setEditForm(f => ({ ...f, line1: v }))}
                                onSelect={({ line1, city, state, pincode, country }) => {
                                  const c = country ? COUNTRIES.find(c => c.name === country) : null;
                                  setEditForm(f => ({
                                    ...f,
                                    line1: line1 || f.line1,
                                    city: city || f.city,
                                    state: state || f.state,
                                    pincode: pincode || f.pincode,
                                    country: country || f.country,
                                  }));
                                  if (c) setEditDialCode(c.code);
                                }}
                              />
                            ) : (
                              <input
                                value={editForm.line1 || ''}
                                onChange={e => setEditForm(f => ({ ...f, line1: e.target.value }))}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-all"
                              />
                            )}
                          </div>
                          {/* Country dropdown */}
                          <div ref={editCountryRef} className="relative sm:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Country</label>
                            <button type="button" onClick={() => { setEditCountryOpen(o => !o); setEditCountrySearch(''); }}
                              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm flex items-center gap-2 justify-between focus:outline-none focus:border-brand-gold transition-all">
                              <div className="flex items-center gap-2 min-w-0">
                                {editForm.country && (() => { const c = COUNTRIES.find(c => c.name === editForm.country); return c ? <span>{flag(c.code)}</span> : null; })()}
                                <span className={`truncate ${editForm.country ? 'text-gray-700' : 'text-gray-400'}`}>{editForm.country || 'Select country'}</span>
                              </div>
                              <svg className={`w-3 h-3 text-gray-400 transition-transform shrink-0 ${editCountryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {editCountryOpen && (
                              <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                                <div className="p-2 border-b border-gray-100">
                                  <input autoFocus type="text" value={editCountrySearch} onChange={e => setEditCountrySearch(e.target.value)}
                                    placeholder="Search country..." className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
                                </div>
                                <ul className="max-h-48 overflow-y-auto">
                                  {displayCountries.filter(c => c.name.toLowerCase().includes(editCountrySearch.toLowerCase())).map(c => (
                                    <li key={c.code}>
                                      <button type="button" onClick={() => {
                                        setEditForm(f => ({ ...f, country: c.name }));
                                        setEditDialCode(c.code);
                                        setEditCountryOpen(false);
                                      }} className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                                        editForm.country === c.name ? 'bg-brand-gold/10 font-bold text-brand-dark-blue' : 'text-gray-700 hover:bg-gray-50'}`}>
                                        <span>{flag(c.code)}</span>
                                        <span className="flex-1 truncate">{c.name}</span>
                                        <span className="text-gray-400 font-mono text-xs shrink-0">{c.dial}</span>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                              If your country is not listed above, shipping to your region is currently unavailable through the website. Please <Link to="/contact" target="_blank" className="text-brand-dark-blue font-bold underline hover:text-brand-gold">contact our Support Team</Link> to place your order.
                            </p>
                          </div>
                          {/* Phone with dial code picker */}
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Phone</label>
                            <div className="flex gap-2">
                              <div ref={editDialRef} className="relative shrink-0">
                                <button type="button" onClick={() => { setEditDialOpen(o => !o); setEditDialSearch(''); }}
                                  className="h-full min-w-[80px] bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm flex items-center gap-1.5 focus:outline-none focus:border-brand-gold hover:border-brand-gold/50 transition-all">
                                  <span>{flag(editDialCode)}</span>
                                  <span className="font-bold text-gray-700 text-xs">{COUNTRIES.find(c => c.code === editDialCode)?.dial || '+1'}</span>
                                  <svg className={`w-3 h-3 text-gray-400 transition-transform shrink-0 ${editDialOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                {editDialOpen && (
                                  <div className="absolute z-50 mt-1 left-0 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                                    <div className="p-2 border-b border-gray-100">
                                      <input autoFocus type="text" value={editDialSearch} onChange={e => setEditDialSearch(e.target.value)}
                                        placeholder="Search country..." className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
                                    </div>
                                    <ul className="max-h-48 overflow-y-auto">
                                      {COUNTRIES.filter(c => c.name.toLowerCase().includes(editDialSearch.toLowerCase()) || c.dial.includes(editDialSearch)).map(c => (
                                        <li key={c.code}>
                                          <button type="button" onClick={() => { setEditDialCode(c.code); setEditDialOpen(false); }}
                                            className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                                              editDialCode === c.code ? 'bg-brand-gold/10 font-bold text-brand-dark-blue' : 'text-gray-700 hover:bg-gray-50'}`}>
                                            <span>{flag(c.code)}</span>
                                            <span className="flex-1 truncate">{c.name}</span>
                                            <span className="text-gray-400 font-mono text-xs shrink-0">{c.dial}</span>
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              <input type="text" inputMode="numeric"
                                value={editForm.mobile || ''}
                                onChange={e => setEditForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '').slice(0, 15) }))}
                                placeholder="Phone number"
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-gold transition-all"
                              />
                            </div>
                          </div>
                        </div>
                        <button onClick={saveEdit} disabled={savingEdit}
                          className="w-full bg-brand-dark-blue text-brand-gold font-bold text-sm rounded-xl py-2.5 flex items-center justify-center gap-2 hover:opacity-90 transition-all disabled:opacity-50">
                          {savingEdit ? <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save Changes</>}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSavedAddress(addr.id);
                          const c = COUNTRIES.find(c => c.name === addr.country);
                          if (c) setDialCountryCode(c.code);
                          const mobileDigits = extractPhone10Digits(addr.mobile);
                          setAddress({ name: addr.name, line1: addr.line1, line2: addr.line2 || '', city: addr.city, state: addr.state || '', pincode: addr.pincode, country: addr.country || 'India', mobile: mobileDigits });
                        }}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3 ${
                          selectedSavedAddress === addr.id ? 'border-brand-gold bg-brand-gold/5' : 'border-gray-200 bg-white hover:border-brand-gold/40'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                          selectedSavedAddress === addr.id ? 'border-brand-gold bg-brand-gold' : 'border-gray-300'
                        }`}>
                          {selectedSavedAddress === addr.id && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-brand-dark-blue">{addr.name}</p>
                            {addr.is_default && <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">Default</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.pincode}</p>
                          <p className="text-xs text-gray-400 mt-0.5">📞 {formatDisplayPhone(addr.mobile)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); openEdit(addr); }}
                          className="shrink-0 w-7 h-7 bg-blue-50 hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => { setSelectedSavedAddress(null); setShowNewAddressForm(true); setAddress({ name: user?.name || '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India', mobile: '' }); }}
                  className="w-full text-left p-4 rounded-2xl border-2 border-dashed border-gray-200 bg-white hover:border-brand-gold/40 transition-all flex items-center gap-3 text-brand-dark-blue/60 hover:text-brand-dark-blue"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0" />
                  <span className="text-sm font-semibold">+ Use a different address</span>
                </button>
              </div>
            )}

            {/* New address form */}
            {showNewAddressForm && (
            <div className="bg-white rounded-2xl shadow-sm border border-brand-gold/20 overflow-hidden">
              {addresses.length > 0 && (
                <div className="px-4 pt-4 sm:px-6">
                  <button type="button" onClick={() => { setShowNewAddressForm(false); const def = addresses.find(a => a.is_default) || addresses[0]; setSelectedSavedAddress(def.id); }}
                    className="text-xs font-bold text-brand-gold flex items-center gap-1 hover:underline">
                    ← Back to saved addresses
                  </button>
                </div>
              )}
              <div className="p-4 sm:p-6 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Full Name *</label>
                  <input
                    required
                    value={address.name}
                    onChange={e => { setAddress({...address, name: e.target.value}); setFieldErrors(f => ({...f, name: ''})); }}
                    className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all ${
                      fieldErrors.name ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-300' : 'border-gray-200 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30'
                    }`}
                    placeholder="Enter your full name"
                  />
                  {fieldErrors.name && <p className="text-[10px] text-red-500 mt-1 font-medium">{fieldErrors.name}</p>}
                </div>

                {/* Address Line 1 */}
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Address Line 1 *</label>
                  {mapsLoaded ? (
                    <div className={fieldErrors.line1 ? 'rounded-xl ring-1 ring-red-400' : ''}>
                      <AddressAutocomplete
                        value={address.line1}
                        onChange={v => { setAddress(a => ({ ...a, line1: v })); setFieldErrors(f => ({...f, line1: ''})); }}
                        onSelect={({ line1, city, state, pincode, country }) => {
                          setAddress(a => ({ ...a, line1: line1 || a.line1, city: city || a.city, state: state || a.state, pincode: pincode || a.pincode, country: country || a.country }));
                          setFieldErrors(f => ({...f, line1: '', city: '', pincode: '', country: ''}));
                        }}
                      />
                    </div>
                  ) : (
                    <input
                      value={address.line1}
                      onChange={e => { setAddress(a => ({ ...a, line1: e.target.value })); setFieldErrors(f => ({...f, line1: ''})); }}
                      placeholder="House no., Street, Area"
                      className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none transition-all ${
                        fieldErrors.line1 ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-300' : 'border-gray-200 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30'
                      }`}
                    />
                  )}
                  {fieldErrors.line1 && <p className="text-[10px] text-red-500 mt-1 font-medium">{fieldErrors.line1}</p>}
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Selecting a suggestion auto-fills city, state, ZIP & country
                  </p>
                </div>

                {/* Apartment */}
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Apartment, suite, etc. (optional)</label>
                  <input
                    value={address.line2}
                    onChange={e => setAddress(a => ({ ...a, line2: e.target.value }))}
                    placeholder="Apartment, suite, unit, building, floor, etc."
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all"
                  />
                </div>

                {/* City + State */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">City *</label>
                    <input required value={address.city} onChange={e => { setAddress({...address, city: e.target.value}); setFieldErrors(f => ({...f, city: ''})); }}
                      className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none transition-all ${
                        fieldErrors.city ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-300' : 'border-gray-200 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30'
                      }`}
                      placeholder="City" />
                    {fieldErrors.city && <p className="text-[10px] text-red-500 mt-1 font-medium">{fieldErrors.city}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">State <span className="text-gray-400 font-normal">*</span></label>
                    {(() => {
                      const states = getStatesForCountry(address.country);
                      return states ? (
                        <select value={address.state} onChange={e => { setAddress({...address, state: e.target.value}); setFieldErrors(f => ({...f, state: ''})); }}
                          className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none transition-all ${fieldErrors.state ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-300' : 'border-gray-200 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30'}`}>
                          <option value="">Select state</option>
                          {states.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
                        </select>
                      ) : (
                        <input value={address.state} onChange={e => setAddress({...address, state: e.target.value})}
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all"
                          placeholder="State (optional)" />
                      );
                    })()}
                    {fieldErrors.state && <p className="text-[10px] text-red-500 mt-1 font-medium">{fieldErrors.state}</p>}
                  </div>
                </div>

                {/* ZIP + Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">ZIP Code *</label>
                    <input type="text" inputMode="numeric" required value={address.pincode}
                      onChange={e => { setAddress({...address, pincode: e.target.value}); setFieldErrors(f => ({...f, pincode: ''})); }}
                      className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none transition-all ${
                        fieldErrors.pincode ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-300' : 'border-gray-200 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30'
                      }`}
                      placeholder="ZIP / Postal code" />
                    {fieldErrors.pincode && <p className="text-[10px] text-red-500 mt-1 font-medium">{fieldErrors.pincode}</p>}
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Phone *</label>
                    <div className="flex gap-2">
                      <div ref={dialRef} className="relative shrink-0">
                        <button type="button" onClick={() => { setDialOpen(o => !o); setDialSearch(''); }}
                          className="h-full min-w-[80px] bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm flex items-center gap-1.5 focus:outline-none focus:border-brand-gold hover:border-brand-gold/50 transition-all">
                          <span>{flag(dialCountryCode)}</span>
                          <span className="font-bold text-gray-700">{dialCode}</span>
                          <svg className={`w-3 h-3 text-gray-400 transition-transform shrink-0 ${dialOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {dialOpen && (
                          <div className="absolute z-50 mt-1 left-0 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                            <div className="p-2 border-b border-gray-100">
                              <input autoFocus type="text" value={dialSearch} onChange={e => setDialSearch(e.target.value)}
                                placeholder="Search country..." className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
                            </div>
                            <ul className="max-h-52 overflow-y-auto">
                              {displayCountries.filter(c => c.name.toLowerCase().includes(dialSearch.toLowerCase()) || c.dial.includes(dialSearch)).map(c => (
                                <li key={c.code}>
                                  <button type="button" onClick={() => { setDialCountryCode(c.code); setDialOpen(false); }}
                                    className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                                      dialCountryCode === c.code ? 'bg-brand-gold/10 font-bold text-brand-dark-blue' : 'text-gray-700 hover:bg-gray-50'}`}>
                                    <span className="text-base">{flag(c.code)}</span>
                                    <span className="flex-1 truncate">{c.name}</span>
                                    <span className="text-gray-400 font-mono text-xs shrink-0">{c.dial}</span>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <input type="text" inputMode="numeric" required value={address.mobile}
                        maxLength={['IN', 'US', 'CA'].includes(dialCountryCode) ? 10 : 15}
                        onChange={e => { const limit = ['IN', 'US', 'CA'].includes(dialCountryCode) ? 10 : 15; setAddress({...address, mobile: e.target.value.replace(/\D/g, '').slice(0, limit)}); setFieldErrors(f => ({...f, mobile: ''})); }}
                        className={`flex-1 bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none transition-all ${
                          fieldErrors.mobile ? 'border-red-400 focus:border-red-400 focus:ring-1 focus:ring-red-300' : 'border-gray-200 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30'
                        }`}
                        placeholder={['IN', 'US', 'CA'].includes(dialCountryCode) ? '10-digit number' : 'Phone number'} />
                    </div>
                    {fieldErrors.mobile && <p className="text-[10px] text-red-500 mt-1 font-medium">{fieldErrors.mobile}</p>}
                  </div>
                </div>

                {/* Country */}
                <div ref={countryRef} className="relative">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Country *</label>
                  <button type="button" onClick={() => { setCountryOpen(o => !o); setCountrySearch(''); }}
                    className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none transition-all flex items-center gap-2 justify-between ${
                      fieldErrors.country ? 'border-red-400' : 'border-gray-200 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30'
                    }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      {address.country && (() => { const c = COUNTRIES.find(c => c.name === address.country); return c ? <span className="text-base shrink-0">{flag(c.code)}</span> : null; })()}
                      <span className={`truncate ${address.country ? 'text-gray-700' : 'text-gray-400'}`}>{address.country || 'Select country'}</span>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${countryOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {countryOpen && (
                    <div className="absolute z-[200] bottom-full mb-1 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <input autoFocus type="text" value={countrySearch} onChange={e => setCountrySearch(e.target.value)}
                          placeholder="Search country..." className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold" />
                      </div>
                      <ul className="max-h-52 overflow-y-auto">
                        {displayCountries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map(c => (
                          <li key={c.code}>
                            <button type="button" onClick={() => { setAddress({...address, country: c.name}); setDialCountryCode(c.code); setCountryOpen(false); setFieldErrors(f => ({...f, country: ''})); }}
                              className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                                address.country === c.name ? 'bg-brand-gold/10 text-brand-dark-blue font-bold' : 'text-gray-700 hover:bg-gray-50'}`}>
                              <span className="text-base shrink-0">{flag(c.code)}</span>
                              <span className="flex-1 truncate">{c.name}</span>
                              <span className="text-gray-400 font-mono text-xs shrink-0">{c.dial}</span>
                            </button>
                          </li>
                        ))}
                        {displayCountries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 && (
                          <li className="px-4 py-3 text-sm text-gray-400 text-center">No country found</li>
                        )}
                      </ul>
                    </div>
                  )}
                  {fieldErrors.country && <p className="text-[10px] text-red-500 mt-1 font-medium">{fieldErrors.country}</p>}
                  <p className="text-[10px] text-gray-400 mt-1.5 leading-relaxed">
                    If your country is not listed above, shipping to your region is currently unavailable through the website. Please <Link to="/contact" target="_blank" className="text-brand-dark-blue font-bold underline hover:text-brand-gold">contact our Support Team</Link> to place your order.
                  </p>
                </div>

                {/* Save address checkboxes */}
                {token && (
                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)}
                        className="w-4 h-4 accent-brand-dark-blue rounded" />
                      <span className="text-xs text-gray-600 font-medium">Save this address for future orders</span>
                    </label>
                    {saveAddress && (
                      <label className="flex items-center gap-2.5 cursor-pointer pl-6">
                        <input type="checkbox" checked={saveAsDefault} onChange={e => setSaveAsDefault(e.target.checked)}
                          className="w-4 h-4 accent-brand-dark-blue rounded" />
                        <span className="text-xs text-gray-600">Set as default address</span>
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Proceed button — new address form path */}
            {showNewAddressForm && (
              <div className="space-y-3">
                <button onClick={handleProceedToPayment}
                  className="w-full bg-brand-dark-blue text-brand-gold font-bold text-sm rounded-xl py-4 shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" /> Proceed to Payment
                </button>
                <div className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[11px] text-gray-400">100% Secure Transaction</span>
                </div>
              </div>
            )}

            {/* Proceed button — saved address path */}
            {!showNewAddressForm && addresses.length > 0 && (
              <div className="space-y-3">
                <button onClick={handleProceedToPayment}
                  className="w-full bg-brand-dark-blue text-brand-gold font-bold text-sm rounded-xl py-4 shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2">
                  <CreditCard className="w-4 h-4" /> Proceed to Payment
                </button>
                <div className="flex items-center justify-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-[11px] text-gray-400">100% Secure Transaction</span>
                </div>
              </div>
            )}
          </div>
        )}
        {step === 2.5 && orderType === 'pickup' && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <Store className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-800">Store Pickup Selected</p>
                  <p className="text-sm text-blue-700 mt-1">Once your order is ready, our team will message you via <strong>WhatsApp/Text</strong> from <strong>+91 9014863411</strong></p>
                </div>
              </div>
              <div className="flex items-start gap-3 border-t border-blue-200 pt-3">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-blue-800">Nearby Pickup Location</p>
                  <p className="text-sm text-blue-700">2965 FM1385, Aubrey, TX 76227</p>
                  <a href="https://maps.google.com/?q=2965+FM1385,+Aubrey,+TX+76227" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 font-bold underline hover:text-blue-800">View on Google Maps →</a>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-brand-gold/20 p-5 space-y-4">
              <p className="text-sm font-bold text-brand-dark-blue">Contact Details for Pickup Notification</p>

              {/* Full Name */}
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Full Name *</label>
                <input
                  value={pickupContact.name}
                  onChange={e => setPickupContact(p => ({ ...p, name: e.target.value }))}
                  placeholder="Your full name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all"
                />
              </div>

              {/* Phone with country code */}
              <div>
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Mobile *</label>
                <div className="flex gap-2">
                  {/* Country code picker */}
                  <div ref={pickupDialRef} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => { setPickupDialOpen(o => !o); setPickupDialSearch(''); }}
                      className="h-full min-w-[90px] bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm flex items-center gap-1.5 focus:outline-none focus:border-brand-gold hover:border-brand-gold/50 transition-all"
                    >
                      <span>{String.fromCodePoint(...[...pickupDialCode.toUpperCase()].map(x => 127397 + x.charCodeAt(0)))}</span>
                      <span className="font-bold text-gray-700 text-xs">{COUNTRIES.find(c=>c.code===pickupDialCode)?.dial || '+1'}</span>
                      <svg className={`w-3 h-3 text-gray-400 transition-transform shrink-0 ${pickupDialOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {pickupDialOpen && (
                      <div className="absolute z-50 mt-1 left-0 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                        <div className="p-2 border-b border-gray-100">
                          <input
                            autoFocus
                            type="text"
                            value={pickupDialSearch}
                            onChange={e => setPickupDialSearch(e.target.value)}
                            placeholder="Search country..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-gold"
                          />
                        </div>
                        <ul className="max-h-52 overflow-y-auto">
                          {COUNTRIES.filter(c =>
                            c.name.toLowerCase().includes(pickupDialSearch.toLowerCase()) ||
                            c.dial.includes(pickupDialSearch)
                          ).map(c => (
                            <li key={c.code}>
                              <button
                                type="button"
                                onClick={() => { setPickupDialCode(c.code); setPickupDialOpen(false); }}
                                className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2.5 transition-colors ${
                                  pickupDialCode === c.code ? 'bg-brand-gold/10 font-bold text-brand-dark-blue' : 'text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <span>{String.fromCodePoint(...[...c.code.toUpperCase()].map(x => 127397 + x.charCodeAt(0)))}</span>
                                <span className="flex-1 truncate">{c.name}</span>
                                <span className="text-gray-400 font-mono text-xs shrink-0">{c.dial}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pickupContact.phone}
                    onChange={e => setPickupContact(p => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 15) }))}
                    placeholder="Phone number"
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all"
                  />
                </div>
                <p className="text-[10px] text-amber-600 font-medium mt-1.5 flex items-center gap-1">
                  💬 For best experience, please provide your WhatsApp number — we'll send pickup updates via WhatsApp/Text.
                </p>
              </div>

              {/* Email */}
              {!user?.email && (
                <div>
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">Email (optional)</label>
                  <input
                    value={pickupContact.email}
                    onChange={e => setPickupContact(p => ({ ...p, email: e.target.value }))}
                    placeholder="your@email.com"
                    type="email"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold/30 transition-all"
                  />
                </div>
              )}
            </div>

            {/* Pickup T&C */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-amber-800">⚠️ Pickup Terms & Conditions</p>
              <ul className="space-y-1.5 text-xs text-amber-700 leading-relaxed">
                <li className="flex items-start gap-2"><span className="shrink-0">•</span><span>Please inspect your item(s) carefully at the time of pickup before leaving the store.</span></li>
                <li className="flex items-start gap-2"><span className="shrink-0">•</span><span><strong>Any damage must be reported within 1 business day</strong> of pickup. Claims after this window cannot be accepted.</span></li>
                <li className="flex items-start gap-2"><span className="shrink-0">•</span><span>Bring a valid photo ID and your order confirmation when picking up.</span></li>
                <li className="flex items-start gap-2"><span className="shrink-0">•</span><span>Orders not picked up within 7 days of the ready notification may be subject to restocking.</span></li>
                <li className="flex items-start gap-2"><span className="shrink-0">•</span><span>To extend the life of your jewelry, avoid contact with perfume, pool water & harsh chemicals. Store in a dry place inside a sealed zip-lock cover when not in use. See our <Link to="/jewelry-care" className="font-bold underline text-brand-dark-blue hover:text-brand-gold" target="_blank">Jewelry Care Tips</Link> for more details.</span></li>
                <li className="flex items-start gap-2"><span className="shrink-0">•</span><span>All sales are <strong>final — no returns or exchanges</strong> on pickup orders.</span></li>
              </ul>
              <label className="flex items-start gap-2.5 cursor-pointer pt-1 border-t border-amber-200">
                <input type="checkbox" checked={pickupTermsAccepted} onChange={e => setPickupTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-amber-700 shrink-0" />
                <span className="text-xs text-amber-800 font-medium leading-relaxed">
                  I acknowledge that I have read and agree to the Pickup Terms & Conditions above and have reviewed the Jewelry Care Tips.
                </span>
              </label>
            </div>
          </div>
        )}

        {step === 2.5 && orderType === 'pickup' && (
          <div className="max-w-3xl mx-auto mt-4">
            <button
              onClick={() => {
                if (!pickupContact.name.trim()) { showToast('Please enter your name.', 'error'); return; }
                if (pickupContact.phone.replace(/\D/g, '').length < 7) { showToast('Please enter a valid phone number.', 'error'); return; }
                if (!pickupTermsAccepted) { showToast('Please accept the Pickup Terms & Conditions to proceed.', 'error'); return; }
                setStep(3);
              }}
              disabled={!pickupTermsAccepted}
              className={`w-full font-bold text-base rounded-xl py-4 flex items-center justify-center gap-2 transition-all ${
                !pickupTermsAccepted
                  ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-400'
                  : 'bg-brand-dark-blue text-brand-gold shadow-lg shadow-brand-dark-blue/20 hover:shadow-xl hover:-translate-y-0.5'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Proceed to Payment
            </button>
          </div>
        )}
        {step === 3 && (
          <RazorpayPaymentForm
            isPlacingOrder={isPlacingOrder}
            handlePlaceOrder={handlePlaceOrder}
            termsAccepted={termsAccepted}
            setTermsAccepted={setTermsAccepted}
            addressConfirmed={addressConfirmed}
            setAddressConfirmed={setAddressConfirmed}
            address={address}
            sessionSecondsLeft={sessionSecondsLeft}
            onEditAddress={() => { setStep(2.5); setSessionSecondsLeft(null); clearInterval(sessionTimerRef.current); setAddressConfirmed(false); setTermsAccepted(false); }}
            paymentError={paymentError}
            onRetry={() => setPaymentError(null)}
            orderType={orderType}
            pickupContact={pickupContact}
            finalTotal={finalTotal}
          />
        )}
      </div>
          {/* Right Column: Order Summary (Desktop) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-24">
            <div className="bg-white/80 p-6 rounded-3xl shadow-sm border border-brand-gold/20">
              <h3 className="font-serif font-bold text-brand-dark-blue mb-6 text-xl">Order Summary</h3>
              
              <div className="space-y-4 max-h-[40vh] overflow-y-auto hide-scrollbar pr-2 mb-6">
                {items.map(item => (
                  <div key={`${item.product.id}-${item.variant?.size}`} className="flex gap-4">
                    <div className="w-16 h-16 bg-white rounded-xl border border-brand-gold/10 p-1 shrink-0">
                      <img src={item.variant?.image || item.product.images?.[0] || item.product.image_url} alt="" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-brand-dark-blue line-clamp-1">{item.product.name}</h4>
                      <p className="text-xs text-brand-dark-blue/60 mt-1">Qty: {item.qty} | {item.variant?.size || 'Std'}</p>
                      {(item.variant?.size_code || item.variant?.code || item.product.product_code) && (
                        <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-1.5 py-0.5 rounded border border-[#D4AF37]/20">#{(item.variant?.size_code || item.variant?.code || item.product.product_code)}</span>
                      )}
                      <p className="text-sm font-bold text-brand-gold mt-1">₹{((item.variant?.price || item.product.price) * item.qty).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-brand-gold/20 pt-4 mb-6">
                <div className="flex justify-between text-sm text-brand-dark-blue/80 mb-2">
                  <span>Item Total</span>
                  <span className="font-medium text-brand-dark-blue">₹{subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-brand-gold mb-2">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span className="font-medium">- ${discount.toFixed(2)}</span>
                  </div>
                )}
{orderType !== 'pickup' && (
                <div className="flex justify-between text-sm text-brand-dark-blue/80 mb-2">
                  <span>Shipping Fee</span>
                  <span className="font-medium text-brand-dark-blue">{shippingFee === 0 && (parseFloat(shippingConfig?.settings?.free_shipping_threshold) || 0) > 0 ? <span className="text-green-600 font-bold">FREE</span> : `₹${shippingFee.toFixed(2)}`}</span>
                </div>
                )}
                {signatureFee > 0 && (
                  <div className="flex justify-between text-sm text-brand-dark-blue/80 mb-2">
                    <span>Signature Confirmation</span>
                    <span className="font-medium text-brand-dark-blue">₹{signatureFee.toFixed(2)}</span>
                  </div>
                )}
                {insuranceFee > 0 && (
                  <div className="flex justify-between text-sm text-brand-dark-blue/80 mb-2">
                    <span>Shipping Insurance</span>
                    <span className="font-medium text-brand-dark-blue">₹{insuranceFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-brand-dark-blue text-xl pt-2 border-t border-brand-gold/20">
                  <span>Grand Total</span>
                  <span className="text-brand-gold">₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              {(step === 2 || (step === 2.5 && orderType !== 'pickup')) ? (
                <button 
                  onClick={step === 2 && pickupEnabled ? undefined : handleProceedToPayment}
                  disabled={step === 2 && pickupEnabled}
                  className={`w-full bg-brand-dark-blue text-brand-gold font-bold text-base rounded-xl py-4 shadow-lg shadow-brand-dark-blue/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${step === 2 && pickupEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  Proceed to Payment
                </button>
              ) : null}
              
              <div className="flex items-center justify-center gap-2 mt-4 text-gray-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-xs font-medium">100% Secure Transaction</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-beige/95 backdrop-blur-md border-t border-brand-gold/20 p-4 pb-safe z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] mx-auto w-full">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-end justify-between mb-4">
            <div>
              <>
                <p className="text-xs font-bold text-brand-dark-blue/60 uppercase tracking-wider mb-1">Payable Amount</p>
                <div className="flex flex-col">
                  {appliedCoupon && <span className="text-[10px] text-brand-gold font-bold -mb-1">Code applied: {appliedCoupon.code}</span>}
                  <p className="text-2xl font-bold text-brand-dark-blue leading-none">₹{finalTotal.toFixed(2)}</p>
                </div>
              </>
            </div>
          </div>
          
          {(step === 2 || (step === 2.5 && orderType !== 'pickup')) ? (
            <button 
              onClick={step === 2 && pickupEnabled ? undefined : handleProceedToPayment}
              disabled={step === 2 && pickupEnabled}
              className={`w-full bg-brand-dark-blue text-brand-gold font-bold text-base rounded-xl py-4 shadow-lg shadow-brand-dark-blue/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 ${step === 2 && pickupEnabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              Proceed to Payment
            </button>
          ) : null}
        
        <div className="flex items-center justify-center gap-1 mt-3">
          <ShieldCheck className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-[9px] text-gray-400 font-medium">Your order is safe and secure</span>
        </div>
        </div>
      </div>

      {/* Placing Order Spinner */}
      {isPlacingOrder && (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-14 h-14 border-4 border-brand-gold/20 border-t-brand-gold rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-brand-dark-blue">Processing your payment & order...</p>
        </div>
      )}

      {/* Order Confirmed Overlay */}
      {orderSuccess && (
        <div ref={overlayRef} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full text-center shadow-2xl border border-brand-gold/30 space-y-5 animate-in fade-in zoom-in duration-300">
            <div ref={iconRef} className="w-20 h-20 bg-gradient-to-tr from-[#45055B] to-[#6a158a] text-white rounded-full flex items-center justify-center shadow-xl mx-auto">
              <CheckCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            
            <div>
              <h2 ref={textRef} className="text-2xl sm:text-3xl font-serif font-bold text-brand-dark-blue">Order Confirmed!</h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                Thank you for placing your order with <strong>LYDIA GLOBAL EXIM</strong>. Your payment was verified and your order details have been registered into the Admin Panel.
              </p>
            </div>

            {/* Order Badges */}
            <div className="bg-brand-beige/50 border border-brand-gold/20 rounded-2xl p-4 space-y-2 text-left text-xs text-brand-dark-blue">
              {confirmedOrderNumber && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-500">Order Number:</span>
                  <span className="font-mono font-bold text-brand-dark-blue bg-white px-2 py-0.5 rounded border border-brand-gold/30">#{confirmedOrderNumber}</span>
                </div>
              )}
              {transactionId && (
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-500">Razorpay Payment ID:</span>
                  <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">{transactionId}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-500">Amount Paid:</span>
                <span className="font-bold text-brand-gold text-sm">₹{Number(finalTotal).toFixed(2)}</span>
              </div>
            </div>

            {/* WhatsApp notification status */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3 text-left">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.96.524 1.831.799 2.796.8 3.183 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.786-5.769-5.786zm3.364 8.163c-.141.398-.711.758-1.047.818-.335.06-.729.074-2.146-.514-1.637-.68-2.695-2.336-2.776-2.446-.082-.11-1.258-1.674-1.258-3.193 0-1.52.796-2.27 1.078-2.576.282-.307.615-.384.82-.384.205 0 .41.002.59.011.19.009.444-.072.694.529.256.617.873 2.13.95 2.285.077.154.129.334.026.54-.103.205-.154.334-.308.514-.154.18-.324.402-.462.539-.154.153-.314.32-.135.628.18.307.8 1.32 1.716 2.137 1.179 1.05 2.174 1.376 2.482 1.53.308.154.488.128.667-.077.18-.205.77-0.898.975-1.206.205-.308.41-.257.693-.154.282.102 1.795.847 2.103 1.001.308.154.513.23.59.36.077.128.077.744-.064 1.142z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-emerald-900">WhatsApp Notification Dispatched</p>
                <p className="text-[10px] text-emerald-700">Order alert prefilled to admin WhatsApp (+91 9014863411).</p>
              </div>
            </div>

            {/* Quick action navigation buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              {whatsappAlertUrl && (
                <a
                  href={whatsappAlertUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5 fill-white" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.96.524 1.831.799 2.796.8 3.183 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.786-5.769-5.786zm3.364 8.163c-.141.398-.711.758-1.047.818-.335.06-.729.074-2.146-.514-1.637-.68-2.695-2.336-2.776-2.446-.082-.11-1.258-1.674-1.258-3.193 0-1.52.796-2.27 1.078-2.576.282-.307.615-.384.82-.384.205 0 .41.002.59.011.19.009.444-.072.694.529.256.617.873 2.13.95 2.285.077.154.129.334.026.54-.103.205-.154.334-.308.514-.154.18-.324.402-.462.539-.154.153-.314.32-.135.628.18.307.8 1.32 1.716 2.137 1.179 1.05 2.174 1.376 2.482 1.53.308.154.488.128.667-.077.18-.205.77-0.898.975-1.206.205-.308.41-.257.693-.154.282.102 1.795.847 2.103 1.001.308.154.513.23.59.36.077.128.077.744-.064 1.142z" />
                  </svg>
                  WhatsApp Order Chat
                </a>
              )}
              <button
                onClick={() => { clearCart(); navigate('/admin/orders'); }}
                className="flex-1 py-3 px-4 bg-brand-dark-blue hover:bg-brand-dark-blue/90 text-brand-gold rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Go to Admin Panel Orders
              </button>
              <button
                onClick={() => { clearCart(); navigate(`/order-tracking/${confirmedOrderNumber || transactionId}`); }}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Track Order
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Address Validation Modal */}
      <AddressValidationModal
        validationResult={validationResult}
        onEdit={() => setValidationResult(null)}
        onProceedOriginal={() => finalizeProceedToPayment(address)}
        onUseSuggested={(suggested) => finalizeProceedToPayment({ ...address, name: suggested.name || address.name, line1: suggested.street1, line2: suggested.street2 || '', city: suggested.city, state: suggested.state, pincode: suggested.zip, country: suggested.country }, true)}
      />
    </div>
  );
}
