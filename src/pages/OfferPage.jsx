import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Tag, Sparkles, Percent } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomNav } from '../components/BottomNav';
import { ProductCard } from '../components/ProductCard';
import { useStoreData } from '../store/useStoreData';

export function OfferPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const { products, offers, loading } = useStoreData();
  
  const activeOffers = (offers || []).filter(o => Boolean(o.active ?? o.is_active ?? true));
  
  // If id is provided and not 'all', find that specific offer, otherwise find first or null
  const selectedOffer = id && id !== 'all' 
    ? activeOffers.find(o => String(o.id) === String(id)) 
    : (activeOffers.length === 1 ? activeOffers[0] : null);

  const isAllSales = !id || id === 'all' || !selectedOffer;

  // Filter products for this specific offer or all sale items
  const offerProducts = (products || []).filter(p => {
    if (!p) return false;
    
    if (selectedOffer) {
      const offerIdStr = String(selectedOffer.id);
      
      // 1. Direct offer_id on product
      if (p.offer_id && String(p.offer_id) === offerIdStr) return true;
      
      // 2. Check sizes on product
      if (Array.isArray(p.sizes) && p.sizes.some(s => s && String(s.offer_id) === offerIdStr)) return true;
      
      // 3. Check variants & sizes
      if (Array.isArray(p.variants)) {
        const hasVariantOffer = p.variants.some(v => 
          Array.isArray(v.sizes) && v.sizes.some(s => s && String(s.offer_id) === offerIdStr)
        );
        if (hasVariantOffer) return true;
      }
      
      // 4. Check applied_products or applied_category from selectedOffer
      if (selectedOffer.category && p.category && p.category.toLowerCase() === selectedOffer.category.toLowerCase()) return true;
      if (Array.isArray(selectedOffer.applied_products) && selectedOffer.applied_products.some(pid => String(pid) === String(p.id))) return true;
      if (Array.isArray(selectedOffer.applied_categories) && selectedOffer.applied_categories.some(c => c && p.category && c.toLowerCase() === p.category.toLowerCase())) return true;
      
      return false;
    } else {
      // Show all products that have ANY offer or discount or is_offer flag
      if (p.is_offer || p.specifications?.is_offer) return true;
      if (p.offer_id) return true;
      if (Array.isArray(p.sizes) && p.sizes.some(s => s && (s.offer_id || (s.mrp && s.mrp > s.our_price)))) return true;
      if (Array.isArray(p.variants)) {
        return p.variants.some(v => Array.isArray(v.sizes) && v.sizes.some(s => s && (s.offer_id || (s.mrp && s.mrp > s.our_price))));
      }
      // If product belongs to any active offer
      return activeOffers.some(o => {
        if (o.category && p.category && p.category.toLowerCase() === o.category.toLowerCase()) return true;
        if (Array.isArray(o.applied_products) && o.applied_products.some(pid => String(pid) === String(p.id))) return true;
        if (Array.isArray(o.applied_categories) && o.applied_categories.some(c => c && p.category && c.toLowerCase() === p.category.toLowerCase())) return true;
        return false;
      });
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF6F0]">
        <div className="w-8 h-8 border-4 border-[#D4AF37]/20 border-t-[#D4AF37] rounded-full animate-spin" />
      </div>
    );
  }

  const pageTitle = selectedOffer ? selectedOffer.title : "Exclusive Sale & Festive Offers";
  const discountText = selectedOffer ? `${parseFloat(selectedOffer.discount_percentage)}% OFF` : "Special Discounts";

  return (
    <div className="bg-[#FAF6F0] min-h-screen pb-20">
      <Header title={`Sale: ${pageTitle}`} showShare={true} />
      
      {/* Offer Banner */}
      <div className="w-full bg-gradient-to-br from-[#45055B] via-[#5A0E72] to-[#26002B] relative overflow-hidden shadow-2xl border-b border-[#D4AF37]/30">
        {/* Decorative silk sheen elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#8F2BAE]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#D4AF37]/15 rounded-full blur-3xl translate-y-1/4 -translate-x-1/4 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center p-8 md:px-12 md:py-14 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-[#D4AF37] text-[#45055B] font-extrabold tracking-widest text-xs px-5 py-1.5 rounded-full mb-3 uppercase shadow-lg">
            <Sparkles className="w-3.5 h-3.5" /> Special Promotional Offer
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-3 text-white tracking-wide drop-shadow-md">
            {pageTitle}
          </h1>
          <div className="bg-[#45055B]/70 backdrop-blur-md border border-[#D4AF37]/30 rounded-2xl p-4 sm:p-5 max-w-sm w-full shadow-2xl mt-2">
            <p className="text-[#D4AF37] font-sans text-xs font-bold uppercase tracking-widest mb-1">Limited Time Deal</p>
            <p className="text-white text-3xl sm:text-5xl font-bold font-serif leading-none mb-1.5 drop-shadow">
              {discountText}
            </p>
            <p className="text-white/80 text-xs tracking-wider uppercase font-medium">On Selected Handcrafted Jewelry</p>
          </div>
        </div>
      </div>

      {/* Offer Filter Tabs (If multiple active offers exist) */}
      {activeOffers.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => navigate('/sale')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-xs cursor-pointer ${
                isAllSales 
                  ? 'bg-[#45055B] text-white shadow-md' 
                  : 'bg-white text-[#45055B] border border-[#45055B]/15 hover:bg-[#FAF6F0]'
              }`}
            >
              All Offers ({activeOffers.length})
            </button>
            {activeOffers.map((offer) => {
              const isSelected = selectedOffer && String(selectedOffer.id) === String(offer.id);
              return (
                <button
                  key={offer.id}
                  onClick={() => navigate(`/offer/${offer.id}`)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-xs flex items-center gap-2 cursor-pointer ${
                    isSelected 
                      ? 'bg-[#45055B] text-white shadow-md' 
                      : 'bg-white text-[#45055B] border border-[#45055B]/15 hover:bg-[#FAF6F0]'
                  }`}
                >
                  <span>{offer.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                    isSelected ? 'bg-[#D4AF37] text-[#45055B]' : 'bg-red-100 text-red-700'
                  }`}>
                    {parseFloat(offer.discount_percentage)}% OFF
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Breadcrumbs */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-2">
        <div className="flex items-center gap-2 text-xs md:text-sm text-[#45055B]/60 font-medium">
          <Link to="/" className="hover:text-[#45055B] transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#45055B] font-bold">{pageTitle}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
        <div className="flex items-center justify-between mb-6 border-b border-[#45055B]/10 pb-4">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#45055B]">
            Eligible Products <span className="text-[#45055B]/50 text-base font-sans ml-2">({offerProducts.length})</span>
          </h2>
        </div>

        {offerProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {offerProducts.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} layout="grid" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-[#45055B]/10 p-8 shadow-xs">
            <div className="w-16 h-16 bg-[#FAF6F0] rounded-2xl flex items-center justify-center shadow-xs border border-[#45055B]/10 mb-4 text-[#45055B]">
              <Tag className="w-7 h-7 text-[#45055B]/60" />
            </div>
            <h3 className="text-xl font-bold text-[#45055B] mb-2 font-serif">Products Coming Soon</h3>
            <p className="text-sm text-[#45055B]/60 max-w-md mb-6">
              Our handcrafted collection for <strong>{pageTitle}</strong> is being prepared. Check back shortly or browse all categories!
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/category/all" className="bg-[#45055B] text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#D4AF37] transition-colors shadow-sm">
                Explore All Products
              </Link>
              <Link to="/" className="bg-[#FAF6F0] border border-[#45055B]/20 text-[#45055B] px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-[#FAF6F0]/80 transition-colors">
                Return to Home
              </Link>
            </div>
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
