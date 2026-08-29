import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, ShieldCheck, Droplet, Feather } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/useAuthStore';
import logoImg from '../assets/image.png';
import brandLogo from '../assets/logo.png'; // Updated logo for mobile
import { PhoneInput, formatPhone, COUNTRIES, parsePhone } from '../components/PhoneInput';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";


function CountryPicker({ dark, allowedCountries, value, onChange }) {
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const countryDropdownRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target)) setCountryOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isoFlag = (iso) => String.fromCodePoint(...[...iso].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));
  const list = allowedCountries.length > 0 ? COUNTRIES.filter(c => allowedCountries.includes(c.name)) : COUNTRIES;
  const filtered = list.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()));
  const selected = COUNTRIES.find(c => c.name === value);

  return (
    <div ref={countryDropdownRef} className="relative">
      <button
        type="button"
        onClick={() => { setCountryOpen(o => !o); setCountrySearch(''); }}
        className={`w-full flex items-center gap-2 px-4 py-3.5 rounded-xl text-sm border transition-all focus:outline-none ${
          dark
            ? 'bg-transparent border-white/10 text-white focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50'
            : 'bg-white border-brand-gold/20 text-brand-dark-blue focus:ring-2 focus:ring-brand-gold/40'
        }`}
      >
        {selected ? (
          <><span className="text-base leading-none shrink-0">{isoFlag(selected.iso)}</span><span className="flex-1 text-left truncate">{selected.name}</span></>
        ) : (
          <span className={`flex-1 text-left ${dark ? 'text-white/30' : 'text-brand-dark-blue/30'}`}>Select your country</span>
        )}
        <svg className={`w-4 h-4 shrink-0 transition-transform ${countryOpen ? 'rotate-180' : ''} ${dark ? 'text-white/40' : 'text-brand-dark-blue/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {countryOpen && (
        <div className="absolute z-[200] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              value={countrySearch}
              onChange={e => setCountrySearch(e.target.value)}
              placeholder="Search country..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-brand-gold"
            />
          </div>
          <ul className="max-h-52 overflow-y-auto">
            {filtered.map(c => (
              <li key={c.iso}>
                <button
                  type="button"
                  onClick={() => { onChange(c.name); setCountryOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                    value === c.name ? 'bg-brand-gold/10 font-bold text-brand-dark-blue' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-base shrink-0">{isoFlag(c.iso)}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                </button>
              </li>
            ))}
            {filtered.length === 0 && <li className="px-4 py-6 text-center text-sm text-gray-400">No results</li>}
          </ul>
        </div>
      )}
    </div>
  );
}


function OtpInput({ length = 6, value, onChange, className, inputClassName }) {
  const refs = useRef([]);
  
  const handleChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...value];
    next[idx] = val;
    onChange(next);
    if (val && idx < length - 1) {
      refs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !value[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
  };

  return (
    <div className={className}>
      {value.map((digit, idx) => (
        <input 
          key={idx} 
          ref={el => refs.current[idx] = el}
          type="text" inputMode="numeric" maxLength={1} value={digit}
          onChange={e => handleChange(e.target.value, idx)}
          onKeyDown={e => handleKeyDown(e, idx)}
          className={inputClassName}
        />
      ))}
    </div>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signup, verifyPhoneOtp, verifyOtp, googleLogin, loading, error, clearError } = useAuthStore();

  const [step, setStep] = useState('form'); // 'form' | 'phone_otp' | 'email_otp' | 'done' | 'google_extra'
  const [pendingGoogleToken, setPendingGoogleToken] = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', country: '' });
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const pwRules = [
    { label: 'At least 8 characters', ok: form.password.length >= 8 },
    { label: 'At least 1 number', ok: /\d/.test(form.password) },
    { label: 'At least 1 special character', ok: /[^A-Za-z0-9]/.test(form.password) },
  ];
  const passwordValid = pwRules.every(r => r.ok);
  const isFormValid = form.name.trim() !== '' && form.email.trim() !== '' && form.country !== '' && parsePhone(form.phone).number.replace(/\D/g, '').length === 10 && passwordValid && consentAccepted;
  const [phoneOtp, setPhoneOtp] = useState(['', '', '', '', '', '']);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [localError, setLocalError] = useState('');
  const [allowedCountries, setAllowedCountries] = useState([]);


  const isoFlag = (iso) => String.fromCodePoint(...[...iso].map(c => 0x1F1E6 - 65 + c.charCodeAt(0)));

  useEffect(() => {
    fetch(`${BACKEND_URL}/general/shipping`)
      .then(r => r.json())
      .then(d => {
        if (d?.settings?.allowed_countries) {
          setAllowedCountries(d.settings.allowed_countries);
        }
      })
      .catch(console.error);
    return () => clearError();
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSignup = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!consentAccepted) { setLocalError('Please accept the Privacy Policy and Terms of Service to continue.'); return; }
    if (!passwordValid) { setPasswordTouched(true); setLocalError('Password does not meet the requirements.'); return; }
    if (!form.country) { setLocalError('Country field is mandatory.'); return; }
    const parsedPhone = parsePhone(form.phone);
    if (parsedPhone.number.replace(/\D/g, '').length !== 10) {
      setLocalError('Mobile number must be exactly 10 digits.');
      return;
    }
    const res = await signup(form.name, form.email, form.phone, form.password, form.country);
    if (res.success) setStep('email_otp');
    else setLocalError(res.error);
  };

  const handleOtpChange = (val, idx, setter, refs) => {
    if (!/^\d?$/.test(val)) return;
    setter(prev => { const next = [...prev]; next[idx] = val; return next; });
    if (val && idx < 5) refs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (e, idx, otp, refs) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    setLocalError('');
    const code = phoneOtp.join('');
    if (code.length < 6) return setLocalError('Enter all 6 digits');
    const res = await verifyPhoneOtp(form.email, code);
    if (res.success) setStep('email_otp');
    else setLocalError(res.error);
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setLocalError('');
    const code = emailOtp.join('');
    if (code.length < 6) return setLocalError('Enter all 6 digits');
    const res = await verifyOtp(form.email, code);
    if (res.success) { setStep('done'); setTimeout(() => navigate('/'), 2000); }
    else setLocalError(res.error);
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLocalError('');
      setPendingGoogleToken(tokenResponse.access_token);
      setStep('google_extra');
    },
    onError: () => {
      setLocalError('Google Signup Failed');
    },
  });

  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    if (!consentAccepted) { setLocalError('Please accept the Privacy Policy and Terms of Service to continue.'); return; }
    if (!form.country) { setLocalError('Country field is mandatory.'); return; }
    const parsedPhone = parsePhone(form.phone);
    if (parsedPhone.number.replace(/\D/g, '').length !== 10) {
      setLocalError('Mobile number must be exactly 10 digits.');
      return;
    }
    const res = await googleLogin(pendingGoogleToken, form.phone, form.country);
    if (res.success) {
      const authState = useAuthStore.getState();
      await useAuthStore.getState().updateProfile(authState.user?.name, form.phone, form.country);
      navigate(res.role === 'admin' ? '/admin' : '/');
    } else {
      setLocalError(res.error);
    }
  };

  const displayError = localError || error;

  return (
    <>
      {/* DESKTOP VIEW (Unchanged, hidden on mobile) */}
      <div className="hidden lg:flex min-h-screen font-sans">
        {/* Left Panel — Brand Visual */}
        <div className="w-1/2 bg-brand-dark-blue flex flex-col items-center justify-center relative overflow-hidden px-16">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full border border-brand-gold/10"></div>
          <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full border border-brand-gold/10"></div>
          <div className="absolute top-1/3 right-8 w-40 h-40 rounded-full bg-brand-gold/5"></div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="relative z-10 text-center"
          >
            <Link to="/">
              <img src={logoImg} alt="LYDIA GLOBAL EXIM" className="h-28 w-auto object-contain mx-auto mb-10 drop-shadow-xl" />
            </Link>

            <h1 className="text-4xl font-serif font-bold text-white mb-4 leading-tight">
              Join the<br />
              <span style={{ color: '#C6A184' }}>LYDIA GLOBAL EXIM</span><br />
              <span className="text-white">Family</span>
            </h1>
            <div className="w-16 h-1 mx-auto mb-5 rounded-full" style={{ background: '#C6A184' }}></div>
            <p className="text-white/60 text-base leading-relaxed max-w-xs mx-auto">
              Create your account and get exclusive access to our premium Stainless Steel gold plated collections.
            </p>

            <div className="mt-12 space-y-4">
              {[
                { icon: '✨', text: 'Exclusive member-only offers' },
                { icon: '📦', text: 'Easy order tracking & returns' },
                { icon: '💛', text: 'Personalized jewelry picks' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-left">
                  <div className="w-9 h-9 rounded-full bg-brand-gold/10 flex items-center justify-center shrink-0 text-base">{item.icon}</div>
                  <span className="text-white/60 text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6">
              {[
                { icon: <ShieldCheck className="w-5 h-5" style={{ color: '#C6A184' }} strokeWidth={1.5} />, label: 'Tarnish Free' },
                { icon: <Droplet className="w-5 h-5" style={{ color: '#C6A184' }} strokeWidth={1.5} />, label: 'Waterproof' },
                { icon: <Feather className="w-5 h-5" style={{ color: '#C6A184' }} strokeWidth={1.5} />, label: 'Hypoallergenic' },
              ].map(({ icon, label }, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center">{icon}</div>
                  <span className="text-white/50 text-xs text-center">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Panel — Signup Form */}
        <div className="w-1/2 bg-brand-beige flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            {step === 'form' ? (
              <>
                <div className="mb-8">
                  <h4 className="text-brand-gold font-bold tracking-widest uppercase text-xs mb-2">Get Started</h4>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark-blue mb-2">Create Account</h2>
                  <div className="w-14 h-1 bg-brand-gold rounded-full"></div>
                  <p className="text-brand-dark-blue/60 text-sm mt-4">Fill in your details to create your LYDIA GLOBAL EXIM account.</p>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-sm font-semibold text-brand-dark-blue block mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-brand-dark-blue/40 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        name="name" value={form.name} onChange={handleChange} required
                        placeholder="Your full name"
                        className="w-full bg-white border border-brand-gold/20 rounded-xl px-4 py-3.5 pl-11 text-sm text-brand-dark-blue placeholder:text-brand-dark-blue/30 focus:outline-none focus:ring-2 focus:ring-brand-gold/40 transition-shadow"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-sm font-semibold text-brand-dark-blue block mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-brand-dark-blue/40 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        name="email" type="email" value={form.email} onChange={handleChange} required
                        placeholder="you@example.com"
                        className="w-full bg-white border border-brand-gold/20 rounded-xl px-4 py-3.5 pl-11 text-sm text-brand-dark-blue placeholder:text-brand-dark-blue/30 focus:outline-none focus:ring-2 focus:ring-brand-gold/40 transition-shadow"
                      />
                    </div>
                  </div>

                  {/* Country - Desktop */}
                  <div>
                    <label className="text-sm font-semibold text-brand-dark-blue block mb-1.5">Country <span className="text-red-500">*</span></label>
                    <CountryPicker dark={false} allowedCountries={[]} value={form.country} onChange={(val) => setForm(f => ({ ...f, country: val }))} />
                  </div>

                  {/* Phone - Desktop */}
                  <div>
                    <label className="text-sm font-semibold text-brand-dark-blue block mb-1.5">Phone Number</label>
                    <PhoneInput allowedCountries={[]} value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="Phone number" />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-sm font-semibold text-brand-dark-blue block mb-1.5">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-brand-dark-blue/40 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        name="password" type={showPass ? 'text' : 'password'} value={form.password}
                        onChange={handleChange} onBlur={() => setPasswordTouched(true)} required
                        placeholder="Min 8 chars, 1 number, 1 special"
                        className={`w-full bg-white border rounded-xl px-4 py-3.5 pl-11 pr-12 text-sm text-brand-dark-blue placeholder:text-brand-dark-blue/30 focus:outline-none focus:ring-2 transition-shadow ${
                          passwordTouched && !passwordValid ? 'border-red-400 focus:ring-red-200' : 'border-brand-gold/20 focus:ring-brand-gold/40'
                        }`}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-dark-blue/40 hover:text-brand-dark-blue transition-colors">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordTouched && (
                      <div className="mt-2 space-y-1">
                        {pwRules.map((r, i) => (
                          <p key={i} className={`text-xs flex items-center gap-1.5 ${r.ok ? 'text-green-600' : 'text-red-500'}`}>
                            <span>{r.ok ? '✓' : '✗'}</span> {r.label}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Consent */}
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-brand-dark-blue rounded shrink-0" />
                    <span className="text-xs text-brand-dark-blue/70 leading-relaxed">
                      I confirm that I am at least 13 years old, agree to the LYDIA GLOBAL EXIM{' '}
                      <Link to="/terms-of-service" target="_blank" className="font-bold text-brand-dark-blue underline">Terms & Conditions</Link>,
                      and acknowledge the LYDIA GLOBAL EXIM{' '}
                      <Link to="/privacy-policy" target="_blank" className="font-bold text-brand-dark-blue underline">Privacy Policy</Link>.
                    </span>
                  </label>

                  {displayError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 text-center">
                      {displayError}
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" disabled={loading || !isFormValid}
                    className="w-full bg-brand-dark-blue text-brand-gold font-bold py-4 rounded-xl text-sm hover:bg-brand-dark-blue/90 transition-all disabled:opacity-60 mt-2 shadow-lg"
                  >
                    {loading ? 'Sending OTP...' : 'Send OTP & Continue →'}
                  </motion.button>
                </form>

                {/* OR Google */}
                <div className="flex items-center gap-3 w-full my-6">
                  <div className="h-px bg-brand-dark-blue/10 flex-1"></div>
                  <span className="text-brand-dark-blue/40 text-[10px] tracking-wider uppercase">OR</span>
                  <div className="h-px bg-brand-dark-blue/10 flex-1"></div>
                </div>
                
                <button type="button" onClick={() => loginWithGoogle()} className="w-full bg-white border border-brand-dark-blue/10 text-brand-dark-blue font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 text-sm hover:bg-brand-dark-blue/5 transition-colors">
                  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
                  Continue with Google
                </button>
              </>
            ) : step === 'phone_otp' ? (
              <>
                <div className="mb-8">
                  <h4 className="text-brand-gold font-bold tracking-widest uppercase text-xs mb-2">Step 1 of 2</h4>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark-blue mb-2">Verify Mobile</h2>
                  <div className="w-14 h-1 bg-brand-gold rounded-full"></div>
                  <p className="text-brand-dark-blue/60 text-sm mt-4">
                    We sent a 6-digit OTP to <strong className="text-brand-dark-blue">{form.phone}</strong>
                  </p>
                </div>
                <form onSubmit={handleVerifyPhone} className="space-y-6">
                  <OtpInput value={phoneOtp} onChange={setPhoneOtp} className="flex justify-center gap-3" inputClassName="w-12 h-14 text-center text-xl font-bold bg-white border-2 border-brand-gold/20 rounded-xl text-brand-dark-blue focus:outline-none focus:border-brand-gold transition-colors" />
                  {(localError || error) && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 text-center">{localError || error}</div>}
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    type="submit" disabled={loading}
                    className="w-full bg-brand-dark-blue text-brand-gold font-bold py-4 rounded-xl text-sm hover:bg-brand-dark-blue/90 transition-all disabled:opacity-60 shadow-lg">
                    {loading ? 'Verifying...' : 'Verify Mobile →'}
                  </motion.button>
                  <button type="button" onClick={() => setStep('form')} className="w-full text-sm text-brand-dark-blue/50 hover:text-brand-dark-blue transition-colors">← Change details</button>
                </form>
              </>
            ) : step === 'email_otp' ? (
              <>
                <div className="mb-8">
                  <h4 className="text-brand-gold font-bold tracking-widest uppercase text-xs mb-2">Step 2 of 2</h4>
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark-blue mb-2">Verify Email</h2>
                  <div className="w-14 h-1 bg-brand-gold rounded-full"></div>
                  <p className="text-brand-dark-blue/60 text-sm mt-4">
                    We sent a 6-digit OTP to <strong className="text-brand-dark-blue">{form.email}</strong>
                  </p>
                </div>
                <form onSubmit={handleVerifyEmail} className="space-y-6">
                  <OtpInput value={emailOtp} onChange={setEmailOtp} className="flex justify-center gap-3" inputClassName="w-12 h-14 text-center text-xl font-bold bg-white border-2 border-brand-gold/20 rounded-xl text-brand-dark-blue focus:outline-none focus:border-brand-gold transition-colors" />
                  {(localError || error) && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 text-center">{localError || error}</div>}
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                    type="submit" disabled={loading}
                    className="w-full bg-brand-dark-blue text-brand-gold font-bold py-4 rounded-xl text-sm hover:bg-brand-dark-blue/90 transition-all disabled:opacity-60 shadow-lg">
                    {loading ? 'Verifying...' : 'Complete Sign Up →'}
                  </motion.button>
                  <button type="button" onClick={() => setStep('phone_otp')} className="w-full text-sm text-brand-dark-blue/50 hover:text-brand-dark-blue transition-colors">← Back to mobile verification</button>
                </form>
              </>
            ) : step === 'google_extra' ? (
              <>
                <div className="mb-8">
                  <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark-blue mb-2">Almost Done!</h2>
                  <div className="w-14 h-1 bg-brand-gold rounded-full"></div>
                  <p className="text-brand-dark-blue/60 text-sm mt-4">
                    Please provide your phone number and country to complete your Google Sign Up.
                  </p>
                </div>
                <form onSubmit={handleGoogleSubmit} className="space-y-5">
                  {/* Country - Desktop */}
                  <div>
                    <label className="text-sm font-semibold text-brand-dark-blue block mb-1.5">Country <span className="text-red-500">*</span></label>
                    <CountryPicker dark={false} allowedCountries={[]} value={form.country} onChange={(val) => setForm(f => ({ ...f, country: val }))} />
                  </div>

                  {/* Phone - Desktop */}
                  <div>
                    <label className="text-sm font-semibold text-brand-dark-blue block mb-1.5">Phone Number</label>
                    <PhoneInput allowedCountries={[]} value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} placeholder="Phone number" />
                  </div>

                  {/* Consent */}
                  <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                    <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-brand-dark-blue rounded shrink-0" />
                    <span className="text-xs text-brand-dark-blue/70 leading-relaxed">
                      I confirm that I am at least 13 years old, agree to the LYDIA GLOBAL EXIM{' '}
                      <Link to="/terms-of-service" target="_blank" className="font-bold text-brand-dark-blue underline">Terms & Conditions</Link>,
                      and acknowledge the LYDIA GLOBAL EXIM{' '}
                      <Link to="/privacy-policy" target="_blank" className="font-bold text-brand-dark-blue underline">Privacy Policy</Link>.
                    </span>
                  </label>

                  {displayError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 text-center">
                      {displayError}
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" disabled={loading}
                    className="w-full bg-brand-dark-blue text-brand-gold font-bold py-4 rounded-xl text-sm hover:bg-brand-dark-blue/90 transition-all disabled:opacity-60 mt-2 shadow-lg"
                  >
                    {loading ? 'Completing...' : 'Complete Sign Up →'}
                  </motion.button>
                  <button type="button" onClick={() => setStep('form')} className="w-full text-sm text-brand-dark-blue/50 hover:text-brand-dark-blue transition-colors mt-2">← Back</button>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <ShieldCheck className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-serif font-bold text-brand-dark-blue">Account Created!</h2>
                <p className="text-brand-dark-blue/60 text-sm">Redirecting you to the store...</p>
              </div>
            )}

            <p className="text-center text-sm text-brand-dark-blue/60 mt-8">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-brand-dark-blue hover:text-brand-gold transition-colors">
                Sign In
              </Link>
            </p>
          </motion.div>
        </div>
      </div>

      {/* MOBILE VIEW */}
      <div className="lg:hidden min-h-screen bg-[#060B19] font-sans flex flex-col items-center justify-start px-6 py-10 overflow-y-auto">
        {/* Header / Logo */}
        <div className="flex flex-col items-center mt-4">
          <Link to="/">
            <img src={brandLogo} alt="LYDIA GLOBAL EXIM Logo" className="w-24 h-24 object-contain" />
          </Link>
          <span className="font-serif font-bold text-lg tracking-[0.15em] text-[#D4AF37] mt-2 text-center">
            LYDIA GLOBAL EXIM
          </span>
          <span className="text-[#D4AF37] text-[10px] font-bold tracking-widest uppercase mt-6">
            {step === 'form' ? 'Get Started' : step === 'phone_otp' ? 'Step 1 of 2' : step === 'email_otp' ? 'Step 2 of 2' : step === 'google_extra' ? 'Almost Done' : 'Welcome!'}
          </span>
          <p className="text-white/70 text-xs text-center leading-relaxed max-w-[260px] mt-4">
            {step === 'form'
              ? 'Premium Stainless Steel PVD Gold Plated Jewelry — Waterproof, Tarnish-Free, and made for Everyday Luxury.'
              : step === 'phone_otp' ? `OTP sent to ${form.phone}`
              : step === 'email_otp' ? `OTP sent to ${form.email}`
              : step === 'google_extra' ? 'Please complete your details to finish signing up.'
              : 'Your account has been created successfully!'}
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-2 w-full max-w-xs mt-6 mb-6">
          <div className="h-px bg-[#D4AF37]/30 flex-1"></div>
          <div className="w-1.5 h-1.5 rotate-45 bg-[#D4AF37]"></div>
          <div className="h-px bg-[#D4AF37]/30 flex-1"></div>
        </div>

        {step === 'form' ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-4xl font-serif font-bold text-white mb-2">
                Create <span className="text-[#D4AF37]">Account</span>
              </h2>
              <div className="w-8 h-1 bg-[#D4AF37] mx-auto rounded-full mb-3"></div>
              <p className="text-white/50 text-xs">Fill in your details to join.</p>
            </div>

            <form onSubmit={handleSignup} className="w-full max-w-sm space-y-4">
              <div>
                <label className="text-xs font-medium text-white block mb-1.5 pl-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#D4AF37] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    name="name" value={form.name} onChange={handleChange} required
                    placeholder="Your full name"
                    className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3.5 pl-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-white block mb-1.5 pl-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#D4AF37] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    name="email" type="email" value={form.email} onChange={handleChange} required
                    placeholder="you@example.com"
                    className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3.5 pl-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 transition-all"
                  />
                </div>
              </div>

              {/* Country - Mobile */}
              <div className="mb-4">
                <label className="text-xs font-medium text-white block mb-1.5 pl-1">Country <span className="text-red-400">*</span></label>
                <CountryPicker dark={true} allowedCountries={[]} value={form.country} onChange={(val) => setForm(f => ({ ...f, country: val }))} />
              </div>

              {/* Phone - Mobile */}
              <div>
                <label className="text-xs font-medium text-white block mb-1.5 pl-1">Phone Number</label>
                <PhoneInput 
                  allowedCountries={[]} 
                  value={form.phone} 
                  onChange={v => setForm(f => ({ ...f, phone: v }))} 
                  placeholder="Phone number" 
                  dark 
                  pattern="[0-9]{10,}" 
                  title="Please enter a valid phone number with at least 10 digits"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-white block mb-1.5 pl-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#D4AF37] absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    name="password" type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={handleChange} onBlur={() => setPasswordTouched(true)} required
                    placeholder="Min 8 chars, 1 number, 1 special"
                    className={`w-full bg-transparent border rounded-xl px-4 py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 transition-all ${
                      passwordTouched && !passwordValid ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30' : 'border-white/10 focus:border-[#D4AF37]/50 focus:ring-[#D4AF37]/50'
                    }`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordTouched && (
                  <div className="mt-2 space-y-1">
                    {pwRules.map((r, i) => (
                      <p key={i} className={`text-xs flex items-center gap-1.5 ${r.ok ? 'text-green-400' : 'text-red-400'}`}>
                        <span>{r.ok ? '✓' : '✗'}</span> {r.label}
                      </p>
                    ))}
                  </div>
                )}
              </div>

              {/* Consent - Mobile */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#D4AF37] rounded shrink-0" />
                <span className="text-[11px] text-white/60 leading-relaxed">
                  I confirm that I am at least 13 years old, agree to the LYDIA GLOBAL EXIM{' '}
                  <Link to="/terms-of-service" target="_blank" className="text-[#D4AF37] font-bold underline">Terms & Conditions</Link>,
                  and acknowledge the LYDIA GLOBAL EXIM{' '}
                  <Link to="/privacy-policy" target="_blank" className="text-[#D4AF37] font-bold underline">Privacy Policy</Link>.
                </span>
              </label>

              {displayError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 text-center">
                  {displayError}
                </div>
              )}

              <button
                type="submit" disabled={loading || !isFormValid}
                className="w-full bg-gradient-to-r from-[#e3c162] to-[#b38827] text-black font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-60 mt-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
              >
                {loading ? 'Sending OTP...' : 'Send OTP & Continue →'}
              </button>
            </form>

            {/* OR Google */}
            <div className="flex items-center gap-3 w-full max-w-sm my-6">
              <div className="h-px bg-white/10 flex-1"></div>
              <span className="text-white/40 text-[10px] tracking-wider uppercase">OR</span>
              <div className="h-px bg-white/10 flex-1"></div>
            </div>

            <button type="button" onClick={() => loginWithGoogle()} className="w-full max-w-sm bg-white text-black font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 text-sm hover:bg-gray-100 transition-colors">
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
              Continue with Google
            </button>
          </>
        ) : step === 'phone_otp' ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-4xl font-serif font-bold text-white mb-2">Verify <span className="text-[#D4AF37]">Mobile</span></h2>
              <div className="w-8 h-1 bg-[#D4AF37] mx-auto rounded-full mb-3"></div>
            </div>
            <form onSubmit={handleVerifyPhone} className="w-full max-w-sm space-y-6">
              <OtpInput value={phoneOtp} onChange={setPhoneOtp} className="flex justify-center gap-2" inputClassName="w-10 h-12 text-center text-xl font-bold bg-transparent border border-white/20 rounded-xl text-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all" />
              {(localError || error) && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 text-center">{localError || error}</div>}
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-[#e3c162] to-[#b38827] text-black font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-60 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                {loading ? 'Verifying...' : 'Verify Mobile →'}
              </button>
              <button type="button" onClick={() => setStep('form')} className="w-full text-sm text-white/50 hover:text-white transition-colors">← Change details</button>
            </form>
          </>
        ) : step === 'email_otp' ? (
          <>
            <div className="text-center mb-8">
              <h2 className="text-4xl font-serif font-bold text-white mb-2">Verify <span className="text-[#D4AF37]">Email</span></h2>
              <div className="w-8 h-1 bg-[#D4AF37] mx-auto rounded-full mb-3"></div>
            </div>
            <form onSubmit={handleVerifyEmail} className="w-full max-w-sm space-y-4">
              <OtpInput value={emailOtp} onChange={setEmailOtp} className="flex justify-center gap-2" inputClassName="w-11 h-12 text-center text-xl font-bold bg-transparent border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-[#D4AF37] transition-colors" />
              {(localError || error) && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 text-center">{localError || error}</div>}
              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-[#e3c162] to-[#b38827] text-black font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-60 mt-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
                {loading ? 'Verifying...' : 'Complete Sign Up →'}
              </button>
              <button type="button" onClick={() => setStep('phone_otp')} className="w-full text-sm text-white/50 mt-4">← Back to mobile verification</button>
            </form>
          </>
        ) : step === 'google_extra' ? (
          <>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">Almost Done!</h2>
            <div className="w-12 h-1 bg-[#C6A184] rounded-full mb-6"></div>
            <p className="text-white/70 text-sm mb-6">
              Please provide your phone number and country.
            </p>

            <form onSubmit={handleGoogleSubmit} className="space-y-4">
              {/* Country - Mobile */}
              <div className="mb-4">
                <label className="text-xs font-medium text-white block mb-1.5 pl-1">Country <span className="text-red-400">*</span></label>
                <CountryPicker dark={true} allowedCountries={[]} value={form.country} onChange={(val) => setForm(f => ({ ...f, country: val }))} />
              </div>

              {/* Phone - Mobile */}
              <div className="mb-4">
                <label className="text-xs font-medium text-white block mb-1.5 pl-1">Phone Number</label>
                <PhoneInput 
                  allowedCountries={[]} 
                  value={form.phone} 
                  onChange={v => setForm(f => ({ ...f, phone: v }))} 
                  placeholder="Phone number" 
                  dark 
                  pattern="[0-9]{10,}" 
                  title="Please enter a valid phone number with at least 10 digits"
                />
              </div>

              {/* Consent - Mobile */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-2">
                <input type="checkbox" checked={consentAccepted} onChange={e => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#D4AF37] rounded shrink-0" />
                <span className="text-[11px] text-white/60 leading-relaxed">
                  I confirm that I am at least 13 years old, agree to the LYDIA GLOBAL EXIM{' '}
                  <Link to="/terms-of-service" target="_blank" className="text-[#D4AF37] font-bold underline">Terms & Conditions</Link>,
                  and acknowledge the LYDIA GLOBAL EXIM{' '}
                  <Link to="/privacy-policy" target="_blank" className="text-[#D4AF37] font-bold underline">Privacy Policy</Link>.
                </span>
              </label>

              {displayError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 text-center">
                  {displayError}
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-[#e3c162] to-[#b38827] text-black font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-60 mt-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
              >
                {loading ? 'Completing...' : 'Complete Sign Up →'}
              </button>
              <button type="button" onClick={() => setStep('form')} className="w-full text-sm text-white/50 mt-4">← Back</button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white">Account Created!</h2>
            <p className="text-white/50 text-sm">Redirecting you to the store...</p>
          </div>
        )}

        <p className="text-center text-xs text-white/50 mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-[#D4AF37] hover:text-white transition-colors">
            Sign In
          </Link>
        </p>

        {/* Bottom Badges */}
        <div className="flex justify-between w-full max-w-sm mt-12 mb-4 px-2">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border border-[#D4AF37]/30 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.5} />
            </div>
            <span className="text-white text-[10px]"> Tarnish Free</span>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border border-[#D4AF37]/30 flex items-center justify-center">
              <Droplet className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.5} />
            </div>
            <span className="text-white text-[10px]">Waterproof</span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full border border-[#D4AF37]/30 flex items-center justify-center">
              <Feather className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.5} />
            </div>
            <span className="text-white text-[10px]">Hypoallergenic</span>
          </div>
        </div>
      </div>
    </>
  );
}
