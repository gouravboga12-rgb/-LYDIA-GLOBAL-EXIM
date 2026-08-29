import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  Menu, Search, Heart, ShoppingBag, ShoppingCart, ArrowLeft, Share2,
  User, LogIn, Package, MapPin, LayoutDashboard, LogOut,
  Settings, Shield, ChevronDown, X, Globe, Phone, Mail, Sparkles
} from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useStoreData } from '../store/useStoreData';
import headerLogo from '../assets/header_logo.png';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";

function AvatarDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const items = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Package, label: 'My Orders', path: '/my-orders' },
    { icon: MapPin, label: 'My Addresses', path: '/my-addresses' },
    { icon: Heart, label: 'Wishlist', path: '/wishlist' },
    { icon: Settings, label: 'Account Settings', path: '/account-settings' },
  ];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex flex-col items-center group cursor-pointer">
        <div className="w-8 h-8 rounded-full bg-[#2A0845] text-[#D4AF37] text-xs font-bold flex items-center justify-center border border-[#D4AF37]/50 shadow-sm group-hover:bg-[#3b0764] transition-all">
          {initials}
        </div>
        <span className="text-[10px] font-semibold text-[#2A0845] mt-0.5 tracking-wider uppercase">Account</span>
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-56 bg-[#2A0845] rounded-xl shadow-2xl border border-[#D4AF37]/30 py-2 z-[100] text-white">
          <div className="px-4 py-3 border-b border-[#D4AF37]/20">
            <p className="text-sm font-bold text-[#D4AF37] truncate">{user?.name}</p>
            <p className="text-[11px] text-gray-300 truncate">{user?.email}</p>
          </div>

          {items.map(({ icon: Icon, label, path }) => (
            <button key={path} onClick={() => { navigate(path); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-200 hover:bg-[#3b0764] hover:text-[#D4AF37] transition-colors text-left">
              <Icon className="w-4 h-4 shrink-0 text-[#D4AF37]" />
              {label}
            </button>
          ))}

          <div className="border-t border-[#D4AF37]/20 mt-1">
            <button onClick={() => { onLogout(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-950/40 transition-colors">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { products } = useStoreData();
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQ('');
    }
  }, [isOpen]);

  const trimmed = q.trim().toLowerCase();
  const results = trimmed
    ? products.filter(p =>
        p.name?.toLowerCase().includes(trimmed) ||
        p.category?.toLowerCase().includes(trimmed) ||
        String(p.code || '').toLowerCase().includes(trimmed) ||
        (p.variants && p.variants.some(v => 
          String(v.code || '').toLowerCase().includes(trimmed) || 
          (v.sizes && v.sizes.some(s => String(s.code || '').toLowerCase().includes(trimmed)))
        ))
      ).slice(0, 8)
    : [];

  const handleSelect = (product) => {
    onClose();
    navigate(`/product/${product.id}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && trimmed) {
      onClose();
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
    if (e.key === 'Escape') onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex flex-col items-center justify-start pt-20 px-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          className="relative w-full max-w-2xl bg-[#FAEDE4] rounded-2xl shadow-2xl border border-[#2A0845]/20 overflow-hidden z-10"
        >
          <div className="p-4 bg-[#2A0845] flex items-center gap-3">
            <Search className="w-5 h-5 text-[#D4AF37] shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search products, collections, jewellery..."
              className="flex-1 bg-transparent text-white placeholder-gray-400 text-base focus:outline-none"
            />
            {q && (
              <button onClick={() => setQ('')} className="text-gray-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="text-[#D4AF37] hover:text-white text-sm font-semibold ml-2">
              Close
            </button>
          </div>

          {trimmed && (
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {results.length > 0 ? (
                <div>
                  <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#2A0845]/60">
                    Products ({results.length})
                  </div>
                  {results.map(p => {
                    const img = p.variants?.[0]?.images?.[0] || p.image_url;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelect(p)}
                        className="flex items-center gap-4 w-full p-3 hover:bg-white/80 rounded-xl transition-colors text-left border-b border-[#2A0845]/5 last:border-0"
                      >
                        {img && <img src={img} alt={p.name} className="w-12 h-12 rounded-lg object-cover border border-[#D4AF37]/30 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#2A0845] truncate">{p.name}</p>
                          <p className="text-xs text-[#2A0845]/60">{p.category}</p>
                        </div>
                        {p.price && (
                          <div className="text-sm font-bold text-[#2A0845]">
                            ₹{p.price}
                          </div>
                        )}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => { onClose(); navigate(`/search?q=${encodeURIComponent(trimmed)}`); }}
                    className="w-full text-center text-xs font-bold text-[#2A0845] bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 py-3 mt-2 rounded-xl transition-colors uppercase tracking-wider"
                  >
                    See all results for "{q}" →
                  </button>
                </div>
              ) : (
                <div className="py-12 text-center text-[#2A0845]/60">
                  <p className="text-sm">No products found for "{q}"</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export function Header({ variant = 'default', title, showShare = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [mobileOffersOpen, setMobileOffersOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  const { products, categories, offers } = useStoreData();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((acc, item) => acc + item.qty, 0);

  const wishlistItems = useWishlistStore((state) => state.items);
  const wishlistCount = wishlistItems ? wishlistItems.length : 0;

  const { token, user, logout, fetchProfile } = useAuthStore();
  const [announcement, setAnnouncement] = useState(null);

  useEffect(() => {
    if (token && !user) fetchProfile();
  }, [token]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/general/settings/announcement`)
      .then(r => r.json())
      .then(d => {
        if (d.announcement) setAnnouncement(d.announcement);
      })
      .catch(console.error);
  }, []);

  const handleLogout = () => { logout(); navigate('/'); };

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Categories', to: '#', isDropdown: true },
    { label: 'Sale', to: '#', isDropdown: true },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ];

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 25) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentPath = location.pathname;

  return (
    <>
      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />

      {/* TOP ANNOUNCEMENT / INFO BAR (Matching WhatsApp Reference - Scrolls away naturally) */}
      <div className="w-full bg-[#2A0845] text-white text-[11px] md:text-xs py-2 px-4 md:px-12 border-b border-[#D4AF37]/20 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium text-[#FAF5EE]">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span>Welcome to Lydia Global Exim</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-medium text-[#FAF5EE]">
            <Globe className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
            <span>Worldwide Shipping</span>
          </div>

          <div className="flex items-center gap-4 md:gap-6 font-medium text-[#FAF5EE]">
            <a href="tel:9014863411" className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors">
              <Phone className="w-3 h-3 text-[#D4AF37] shrink-0" />
              <span>+91 9014863411</span>
            </a>
            <a href="mailto:lydiaglobalexim@gmail.com" className="hidden md:flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors">
              <Mail className="w-3 h-3 text-[#D4AF37] shrink-0" />
              <span>lydiaglobalexim@gmail.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── STICKY COMPACTING HEADER CONTAINER (Sticks to screen & compresses on scroll) ──── */}
      <div className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'shadow-xl' : 'shadow-sm'}`}>
        
        {/* MAIN HEADER SECTION (Cream background with Centered Logo, Search, Account, Wishlist, Cart) */}
        <header className={`w-full bg-[#FAEDE4]/98 backdrop-blur-md border-b border-[#2A0845]/10 px-4 md:px-10 lg:px-16 transition-all duration-300 ${
          isScrolled ? 'py-1.5 md:py-2' : 'py-2.5 md:py-3.5'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            
            {/* Left: Hamburger menu toggle */}
            <div className="flex items-center w-1/4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open Navigation Menu"
                className="p-1.5 -ml-2 rounded-lg text-[#2A0845] hover:text-[#B38827] hover:bg-[#2A0845]/5 transition-colors cursor-pointer"
              >
                <Menu className={`transition-all duration-300 ${isScrolled ? 'w-6 h-6 md:w-7 md:h-7' : 'w-7 h-7 md:w-8 md:h-8'}`} strokeWidth={1.75} />
              </button>
            </div>

            {/* Center: Brand Logo (Compresses when scrolling down) */}
            <div className="flex items-center justify-center w-2/4">
              <Link to="/" className="flex flex-col items-center group">
                <img
                  src={headerLogo}
                  alt="LYDIA GLOBAL EXIM"
                  className={`w-auto object-contain mix-blend-multiply transition-all duration-300 group-hover:scale-102 ${
                    isScrolled ? 'h-10 xs:h-12 sm:h-14 md:h-16' : 'h-14 xs:h-18 sm:h-22 md:h-26'
                  }`}
                />
              </Link>
            </div>

            {/* Right: Search, Profile/Login, Wishlist, Cart */}
            <div className="flex items-center justify-end gap-3 md:gap-5 w-1/4">
              
              {/* Search Icon */}
              <button
                onClick={() => setSearchModalOpen(true)}
                aria-label="Search"
                className="p-1.5 text-[#2A0845] hover:text-[#B38827] transition-colors cursor-pointer"
              >
                <Search className={`transition-all duration-300 ${isScrolled ? 'w-5 h-5' : 'w-5 h-5 md:w-6 md:h-6'}`} strokeWidth={1.6} />
              </button>

              {/* Profile / Account */}
              {token ? (
                <AvatarDropdown user={user} onLogout={handleLogout} />
              ) : (
                <Link to="/login" className="flex flex-col items-center text-[#2A0845] hover:text-[#B38827] transition-colors">
                  <User className={`transition-all duration-300 ${isScrolled ? 'w-5 h-5' : 'w-5 h-5 md:w-6 md:h-6'}`} strokeWidth={1.6} />
                  <span className={`hidden md:block text-[9px] font-semibold tracking-wider uppercase transition-all duration-300 ${isScrolled ? 'hidden' : 'mt-0.5'}`}>Account</span>
                </Link>
              )}

              {/* Wishlist Icon with Label & Badge */}
              <Link to="/wishlist" className="flex flex-col items-center text-[#2A0845] hover:text-[#B38827] transition-colors relative">
                <div className="relative">
                  <Heart className={`transition-all duration-300 ${isScrolled ? 'w-5 h-5' : 'w-5 h-5 md:w-6 md:h-6'}`} strokeWidth={1.6} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#2A0845] text-[#D4AF37] text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-[#FAEDE4]">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className={`hidden md:block text-[9px] font-semibold tracking-wider uppercase transition-all duration-300 ${isScrolled ? 'hidden' : 'mt-0.5'}`}>Wishlist</span>
              </Link>

              {/* Cart Icon with Label & Badge */}
              <Link to="/cart" className="flex flex-col items-center text-[#2A0845] hover:text-[#B38827] transition-colors relative">
                <div className="relative">
                  <ShoppingBag className={`transition-all duration-300 ${isScrolled ? 'w-5 h-5' : 'w-5 h-5 md:w-6 md:h-6'}`} strokeWidth={1.6} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#2A0845] text-[#D4AF37] text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-[#FAEDE4]">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className={`hidden md:block text-[9px] font-semibold tracking-wider uppercase transition-all duration-300 ${isScrolled ? 'hidden' : 'mt-0.5'}`}>Cart ({cartCount})</span>
              </Link>
            </div>
          </div>
        </header>

        {/* BOTTOM NAVIGATION RIBBON (Royal Purple Pages Menu - Desktop Only) */}
        <nav className={`hidden md:block w-full bg-[#2A0845] text-white px-4 md:px-8 border-b border-[#D4AF37]/20 shadow-md transition-all duration-300 ${
          isScrolled ? 'py-1.5' : 'py-2.5'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-6 sm:gap-8 md:gap-12 flex-wrap">
            
            {/* HOME */}
            <Link
              to="/"
              className={`text-xs md:text-sm font-semibold tracking-[0.14em] uppercase transition-all py-1 border-b-2 ${
                currentPath === '/' ? 'text-[#D4AF37] border-[#D4AF37]' : 'text-white/90 border-transparent hover:text-[#D4AF37]'
              }`}
            >
              HOME
            </Link>

            {/* CATEGORIES */}
            <div className="relative group">
              <div className="flex items-center cursor-pointer py-1 text-xs md:text-sm font-semibold tracking-[0.14em] uppercase text-white/90 group-hover:text-[#D4AF37] transition-colors">
                <span>CATEGORIES</span>
                <ChevronDown className="w-3.5 h-3.5 ml-1 text-white/80 group-hover:text-[#D4AF37] transition-transform group-hover:-rotate-180" />
              </div>
              {categories && categories.length > 0 && (
                <div className="absolute top-[100%] left-1/2 -translate-x-1/2 hidden group-hover:block w-52 bg-[#2A0845] rounded-xl shadow-2xl py-2 z-[100] border border-[#D4AF37]/30 mt-1">
                  <div className="w-full h-2 bg-transparent absolute -top-2 left-0" />
                  <Link to="/category/all" className="block px-4 py-2.5 text-xs font-bold text-[#D4AF37] hover:bg-[#3b0764] transition-colors uppercase tracking-wider">
                    All Categories
                  </Link>
                  {categories.map((cat) => (
                    <Link key={cat.id} to={`/category/${cat.id}`} className="block px-4 py-2 text-xs font-medium text-gray-200 hover:bg-[#3b0764] hover:text-[#D4AF37] transition-colors">
                      {cat.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* SALE / OFFERS */}
            <div className="relative group">
              <div className="flex items-center cursor-pointer py-1 text-xs md:text-sm font-semibold tracking-[0.14em] uppercase text-white/90 group-hover:text-[#D4AF37] transition-colors">
                <span>SALE</span>
                <ChevronDown className="w-3.5 h-3.5 ml-1 text-white/80 group-hover:text-[#D4AF37] transition-transform group-hover:-rotate-180" />
              </div>
              {offers && offers.length > 0 && (
                <div className="absolute top-[100%] left-1/2 -translate-x-1/2 hidden group-hover:block w-56 bg-[#2A0845] rounded-xl shadow-2xl py-2 z-[100] border border-[#D4AF37]/30 mt-1">
                  <div className="w-full h-2 bg-transparent absolute -top-2 left-0" />
                  {offers.map((offer) => (
                    <Link key={offer.id} to={`/offer/${offer.id}`} className="flex justify-between items-center px-4 py-2 text-xs text-gray-200 hover:bg-[#3b0764] hover:text-[#D4AF37] transition-colors">
                      <span>{offer.title}</span>
                      <span className="text-[10px] bg-red-900/60 text-red-200 px-1.5 py-0.5 rounded-full font-bold border border-red-500/30">{parseFloat(offer.discount_percentage)}% OFF</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* ABOUT */}
            <Link
              to="/about"
              className={`text-xs md:text-sm font-semibold tracking-[0.14em] uppercase transition-all py-1 border-b-2 ${
                currentPath === '/about' ? 'text-[#D4AF37] border-[#D4AF37]' : 'text-white/90 border-transparent hover:text-[#D4AF37]'
              }`}
            >
              ABOUT
            </Link>

            {/* CONTACT */}
            <Link
              to="/contact"
              className={`text-xs md:text-sm font-semibold tracking-[0.14em] uppercase transition-all py-1 border-b-2 ${
                currentPath === '/contact' ? 'text-[#D4AF37] border-[#D4AF37]' : 'text-white/90 border-transparent hover:text-[#D4AF37]'
              }`}
            >
              CONTACT
            </Link>
          </div>
        </nav>
      </div>

      {/* MOBILE / DRAWER SIDEBAR */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />

            <motion.div
              key="panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 w-[300px] h-full z-[201] shadow-2xl flex flex-col bg-[#FAEDE4]"
            >
              {/* Sidebar Header */}
              <div className="px-5 py-3 flex items-center justify-between border-b border-[#2A0845]/10 bg-[#FAEDE4]">
                <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center">
                  <img
                    src={headerLogo}
                    alt="LYDIA GLOBAL EXIM"
                    className="h-13 xs:h-14 w-auto object-contain mix-blend-multiply"
                  />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close Navigation Menu"
                  className="p-2 text-[#2A0845]/80 hover:text-[#2A0845] bg-[#2A0845]/10 hover:bg-[#2A0845]/20 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>

              {/* Sidebar Links */}
              <nav className="flex flex-col p-4 gap-1 flex-grow overflow-y-auto">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-[#2A0845] font-bold text-sm py-3 px-4 rounded-xl hover:bg-[#2A0845] hover:text-[#D4AF37] transition-all uppercase tracking-wider"
                >
                  Home
                </Link>

                {/* Mobile Categories Accordion */}
                <div className="flex flex-col rounded-xl overflow-hidden">
                  <div
                    onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                    className="flex items-center justify-between hover:bg-[#2A0845] hover:text-[#D4AF37] transition-all cursor-pointer rounded-xl group"
                  >
                    <span className="block text-[#2A0845] font-bold text-sm py-3 px-4 flex-grow group-hover:text-[#D4AF37] uppercase tracking-wider">
                      Categories
                    </span>
                    <button className="p-3 text-[#2A0845] group-hover:text-[#D4AF37]">
                      <ChevronDown className={`w-4 h-4 transition-transform ${mobileCategoriesOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {mobileCategoriesOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-black/5 overflow-hidden rounded-lg mx-2 mt-1"
                      >
                        <div className="py-2 px-2 flex flex-col gap-1">
                          <Link to="/category/all" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-bold text-[#2A0845] py-2 px-3 rounded-lg hover:bg-black/5 uppercase">
                            All Categories
                          </Link>
                          {categories && categories.map((cat) => (
                            <Link key={cat.id} to={`/category/${cat.id}`} onClick={() => setMobileMenuOpen(false)} className="block text-xs text-[#2A0845]/90 py-2 px-3 rounded-lg hover:bg-black/5">
                              {cat.name}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Mobile Offers Accordion */}
                <div className="flex flex-col rounded-xl overflow-hidden">
                  <div
                    onClick={() => setMobileOffersOpen(!mobileOffersOpen)}
                    className="flex items-center justify-between hover:bg-[#2A0845] hover:text-[#D4AF37] transition-all cursor-pointer rounded-xl group"
                  >
                    <span className="block text-[#2A0845] font-bold text-sm py-3 px-4 flex-grow group-hover:text-[#D4AF37] uppercase tracking-wider">
                      Sale
                    </span>
                    <button className="p-3 text-[#2A0845] group-hover:text-[#D4AF37]">
                      <ChevronDown className={`w-4 h-4 transition-transform ${mobileOffersOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                  <AnimatePresence>
                    {mobileOffersOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-black/5 overflow-hidden rounded-lg mx-2 mt-1"
                      >
                        <div className="py-2 px-2 flex flex-col gap-1">
                          {offers && offers.length > 0 ? offers.map((offer) => (
                            <Link key={offer.id} to={`/offer/${offer.id}`} onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-between text-xs text-[#2A0845] py-2 px-3 rounded-lg hover:bg-black/5">
                              <span>{offer.title}</span>
                              <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{parseFloat(offer.discount_percentage)}% OFF</span>
                            </Link>
                          )) : (
                            <span className="py-2 px-3 text-xs text-gray-500">No active offers</span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  to="/about"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-[#2A0845] font-bold text-sm py-3 px-4 rounded-xl hover:bg-[#2A0845] hover:text-[#D4AF37] transition-all uppercase tracking-wider"
                >
                  About
                </Link>

                <Link
                  to="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-[#2A0845] font-bold text-sm py-3 px-4 rounded-xl hover:bg-[#2A0845] hover:text-[#D4AF37] transition-all uppercase tracking-wider"
                >
                  Contact
                </Link>

                {token && (
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-[#2A0845] font-bold text-sm py-3 px-4 rounded-xl hover:bg-[#2A0845] hover:text-[#D4AF37] transition-all uppercase tracking-wider"
                  >
                    My Profile
                  </Link>
                )}
              </nav>

              {/* Mobile Sidebar Footer */}
              <div className="p-4 border-t border-[#2A0845]/15 bg-[#2A0845]/5">
                {token ? (
                  <div>
                    <div className="px-3 py-1 mb-2">
                      <p className="text-sm font-bold text-[#2A0845] truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                      className="flex items-center justify-center gap-2 w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-all text-xs uppercase tracking-wider"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 w-full bg-[#2A0845] text-[#D4AF37] font-bold py-3.5 rounded-xl shadow-md hover:bg-[#3b0764] transition-all text-xs uppercase tracking-wider"
                  >
                    <LogIn className="w-4 h-4" /> Login / Sign Up
                  </Link>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
