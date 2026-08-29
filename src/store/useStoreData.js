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

      const liveProducts = prodsRes.data && prodsRes.data.length > 0 ? prodsRes.data : defaultProducts;
      const liveCategories = catsRes.data && catsRes.data.length > 0 ? catsRes.data : defaultCategories;
      const liveOffers = offersRes.data && offersRes.data.length > 0 ? offersRes.data : defaultOffers;

      set({
        products: liveProducts,
        categories: liveCategories,
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
