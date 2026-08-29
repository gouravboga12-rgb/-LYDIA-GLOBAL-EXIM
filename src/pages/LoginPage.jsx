import React, { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ShieldCheck, Droplet, Feather, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/useAuthStore';
import logoImg from '../assets/image.png';
import brandLogo from '../assets/logo.png';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

function ForgotPassword({ onBack, dark = false }) {
  const [step, setStep] = useState('email'); // email | otp | password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const otpRefs = useRef([]);

  const inputCls = dark
    ? 'w-full bg-transparent border border-white/10 rounded-xl px-4 py-3.5 pl-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 transition-all'
    : 'w-full bg-white border border-brand-gold/20 rounded-xl px-4 py-3.5 pl-11 text-sm text-brand-dark-blue placeholder:text-brand-dark-blue/30 focus:outline-none focus:ring-2 focus:ring-brand-gold/40 transition-shadow';
  const labelCls = dark ? 'text-xs font-medium text-white block mb-1.5' : 'text-sm font-semibold text-brand-dark-blue block mb-1.5';
  const btnCls = dark
    ? 'w-full bg-gradient-to-r from-[#e3c162] to-[#b38827] text-black font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-60 shadow-[0_0_15px_rgba(212,175,55,0.2)]'
    : 'w-full bg-brand-dark-blue text-brand-gold font-bold py-4 rounded-xl text-sm hover:bg-brand-dark-blue/90 transition-all disabled:opacity-60 shadow-lg';
  const errCls = dark
    ? 'bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 text-center'
    : 'bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-600 text-center';

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep('otp');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return setError('Enter all 6 digits');
    setStep('password');
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const pwRules = [
      { ok: newPassword.length >= 8, msg: 'Min 8 characters' },
      { ok: /\d/.test(newPassword), msg: 'At least 1 number' },
      { ok: /[^A-Za-z0-9]/.test(newPassword), msg: 'At least 1 special character' },
    ];
    const failedRule = pwRules.find(r => !r.ok);
    if (failedRule) {
      setError(`Password requirements: ${failedRule.msg}`);
      return;
    }

    setLoading(true); setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otp.join(''), newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess('Password reset successfully! You can now sign in.');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val; setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };
  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  if (success) return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-3xl">✓</span>
      </div>
      <p className={`text-sm font-semibold ${dark ? 'text-green-400' : 'text-green-600'}`}>{success}</p>
      <button onClick={onBack} className={btnCls}>Back to Sign In</button>
    </div>
  );

  return (
    <div className="space-y-5">
      <button onClick={onBack} className={`flex items-center gap-1.5 text-xs font-semibold mb-2 ${dark ? 'text-white/50 hover:text-white' : 'text-brand-dark-blue/50 hover:text-brand-dark-blue'} transition-colors`}>
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
      </button>

      <div>
        <h4 className={`font-bold tracking-widest uppercase text-xs mb-1 ${dark ? 'text-[#D4AF37]' : 'text-brand-gold'}`}>Reset Password</h4>
        <h2 className={`text-2xl font-serif font-bold mb-1 ${dark ? 'text-white' : 'text-brand-dark-blue'}`}>
          {step === 'email' ? 'Forgot Password' : step === 'otp' ? 'Verify OTP' : 'New Password'}
        </h2>
        <p className={`text-xs ${dark ? 'text-white/50' : 'text-brand-dark-blue/60'}`}>
          {step === 'email' ? 'Enter your email to receive a reset OTP.' : step === 'otp' ? `OTP sent to ${email} and your phone.` : 'Enter your new password.'}
        </p>
      </div>

      {step === 'email' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className={labelCls}>Email Address</label>
            <div className="relative">
              <Mail className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 ${dark ? 'text-[#D4AF37]' : 'text-brand-dark-blue/40'}`} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
            </div>
          </div>
          {error && <p className={errCls}>{error}</p>}
          <button type="submit" disabled={loading} className={btnCls}>{loading ? 'Sending OTP...' : 'Send OTP →'}</button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="flex justify-center gap-2">
            {otp.map((digit, idx) => (
              <input key={idx} ref={el => otpRefs.current[idx] = el}
                type="text" inputMode="numeric" maxLength={1} value={digit}
                onChange={e => handleOtpChange(e.target.value, idx)}
                onKeyDown={e => handleOtpKeyDown(e, idx)}
                className={`w-10 h-12 text-center text-xl font-bold rounded-xl border-2 focus:outline-none transition-colors ${dark ? 'bg-transparent border-white/20 text-white focus:border-[#D4AF37]' : 'bg-white border-brand-gold/20 text-brand-dark-blue focus:border-brand-gold'
                  }`}
              />
            ))}
          </div>
          {error && <p className={errCls}>{error}</p>}
          <button type="submit" className={btnCls}>Verify OTP →</button>
          <button type="button" onClick={() => { setStep('email'); setOtp(['', '', '', '', '', '']); }}
            className={`w-full text-xs ${dark ? 'text-white/40 hover:text-white' : 'text-brand-dark-blue/40 hover:text-brand-dark-blue'} transition-colors`}>
            Resend OTP
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className={labelCls}>New Password</label>
            <div className="relative">
              <Lock className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 ${dark ? 'text-[#D4AF37]' : 'text-brand-dark-blue/40'}`} />
              <input type={showPass ? 'text' : 'password'} required minLength={8} value={newPassword}
                onChange={e => setNewPassword(e.target.value)} placeholder="Min 8 chars, 1 num, 1 special" className={`${inputCls} pr-12`} />
              <button type="button" onClick={() => setShowPass(p => !p)}
                className={`absolute right-4 top-1/2 -translate-y-1/2 ${dark ? 'text-[#D4AF37]' : 'text-brand-dark-blue/40'}`}>
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          {error && <p className={errCls}>{error}</p>}
          <button type="submit" disabled={loading} className={btnCls}>{loading ? 'Resetting...' : 'Reset Password →'}</button>
        </form>
      )}
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const { login, googleLogin, loading, error } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [localError, setLocalError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    const res = await login(form.email, form.password);
    if (res.success) navigate(res.role === 'admin' ? '/admin' : redirect);
    else setLocalError(res.error);
  };

  const handleGoogleSuccess = async (tokenResponse) => {
    setLocalError('');
    const res = await googleLogin(tokenResponse.access_token || tokenResponse.credential || tokenResponse.id_token);
    // Note: useGoogleLogin with flow: 'implicit' gives access_token. We can use googleAuth if it accepts id_token or access_token.
    // To get id_token, we should use standard credentialResponse from GoogleLogin, OR use implicit flow but backend needs userinfo endpoint.
    // Wait, the backend verifyIdToken expects an id_token!
    // So we should NOT use `useGoogleLogin` which only gives access_token unless we use flow: 'auth-code'.
    // Actually, `useGoogleLogin` with flow default gives an access token.
    // Let me revise this. I'll use `GoogleLogin` component if I want idToken easily, OR I can use `useGoogleLogin` and fetch user info on frontend and pass it, OR better yet, just use `googleAuth(tokenResponse.credential)` if I use the bare `GoogleLogin` component, OR I can just use `google-auth-library` verifyIdToken if I can get the id_token.
    // Let's use `useGoogleLogin` with `flow: 'implicit'` but wait! We can just fetch user info on the frontend and send it to our backend, or even better, if we need idToken, we can use `window.google.accounts.oauth2` or just use the `<GoogleLogin />` component. Since we have custom buttons, `useGoogleLogin` is required.
    // Wait! `useGoogleLogin` DOES NOT return an `id_token`. It only returns an `access_token`. The backend `verifyIdToken` requires an `id_token`.
    // Instead of `verifyIdToken` in backend, I can fetch `https://www.googleapis.com/oauth2/v3/userinfo` with the `access_token`!
    // That's much easier for custom buttons. Let's change backend to accept `accessToken` instead.
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLocalError('');
      // Send access_token to backend
      const res = await googleLogin(tokenResponse.access_token);
      if (res.success) navigate(res.role === 'admin' ? '/admin' : redirect);
      else setLocalError(res.error);
    },
    onError: () => {
      setLocalError('Google Login Failed');
    },
  });

  const displayError = localError || error;

  return (
    <>
      {/* DESKTOP VIEW (Unchanged, hidden on mobile) */}
      <div className="hidden lg:flex min-h-screen font-sans">
        {/* Left Panel — Brand Visual */}
        <div className="w-1/2 bg-brand-dark-blue flex flex-col items-center justify-center relative overflow-hidden px-16">
          {/* Decorative circles */}
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
              Welcome to<br />
              <span style={{ color: '#C6A184' }}>LYDIA GLOBAL EXIM</span>
            </h1>
            <div className="w-16 h-1" style={{ background: '#C6A184', borderRadius: 99, margin: '0 auto 20px' }}></div>
            <p className="text-white/60 text-base leading-relaxed max-w-xs mx-auto">
              Premium Stainless Steel PVD Gold Plated Jewelry — Waterproof, Tarnish-Free, and made for Everyday Luxury.
            </p>

            {/* Trust badges */}
            <div className="mt-12 grid grid-cols-3 gap-6">
              {[
                { icon: <ShieldCheck className="w-5 h-5" style={{ color: '#C6A184' }} strokeWidth={1.5} />, label: 'Tarnish Free' },
                { icon: <Droplet className="w-5 h-5" style={{ color: '#C6A184' }} strokeWidth={1.5} />, label: 'Waterproof' },
                { icon: <Feather className="w-5 h-5" style={{ color: '#C6A184' }} strokeWidth={1.5} />, label: 'Hypoallergenic' },
              ].map(({ icon, label }, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center">
                    {icon}
                  </div>
                  <span className="text-white/50 text-xs text-center">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Panel — Login Form */}
        <div className="w-1/2 bg-brand-beige flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="w-full max-w-md"
          >
            {/* Heading */}
            <div className="mb-8">
              <h4 className="text-brand-gold font-bold tracking-widest uppercase text-xs mb-2">Welcome Back</h4>
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-brand-dark-blue mb-2">Sign In</h2>
              <div className="w-14 h-1 bg-brand-gold rounded-full"></div>
              <p className="text-brand-dark-blue/60 text-sm mt-4">Enter your credentials to access your account.</p>
            </div>

            {showForgot ? (
              <ForgotPassword onBack={() => setShowForgot(false)} dark={false} />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
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

                {/* Password */}
                <div>
                  <label className="text-sm font-semibold text-brand-dark-blue block mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-brand-dark-blue/40 absolute left-4 top-1/2 -translate-y-1/2" />
                    <input
                      name="password" type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={handleChange} required
                      placeholder="Your password"
                      className="w-full bg-white border border-brand-gold/20 rounded-xl px-4 py-3.5 pl-11 pr-12 text-sm text-brand-dark-blue placeholder:text-brand-dark-blue/30 focus:outline-none focus:ring-2 focus:ring-brand-gold/40 transition-shadow"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-dark-blue/40 hover:text-brand-dark-blue transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

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
                  {loading ? 'Signing in...' : 'Sign In →'}
                </motion.button>
                <button type="button" onClick={() => setShowForgot(true)}
                  className="w-full text-center text-xs text-brand-dark-blue/50 hover:text-brand-dark-blue transition-colors mt-1">
                  Forgot Password?
                </button>
              </form>
            )}

            {/* OR Google */}
            <div className="flex items-center gap-3 w-full my-6">
              <div className="h-px bg-brand-dark-blue/10 flex-1"></div>
              <span className="text-brand-dark-blue/40 text-[10px] tracking-wider uppercase">OR</span>
              <div className="h-px bg-brand-dark-blue/10 flex-1"></div>
            </div>

            <button type="button" onClick={() => loginWithGoogle()} className="w-full bg-white border border-brand-dark-blue/10 text-brand-dark-blue font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 text-sm hover:bg-brand-dark-blue/5 transition-colors">
              <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" /><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" /><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" /><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" /></g></svg>
              Continue with Google
            </button>

            <p className="text-center text-sm text-brand-dark-blue/60 mt-8">
              Don't have an account?{' '}
              <Link to="/signup" className="font-bold text-brand-dark-blue hover:text-brand-gold transition-colors">
                Create Account
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
            Welcome Back
          </span>
          <p className="text-white/70 text-xs text-center leading-relaxed max-w-[260px] mt-4">
            Premium Stainless Steel PVD Gold Plated Jewelry — Waterproof, Tarnish-Free, and made for Everyday Luxury.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center justify-center gap-2 w-full max-w-xs mt-6 mb-6">
          <div className="h-px bg-[#D4AF37]/30 flex-1"></div>
          <div className="w-1.5 h-1.5 rotate-45 bg-[#D4AF37]"></div>
          <div className="h-px bg-[#D4AF37]/30 flex-1"></div>
        </div>

        {/* Sign In Heading */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-serif font-bold text-white mb-2">
            Sign <span className="text-[#D4AF37]">In</span>
          </h2>
          <div className="w-8 h-1 bg-[#D4AF37] mx-auto rounded-full mb-3"></div>
          <p className="text-white/50 text-xs">Enter your credentials to access your account.</p>
        </div>

        {/* Form */}
        {showForgot ? (
          <div className="w-full max-w-sm">
            <ForgotPassword onBack={() => setShowForgot(false)} dark={true} />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
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

            <div>
              <label className="text-xs font-medium text-white block mb-1.5 pl-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#D4AF37] absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  name="password" type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={handleChange} required
                  placeholder="Your password"
                  className="w-full bg-transparent border border-white/10 rounded-xl px-4 py-3.5 pl-11 pr-12 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/50 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37] hover:text-[#D4AF37]/80 transition-colors">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {displayError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs text-red-400 text-center">
                {displayError}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-[#e3c162] to-[#b38827] text-black font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-60 mt-4 shadow-[0_0_15px_rgba(212,175,55,0.2)]"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
            <button type="button" onClick={() => setShowForgot(true)}
              className="w-full text-center text-xs text-white/40 hover:text-white transition-colors mt-1">
              Forgot Password?
            </button>
          </form>
        )}

        {/* OR Google */}
        <div className="flex items-center gap-3 w-full max-w-sm my-6">
          <div className="h-px bg-white/10 flex-1"></div>
          <span className="text-white/40 text-[10px] tracking-wider uppercase">OR</span>
          <div className="h-px bg-white/10 flex-1"></div>
        </div>

        <button type="button" onClick={() => loginWithGoogle()} className="w-full max-w-sm bg-white text-black font-semibold py-3.5 rounded-xl flex items-center justify-center gap-3 text-sm hover:bg-gray-100 transition-colors">
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" /><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" /><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" /><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" /></g></svg>
          Continue with Google
        </button>

        <p className="text-center text-xs text-white/50 mt-8">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#D4AF37] hover:text-white transition-colors">
            Create Account
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
