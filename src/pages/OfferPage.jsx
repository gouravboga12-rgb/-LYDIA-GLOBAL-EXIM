import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { ProductCard } from '../components/ProductCard';
import { useStoreData } from '../store/useStoreData';



export function OfferPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { products, offers, loading } = useStoreData();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF6F0]">
        <div className="w-8 h-8 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
      </div>
    );
  }

  const activeOffer = offers?.find(o => o.id.toString() === id && o.is_active);
  
  if (!activeOffer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FAF6F0] text-[#45055B]">
        <h2 className="text-2xl font-serif font-bold mb-2">Offer Not Found</h2>
        <p className="mb-6 opacity-70">This offer has expired or does not exist.</p>
        <button onClick={() => navigate('/')} className="bg-[#45055B] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#D4AF37] transition-colors">
          Return to Home
        </button>
      </div>
    );
  }

  // Filter products for this specific offer
  const offerProducts = products.filter(p => p.offer_id && p.offer_id.toString() === id);

  return (
    <div className="bg-[#FAF6F0] min-h-screen pb-20">
      <Header title={`Offer: ${activeOffer.title}`} showShare={true} />
      
      {/* Offer Banner */}
      <div className="reveal-on-scroll w-full bg-gradient-to-br from-[#45055B] via-[#5A0E72] to-[#26002B] relative overflow-hidden shadow-2xl border-b border-[#D4AF37]/30">
        {/* Decorative silk sheen elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8F2BAE]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center p-10 md:px-12 md:py-16 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-[#D4AF37] text-[#45055B] font-extrabold tracking-widest text-xs px-5 py-1.5 rounded-full mb-4 uppercase shadow-lg">
            ✨ Special Offer ✨
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 text-white tracking-wide drop-shadow-md">
            {activeOffer.title}
          </h1>
          <div className="bg-[#45055B]/60 backdrop-blur-md border border-[#D4AF37]/30 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <p className="text-[#D4AF37] font-sans text-xs font-bold uppercase tracking-widest mb-1">Get up to</p>
            <p className="text-white text-5xl md:text-6xl font-bold font-serif leading-none mb-2 drop-shadow">
              {parseFloat(activeOffer.discount_percentage)}% <span className="text-2xl text-[#D4AF37]">OFF</span>
            </p>
            <p className="text-white/80 text-xs tracking-wider uppercase font-medium">On Selected Handcrafted Pieces</p>
          </div>
        </div>
      </div>
      
      {/* Breadcrumbs */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-2">
        <div className="flex items-center gap-2 text-xs md:text-sm text-[#45055B]/60 font-medium">
          <button onClick={() => navigate('/')} className="hover:text-[#45055B] transition-colors">Home</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#45055B] font-bold">{activeOffer.title}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="reveal-on-scroll flex items-center justify-between mb-6 border-b border-[#45055B]/10 pb-4">
          <h2 className="font-serif text-2xl font-bold text-[#45055B]">
            Eligible Products <span className="text-[#45055B]/50 text-base font-sans ml-2">({offerProducts.length})</span>
          </h2>
        </div>

        {offerProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {offerProducts.map((product, pIdx) => (
              <div key={product.id} className={`reveal-on-scroll reveal-delay-${(pIdx % 4) + 1}`}>
                <ProductCard product={product} layout="grid" />
              </div>
            ))}
          </div>
        ) : (
          <div className="reveal-on-scroll flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#45055B]/10 mb-4">
              <span className="text-3xl">📿</span>
            </div>
            <h3 className="text-xl font-bold text-[#45055B] mb-2">No products found</h3>
            <p className="text-[#45055B]/60 max-w-md">There are currently no products available under this offer.</p>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
