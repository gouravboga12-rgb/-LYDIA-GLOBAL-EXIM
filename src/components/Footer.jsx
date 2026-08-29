import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import logoUrl from '../assets/logo.png';

export function Footer() {
  return (
    <footer className="bg-[#2A0845] text-gray-50 pt-12 pb-24 md:pb-12 w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          
          {/* Brand Info */}
          <div className="flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3 hover:opacity-95 transition-opacity">
              <div className="h-14 bg-[#FAEDE4] rounded-xl px-2 py-1 flex items-center justify-center shrink-0 border border-brand-gold/30 shadow-md">
                <img src={logoUrl} alt="LYDIA GLOBAL EXIM" className="h-full w-auto object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-xl leading-tight tracking-[0.08em]" style={{ color: '#C6A184' }}>LYDIA GLOBAL EXIM</span>
              </div>
            </Link>
            <p className="text-sm text-gray-100/80 leading-relaxed">
              Your one-stop destination for authentic and premium quality products. Experience excellence with our carefully curated collection.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold mb-2" style={{ color: '#C6A184' }}>Quick Links</h3>
            <Link to="/" className="text-sm text-gray-100/80 transition-colors" style={{}} onMouseEnter={e => e.currentTarget.style.color='#C6A184'} onMouseLeave={e => e.currentTarget.style.color=''}>Home</Link>
            <Link to="/category/all" className="text-sm text-gray-100/80 transition-colors" onMouseEnter={e => e.currentTarget.style.color='#C6A184'} onMouseLeave={e => e.currentTarget.style.color=''}>Shop All</Link>
            <Link to="/about" className="text-sm text-gray-100/80 transition-colors" onMouseEnter={e => e.currentTarget.style.color='#C6A184'} onMouseLeave={e => e.currentTarget.style.color=''}>About</Link>
            <Link to="/profile" className="text-sm text-gray-100/80 transition-colors" onMouseEnter={e => e.currentTarget.style.color='#C6A184'} onMouseLeave={e => e.currentTarget.style.color=''}>My Account</Link>
            <Link to="/my-orders" className="text-sm text-gray-100/80 transition-colors" onMouseEnter={e => e.currentTarget.style.color='#C6A184'} onMouseLeave={e => e.currentTarget.style.color=''}>Order Tracking</Link>
            <Link to="/contact" className="text-sm text-gray-100/80 transition-colors" onMouseEnter={e => e.currentTarget.style.color='#C6A184'} onMouseLeave={e => e.currentTarget.style.color=''}>Contact Us</Link>
          </div>

          {/* Customer Service */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold mb-2" style={{ color: '#C6A184' }}>Customer Service</h3>
            <Link to="/terms-of-service" className="text-sm text-gray-100/80 transition-colors" onMouseEnter={e => e.currentTarget.style.color='#C6A184'} onMouseLeave={e => e.currentTarget.style.color=''}>Terms & Conditions</Link>
            <Link to="/privacy-policy" className="text-sm text-gray-100/80 transition-colors" onMouseEnter={e => e.currentTarget.style.color='#C6A184'} onMouseLeave={e => e.currentTarget.style.color=''}>Privacy Policy</Link>
            <Link to="/shipping-policy" className="text-sm text-gray-100/80 transition-colors" onMouseEnter={e => e.currentTarget.style.color='#C6A184'} onMouseLeave={e => e.currentTarget.style.color=''}>Shipping Policy</Link>
            <Link to="/returns-policy" className="text-sm text-gray-100/80 transition-colors" onMouseEnter={e => e.currentTarget.style.color='#C6A184'} onMouseLeave={e => e.currentTarget.style.color=''}>Returns & Exchanges</Link>
            <Link to="/jewelry-care" className="text-sm text-gray-100/80 transition-colors" onMouseEnter={e => e.currentTarget.style.color='#C6A184'} onMouseLeave={e => e.currentTarget.style.color=''}>Jewelry Care Tips</Link>
            <Link to="/contact#faq-section" className="text-sm text-gray-100/80 transition-colors" onMouseEnter={e => e.currentTarget.style.color='#C6A184'} onMouseLeave={e => e.currentTarget.style.color=''}>FAQs</Link>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold mb-2" style={{ color: '#C6A184' }}>Contact Us</h3>
            <div className="flex items-start gap-3 text-sm text-gray-100/80">
              <MapPin className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#C6A184' }} />
              <span>8-20/SHR/401, Nizampet Road, Nizampet, Hyderabad, Medchal-Malkajgiri, Telangana – 500090</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-100/80">
              <Phone className="w-5 h-5 shrink-0" style={{ color: '#C6A184' }} />
              <a href="tel:9014863411" className="hover:underline">+91 9014863411</a>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-100/80">
              <Mail className="w-5 h-5 shrink-0" style={{ color: '#C6A184' }} />
              <a href="mailto:lydiaglobalexim@gmail.com" className="hover:underline">lydiaglobalexim@gmail.com</a>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-100/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-100/50">
            © {new Date().getFullYear()} LYDIA GLOBAL EXIM. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-100/50">
            <Link to="/privacy-policy" className="transition-colors" onMouseEnter={e => e.currentTarget.style.color='#C6A184'} onMouseLeave={e => e.currentTarget.style.color=''}>Privacy Policy</Link>
            <Link to="/terms-of-service" className="transition-colors" onMouseEnter={e => e.currentTarget.style.color='#C6A184'} onMouseLeave={e => e.currentTarget.style.color=''}>Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

