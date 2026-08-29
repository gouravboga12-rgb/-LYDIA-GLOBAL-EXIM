import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, ShoppingCart, Star, Flame, Sparkles, Circle, Gift, Wind, Bell, Droplet, Flower2, Cloud, Grid, Package, MapPin, Globe, Users, Store, ShieldCheck, Gem, Quote, CheckCircle2, Award } from 'lucide-react';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { useStoreData } from '../store/useStoreData';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

import imgHeroBanner from '../assets/hero_banner.png';
import bannerJewelry from '../assets/banner_jewelry.jpg';
import imgMeditation from '../assets/story_meditation.png';
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
// ── Count-up hook (triggers when element enters viewport) ────────────────────
function useCountUp(target, duration = 1800, suffix = '') {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(ease * target));
            if (progress < 1) requestAnimationFrame(step);
            else setCount(target);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { count, ref };
}

// ── Individual stat tile ─────────────────────────────────────────────────────
function StatTile({ icon: Icon, target, prefix = '', suffix = '', label, link, color = '#D4AF37', decimals = 0 }) {
  const { count, ref } = useCountUp(Math.round(target * Math.pow(10, decimals)), 2000);
  const displayVal = decimals > 0
    ? (count / Math.pow(10, decimals)).toFixed(decimals)
    : count;

  const inner = (
    <div ref={ref} className="flex flex-col items-center gap-2 group cursor-default">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-1 shadow-lg transition-transform duration-300 group-hover:scale-110"
        style={{ background: `${color}18`, border: `1.5px solid ${color}50` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none">
        {prefix}{displayVal}{suffix}
      </div>
      <div className="text-[11px] md:text-xs font-semibold text-white/60 text-center leading-snug max-w-[100px]">{label}</div>
    </div>
  );

  if (link) {
    return (
      <a href={link} target="_blank" rel="noopener noreferrer" className="contents">
        <div ref={ref} className="flex flex-col items-center gap-2 group cursor-pointer">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-1 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:ring-2 ring-offset-2 ring-offset-[#0d1f3f]"
            style={{ background: `${color}25`, border: `1.5px solid ${color}80`, ringColor: color }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none group-hover:underline underline-offset-2">
            {prefix}{displayVal}{suffix}
          </div>
          <div className="text-[11px] md:text-xs font-semibold text-white/60 text-center leading-snug max-w-[100px] group-hover:text-white/90 transition-colors">{label}</div>
        </div>
      </a>
    );
  }
  return inner;
}

// ── Stats banner ─────────────────────────────────────────────────────────────
function StatsBanner() {
  const stats = [
    { icon: Award, target: 10, suffix: '+', label: 'Years of Experience', color: '#D4AF37' },
    { icon: Package, target: 1000, suffix: '+', label: 'Orders Delivered', color: '#60a5fa' },
    { icon: Users, target: 1000, suffix: '+', label: 'Happy Customers', color: '#f472b6' },
    { icon: MapPin, target: 500, suffix: '+', label: 'Pick Up Orders', color: '#34d399' },
  ];

  return (
    <div className="animate-section px-4 md:px-8 mb-10">
      <div
        className="relative rounded-2xl overflow-hidden py-8 px-6 md:px-10"
        style={{
          background: 'linear-gradient(135deg, #2A0845 0%, #4C1D95 60%, #2A0845 100%)',
          boxShadow: '0 8px 40px rgba(8,24,58,0.35), inset 0 1px 0 rgba(212,175,55,0.15)'
        }}
      >
        {/* Decorative gold top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #D4AF37, transparent)' }} />
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

        <div className="relative z-10">
          {/* Heading */}
          <div className="text-center mb-8">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#D4AF37] mb-1">Our Journey So Far</p>
            <h2 className="font-serif text-xl md:text-2xl font-bold text-white">Trusted by Thousands Across the Globe</h2>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
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

// ── Features Banner ──────────────────────────────────────────────────────────
function FeaturesBanner() {
  return (
    <div className="animate-section px-4 md:px-8 mb-12">
      <div className="w-full bg-[#F3ECE2] border border-[#2A0845]/10 rounded-2xl py-6 md:py-8 px-6 md:px-12 flex flex-col items-center text-center relative overflow-hidden shadow-sm">
        {/* Decorative subtle border */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1.5px] bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
        <Star className="text-[#D4AF37] w-4 h-4 absolute top-[-8px] left-1/2 -translate-x-1/2 fill-[#D4AF37]" />

        <div className="flex justify-center items-start max-w-4xl mx-auto w-full">
          {/* Feature 1 */}
          <div className="flex flex-col items-center w-1/4 border-r border-[#2A0845]/15 px-1 md:px-4">
            <div className="flex items-center justify-center mb-2 md:mb-3 text-[#2A0845]">
              <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M12 8s-2 2.5-2 5a2 2 0 004 0c0-2.5-2-5-2-5z"/>
              </svg>
            </div>
            <span className="text-[7px] md:text-[11px] font-semibold tracking-wider text-[#2A0845] uppercase text-center break-words w-full">Waterproof</span>
          </div>
          
          {/* Feature 2 */}
          <div className="flex flex-col items-center w-1/4 border-r border-[#2A0845]/15 px-1 md:px-4">
            <div className="flex items-center justify-center mb-2 md:mb-3 text-[#2A0845]">
              <ShieldCheck className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
            </div>
            <span className="text-[7px] md:text-[11px] font-semibold tracking-wider text-[#2A0845] uppercase text-center break-words w-full">Anti-Tarnish</span>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center w-1/4 border-r border-[#2A0845]/15 px-1 md:px-4">
            <div className="flex items-center justify-center mb-2 md:mb-3 text-[#2A0845]">
              <svg className="w-6 h-6 md:w-8 md:h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8s-2 2.5-2 5a2 2 0 004 0c0-2.5-2-5-2-5z"/>
              </svg>
            </div>
            <span className="text-[7px] md:text-[11px] font-semibold tracking-wider text-[#2A0845] uppercase text-center break-words w-full">Hypoallergenic</span>
          </div>

          {/* Feature 4 */}
          <div className="flex flex-col items-center w-1/4 px-1 md:px-4">
            <div className="flex items-center justify-center mb-2 md:mb-3 text-[#2A0845]">
              <Gem className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1.5} />
            </div>
            <span className="text-[7px] md:text-[11px] font-semibold tracking-wider text-[#2A0845] uppercase text-center break-words w-full">Premium Quality</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
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

  React.useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length]);
  useGSAP(() => {
    if (!loading) {
      gsap.from('.animate-section', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
        clearProps: 'all'
      });
    }
  }, { scope: container, dependencies: [loading] });

  const featuredProducts = products.slice(0, 5);

  return (
    <div ref={container} className="bg-brand-beige flex-grow w-full flex flex-col pb-8">
      <Header variant="home" />

      {/* Hero Banner Section */}
      <div className="animate-section py-4 md:py-8">
        {banners.length > 0 ? (
          <div className="relative w-full md:w-[75%] h-48 md:h-[400px] rounded-2xl overflow-hidden shadow-lg border border-gray-100 mx-auto px-4 md:px-0">
            <div
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {banners.map((banner) => (
                <div key={banner.id} className="relative w-full h-full shrink-0">
                  <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent flex flex-col justify-center px-6 md:px-16">
                    <h2 className="text-white text-2xl md:text-5xl font-bold mb-4 leading-tight font-serif tracking-wide drop-shadow-lg">
                      {banner.title}
                    </h2>
                    {(banner.link_url || banner.link_url === '') && (
                      <Link to={banner.link_url || "/category/all"} className="bg-brand-dark-blue text-brand-gold text-xs md:text-base font-bold px-8 py-3 md:py-4 rounded-xl w-fit shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all">
                        SHOP NOW
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Slider Dots */}
            <div className="absolute bottom-4 md:bottom-6 left-0 right-0 flex justify-center gap-2">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`h-1.5 md:h-2 rounded-full transition-all ${i === currentSlide ? 'bg-white w-6 md:w-8' : 'bg-white/50 w-1.5 md:w-2 hover:bg-white/80'}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex justify-center px-4 md:px-24 pt-2 md:pt-6 pb-2">
            <div className="relative w-full h-72 md:h-[360px] rounded-[24px] overflow-hidden shadow-2xl border border-brand-gold/20 bg-brand-beige group">
              <div className="absolute inset-0 z-0">
                <img src="/images/about_hero.jpg" alt="Handcrafted Imitation Jewelry Collection" className="w-full h-full object-cover object-right md:object-[center_35%] transition-transform duration-1000 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#FAF6F0] via-[#FAF6F0]/90 md:via-[#FAF6F0]/80 to-[#FAF6F0]/0 z-10 pointer-events-none w-full md:w-[75%]"></div>
              </div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-14 z-10 w-[75%] md:w-[60%]">
                <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-1 drop-shadow-sm">Lydia Global Exim Collection</span>
                <h2 className="text-[#2A0845] text-2xl md:text-4xl lg:text-[40px] font-bold mb-3 md:mb-4 leading-[1.2] font-serif tracking-wide drop-shadow-sm">
                  Handcrafted Elegance,<br />
                  <span className="text-[#2A0845]/80 font-light">Royal Imitation Luxury</span>
                </h2>
                <p className="text-gray-700 text-xs md:text-sm lg:text-[15px] mb-6 md:mb-8 max-w-[290px] md:max-w-md leading-relaxed font-medium">
                  Explore exquisite Kundan bridal sets, anti-tarnish micro-gold plated jewelry, and timeless designs crafted for celebrations and everyday elegance.
                </p>
                <Link to="/category/all" className="bg-[#2A0845] text-white text-[11px] md:text-xs font-bold px-6 py-3 md:px-8 md:py-3.5 rounded-xl w-fit shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all hover:bg-[#D4AF37] tracking-wider uppercase">
                  SHOP NOW
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <FeaturesBanner />

      <div className="md:max-w-full mx-auto w-full pb-20">
        {/* Categories Grid */}
        <div className="animate-section px-4 md:px-24 mb-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-serif text-xl md:text-2xl text-gray-900">Shop by Category</h3>
            <Link to="/category/all" className="text-sm font-semibold text-brand-accent flex items-center gap-1">View All <span className="text-lg leading-none">&rsaquo;</span></Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-y-6 gap-x-3">
            {categories.map((cat) => {
              const IconMap = {
                Flame,
                Sparkles,
                Circle,
                Gift,
                Wind,
                Bell,
                Droplet,
                Flower2,
                Cloud,
                Grid
              };
              const Icon = IconMap[cat.icon] || Star;

              return (
                <Link key={cat.id} to={`/category/${cat.id}`} className="group flex flex-col h-full rounded-[14px] overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 bg-brand-beige-darker border border-brand-gold/30">
                  <div className="h-24 md:h-32 w-full flex items-center justify-center relative overflow-hidden bg-white/50">
                    {cat.image_url ? (
                      <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                    ) : (
                      <Star className="w-8 h-8 text-brand-gold" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="bg-brand-dark-blue flex items-center justify-center gap-1.5 py-2.5 md:py-3 px-2 mt-auto border-t border-brand-gold/20">
                    <Sparkles className="w-3 h-3 text-brand-gold shrink-0" />
                    <span className="text-[10px] md:text-xs font-semibold text-white text-center leading-tight truncate">{cat.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Trending Products */}
        {products.filter(p => p.is_trending).length > 0 && (
          <div className="animate-section mb-8">
            <div className="flex justify-between items-center mb-4 px-4 md:px-24">
              <h3 className="font-bold text-gray-900">Trending Products</h3>
              <Link to="/category/all" className="text-xs font-semibold text-brand-orange">View all</Link>
            </div>

            <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4 md:px-24 pb-2 md:grid md:grid-cols-4 lg:grid-cols-5 md:overflow-visible">
              {products.filter(p => p.is_trending).slice(0, 5).map(product => (
                <div key={product.id} className="w-[140px] md:w-auto shrink-0 hover:-translate-y-1 transition-transform">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Special Offers / Premium Collection Banner */}
        {/* <div className="animate-section px-4 md:px-24 mb-12 flex justify-center mt-8">
          <div className="relative w-full h-32 md:h-[300px] rounded-[24px] overflow-hidden shadow-lg border border-brand-gold/20 group">
            <div className="absolute inset-0 z-0">
              <img src="https://images.pexels.com/photos/1458867/pexels-photo-1458867.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" alt="Jewelry Offers" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-r from-brand-dark-blue via-brand-dark-blue/90 to-brand-dark-blue/0 z-10 pointer-events-none w-full md:w-[70%]"></div>
            </div>
            
            <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-12 pointer-events-none">
              <div className="bg-brand-gold text-brand-dark-blue text-[10px] md:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full w-fit mb-3 drop-shadow-sm pointer-events-auto">Today's Offers</div>
              <h2 className="text-white text-xl md:text-4xl font-bold mb-4 leading-tight font-serif drop-shadow-md">
                Get up to 50% OFF<br />on Diamond Collections
              </h2>
              <Link to="/category/all" className="bg-brand-gold text-brand-dark-blue text-[10px] md:text-sm font-bold px-6 py-2.5 md:px-8 md:py-3 rounded-xl w-fit hover:bg-white hover:scale-105 shadow-lg shadow-brand-gold/20 transition-all pointer-events-auto">
                SHOP OFFERS
              </Link>
            </div>
          </div>
        </div> */}

        {/* Festive Collection */}
        {products.filter(p => p.is_festive).length > 0 && (
          <div className="animate-section mb-8 px-4 md:px-24">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">Festive Collection</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
              {products.filter(p => p.is_festive).slice(0, 5).map(product => (
                <div key={product.id} className="hover:-translate-y-1 transition-transform">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Stats Banner ─────────────────────────────────────── */}
        <StatsBanner />

        {/* Offers Section */}
        {products.filter(p => p.is_offer).length > 0 && (
          <div className="animate-section mb-8 px-4 md:px-24">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">Special Offers</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
              {products.filter(p => p.is_offer).slice(0, 5).map(product => (
                <div key={product.id} className="hover:-translate-y-1 transition-transform">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best Sellers */}
        {products.filter(p => p.is_bestseller).length > 0 && (
          <div className="animate-section mb-8 px-4 md:px-24">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-900">Best Sellers</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
              {products.filter(p => p.is_bestseller).slice(0, 5).map(product => (
                <div key={product.id} className="hover:-translate-y-1 transition-transform">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        )}

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
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2A0845] to-[#4A154B] text-[#D4AF37] font-bold text-xs flex items-center justify-center shadow-md ring-2 ring-[#D4AF37]/30 shrink-0">
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
