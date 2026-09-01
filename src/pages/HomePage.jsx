import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingCart, Star, Flame, Sparkles, Circle, Gift, Wind, Bell, Droplet, Flower2, Cloud, Grid, Package, MapPin, Globe, Users, Store, ShieldCheck, Gem, Quote, CheckCircle2, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { useStoreData } from '../store/useStoreData';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import banner1Velvet from '../assets/banner_1_velvet_necklace.jpg';
import banner2Bridal from '../assets/banner_2_bridal_kundan.jpg';
import banner3AntiTarnish from '../assets/banner_3_antitarnish_gold.jpg';
import banner4Designer from '../assets/banner_4_designer_jewelry.jpg';
import defaultReviews from '../data/reviews.json';

// Inline Instagram icon (not available in this version of lucide-react)
function InstagramIcon({ className, style }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.01" fill="currentColor" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}
// ── Count-up hook (triggers when element enters viewport with smooth ease) ────
function useCountUp(target, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const startCounting = () => {
      if (started.current) return;
      started.current = true;
      const startTime = performance.now();
      const step = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Smooth Out-Expo / Cubic easing
        const ease = 1 - Math.pow(1 - progress, 4);
        const currentVal = Math.floor(ease * target);
        setCount(currentVal);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setCount(target);
        }
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startCounting();
        }
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

// ── Individual stat tile ─────────────────────────────────────────────────────
function StatTile({ icon: Icon, target, prefix = '', suffix = '', label, sublabel, color = '#D4AF37' }) {
  const { count, ref } = useCountUp(target, 2200);

  return (
    <div ref={ref} className="flex flex-col items-center text-center p-4 rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] hover:border-[#D4AF37]/40 hover:bg-white/[0.07] transition-all duration-300 group cursor-default shadow-sm hover:-translate-y-1">
      <div
        className="w-13 h-13 md:w-14 md:h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
        style={{ background: `${color}20`, border: `1.5px solid ${color}60` }}
      >
        <Icon className="w-6 h-6 md:w-7 md:h-7 transition-colors" style={{ color }} />
      </div>
      <div className="text-2xl md:text-4xl font-black text-white tracking-tight leading-none mb-1.5 drop-shadow-sm font-sans">
        {prefix}{count > 0 ? count.toLocaleString() : '0'}{suffix}
      </div>
      <div className="text-xs md:text-sm font-bold text-white/95 leading-tight mb-1">{label}</div>
      {sublabel && (
        <div className="text-[10px] md:text-[11px] font-medium text-white/50 leading-snug">{sublabel}</div>
      )}
    </div>
  );
}

// ── Stats banner ─────────────────────────────────────────────────────────────
function StatsBanner() {
  const stats = [
    { icon: Award, target: 10, suffix: '+ Years', label: 'Decade of Heritage', sublabel: '10+ Years of Craftsmanship', color: '#D4AF37' },
    { icon: Package, target: 1000, suffix: '+', label: 'Orders Delivered', sublabel: 'Safe Doorstep Delivery', color: '#60a5fa' },
    { icon: Users, target: 1000, suffix: '+', label: 'Happy Customers', sublabel: '100% Satisfaction Rate', color: '#f472b6' },
    { icon: MapPin, target: 500, suffix: '+', label: 'Pick Up Orders', sublabel: 'Personalized Boutique Care', color: '#34d399' },
  ];

  return (
    <div className="animate-section px-4 md:px-8 mb-12">
      <div
        className="relative rounded-3xl overflow-hidden py-10 px-6 md:px-12"
        style={{
          background: 'linear-gradient(135deg, #26002B 0%, #5A0E72 50%, #26002B 100%)',
          boxShadow: '0 12px 48px rgba(8,24,58,0.4), inset 0 1px 0 rgba(212,175,55,0.2)'
        }}
      >
        {/* Decorative gold top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative z-10">
          {/* Heading & Subtitle Details */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-[10px] md:text-xs font-bold tracking-[0.15em] uppercase mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              A Decade of Heritage & Excellence
            </div>
            <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight">
              Crafting Timeless Luxury & Trusted Globally
            </h2>
            <p className="text-xs md:text-sm text-white/70 leading-relaxed font-normal">
              For over 10 years, Lydia Global Exim has delivered handcrafted, 18K/24K gold-plated waterproof & tarnish-free jewelry with uncompromised quality, authentic artistry, and dedicated care.
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((s, i) => (
              <StatTile key={i} {...s} />
            ))}
          </div>
        </div>

        {/* Decorative gold bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />
      </div>
    </div>
  );
}



export function HomePage() {
  const navigate = useNavigate();
  const container = useRef(null);
  const { products, categories, loading } = useStoreData();
  const [banners, setBanners] = React.useState([]);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [reviews, setReviews] = React.useState(defaultReviews || []);
  const reviewTrackRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || '';

  React.useEffect(() => {
    if (!BACKEND_URL) return;

    fetch(`${BACKEND_URL}/general/banners`)
      .then(r => r.json())
      .then(d => { if (d && d.banners && d.banners.length > 0) setBanners(d.banners); })
      .catch(e => console.warn('Banners load error:', e.message));

    fetch(`${BACKEND_URL}/general/reviews`)
      .then(r => r.json())
      .then(d => {
        if (d && d.reviews && d.reviews.length > 0) {
          const valid = d.reviews.filter(r => r.is_active !== false && r.review && r.review.trim().length > 15 && !r.review.toLowerCase().includes('hello'));
          if (valid.length > 0) {
            setReviews(valid);
          }
        }
      })
      .catch(e => console.warn('Reviews load error:', e.message));
  }, []);

  // Auto-scroll reviews
  React.useEffect(() => {
    const track = reviewTrackRef.current;
    if (!track || reviews.length === 0) return;
    let animFrame;
    let pos = 0;
    const speed = 0.5;
    const step = () => {
      pos += speed;
      const half = track.scrollWidth / 2;
      if (pos >= half) pos = 0;
      track.style.transform = `translateX(-${pos}px)`;
      animFrame = requestAnimationFrame(step);
    };
    animFrame = requestAnimationFrame(step);
    const pause = () => cancelAnimationFrame(animFrame);
    const resume = () => { animFrame = requestAnimationFrame(step); };
    track.addEventListener('mouseenter', pause);
    track.addEventListener('mouseleave', resume);
    track.addEventListener('touchstart', pause);
    track.addEventListener('touchend', resume);
    return () => {
      cancelAnimationFrame(animFrame);
      track.removeEventListener('mouseenter', pause);
      track.removeEventListener('mouseleave', resume);
      track.removeEventListener('touchstart', pause);
      track.removeEventListener('touchend', resume);
    };
  }, [reviews]);

  const defaultHeroSlides = [
    {
      id: 'slide_1',
      tag: 'Exclusive Collection',
      titleLine1: 'TIMELESS BEAUTY,',
      titleLine2: 'UNIQUELY YOURS',
      subtitle: 'Explore our exclusive collection of imitation jewellery crafted with elegance and perfection.',
      image: banner1Velvet,
      link: '/category/all'
    },
    {
      id: 'slide_2',
      tag: 'Bridal & Wedding Couture',
      titleLine1: 'HERITAGE BRIDAL,',
      titleLine2: 'ROYAL KUNDAN ELEGANCE',
      subtitle: 'Exquisite bridal necklaces, royal choker sets, and timeless luxury heirloom jewelry.',
      image: banner2Bridal,
      link: '/category/all'
    },
    {
      id: 'slide_3',
      tag: 'Everyday Luxury',
      titleLine1: '18K ANTI-TARNISH,',
      titleLine2: 'WATERPROOF GOLD BRILLIANCE',
      subtitle: 'Waterproof, sweatproof, and hypoallergenic designs crafted for daily brilliance.',
      image: banner3AntiTarnish,
      link: '/category/all'
    },
    {
      id: 'slide_4',
      tag: 'Statement Glamour',
      titleLine1: 'CELEBRATION GLAMOUR,',
      titleLine2: 'DESIGNER CHOKERS & BANGLES',
      subtitle: 'Radiant handcrafted partywear jewelry to make every celebration and special occasion shine.',
      image: banner4Designer,
      link: '/category/all'
    }
  ];

const HERO_ASSET_MAP = {
  '/assets/banner_1_velvet_necklace.jpg': banner1Velvet,
  '/assets/banner_2_bridal_kundan.jpg': banner2Bridal,
  '/assets/banner_3_antitarnish_gold.jpg': banner3AntiTarnish,
  '/assets/banner_4_designer_jewelry.jpg': banner4Designer,
  1: banner1Velvet,
  2: banner2Bridal,
  3: banner3AntiTarnish,
  4: banner4Designer,
};

  const activeSlides = useMemo(() => {
    const validBanners = (banners || []).filter(b => b.active !== false && b.is_active !== false);
    if (validBanners.length > 0) {
      return validBanners.map(b => {
        const parts = (b.title || '').split(',');
        const titleLine1 = parts[0] ? parts[0].trim() + (parts.length > 1 ? ',' : '') : b.title;
        const titleLine2 = parts.slice(1).join(',').trim();
        const slideImg = HERO_ASSET_MAP[b.image_url] || HERO_ASSET_MAP[b.id] || b.image_url || banner1Velvet;
        return {
          id: b.id,
          tag: b.tag || 'Exclusive Collection',
          titleLine1: titleLine1 || 'TIMELESS BEAUTY,',
          titleLine2: titleLine2,
          subtitle: b.subtitle || 'Discover hand-selected artisan jewelry tailored to perfection for every celebration.',
          image: slideImg,
          link: b.link_url || '/category/all'
        };
      });
    }
    return defaultHeroSlides;
  }, [banners]);

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const touchStartY = useRef(null);
  const touchEndY = useRef(null);

  const nextSlide = () => setCurrentSlide(prev => (prev + 1) % activeSlides.length);
  const prevSlide = () => setCurrentSlide(prev => (prev - 1 + activeSlides.length) % activeSlides.length);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current && touchEndY.current ? Math.abs(touchStartY.current - touchEndY.current) : 0;
    if (Math.abs(diffX) > 40 && Math.abs(diffX) > diffY) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  React.useEffect(() => {
    if (activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % activeSlides.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [activeSlides.length]);

  const featuredProducts = products.slice(0, 5);

  return (
    <div ref={container} className="bg-brand-beige flex-grow w-full flex flex-col pb-8">
      <Header variant="home" />

      {/* Hero Banner Section matching WhatsApp Reference */}
      <div className="animate-section w-full py-0 md:py-2 px-0 md:px-8 lg:px-12">
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="relative w-full h-[320px] xs:h-[360px] sm:h-[420px] md:h-[500px] lg:h-[560px] overflow-hidden md:rounded-2xl shadow-2xl bg-[#45055B] group select-none touch-pan-y"
        >
          {/* Slides Track */}
          <div
            className="flex h-full w-full transition-transform duration-700 ease-in-out select-none"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {activeSlides.map((slide) => (
              <div key={slide.id} className="relative w-full min-w-full flex-[0_0_100%] h-full shrink-0 flex items-center overflow-hidden select-none bg-[#45055B]">
                {/* Background Image & Non-blocking Luxury Overlay */}
                <div className="absolute inset-0 z-0 select-none pointer-events-none">
                  <img
                    src={slide.image}
                    alt={slide.titleLine1 || slide.title}
                    draggable={false}
                    className="w-full h-full object-cover object-right md:object-center lg:object-right transition-transform duration-1000 group-hover:scale-105 select-none pointer-events-none"
                  />
                  {/* Desktop subtle text gradient overlay (does NOT block jewelry on the right) */}
                  <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#45055B]/90 via-[#45055B]/50 to-transparent z-10 pointer-events-none w-[58%]"></div>
                  {/* Mobile gradient overlay (soft bottom/left gradient so jewelry is 100% visible) */}
                  <div className="md:hidden absolute inset-0 bg-gradient-to-t from-[#45055B]/90 via-[#45055B]/40 to-transparent z-10 pointer-events-none"></div>
                </div>

                {/* Slide Content with WhatsApp Reference Format */}
                <div className="relative flex flex-col justify-end md:justify-center pl-12 xs:pl-14 sm:pl-16 md:pl-20 pr-4 sm:pr-8 pb-8 md:pb-0 z-20 w-[95%] sm:w-[80%] md:w-[60%] lg:w-[50%] select-none text-white">
                  
                  {/* Main Headline */}
                  <h2 className="text-lg xs:text-xl sm:text-2xl md:text-5xl font-serif font-bold uppercase tracking-[0.06em] leading-tight mb-1.5 md:mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                    <span className="block text-white">{slide.titleLine1}</span>
                    {slide.titleLine2 && (
                      <span className="block text-[#D4AF37] font-serif drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{slide.titleLine2}</span>
                    )}
                  </h2>

                  {/* Gold Filigree Ornament Divider */}
                  <div className="flex items-center gap-2 my-1.5 md:my-3">
                    <div className="w-8 md:w-16 h-[1px] bg-gradient-to-r from-transparent to-[#D4AF37]"></div>
                    <span className="text-[#D4AF37] text-xs md:text-sm">❖</span>
                    <div className="w-8 md:w-16 h-[1px] bg-gradient-to-l from-transparent to-[#D4AF37]"></div>
                  </div>

                  {/* Subtitle */}
                  <p className="text-white/90 text-[11px] xs:text-xs sm:text-sm md:text-base mb-3.5 md:mb-7 max-w-xs sm:max-w-md leading-relaxed font-light drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                    {slide.subtitle}
                  </p>

                  {/* Gold Bordered SHOP NOW Button */}
                  <Link
                    to={slide.link}
                    className="w-fit border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-[#45055B] px-5 py-2 md:px-8 md:py-3 text-[11px] md:text-sm font-semibold tracking-[0.2em] uppercase transition-all duration-300 shadow-xl active:scale-95 cursor-pointer backdrop-blur-md bg-[#45055B]/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.6)]"
                  >
                    SHOP NOW
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Left / Right Arrow Buttons (Reference Translucent Circles) */}
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-1.5 xs:left-2 md:left-6 top-1/2 -translate-y-1/2 z-20 w-7 h-7 xs:w-8 xs:h-8 md:w-11 md:h-11 rounded-full bg-black/40 hover:bg-[#45055B] text-white/80 hover:text-[#D4AF37] backdrop-blur-md flex items-center justify-center border border-white/20 hover:border-[#D4AF37]/50 shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 xs:w-5 xs:h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-1.5 xs:right-2 md:right-6 top-1/2 -translate-y-1/2 z-20 w-7 h-7 xs:w-8 xs:h-8 md:w-11 md:h-11 rounded-full bg-black/40 hover:bg-[#45055B] text-white/80 hover:text-[#D4AF37] backdrop-blur-md flex items-center justify-center border border-white/20 hover:border-[#D4AF37]/50 shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 xs:w-5 xs:h-5 md:w-6 md:h-6" />
          </button>

          {/* Slider Dots matching WhatsApp reference */}
          <div className="absolute bottom-3 md:bottom-5 left-0 right-0 z-20 flex justify-center items-center gap-2">
            {activeSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  i === currentSlide
                    ? 'bg-[#D4AF37] w-3 h-3 shadow-[0_0_8px_rgba(212,175,55,0.8)]'
                    : 'bg-white/60 hover:bg-white w-2 h-2'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="md:max-w-full mx-auto w-full pb-20 pt-4 md:pt-6">
        {/* Shop By Category (Matching Reference Image) */}
        <div className="animate-section px-4 md:px-24 mb-14 text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="h-[1px] w-12 sm:w-20 bg-[#D4AF37]/50" />
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold tracking-[0.18em] uppercase text-[#45055B]">
              SHOP BY CATEGORY
            </h2>
            <span className="h-[1px] w-12 sm:w-20 bg-[#D4AF37]/50" />
          </div>

          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-5 sm:gap-6 md:gap-4 items-start justify-center max-w-6xl mx-auto">
            {categories.slice(0, 7).map((cat, idx) => (
              <Link
                key={cat.id}
                to={`/category/${cat.id}`}
                className={`reveal-on-scroll reveal-delay-${(idx % 7) + 1} group flex flex-col items-center`}
              >
                <div className="w-24 h-24 xs:w-26 xs:h-26 sm:w-28 sm:h-28 md:w-30 md:h-30 rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-md bg-[#45055B] relative flex items-center justify-center group-hover:scale-105 group-hover:shadow-xl transition-all duration-500 p-0">
                  {cat.image_url ? (
                    <img
                      src={cat.image_url}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <Star className="w-8 h-8 text-brand-gold" strokeWidth={1.5} />
                  )}
                </div>
                <span className="text-[11px] sm:text-xs font-bold tracking-wider text-[#45055B] uppercase text-center mt-2.5 group-hover:text-[#B38827] transition-colors leading-tight">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-8">
            <Link
              to="/category/all"
              className="inline-block bg-[#45055B] hover:bg-[#5A0E72] text-[#D4AF37] text-xs font-bold px-8 py-3 rounded shadow-md tracking-[0.14em] uppercase transition-colors"
            >
              VIEW ALL CATEGORIES
            </Link>
          </div>
        </div>

        {/* FEATURED PRODUCTS (Matching Reference Image) */}
        {products.filter(p => p.is_trending).length > 0 && (
          <div className="animate-section mb-14 px-4 md:px-24 text-center">
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className="h-[1px] w-12 sm:w-20 bg-[#D4AF37]/50" />
              <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold tracking-[0.18em] uppercase text-[#45055B]">
                FEATURED PRODUCTS
              </h2>
              <span className="h-[1px] w-12 sm:w-20 bg-[#D4AF37]/50" />
            </div>

            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 md:grid md:grid-cols-4 lg:grid-cols-5 md:overflow-visible max-w-7xl mx-auto">
              {products.filter(p => p.is_trending).slice(0, 5).map((product, pIdx) => (
                <div key={product.id} className={`reveal-on-scroll reveal-delay-${(pIdx % 5) + 1} w-[200px] xs:w-[220px] sm:w-[240px] md:w-auto shrink-0 hover:-translate-y-1 transition-transform text-left`}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link
                to="/category/all"
                className="inline-block bg-[#45055B] hover:bg-[#5A0E72] text-[#D4AF37] text-xs font-bold px-8 py-3 rounded shadow-md tracking-[0.14em] uppercase transition-colors"
              >
                VIEW ALL PRODUCTS
              </Link>
            </div>
          </div>
        )}

        {/* ── Stats Banner ─────────────────────────────────────── */}
        <StatsBanner />

        {/* Customer Reviews — Modern Testimonial Cards */}
        {reviews.length > 0 && (
          <section className="animate-section mb-12 overflow-hidden">
            <div className="px-4 md:px-24 mb-6 flex flex-col md:flex-row md:items-end justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Testimonials</span>
                <h3 className="font-serif font-bold text-2xl md:text-3xl text-brand-dark-blue mt-1">What Our Customers Say</h3>
              </div>
              <p className="text-xs md:text-sm text-gray-500 max-w-md">
                Verified reviews from our cherished patrons worldwide experiencing handcrafted elegance.
              </p>
            </div>

            <div className="overflow-hidden w-full py-2">
              <div
                ref={reviewTrackRef}
                className="flex gap-6 will-change-transform"
                style={{ width: 'max-content' }}
              >
                {/* Duplicate for seamless continuous carousel loop */}
                {[...reviews, ...reviews].map((rev, idx) => {
                  const initials = rev.name
                    ? rev.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                    : 'VIP';

                  return (
                    <div
                      key={idx}
                      className="w-[300px] md:w-[360px] shrink-0 bg-white/95 backdrop-blur-sm border border-brand-gold/25 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between relative group"
                    >
                      {/* Top Row: Stars, Quote Icon & Verified Badge */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, sIdx) => (
                              <Star
                                key={sIdx}
                                className={`w-4 h-4 ${sIdx < (rev.rating || 5) ? 'fill-[#D4AF37] text-[#D4AF37]' : 'text-gray-200'}`}
                              />
                            ))}
                          </div>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Verified
                          </span>
                        </div>

                        {/* Review Quote */}
                        <div className="relative my-3">
                          <Quote className="w-6 h-6 text-brand-gold/20 absolute -top-2 -left-1 pointer-events-none" />
                          <p className="text-gray-700 text-sm leading-relaxed italic relative z-10 pl-2">
                            "{rev.review}"
                          </p>
                        </div>
                      </div>

                      {/* Bottom Row: Customer Info */}
                      <div className="pt-4 mt-2 border-t border-gray-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#45055B] to-[#45055B] text-[#D4AF37] font-bold text-xs flex items-center justify-center shadow-md ring-2 ring-[#D4AF37]/30 shrink-0">
                            {initials}
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-sm leading-tight">{rev.name}</h4>
                            <p className="text-[11px] text-gray-500 font-medium">{rev.location || 'Verified Buyer'}</p>
                          </div>
                        </div>

                        {rev.product_name && (
                          <span className="text-[10px] font-semibold text-brand-dark-blue/80 bg-[#FAF6F0] px-2.5 py-1 rounded-lg border border-brand-gold/20 truncate max-w-[120px]">
                            {rev.product_name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

      </div>

    </div>
  );
}
