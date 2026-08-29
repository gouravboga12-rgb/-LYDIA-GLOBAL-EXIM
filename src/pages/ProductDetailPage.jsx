import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Share2, Heart, ShoppingCart, Star, ShieldCheck, Droplet, Feather, Check, ChevronLeft, ChevronRight, User, Truck, RotateCcw, Layers, PlayCircle } from 'lucide-react';
import { Header } from '../components/Header';

function InstagramIcon({ className }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.01" fill="currentColor" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}
import { ProductCard } from '../components/ProductCard';
import { ImageZoom } from '../components/ImageZoom';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';
import { useWishlistStore } from '../store/useWishlistStore';
import { useStoreData } from '../store/useStoreData';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const variantCode = searchParams.get('variantCode');
  const { products, loading, fetchData } = useStoreData();
  const product = products.find(p => p.id.toString() === id);
  const { addToCart } = useCartStore();
  const { toggleWishlist, items: wishlistItems } = useWishlistStore();
  const { user } = useAuthStore();
  
  // Backwards compatibility for old product formats
  let variants = product?.variants;
  if (product && (!variants || variants.length === 0)) {
    variants = [{
      color: product.color || "",
      images: product.images || (product.image_url ? [product.image_url] : []),
      sizes: product.sizes ? product.sizes.map(s => ({ size: s.size, mrp: s.price, our_price: s.price })) : []
    }];
  }

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  
  const isWishlisted = product ? wishlistItems.includes(product.id) : false;
  
  const { offers } = useStoreData();
  const activeOffer = product?.offer_id ? offers?.find(o => o.id === product.offer_id && o.is_active) : null;
  
  const container = useRef(null);
  const [mainImg, setMainImg] = useState(null);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const API_URL = import.meta.env.VITE_BACKEND_URL || '/api';

  // Determine Related Products
  const relatedProducts = product ? products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4) : [];

  useEffect(() => {
    // Reset state when ID changes
    setMainImg(null);
    setSelectedVariant(null);
    setSelectedSize(null);
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (variants && variants.length > 0 && !selectedVariant) {
      let match = null;
      if (variantCode) {
        // Try matching variant code first
        match = variants.find(v => v.code === variantCode) ||
                variants.find(v => (v.color || '').toLowerCase().trim() === variantCode.toLowerCase().trim());
        // If no variant match, try matching by size code
        if (!match) {
          match = variants.find(v => (v.sizes || []).some(s => s.code === variantCode));
          if (match) {
            const matchedSize = match.sizes.find(s => s.code === variantCode);
            if (matchedSize) setTimeout(() => setSelectedSize(matchedSize), 0);
          }
        }
      }
      setSelectedVariant(match || variants[0]);
    }
  }, [variants, selectedVariant, variantCode]);

  useEffect(() => {
    if (selectedVariant && selectedVariant.sizes && selectedVariant.sizes.length > 0) {
      const firstSize = selectedVariant.sizes[0];
      setSelectedSize(firstSize);
      if (firstSize.code) setSearchParams({ variantCode: firstSize.code }, { replace: true });
      else if (selectedVariant.code) setSearchParams({ variantCode: selectedVariant.code }, { replace: true });
      else if (selectedVariant.color) setSearchParams({ variantCode: selectedVariant.color }, { replace: true });
    } else {
      setSelectedSize(null);
    }
    
    if (selectedVariant && selectedVariant.images && selectedVariant.images.length > 0) {
      setMainImg(selectedVariant.images[0]);
    } else {
      setMainImg(null);
    }
  }, [selectedVariant]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) return;
    setReviewSubmitting(true);
    try {
      await fetch(`${API_URL}/general/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm)
      });
      setReviewSuccess(true);
      setReviewForm({ name: '', rating: 5, comment: '' });
      fetchData();
    } catch (e) {}
    setReviewSubmitting(false);
  };

  useGSAP(() => {
    if (product && !loading) {
      gsap.from('.animate-image', {
        x: -40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        clearProps: 'all'
      });
      
      gsap.from('.animate-info', {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        clearProps: 'all'
      });
    }
  }, { scope: container, dependencies: [product, loading, id] });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-beige">
        <div className="w-10 h-10 border-4 border-brand-dark-blue/20 border-t-brand-dark-blue rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-beige text-brand-dark-blue">
        <h2 className="text-2xl font-serif font-bold mb-2">Product Not Found</h2>
        <p className="mb-6 opacity-70">The jewelry piece you're looking for doesn't exist.</p>
        <button onClick={() => navigate('/')} className="bg-brand-dark-blue text-brand-gold px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
          Return to Collections
        </button>
      </div>
    );
  }

  const getDisplayPrice = (original) => {
    if (activeOffer) return Math.round(original - (original * (activeOffer.discount_percentage / 100)));
    return original;
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) return false;
    const sizeToUse = selectedSize || { size: 'Standard', mrp: 0, our_price: 0, stock: currentStock };
    const priceToUse = getDisplayPrice(Number(sizeToUse.our_price) || Number(sizeToUse.mrp) || 0);
    const itemColor = selectedVariant?.color || product.color;
    const variantImage = selectedVariant?.images?.[0] || product.image_url;
    return await addToCart(
      product,
      { ...sizeToUse, price: priceToUse, image: variantImage, size_code: sizeToUse.code, stock: currentStock },
      quantity,
      itemColor
    );
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    const success = await handleAddToCart();
    if (success) {
      navigate('/cart');
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product.id);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, url });
      } catch (err) {}
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };



  const productImages = selectedVariant?.images || [];
  const productSizes = selectedVariant?.sizes || [];
  
  const currentMrp = selectedSize ? (Number(selectedSize.mrp) || Number(selectedSize.our_price)) : 0;
  const currentOurPrice = selectedSize ? (Number(selectedSize.our_price) || currentMrp) : 0;
  const displayPrice = getDisplayPrice(currentOurPrice);
  
  const currentStock = selectedSize && selectedSize.stock !== undefined 
    ? Number(selectedSize.stock) 
    : Number(product.stock || 0);
  const isOutOfStock = currentStock <= 0;

  let avgRating = 0;
  let reviewCount = 0;
  let reviews = product.reviews || [];
  if (typeof reviews === 'string') {
    try { reviews = JSON.parse(reviews); } catch(e) { reviews = []; }
  }
  if (!Array.isArray(reviews)) reviews = [];
  if (reviews.length > 0) {
    const total = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
    avgRating = (total / reviews.length).toFixed(1);
    reviewCount = reviews.length;
  }

  return (
    <div ref={container} className="min-h-screen bg-brand-beige font-sans pb-28 md:pb-12">
      <Header showShare={true} />
      
      {/* Breadcrumbs */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-4 md:pt-10 md:pb-8">
        <div className="flex items-center gap-2 text-xs md:text-sm text-brand-dark-blue/60 font-medium">
          <button onClick={() => navigate('/')} className="hover:text-brand-dark-blue transition-colors">Home</button>
          <ChevronRight className="w-3 h-3" />
          <button onClick={() => navigate('/category/all')} className="hover:text-brand-dark-blue transition-colors">Collections</button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-brand-dark-blue line-clamp-1">{product.name}</span>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-4 md:px-8">
        <div className="md:grid md:grid-cols-12 md:gap-12 lg:gap-16 items-start">
          
          {/* Left: Product Image Gallery */}
          <div className="md:col-span-5 animate-image mb-8 md:mb-0 md:sticky md:top-32">
            <div className="w-full aspect-square relative rounded-2xl overflow-hidden shadow-sm bg-white">
              {product.is_bestseller && !activeOffer && (
                <div className="absolute top-4 left-4 bg-brand-gold text-brand-dark-blue text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-sm">
                  Bestseller
                </div>
              )}
              {activeOffer && (
                <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-sm">
                  {parseFloat(activeOffer.discount_percentage)}% OFF
                </div>
              )}
              {mainImg ? (
                <div className="w-full h-full p-4">
                  <ImageZoom 
                    src={mainImg} 
                    alt={product.name} 
                    className="w-full h-full rounded-xl" 
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">No Image Available</div>
              )}
              {/* Arrow Buttons */}
              {productImages.length > 1 && (
                <>
                  <button
                    onClick={() => setMainImg(productImages[(productImages.indexOf(mainImg) - 1 + productImages.length) % productImages.length])}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 border border-brand-gold/20 shadow flex items-center justify-center hover:bg-white transition z-10"
                  >
                    <ChevronLeft className="w-5 h-5 text-brand-dark-blue" />
                  </button>
                  <button
                    onClick={() => setMainImg(productImages[(productImages.indexOf(mainImg) + 1) % productImages.length])}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 border border-brand-gold/20 shadow flex items-center justify-center hover:bg-white transition z-10"
                  >
                    <ChevronRight className="w-5 h-5 text-brand-dark-blue" />
                  </button>
                </>
              )}
            </div>
            
            {/* Thumbnails */}
            {productImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto hide-scrollbar mt-4 pb-2">
                {productImages.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setMainImg(img)}
                    className={`w-20 h-20 bg-white rounded-xl overflow-hidden flex-shrink-0 transition-all ${mainImg === img ? 'border-2 border-brand-dark-blue shadow-sm' : 'border-2 border-transparent opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Info & Actions */}
          <div className="md:col-span-7 space-y-8 pb-8">
            
            {/* Header Info */}
            <div className="animate-info space-y-2">
              <h1 className="text-3xl md:text-[40px] font-serif font-bold text-brand-dark-blue leading-tight">
                {product.name}
              </h1>
              {(selectedSize?.code || selectedVariant?.code) && (
                <p className="text-gray-500 font-mono text-sm tracking-wider">CODE: {selectedSize?.code || selectedVariant?.code}</p>
              )}
              
              {reviewCount > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center text-brand-gold">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < Math.floor(avgRating) ? 'fill-current' : ''}`} />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500 font-medium">
                    {avgRating} ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </div>
              )}
            </div>

            <div className="animate-info">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl md:text-5xl font-bold text-brand-dark-blue">₹{displayPrice.toLocaleString()}
                </span>
                {(activeOffer || currentMrp > currentOurPrice) && (
                  <span className="text-xl md:text-2xl font-bold text-gray-400 line-through">₹{currentMrp.toLocaleString()}
                  </span>
                )}
              </div>
              {currentStock > 0 && currentStock <= 5 && (
                <p className="text-sm font-bold text-red-500 mt-2 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Only {currentStock} left in stock!
                </p>
              )}
              {isOutOfStock && (
                <p className="text-sm font-bold text-red-600 mt-2 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-red-600" />
                  Out of Stock
                </p>
              )}
            </div>


            {/* <div className="animate-info">
              <h3 className="font-bold text-brand-dark-blue text-lg mb-2">About this product</h3>
              <p className="text-brand-dark-blue/70 leading-relaxed font-medium">
                {product.description || "Beautifully crafted jewelry piece, perfect for any occasion. Made with premium materials to ensure lasting elegance and durability."}
              </p>
            </div> */}

            {/* Variants Selection */}
            <div className="animate-info space-y-6">
              
              {/* Colors */}
              {variants && variants.length > 1 && (
                <div>
                  <h3 className="font-bold text-brand-dark-blue text-lg mb-3">Color: <span className="text-brand-gold">{selectedVariant?.color}</span></h3>
                  <div className="flex gap-3 flex-wrap">
                    {variants.map((v, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setSelectedVariant(v); setSearchParams(v.code ? { variantCode: v.code } : { variantCode: v.color || idx }, { replace: true }); }}
                        className={`px-4 py-2 rounded-xl border-2 font-bold transition-colors ${
                          selectedVariant === v ? 'border-brand-dark-blue bg-brand-dark-blue text-white' : 'border-gray-200 bg-white text-brand-dark-blue hover:border-brand-dark-blue/50'
                        }`}
                      >
                        {v.color || `Variant ${idx+1}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sizes */}
              {productSizes && productSizes.length > 0 && (
                <div>
                  <h3 className="font-bold text-brand-dark-blue text-lg mb-3">Select Size</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {productSizes.map((sizeObj, idx) => {
                      const isSelected = selectedSize?.size === sizeObj.size;
                      const szMrp = Number(sizeObj.mrp) || Number(sizeObj.our_price);
                      const szOur = Number(sizeObj.our_price) || szMrp;
                      const displaySzPrice = getDisplayPrice(szOur);
                      
                      const szStock = sizeObj.stock !== undefined ? Number(sizeObj.stock) : Number(product.stock || 0);
                      const isSzOutOfStock = szStock <= 0;
                      
                      return (
                        <button
                          key={idx}
                          onClick={() => { setSelectedSize(sizeObj); if (sizeObj.code) setSearchParams({ variantCode: sizeObj.code }, { replace: true }); }}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 relative ${
                            isSelected 
                              ? 'border-brand-dark-blue bg-brand-dark-blue/5' 
                              : 'border-brand-dark-blue/10 bg-transparent hover:border-brand-dark-blue/30'
                          } ${isSzOutOfStock ? 'opacity-60' : ''}`}
                        >
                          <span className={`font-bold text-base ${isSelected ? 'text-brand-dark-blue' : 'text-brand-dark-blue/80'}`}>{sizeObj.size}</span>
                          <span className={`font-bold mt-1 ${isSelected ? 'text-brand-gold' : 'text-brand-dark-blue/50'}`}>₹{displaySzPrice}</span>
                          {(szMrp > szOur || activeOffer) && (
                            <span className="text-[10px] line-through text-gray-400">₹{szMrp}</span>
                          )}
                          {isSzOutOfStock ? (
                            <span className="absolute top-1 right-1 text-[8px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">Sold Out</span>
                          ) : szStock <= 5 && szStock > 0 ? (
                            <span className="absolute top-1 right-1 text-[8px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded">{szStock} left</span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div>
                <h3 className="font-bold text-brand-dark-blue text-lg mb-3">Quantity</h3>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))} 
                    disabled={isOutOfStock}
                    className="w-12 h-12 rounded-xl bg-white text-brand-dark-blue font-bold text-xl flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors border border-gray-100 disabled:opacity-50"
                  >-</button>
                  <span className="w-12 text-center font-bold text-brand-dark-blue text-xl">{isOutOfStock ? 0 : quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(quantity + 1, currentStock))} 
                    disabled={isOutOfStock || quantity >= currentStock}
                    className="w-12 h-12 rounded-xl bg-white text-brand-dark-blue font-bold text-xl flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors border border-gray-100 disabled:opacity-50"
                  >+</button>
                </div>
                {currentStock > 0 && currentStock <= 5 && (
                  <p className="text-xs text-red-500 font-bold mt-2">Only {currentStock} left in stock!</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="animate-info flex items-center gap-3 md:gap-4 pt-4">
              <button 
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={`hidden md:flex flex-1 font-bold py-4 rounded-xl items-center justify-center gap-2 shadow-md transition-all text-lg ${
                  isOutOfStock 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-brand-dark-blue text-brand-gold hover:bg-brand-dark-blue/90 shadow-brand-dark-blue/20'
                }`}
              >
                <ShoppingCart className="w-5 h-5" /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
              
              <button 
                onClick={handleWishlist}
                className="flex-1 md:flex-none md:w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100 hover:scale-105 transition-transform flex-shrink-0 group"
              >
                <Heart className={`w-6 h-6 transition-colors ${isWishlisted ? 'fill-brand-gold text-brand-gold' : 'text-brand-dark-blue group-hover:text-brand-gold'}`} />
                <span className="md:hidden ml-2 font-bold text-sm text-brand-dark-blue">Wishlist</span>
              </button>
              
              <button 
                onClick={handleShare}
                className="flex-1 md:flex-none md:w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100 hover:scale-105 transition-transform flex-shrink-0 group"
              >
                <Share2 className="w-5 h-5 text-brand-dark-blue group-hover:text-brand-gold transition-colors" />
                <span className="md:hidden ml-2 font-bold text-sm text-brand-dark-blue">Share</span>
              </button>

              {(product.instagram_reel_url || selectedVariant?.instagram_link) && (
                <button 
                  onClick={() => window.open(product.instagram_reel_url || selectedVariant?.instagram_link, '_blank', 'noopener,noreferrer')}
                  title="Watch Instagram Reel"
                  className="flex-1 md:flex-none md:w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100 hover:scale-105 transition-transform flex-shrink-0 group"
                >
                  <InstagramIcon className="w-5 h-5 text-[#E1306C] group-hover:scale-110 transition-transform" />
                  <span className="md:hidden ml-2 font-bold text-sm text-[#E1306C]">Reel</span>
                </button>
              )}
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[
                // { icon: <Truck className="w-4 h-4 text-brand-gold" />, label: 'Free Shipping' },
                // { icon: <RotateCcw className="w-4 h-4 text-brand-gold" />, label: '7 Days Return' },
                { icon: <ShieldCheck className="w-4 h-4 text-brand-gold" />, label: 'Tarnish Free' },
                { icon: <Droplet className="w-4 h-4 text-brand-gold" />, label: 'Waterproof' },
                { icon: <Feather className="w-4 h-4 text-brand-gold" />, label: 'Hypoallergenic' },
                { icon: <Layers className="w-4 h-4 text-brand-gold" />, label: 'PVD Plated' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 bg-white rounded-xl px-3 py-2.5 border border-brand-gold/10">
                  {icon}
                  <span className="text-xs font-semibold text-brand-dark-blue">{label}</span>
                </div>
              ))}
            </div>

            {/* Product Details Tabs */}
            <div className="reveal-on-scroll bg-white rounded-2xl shadow-sm border border-brand-beige/50 overflow-hidden mt-8">
              <div className="flex border-b border-gray-100">
                <button 
                  onClick={() => setActiveTab('description')}
                  className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'description' ? 'text-brand-dark-blue border-b-2 border-brand-gold bg-brand-dark-blue/5' : 'text-gray-400 hover:text-brand-dark-blue'}`}
                >
                  Description
                </button>
                <button 
                  onClick={() => setActiveTab('details')}
                  className={`flex-1 py-4 text-sm font-bold transition-colors border-l border-gray-100 ${activeTab === 'details' ? 'text-brand-dark-blue border-b-2 border-brand-gold bg-brand-dark-blue/5' : 'text-gray-400 hover:text-brand-dark-blue'}`}
                >
                  Details
                </button>
                <button 
                  onClick={() => setActiveTab('care')}
                  className={`flex-1 py-4 text-sm font-bold transition-colors border-l border-gray-100 ${activeTab === 'care' ? 'text-brand-dark-blue border-b-2 border-brand-gold bg-brand-dark-blue/5' : 'text-gray-400 hover:text-brand-dark-blue'}`}
                >
                  Care Tips
                </button>
              </div>
              
              <div className="p-6">
                {activeTab === 'description' && (
                  <p className="text-sm text-brand-dark-blue/80 leading-relaxed font-medium whitespace-pre-wrap">
                    {product.description || "No description available."}
                  </p>
                )}
                
                {activeTab === 'details' && (() => {
                  const productDetails = product.details || [];
                  return productDetails.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {productDetails.map((detail, i) => (
                        <div key={i} className="flex items-center py-3 gap-4">
                          <span className="text-xs font-bold text-brand-dark-blue/50 uppercase tracking-wider w-32 shrink-0">{detail.label}</span>
                          <span className="text-sm text-brand-dark-blue font-medium">{detail.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm py-2 border-b border-gray-100">
                        <Check className="w-4 h-4 text-brand-gold shrink-0" />
                        <span className="text-brand-dark-blue/80 font-medium">Premium craftsmanship</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm py-2 border-b border-gray-100">
                        <Check className="w-4 h-4 text-brand-gold shrink-0" />
                        <span className="text-brand-dark-blue/80 font-medium">Skin-friendly materials</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm py-2">
                        <Check className="w-4 h-4 text-brand-gold shrink-0" />
                        <span className="text-brand-dark-blue/80 font-medium">Comes in luxury packaging</span>
                      </div>
                    </div>
                  );
                })()}

                {activeTab === 'care' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs md:text-sm">
                      <div className="p-3 bg-[#FAF6F0] rounded-xl border border-brand-gold/20 flex items-start gap-2.5">
                        <span className="text-base">🧴</span>
                        <div>
                          <strong className="text-brand-dark-blue block font-bold">Avoid Sprays & Perfumes</strong>
                          <span className="text-gray-600">Always wear your jewelry after applying makeup, lotions, and perfumes.</span>
                        </div>
                      </div>
                      <div className="p-3 bg-[#FAF6F0] rounded-xl border border-brand-gold/20 flex items-start gap-2.5">
                        <span className="text-base">💧</span>
                        <div>
                          <strong className="text-brand-dark-blue block font-bold">Keep Away from Moisture</strong>
                          <span className="text-gray-600">Remove jewelry before bathing, showering, swimming, or workouts.</span>
                        </div>
                      </div>
                      <div className="p-3 bg-[#FAF6F0] rounded-xl border border-brand-gold/20 flex items-start gap-2.5">
                        <span className="text-base">✨</span>
                        <div>
                          <strong className="text-brand-dark-blue block font-bold">Wipe After Wear</strong>
                          <span className="text-gray-600">Gently clean with a soft, dry micro-fiber cloth to preserve the polish.</span>
                        </div>
                      </div>
                      <div className="p-3 bg-[#FAF6F0] rounded-xl border border-brand-gold/20 flex items-start gap-2.5">
                        <span className="text-base">📦</span>
                        <div>
                          <strong className="text-brand-dark-blue block font-bold">Airtight Storage</strong>
                          <span className="text-gray-600">Store individually in dry zip-lock pouches or velvet jewelry boxes.</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center p-2 pt-2 border-t border-gray-100">
                      <img src="/images/inst.png" alt="Jewelry Care Tips" className="max-w-full h-auto rounded-lg shadow-sm" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Reviews — always visible below tabs */}
            <div className="reveal-on-scroll bg-white rounded-2xl shadow-sm border border-brand-beige/50 overflow-hidden mt-6">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-brand-dark-blue text-lg">
                  Customer Reviews
                  {reviews.length > 0 && <span className="ml-2 text-brand-gold">({reviews.length})</span>}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                {reviews.length > 0 ? (
                  reviews.map((rev, idx) => (
                    <div key={idx} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-dark-blue/10 flex items-center justify-center text-brand-dark-blue">
                            <User className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-brand-dark-blue text-sm">{rev.name}</span>
                        </div>
                        <div className="flex text-brand-gold">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-gray-300'}`} />
                          ))}
                        </div>
                      </div>

                      {(rev.color || rev.size) && (
                        <div className="flex gap-2 mt-1 mb-1">
                          {rev.color && <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold">{rev.color}</span>}
                          {rev.size && <span className="text-[9px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-bold">{rev.size}</span>}
                        </div>
                      )}

                      <p className="text-sm text-gray-600 mt-1">{rev.comment}</p>
                      {rev.date && <p className="text-[10px] text-gray-400 mt-1">{new Date(rev.date).toLocaleDateString()}</p>}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No reviews yet.</p>
                )}
              </div>
              {/* Write a Review */}
              {(product.allow_reviews ?? true) && (
                <div className="px-6 pb-6 border-t border-gray-100 pt-5">
                  {!user ? (
                    <div className="text-center py-4">
                      <p className="text-sm text-brand-dark-blue/60 mb-3">Please login to share your review</p>
                      <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2.5 bg-brand-dark-blue text-brand-gold font-bold rounded-xl text-sm hover:bg-brand-dark-blue/90 transition"
                      >
                        Login to Review
                      </button>
                    </div>
                  ) : reviewSuccess ? (
                    <p className="text-green-600 text-sm font-semibold text-center py-2">✓ Thank you for your review!</p>
                  ) : (
                    <>
                      <h4 className="font-bold text-brand-dark-blue mb-4">Share Your Review</h4>
                      <form onSubmit={handleReviewSubmit} className="space-y-3">
                        <input
                          required
                          placeholder="Your name"
                          value={reviewForm.name}
                          onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm border border-brand-gold/20 rounded-xl focus:outline-none focus:border-brand-gold"
                        />
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-brand-dark-blue/60">Rating:</span>
                          {[1,2,3,4,5].map(star => (
                            <button type="button" key={star} onClick={() => setReviewForm({ ...reviewForm, rating: star })}>
                              <Star className={`w-5 h-5 ${star <= reviewForm.rating ? 'fill-brand-gold text-brand-gold' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                        <textarea
                          required
                          rows={3}
                          placeholder="Write your review..."
                          value={reviewForm.comment}
                          onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                          className="w-full px-4 py-2.5 text-sm border border-brand-gold/20 rounded-xl focus:outline-none focus:border-brand-gold resize-none"
                        />
                        <button
                          type="submit"
                          disabled={reviewSubmitting}
                          className="w-full py-3 bg-brand-dark-blue text-brand-gold font-bold rounded-xl hover:bg-brand-dark-blue/90 transition text-sm disabled:opacity-60"
                        >
                          {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* People Also Bought Section */}
      {relatedProducts.length > 0 && (
        <div className="reveal-on-scroll w-full max-w-7xl mx-auto px-4 md:px-8 mt-16 md:mt-24 mb-12">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-brand-dark-blue">
             Customers Also Bought
            </h2>
            <button onClick={() => navigate('/category/all')} className="text-sm font-bold text-brand-gold hover:underline hidden md:block">
              View All
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {relatedProducts.map((relProduct, rIdx) => (
              <div key={relProduct.id} className={`reveal-on-scroll reveal-delay-${(rIdx % 4) + 1}`}>
                <ProductCard product={relProduct} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Sticky Buy Bar */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-brand-beige p-4 flex gap-3 z-[60] md:hidden pb-safe">
        <button 
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`flex-1 border-2 font-bold py-3.5 rounded-xl shadow-sm text-sm ${
            isOutOfStock 
              ? 'border-gray-300 text-gray-500 cursor-not-allowed'
              : 'border-brand-dark-blue text-brand-dark-blue'
          }`}
        >
          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
        </button>
        <button 
          onClick={handleBuyNow}
          disabled={isOutOfStock}
          className={`flex-1 font-bold py-3.5 rounded-xl shadow-md text-sm ${
            isOutOfStock
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-brand-dark-blue text-brand-gold'
          }`}
        >
          Buy Now
        </button>
      </div>

    </div>
  );
}
