import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Share2 } from 'lucide-react';
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
      color: product.color || "",
      images: product.images || (product.image_url ? [product.image_url] : []),
      sizes: product.sizes ? product.sizes.map(s => ({ size: s.size, mrp: s.price, our_price: s.price })) : []
    }];
  }

  let firstVariant = variants[0] || { color: "", images: [], sizes: [] };
  let matched = null;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    matched = variants.find(v => v.code?.toLowerCase().includes(q) || v.color?.toLowerCase().includes(q));
    if (matched) {
      firstVariant = matched;
    }
  }
  const firstImg = (firstVariant.images && firstVariant.images.length > 0) 
    ? firstVariant.images[0] 
    : (product.images && product.images.length > 0 ? product.images[0] : product.image_url);
  const defaultSize = firstVariant.sizes && firstVariant.sizes.length > 0 
    ? { ...firstVariant.sizes[0], stock: firstVariant.sizes[0].stock ?? product.stock ?? 0 } 
    : { size: 'Standard', mrp: 0, our_price: 0, stock: product.stock ?? 0 };
  
  const originalPrice = Number(defaultSize.mrp) || Number(defaultSize.our_price) || 0;
  let displayPrice = Number(defaultSize.our_price) || originalPrice;

  // Calculate offer price (check per-size offer too)
  let activeOffer = null;
  if (defaultSize.offer_id) {
    activeOffer = offers?.find(o => o.id == defaultSize.offer_id && o.is_active);
  } else if (product.offer_id) {
    activeOffer = offers?.find(o => o.id === product.offer_id && o.is_active);
  }
  if (activeOffer) {
    displayPrice = Math.round(originalPrice - (originalPrice * (activeOffer.discount_percentage / 100)));
  }

  // Compute total stock across all variants/sizes
  const totalStock = variants.reduce((sum, v) => {
    const sizes = v.sizes && v.sizes.length > 0 ? v.sizes : [];
    return sum + sizes.reduce((s2, sz) => s2 + (Number(sz.stock) || 0), 0);
  }, product.stock !== undefined ? Number(product.stock) : 0);
  const isOutOfStock = totalStock <= 0 || (defaultSize.stock !== undefined && Number(defaultSize.stock) <= 0 && variants.length === 1 && (!firstVariant.sizes || firstVariant.sizes.length <= 1));

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
    await addToCart(product, { ...defaultSize, price: displayPrice, stock: defaultSize.stock, image: firstImg }, 1, firstVariant.color);
  };

  const handleBuyNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    await addToCart(product, { ...defaultSize, price: displayPrice, stock: defaultSize.stock, image: firstImg }, 1, firstVariant.color);
    navigate('/checkout');
  };

  const handleCardClick = () => {
    const queryParam = firstVariant.code ? `?variantCode=${encodeURIComponent(firstVariant.code)}` : '';
    navigate(`/product/${product.id}${queryParam}`);
  };

  // Determine reviews average
  let avgRating = 4.5;
  let reviewCount = 12; // default mock
  if (product.reviews && product.reviews.length > 0) {
    const total = product.reviews.reduce((acc, r) => acc + r.rating, 0);
    avgRating = (total / product.reviews.length).toFixed(1);
    reviewCount = product.reviews.length;
  }

  if (layout === 'list') {
    return (
      <Link to={`/product/${product.id}${firstVariant.code ? `?variantCode=${encodeURIComponent(firstVariant.code)}` : ''}`} className="flex gap-4 p-4 bg-white rounded-xl shadow-sm mb-4 relative hover:shadow-md transition-shadow">
        <div className="w-28 h-28 sm:w-36 sm:h-36 bg-[#2A0845] rounded-xl flex-shrink-0 p-0 relative border border-[#D4AF37]/20 flex items-center justify-center overflow-hidden shadow-inner">
          <img src={firstImg} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col justify-center flex-grow">
          <div className="flex justify-between items-start pr-24">
            <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-snug mb-1">{product.name}</h3>
          </div>
          
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
            <span className="text-[10px] font-medium text-gray-500">{avgRating} ({reviewCount})</span>
            {variants.length > 1 ? (
              <>
                <span className="text-[10px] font-medium text-gray-300 px-1">•</span>
                <span className="text-[10px] font-medium text-brand-dark-blue">{variants.length} Colors</span>
              </>
            ) : (firstVariant || defaultSize) && (
              <>
                <span className="text-[10px] font-medium text-gray-300 px-1">•</span>
                <span className="text-[10px] font-medium text-gray-500 line-clamp-1">
                  {defaultSize?.code || firstVariant?.code || firstVariant?.color}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between mt-auto pt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-gray-900">₹{displayPrice}</span>
              {(activeOffer || originalPrice > displayPrice) && (
                <span className="text-[10px] text-gray-400 line-through">₹{originalPrice}</span>
              )}
              <div className="flex items-center gap-1 ml-2">
                <span className="text-[9px] text-[#2A0845] font-bold bg-[#2A0845]/10 px-1.5 py-0.5 rounded">{defaultSize.size}</span>
                {firstVariant.sizes?.length > 1 && (
                  <span className="text-[9px] text-gray-500 font-medium whitespace-nowrap">+{firstVariant.sizes.length - 1} sizes</span>
                )}
              </div>
            </div>
            {isOutOfStock ? (
              <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-md">Out of Stock</span>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={handleAddToCart} className="py-1.5 px-3 text-[11px] font-bold rounded-lg border border-[#2A0845] text-[#2A0845] hover:bg-[#2A0845] hover:text-white transition-colors">
                  Add to Cart
                </button>
                <button onClick={handleBuyNow} className="py-1.5 px-3 text-[11px] font-bold rounded-lg bg-[#2A0845] text-white hover:bg-[#D4AF37] transition-colors">
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
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#2A0845] text-[#2A0845]' : 'text-gray-400'}`} />
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
      className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.03)] border border-[#2A0845]/10 cursor-pointer transition-all duration-300 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-1 h-full p-3 relative"
    >
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
        <button onClick={handleWishlist} className="p-1.5 hover:scale-110 transition-transform bg-white/90 rounded-full shadow-sm">
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#2A0845] text-[#2A0845]' : 'text-gray-400'}`} />
        </button>
        <button onClick={handleShare} className="p-1.5 hover:scale-110 transition-transform bg-white/90 rounded-full shadow-sm">
          <Share2 className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="relative aspect-square w-full bg-[#2A0845] overflow-hidden rounded-xl mb-3 flex items-center justify-center p-0 border border-[#D4AF37]/20 shadow-inner">
        {activeOffer && (
          <div className="absolute top-2 left-2 z-10 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
            {parseFloat(activeOffer.discount_percentage)}% OFF
          </div>
        )}
        {firstImg ? (
          <img
            src={firstImg}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">No Image</div>
        )}
      </div>

      <div className="flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-1.5">
          <h3 className="text-xs md:text-sm font-semibold text-gray-800 line-clamp-2 leading-snug">{product.name}</h3>
        </div>
        
        <div className="flex items-center gap-1 mb-2">
          <Star className="w-3.5 h-3.5 fill-brand-gold text-brand-gold" />
          <span className="text-[10px] font-medium text-gray-500">{avgRating} ({reviewCount})</span>
          {variants.length > 1 ? (
             <>
               <span className="text-[10px] font-medium text-gray-300 px-1">•</span>
               <span className="text-[10px] font-medium text-brand-dark-blue">{variants.length} Colors</span>
             </>
          ) : (firstVariant || defaultSize) && (
            <>
              <span className="text-[10px] font-medium text-gray-300 px-1">•</span>
              <span className="text-[10px] font-medium text-gray-500 line-clamp-1">
                {defaultSize?.code || firstVariant?.code || firstVariant?.color}
              </span>
            </>
          )}
        </div>

        {isOutOfStock ? (
          <div className="mt-auto pt-1 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-[#2A0845] font-bold bg-[#2A0845]/10 px-1.5 py-0.5 rounded w-fit">{defaultSize.size}</span>
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
                <span className="text-[9px] text-[#2A0845] font-bold bg-[#2A0845]/10 px-1.5 py-0.5 rounded w-fit">{defaultSize.size}</span>
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

            {/* Dual Action Buttons: Add to Cart & Buy Now */}
            <div className="flex flex-col sm:grid sm:grid-cols-2 gap-1.5 mt-1">
              <button
                onClick={handleAddToCart}
                className="w-full py-1.5 md:py-2 px-2 text-[11px] md:text-xs font-bold rounded-xl border border-[#2A0845]/30 text-[#2A0845] hover:bg-[#2A0845] hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 bg-white whitespace-nowrap"
              >
                <ShoppingCart className="w-3.5 h-3.5 shrink-0" />
                <span>Add to Cart</span>
              </button>
              <button
                onClick={handleBuyNow}
                className="w-full py-1.5 md:py-2 px-2 text-[11px] md:text-xs font-bold rounded-xl bg-gradient-to-r from-[#2A0845] to-[#4C1D95] hover:from-[#D4AF37] hover:to-[#B38827] text-white transition-all flex items-center justify-center gap-1 shadow-sm active:scale-95 whitespace-nowrap"
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
