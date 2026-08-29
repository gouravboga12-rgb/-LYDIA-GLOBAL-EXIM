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
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 flex items-center justify-center shrink-0 bg-black rounded-full p-1 shadow-lg">
                <img src={logoUrl} alt="LYDIA GLOBAL EXIM" className="h-full w-auto object-contain" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-xl leading-none" style={{ color: '#C6A184' }}>LYDIA GLOBAL EXIM</span>
              </div>
            </div>
            <p className="text-sm text-gray-100/80 leading-relaxed">
              Your one-stop destination for authentic and premium quality products. Experience excellence with our carefully curated collection.
            </p>
            <div className="flex items-center gap-4 mt-2">
              {/* WhatsApp */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(198,161,132,0.15)', color: '#C6A184' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.971.53 1.771.815 2.796.815 3.18 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.768-5.768-5.768zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </div>
              {/* Facebook */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(198,161,132,0.15)', color: '#C6A184' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h11.495v-9.294h-3.128v-3.622h3.128v-2.671c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12v9.293h6.116c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/></svg>
              </div>
              {/* Instagram */}
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(198,161,132,0.15)', color: '#C6A184' }}>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </div>
            </div>
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

