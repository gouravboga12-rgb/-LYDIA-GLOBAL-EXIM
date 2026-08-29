import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useToastStore } from './useToastStore';

function validateCouponAgainstCart(coupon, items) {
  if (!coupon) return null;
  const cartQty = items.reduce((s, i) => s + i.qty, 0);
  const cartValue = items.reduce((s, i) => s + ((i.variant?.price || i.product?.price || 0) * i.qty), 0);
  if (coupon.min_type === 'qty' && cartQty < (coupon.min_qty || 0)) {
    useToastStore.getState().showToast(`Coupon removed: need at least ${coupon.min_qty} item(s)`, 'error');
    return null;
  }
  if (coupon.min_type !== 'qty' && cartValue < (coupon.min_order_value || 0)) {
    useToastStore.getState().showToast(`Coupon removed: minimum order \u20b9${coupon.min_order_value} required`, 'error');
    return null;
  }
  return coupon;
}
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      deliveryCharge: 0,
      appliedCoupon: null,
      
      addToCart: async (product, variant, qty = 1, color) => {
        if (!product || !product.id) return false;

        const variantWithColor = { ...variant, color: color || variant?.color || product?.color || '' };
        const state = get();
        const existingItem = state.items.find(
          (i) => i.product.id === product.id && i.variant?.size === variantWithColor?.size && i.variant?.color === variantWithColor?.color
        );
        const existingQty = existingItem ? existingItem.qty : 0;
        const requestedTotalQty = existingQty + qty;

        // Determine stock locally first
        let localStock = variant?.stock !== undefined && variant?.stock !== null ? Number(variant.stock) : Number(product?.stock || 0);

        if (localStock <= 0) {
          useToastStore.getState().showToast('This item is out of stock', 'error');
          return false;
        }

        if (existingQty >= localStock) {
          useToastStore.getState().showToast(`Maximum available stock (${localStock}) already in your cart`, 'error');
          return false;
        }

        // Real-time backend stock validation
        try {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || "/api";
          const res = await fetch(`${backendUrl}/general/check-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: [{
                product: { id: product.id, name: product.name },
                variant: { color: variantWithColor.color, size: variantWithColor.size },
                qty: requestedTotalQty
              }]
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (!data.available && data.unavailable && data.unavailable.length > 0) {
              const unavail = data.unavailable[0];
              const serverAvailable = unavail.available !== undefined ? Number(unavail.available) : 0;

              if (serverAvailable <= 0) {
                useToastStore.getState().showToast('This item is out of stock', 'error');
                return false;
              }

              if (existingQty >= serverAvailable) {
                useToastStore.getState().showToast(`Maximum available stock (${serverAvailable}) already in your cart`, 'error');
                return false;
              }

              localStock = serverAvailable;
            }
          }
        } catch (err) {
          console.warn("Real-time stock check failed, relying on local stock:", err);
        }

        let addedSuccessfully = false;
        set((prevState) => {
          const existingItemIndex = prevState.items.findIndex(
            (i) => i.product.id === product.id && i.variant?.size === variantWithColor?.size && i.variant?.color === variantWithColor?.color
          );

          if (existingItemIndex > -1) {
            const newItems = [...prevState.items];
            const currentQty = newItems[existingItemIndex].qty;
            if (currentQty >= localStock) {
              return prevState;
            }
            const newQty = Math.min(currentQty + qty, localStock);
            newItems[existingItemIndex].qty = newQty;
            addedSuccessfully = true;
            if (currentQty + qty > localStock) {
              useToastStore.getState().showToast(`Only ${localStock} in stock. Adjusted quantity in cart.`, 'error');
            } else {
              useToastStore.getState().showToast(`Added ${product.name} to cart!`);
            }
            return { items: newItems };
          }

          const addQty = Math.min(qty, localStock);
          addedSuccessfully = true;
          if (qty > localStock) {
            useToastStore.getState().showToast(`Only ${localStock} in stock. Added available quantity to cart.`, 'error');
          } else {
            useToastStore.getState().showToast(`Added ${product.name} to cart!`);
          }
          return { items: [...prevState.items, { product, variant: variantWithColor, qty: addQty }] };
        });

        return addedSuccessfully;
      },
      
      removeFromCart: (productId, variant) => set((state) => {
        const newItems = state.items.filter(item => !(item.product.id === productId && item.variant?.size === variant?.size && item.variant?.color === variant?.color));
        return { items: newItems, appliedCoupon: validateCouponAgainstCart(state.appliedCoupon, newItems) };
      }),
      
      updateQuantity: (productId, variant, qty) => set((state) => {
        const stock = variant?.stock !== undefined ? Number(variant.stock) : 0;
        const cappedQty = stock > 0 ? Math.min(qty, stock) : qty;
        let newItems;
        if (cappedQty <= 0) {
          newItems = state.items.filter(item => !(item.product.id === productId && item.variant?.size === variant?.size && item.variant?.color === variant?.color));
        } else {
          newItems = state.items.map(item =>
            (item.product.id === productId && item.variant?.size === variant?.size && item.variant?.color === variant?.color) ? { ...item, qty: cappedQty } : item
          );
        }
        return { items: newItems, appliedCoupon: validateCouponAgainstCart(state.appliedCoupon, newItems) };
      }),

      clearCart: () => set({ items: [], appliedCoupon: null }),

      applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
      removeCoupon: () => set({ appliedCoupon: null }),

      getSubtotal: () => {
        return get().items.reduce((sum, item) => {
          const price = item.variant?.price || item.product.price || 0;
          return sum + (price * item.qty);
        }, 0);
      },

      getTotalSavings: () => {
        return get().items.reduce((sum, item) => {
          const originalPrice = item.variant?.originalPrice || item.product.originalPrice;
          const currentPrice = item.variant?.price || item.product.price;
          if (originalPrice && originalPrice > currentPrice) {
            return sum + ((originalPrice - currentPrice) * item.qty);
          }
          return sum;
        }, 0);
      },

      getDiscount: () => {
        const subtotal = get().getSubtotal();
        const coupon = get().appliedCoupon;
        if (!coupon) return 0;
        
        const cartItems = get().items;
        let eligibleSubtotal = 0;
        
        const hasCatTarget = coupon.applicable_categories && coupon.applicable_categories.length > 0;
        const hasCodeTarget = coupon.applicable_product_codes && coupon.applicable_product_codes.length > 0;
        
        if (hasCatTarget || hasCodeTarget) {
          cartItems.forEach(item => {
            let isEligible = false;
            if (hasCatTarget && coupon.applicable_categories.includes(item.category)) {
              isEligible = true;
            }
            if (hasCodeTarget && coupon.applicable_product_codes.includes(item.code)) {
              isEligible = true;
            }
            if (isEligible) {
              const currentPrice = item.our_price && item.our_price > 0 ? item.our_price : item.mrp;
              eligibleSubtotal += (currentPrice * (item.qty || 1));
            }
          });
        } else {
          eligibleSubtotal = subtotal; // No restrictions, applies to all
        }
        
        if (eligibleSubtotal <= 0) return 0;

        let discount = 0;
        const discountValue = Number(coupon.discount_value) || 0;
        if (coupon.discount_type === 'percentage') {
          discount = eligibleSubtotal * (discountValue / 100);
        } else {
          discount = discountValue; // flat amount
        }
        return discount > eligibleSubtotal ? eligibleSubtotal : discount;
      },

      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().getDiscount();
        return subtotal > 0 ? (subtotal - discount) + get().deliveryCharge : 0;
      }
    }),
    {
      name: 'pooja-cart-storage',
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        deliveryCharge: 0
      })
    }
  )
);
