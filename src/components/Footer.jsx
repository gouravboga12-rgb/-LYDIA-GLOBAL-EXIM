import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Sparkles, Truck, ShieldCheck, Headphones } from 'lucide-react';
import footerLogo from '../assets/header_logo.png';

// Social Icon components
function InstagramIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.01" fill="currentColor" stroke="currentColor" strokeWidth="2.5" />
    </svg>
  );
}

function FacebookIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function WhatsAppIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="w-full">
      {/* ── TOP 4 VALUE PROPOSITIONS BAR (Royal Purple matching Reference) ──── */}
      <div className="w-full bg-[#45055B] text-white py-8 px-4 md:px-12 border-b border-[#D4AF37]/20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0">
          
          {/* Feature 1: Premium Quality */}
          <div className="flex items-start gap-4 lg:pr-8 lg:border-r border-[#D4AF37]/20">
            <div className="w-11 h-11 rounded-full border border-[#D4AF37]/40 flex items-center justify-center shrink-0 text-[#D4AF37] bg-white/5">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-xs md:text-sm tracking-wider uppercase text-white mb-1">PREMIUM QUALITY</h4>
              <p className="text-white/70 text-xs leading-relaxed">Handpicked products with finest craftsmanship.</p>
            </div>
          </div>

          {/* Feature 2: Worldwide Shipping */}
          <div className="flex items-start gap-4 lg:px-8 lg:border-r border-[#D4AF37]/20">
            <div className="w-11 h-11 rounded-full border border-[#D4AF37]/40 flex items-center justify-center shrink-0 text-[#D4AF37] bg-white/5">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-xs md:text-sm tracking-wider uppercase text-white mb-1">WORLDWIDE SHIPPING</h4>
              <p className="text-white/70 text-xs leading-relaxed">Delivering beauty to your doorstep, worldwide.</p>
            </div>
          </div>

          {/* Feature 3: Secure Shopping */}
          <div className="flex items-start gap-4 lg:px-8 lg:border-r border-[#D4AF37]/20">
            <div className="w-11 h-11 rounded-full border border-[#D4AF37]/40 flex items-center justify-center shrink-0 text-[#D4AF37] bg-white/5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-xs md:text-sm tracking-wider uppercase text-white mb-1">SECURE SHOPPING</h4>
              <p className="text-white/70 text-xs leading-relaxed">100% secure payments and easy returns.</p>
            </div>
          </div>

          {/* Feature 4: Customer Support */}
          <div className="flex items-start gap-4 lg:pl-8">
            <div className="w-11 h-11 rounded-full border border-[#D4AF37]/40 flex items-center justify-center shrink-0 text-[#D4AF37] bg-white/5">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-xs md:text-sm tracking-wider uppercase text-white mb-1">CUSTOMER SUPPORT</h4>
              <p className="text-white/70 text-xs leading-relaxed">We are here to help you anytime.</p>
            </div>
          </div>

        </div>
      </div>

      {/* ── MAIN FOOTER (Clean Cream Background matching Reference) ────────── */}
      <div className="w-full bg-[#FAF5EE] text-[#45055B] pt-12 pb-24 md:pb-12 border-t border-[#45055B]/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            
            {/* Column 1: Brand Logo & Social Icons */}
            <div className="flex flex-col items-start gap-4">
              <Link to="/" className="inline-block group">
                <img
                  src={footerLogo}
                  alt="LYDIA GLOBAL EXIM"
                  className="h-28 xs:h-36 sm:h-40 md:h-44 w-auto object-contain mix-blend-multiply group-hover:scale-102 transition-transform duration-300"
                />
              </Link>
              <div className="flex items-center gap-3.5 mt-2">
                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-10 h-10 rounded-full border border-[#45055B]/30 flex items-center justify-center text-[#45055B] hover:bg-[#45055B] hover:text-[#D4AF37] transition-all duration-300 shadow-sm"
                >
                  <InstagramIcon className="w-4.5 h-4.5" />
                </a>
                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-10 h-10 rounded-full border border-[#45055B]/30 flex items-center justify-center text-[#45055B] hover:bg-[#45055B] hover:text-[#D4AF37] transition-all duration-300 shadow-sm"
                >
                  <FacebookIcon className="w-4.5 h-4.5" />
                </a>
                {/* WhatsApp */}
                <a
                  href="https://wa.me/919014863411"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="w-10 h-10 rounded-full border border-[#45055B]/30 flex items-center justify-center text-[#45055B] hover:bg-[#45055B] hover:text-[#D4AF37] transition-all duration-300 shadow-sm"
                >
                  <WhatsAppIcon className="w-4.5 h-4.5" />
                </a>
              </div>
            </div>

            {/* Column 2: QUICK LINKS */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-xs md:text-sm font-bold tracking-[0.14em] uppercase text-[#45055B] mb-2 font-serif">QUICK LINKS</h3>
              <Link to="/" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">Home</Link>
              <Link to="/category/all" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">Shop All</Link>
              <Link to="/category/Necklaces" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">Necklaces</Link>
              <Link to="/category/Earrings" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">Earrings</Link>
              <Link to="/category/Bangles" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">Bangles</Link>
              <Link to="/category/Rings" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">Rings</Link>
              <Link to="/category/Bracelets" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">Bracelets</Link>
              <Link to="/category/Hair%20Accessories" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">Hair Accessories</Link>
              <Link to="/category/Lifestyle%20Products" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">Lifestyle Products</Link>
            </div>

            {/* Column 3: CUSTOMER SERVICE */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-xs md:text-sm font-bold tracking-[0.14em] uppercase text-[#45055B] mb-2 font-serif">CUSTOMER SERVICE</h3>
              <Link to="/about" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">About Us</Link>
              <Link to="/my-orders" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">Track Order</Link>
              <Link to="/shipping-policy" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">Shipping Policy</Link>
              <Link to="/returns-policy" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">Return & Refund Policy</Link>
              <Link to="/terms-of-service" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">Terms & Conditions</Link>
              <Link to="/privacy-policy" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">Privacy Policy</Link>
              <Link to="/contact#faq-section" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">FAQ's</Link>
              <Link to="/contact" className="text-xs md:text-sm text-[#45055B]/80 hover:text-[#B38827] transition-colors">Contact Us</Link>
            </div>

            {/* Column 4: CONTACT US */}
            <div className="flex flex-col gap-3">
              <h3 className="text-xs md:text-sm font-bold tracking-[0.14em] uppercase text-[#45055B] mb-2 font-serif">CONTACT US</h3>
              
              <div className="flex items-start gap-2.5 text-xs md:text-sm text-[#45055B]/80">
                <MapPin className="w-4 h-4 text-[#45055B] shrink-0 mt-0.5" />
                <span className="leading-relaxed">H.No. 3-6-555/7, 1st Floor, Nizampet Road, Kukatpally, Hyderabad - 500072, Telangana, India.</span>
              </div>

              <div className="flex items-center gap-2.5 text-xs md:text-sm text-[#45055B]/80">
                <Phone className="w-4 h-4 text-[#45055B] shrink-0" />
                <a href="tel:9014863411" className="hover:text-[#B38827] transition-colors">+91 9014863411</a>
              </div>

              <div className="flex items-center gap-2.5 text-xs md:text-sm text-[#45055B]/80">
                <Mail className="w-4 h-4 text-[#45055B] shrink-0" />
                <a href="mailto:lydiaglobalexim@gmail.com" className="hover:text-[#B38827] transition-colors">lydiaglobalexim@gmail.com</a>
              </div>
            </div>

          </div>

          {/* Bottom Copyright Bar */}
          <div className="mt-10 pt-6 border-t border-[#45055B]/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#45055B]/60">
            <p>© {new Date().getFullYear()} Lydia Global Exim. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/privacy-policy" className="hover:text-[#45055B] transition-colors">Privacy Policy</Link>
              <span>•</span>
              <Link to="/terms-of-service" className="hover:text-[#45055B] transition-colors">Terms & Conditions</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
