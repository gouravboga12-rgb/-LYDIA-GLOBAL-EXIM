import { create } from 'zustand';
import { supabase } from '../utils/supabase';
import defaultProducts from '../data/products.json';
import defaultCategories from '../data/categories.json';
import defaultOffers from '../data/offers.json';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/api';

export const useStoreData = create((set) => ({
  products: defaultProducts || [],
  categories: defaultCategories || [],
  offers: defaultOffers || [],
  loading: false,
  fetchData: async () => {
    try {
      let liveProducts = null;
      let liveCategories = null;
      let liveOffers = null;

      // 1. Fetch live updated data from Supabase Cloud PostgreSQL
      try {
        const [sbProds, sbCats, sbOffers] = await Promise.all([
          supabase.from('products').select('*').order('id', { ascending: false }),
          supabase.from('categories').select('*').order('id', { ascending: true }),
          supabase.from('offers').select('*').eq('active', true)
        ]);

        if (sbProds.data && sbProds.data.length > 0) {
          liveProducts = sbProds.data;
        }
        if (sbCats.data && sbCats.data.length > 0) {
          liveCategories = sbCats.data;
        }
        if (sbOffers.data && sbOffers.data.length > 0) {
          liveOffers = sbOffers.data;
        }
      } catch (sbErr) {
        console.warn("Supabase fetch note:", sbErr);
      }

      // 2. If any data wasn't available from Supabase, query Backend REST API
      if (!liveProducts || !liveCategories || !liveOffers) {
        try {
          const [catsRes, prodsRes, offersRes] = await Promise.all([
            !liveCategories ? fetch(`${BACKEND_URL}/general/categories`).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null),
            !liveProducts ? fetch(`${BACKEND_URL}/general/products`).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null),
            !liveOffers ? fetch(`${BACKEND_URL}/general/offers`).then(r => r.ok ? r.json() : null).catch(() => null) : Promise.resolve(null),
          ]);

          if (!liveCategories && catsRes?.categories?.length > 0) {
            liveCategories = catsRes.categories;
          }
          if (!liveProducts && prodsRes?.products?.length > 0) {
            liveProducts = prodsRes.products;
          }
          if (!liveOffers && offersRes?.offers?.length > 0) {
            liveOffers = offersRes.offers;
          }
        } catch (apiErr) {
          console.warn("Backend REST fetch note:", apiErr);
        }
      }

      // 3. Fallback to bundled defaults
      liveProducts = liveProducts || defaultProducts || [];
      liveCategories = liveCategories || defaultCategories || [];
      liveOffers = liveOffers || defaultOffers || [];

      const normalizedCategories = (liveCategories || []).map(c => ({
        ...c,
        image_url: c.image_url && c.image_url.startsWith('/images/') && !c.image_url.includes('?v=')
          ? `${c.image_url}?v=lifestyle_bag_11`
          : c.image_url
      }));

      set({
        products: liveProducts,
        categories: normalizedCategories,
        offers: liveOffers,
        loading: false
      });
    } catch (err) {
      console.warn("Using standalone catalog fallback:", err.message);
      set({
        products: defaultProducts,
        categories: defaultCategories,
        offers: defaultOffers,
        loading: false
      });
    }
  }
}));


