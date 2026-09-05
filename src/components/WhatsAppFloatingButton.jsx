import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

const WHATSAPP_NUMBER = '919014863411';

export function WhatsAppFloatingButton() {
  const [hovered, setHovered] = useState(false);
  const location = useLocation();

  // Don't show in admin portal
  if (location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleClick = () => {
    let prefilledText = 'Hello Lydia Global Exim, I would like to enquire about your exquisite jewelry collection.';
    
    if (location.pathname === '/about') {
      prefilledText = 'Hello Lydia Global Exim, I was reading your story on the About page and would like to learn more about your brand and products.';
    } else if (location.pathname === '/contact') {
      prefilledText = 'Hello Lydia Global Exim Support, I would like to connect with your team regarding an enquiry.';
    }

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(prefilledText)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-20 md:bottom-8 right-4 md:right-8 z-40 flex items-center gap-2.5">
      {/* Tooltip on hover (desktop) */}
      <div 
        className={`hidden md:flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-brand-dark-blue font-bold text-xs py-2 px-3.5 rounded-2xl shadow-lg border border-brand-gold/20 transition-all duration-300 pointer-events-none ${
          hovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}
      >
        <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
        <span>Chat on WhatsApp</span>
      </div>

      {/* WhatsApp Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label="Chat with Lydia Global Exim on WhatsApp"
        className="relative group w-13 h-13 md:w-14 md:h-14 bg-gradient-to-tr from-[#128C7E] via-[#25D366] to-[#25D366] text-white rounded-full shadow-[0_8px_25px_rgba(37,211,102,0.45)] hover:shadow-[0_12px_32px_rgba(37,211,102,0.65)] hover:-translate-y-1 active:scale-95 transition-all duration-300 flex items-center justify-center cursor-pointer border-2 border-white/80"
      >
        {/* Subtle glowing ring */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-30 group-hover:opacity-60 blur-sm transition-opacity duration-300 animate-pulse" />
        
        {/* Official WhatsApp SVG Icon */}
        <svg 
          className="w-7 h-7 md:w-8 md:h-8 relative z-10 fill-current drop-shadow-sm" 
          viewBox="0 0 24 24"
        >
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.96.524 1.831.799 2.796.8 3.183 0 5.768-2.587 5.769-5.766.001-3.182-2.585-5.786-5.769-5.786zm3.364 8.163c-.141.398-.711.758-1.047.818-.335.06-.729.074-2.146-.514-1.637-.68-2.695-2.336-2.776-2.446-.082-.11-1.258-1.674-1.258-3.193 0-1.52.796-2.27 1.078-2.576.282-.307.615-.384.82-.384.205 0 .41.002.59.011.19.009.444-.072.694.529.256.617.873 2.13.95 2.285.077.154.129.334.026.54-.103.205-.154.334-.308.514-.154.18-.324.402-.462.539-.154.153-.314.32-.135.628.18.307.8 1.32 1.716 2.137 1.179 1.05 2.174 1.376 2.482 1.53.308.154.488.128.667-.077.18-.205.77-0.898.975-1.206.205-.308.41-.257.693-.154.282.102 1.795.847 2.103 1.001.308.154.513.23.59.36.077.128.077.744-.064 1.142z" />
          <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984 0 1.757.458 3.473 1.328 4.981l-1.41 5.155 5.275-1.383c1.455.794 3.097 1.231 4.8 1.232h.004c5.505 0 9.99-4.478 9.991-9.986 0-2.668-1.04-5.176-2.928-7.063-1.889-1.888-4.397-2.929-7.07-2.93zm0 18.257h-.003c-1.517 0-3.006-.408-4.305-1.18l-.309-.183-3.203.84.855-3.123-.2-.319c-.85-1.352-1.299-2.923-1.298-4.528.001-4.551 3.704-8.254 8.259-8.254 2.206 0 4.279.86 5.838 2.42 1.56 1.56 2.418 3.635 2.417 5.842-.001 4.553-3.704 8.256-8.254 8.256z" />
        </svg>

        {/* Mobile Green Online Dot */}
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center p-0.5 shadow-sm">
          <span className="w-full h-full bg-green-500 rounded-full" />
        </span>
      </button>
    </div>
  );
}
