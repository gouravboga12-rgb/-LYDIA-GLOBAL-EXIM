import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useWishlistStore } from '../store/useWishlistStore';
import { useCartStore } from '../store/useCartStore';
import { useStoreData } from '../store/useStoreData';

export function ProductCard({ product, layout = 'grid', searchQuery = '' }) {
  const navigate = useNavigate();
  const { toggleWishlist, items: wishlistItems } = useWishlistStore();
  const { addToCart } = useCartStore();
  const { offers } = useStoreData();

  const isWishlisted = wishlistItems.includes(product.id);

  // Fallback for older product structure
  let variants = product.variants;
  if (!variants || variants.length === 0) {
    variants = [{
      color: product.color || "Gold",
      images: product.images || (product.image_url ? [product.image_url] : []),
      sizes: product.sizes ? product.sizes.map(s => ({ size: s.size, mrp: s.price, our_price: s.price })) : []
    }];
  }

  let firstVariant = variants[0] || { color: "", images: [], sizes: [] };
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    const matched = variants.find(v => v.code?.toLowerCase().includes(q) || v.color?.toLowerCase().includes(q));
    if (matched) {
      firstVariant = matched;
    }
  }

  // Extract all media files (photos + videos) for this product
  const allMediaList = useMemo(() => {
    const list = [];
    if (firstVariant.images && Array.isArray(firstVariant.images)) {
      firstVariant.images.forEach(m => { if (m && !list.includes(m)) list.push(m); });
    }
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(m => { if (m && !list.includes(m)) list.push(m); });
    }
    if (product.image_url && !list.includes(product.image_url)) {
      list.unshift(product.image_url);
    }
    if (Array.isArray(variants)) {
      variants.forEach(v => {
        if (Array.isArray(v.images)) {
          v.images.forEach(m => { if (m && !list.includes(m)) list.push(m); });
        }
      });
    }
    return list.filter(Boolean);
  }, [product, variants, firstVariant]);

  const [currentMediaIdx, setCurrentMediaIdx] = useState(0);
  const activeMedia = allMediaList[currentMediaIdx] || allMediaList[0] || product.image_url;
  const isVideo = activeMedia && (/\.(mp4|webm|mov|avi|mkv|3gp)($|\?)/i.test(activeMedia) || activeMedia.includes('/video/upload/'));

  const handlePrevMedia = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMediaIdx(prev => (prev === 0 ? allMediaList.length - 1 : prev - 1));
  };

  const handleNextMedia = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMediaIdx(prev => (prev === allMediaList.length - 1 ? 0 : prev + 1));
  };

  const defaultSize = firstVariant.sizes && firstVariant.sizes.length > 0 
    ? { ...firstVariant.sizes[0], stock: firstVariant.sizes[0].stock ?? 10 } 
    : { size: 'Standard', mrp: 0, our_price: 0, stock: 10 };
  
  const originalPrice = Number(defaultSize.mrp) || Number(defaultSize.our_price) || 0;
  let displayPrice = Number(defaultSize.our_price) || originalPrice;

  // Calculate offer price
  let activeOffer = null;
  if (defaultSize.offer_id) {
    activeOffer = offers?.find(o => o.id == defaultSize.offer_id && (o.active ?? o.is_active ?? true));
  } else if (product.offer_id) {
    activeOffer = offers?.find(o => o.id === product.offer_id && (o.active ?? o.is_active ?? true));
  }
  if (activeOffer) {
    displayPrice = Math.round(originalPrice - (originalPrice * (activeOffer.discount_percentage / 100)));
  }

  // Compute total stock across all variants/sizes
  const hasVariantsWithSizes = variants.some(v => v.sizes && v.sizes.length > 0);
  const totalStock = hasVariantsWithSizes
    ? variants.reduce((sum, v) => {
        const sizes = v.sizes && v.sizes.length > 0 ? v.sizes : [];
        return sum + sizes.reduce((s2, sz) => s2 + (Number(sz.stock) || 0), 0);
      }, 0)
    : Number(product.stock !== undefined ? product.stock : 10);

  const isOutOfStock = totalStock <= 0;

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/product/${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch (err) {}
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    await addToCart(product, { ...defaultSize, price: displayPrice, stock: defaultSize.stock, image: activeMedia }, 1, firstVariant.color);
  };

  const handleBuyNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    await addToCart(product, { ...defaultSize, price: displayPrice, stock: defaultSize.stock, image: activeMedia }, 1, firstVariant.color);
    navigate('/checkout');
  };

  const handleCardClick = () => {
    const queryParam = firstVariant.code ? `?variantCode=${encodeURIComponent(firstVariant.code)}` : '';
    navigate(`/product/${product.id}${queryParam}`);
  };

  // Determine reviews average
  let avgRating = product.rating ? Number(product.rating).toFixed(1) : "4.8";
  let reviewCount = 0;
  if (product.reviews && product.reviews.length > 0) {
    const total = product.reviews.reduce((acc, r) => acc + Number(r.rating || 5), 0);
    avgRating = (total / product.reviews.length).toFixed(1);
    reviewCount = product.reviews.length;
  }

  if (layout === 'list') {
    return (
      <Link to={`/product/${product.id}${firstVariant.code ? `?variantCode=${encodeURIComponent(firstVariant.code)}` : ''}`} className="flex gap-4 p-4 bg-white rounded-xl shadow-sm mb-4 relative hover:shadow-md transition-shadow">
        <div className="w-28 h-28 sm:w-36 sm:h-36 bg-[#45055B] rounded-xl flex-shrink-0 p-0 relative border border-[#D4AF37]/20 flex items-center justify-center overflow-hidden shadow-inner">
          {isVideo ? (
            <video src={activeMedia} muted loop autoPlay playsInline className="w-full h-full object-cover" />
          ) : (
            <img src={activeMedia} alt={product.name} className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex flex-col justify-center flex-grow">
          <div className="flex justify-between items-start pr-24">
            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-1">{product.name}</h3>
          </div>
          
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-semibold text-gray-700">
              {avgRating} {reviewCount > 0 && <span className="text-gray-400 font-normal">({reviewCount})</span>}
            </span>
            {variants.length > 1 && (
              <>
                <span className="text-[10px] font-medium text-gray-300 px-0.5">•</span>
                <span className="text-[10px] font-bold text-brand-dark-blue">{variants.length} Colors</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between mt-auto pt-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-[#45055B]">₹{displayPrice}</span>
                {originalPrice > displayPrice && (
                  <span className="text-xs line-through text-gray-400">₹{originalPrice}</span>
                )}
              </div>
            </div>
            {isOutOfStock ? (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-md">Out of Stock</span>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={handleAddToCart} className="py-1.5 px-3 text-[11px] font-bold rounded-lg border border-[#45055B] text-[#45055B] hover:bg-[#45055B] hover:text-white transition-colors">
                  Add to Cart
                </button>
                <button onClick={handleBuyNow} className="py-1.5 px-3 text-[11px] font-bold rounded-lg bg-[#45055B] text-white hover:bg-[#D4AF37] transition-colors">
                  Buy Now
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="absolute top-3 right-3 flex flex-row gap-2 z-10">
          <button 
            onClick={handleWishlist}
            className="p-1.5 bg-white/80 rounded-full shadow-sm text-gray-400 hover:scale-110 transition-transform"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#45055B] text-[#45055B]' : 'text-gray-400'}`} />
          </button>
          <button 
            onClick={handleShare}
            className="p-1.5 bg-white/80 rounded-full shadow-sm text-gray-400 hover:scale-110 transition-transform"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </Link>
    );
  }

  return (
    <div 
      onClick={handleCardClick}
      className="group relative bg-white rounded-2xl p-3 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between cursor-pointer border border-[#45055B]/10 hover:border-[#45055B]/30"
    >
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <button onClick={handleWishlist} className="p-1.5 hover:scale-110 transition-transform bg-white/90 rounded-full shadow-sm">
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#45055B] text-[#45055B]' : 'text-gray-400'}`} />
        </button>
        <button onClick={handleShare} className="p-1.5 hover:scale-110 transition-transform bg-white/90 rounded-full shadow-sm">
          <Share2 className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="relative aspect-square w-full bg-[#45055B] overflow-hidden rounded-xl mb-3 flex items-center justify-center p-0 border border-[#D4AF37]/30 shadow-inner group/media">
        {activeOffer ? (
          <div className="absolute top-2.5 left-2.5 z-10 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-sm">
            {parseFloat(activeOffer.discount_percentage)}% OFF
          </div>
        ) : (
          <div className="absolute top-2.5 left-2.5 z-10 bg-[#45055B]/90 text-[#D4AF37] text-[9px] font-bold px-2 py-0.5 rounded border border-[#D4AF37]/40 tracking-wider shadow-sm backdrop-blur-xs">
            NEW
          </div>
        )}

        {/* Media rendering (Image or Video) */}
        {activeMedia ? (
          isVideo ? (
            <div className="w-full h-full relative bg-slate-950 flex items-center justify-center">
              <video
                src={activeMedia}
                muted
                loop
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/70 text-amber-300 text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                VIDEO
              </div>
            </div>
          ) : (
            <img
              src={activeMedia}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">No Image</div>
        )}

        {/* Left & Right Arrow Navigation for Multiple Media Files */}
        {allMediaList.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevMedia}
              aria-label="Previous image"
              className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-all opacity-85 md:opacity-0 group-hover/media:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMedia}
              aria-label="Next image"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-all opacity-85 md:opacity-0 group-hover/media:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Slide dots indicator */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-xs pointer-events-none">
              {allMediaList.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 rounded-full transition-all ${idx === currentMediaIdx ? 'w-3 bg-amber-400' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1.5">
          <h3 className="text-xs md:text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">{product.name}</h3>
        </div>
        
        <div className="flex items-center gap-1.5 mb-2">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="text-[11px] font-semibold text-gray-700">
            {avgRating} {reviewCount > 0 && <span className="text-gray-400 font-normal">({reviewCount})</span>}
          </span>
          {variants.length > 1 && (
            <>
              <span className="text-[10px] font-medium text-gray-300 px-0.5">•</span>
              <span className="text-[10px] font-bold text-brand-dark-blue">{variants.length} Colors</span>
            </>
          )}
        </div>

        {isOutOfStock ? (
          <div className="mt-auto pt-1 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#45055B] font-bold bg-[#45055B]/10 px-1.5 py-0.5 rounded w-fit">{defaultSize.size}</span>
              <span className="text-sm font-bold text-gray-400 line-through">₹{displayPrice}</span>
            </div>
            <button disabled className="w-full py-2 bg-gray-100 text-gray-400 font-bold text-xs rounded-xl cursor-not-allowed">
              Out of Stock
            </button>
          </div>
        ) : (
          <div className="mt-auto pt-1 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] text-[#45055B] font-bold bg-[#45055B]/10 px-1.5 py-0.5 rounded w-fit">{defaultSize.size}</span>
                {firstVariant.sizes?.length > 1 && (
                  <span className="text-[9px] text-gray-500 font-medium whitespace-nowrap">+{firstVariant.sizes.length - 1} sizes</span>
                )}
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm md:text-base font-bold text-gray-900 leading-none">₹{displayPrice}</span>
                {(activeOffer || originalPrice > displayPrice) && (
                  <span className="text-[10px] text-gray-400 line-through leading-none">₹{originalPrice}</span>
                )}
              </div>
            </div>

            {/* Dual Action Buttons */}
            <div className="flex flex-col gap-1.5 mt-2">
              <button
                onClick={handleAddToCart}
                className="w-full py-2 px-3 text-xs font-bold rounded-xl border border-[#45055B]/30 text-[#45055B] hover:bg-[#45055B] hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95 bg-white whitespace-nowrap cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                <span>Add to Cart</span>
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-gradient-to-r from-[#45055B] to-[#70148D] hover:from-[#D4AF37] hover:to-[#B38827] text-white transition-all flex items-center justify-center gap-1 shadow-xs active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <span>Buy Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
