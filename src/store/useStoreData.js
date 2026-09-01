import { create } from 'zustand';
import { supabase } from '../utils/supabase';
import defaultProducts from '../data/products.json';
import defaultCategories from '../data/categories.json';
import defaultOffers from '../data/offers.json';

export const useStoreData = create((set) => ({
  products: defaultProducts || [],
  categories: defaultCategories || [],
  offers: defaultOffers || [],
  loading: false,
  fetchData: async () => {
    try {
      const [prodsRes, catsRes, offersRes] = await Promise.all([
        supabase.from('products').select('*').order('id', { ascending: false }),
        supabase.from('categories').select('*').order('id', { ascending: true }),
        supabase.from('offers').select('*').eq('active', true)
      ]);

      let liveProducts = prodsRes.data && prodsRes.data.length > 0 ? prodsRes.data : defaultProducts;
      let liveCategories = catsRes.data && catsRes.data.length > 0 ? catsRes.data : defaultCategories;
      let liveOffers = offersRes.data && offersRes.data.length > 0 ? offersRes.data : defaultOffers;

      // If supabase didn't return products, attempt fallback to local backend API
      if (!prodsRes.data || prodsRes.data.length === 0) {
        try {
          const apiRes = await fetch('/api/general/products');
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (apiData.products && apiData.products.length > 0) {
              liveProducts = apiData.products;
            }
          }
        } catch (e) {}
      }

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
