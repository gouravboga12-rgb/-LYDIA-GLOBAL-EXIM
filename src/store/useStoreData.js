import { create } from 'zustand';
import defaultProducts from '../data/products.json';
import defaultCategories from '../data/categories.json';
import defaultOffers from '../data/offers.json';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || "";

export const useStoreData = create((set) => ({
  products: defaultProducts || [],
  categories: defaultCategories || [],
  offers: defaultOffers || [],
  loading: false,
  fetchData: async () => {
    if (!BACKEND_URL) {
      set({
        products: defaultProducts,
        categories: defaultCategories,
        offers: defaultOffers,
        loading: false
      });
      return;
    }

    try {
      set({ loading: false });
      const [prodRes, catRes, offerRes] = await Promise.all([
        fetch(`${BACKEND_URL}/general/products`).catch(() => null),
        fetch(`${BACKEND_URL}/general/categories`).catch(() => null),
        fetch(`${BACKEND_URL}/general/offers`).catch(() => null)
      ]);

      const prodData = prodRes && prodRes.ok ? await prodRes.json() : null;
      const catData = catRes && catRes.ok ? await catRes.json() : null;
      const offerData = offerRes && offerRes.ok ? await offerRes.json() : null;

      set({
        products: (prodData && prodData.products && prodData.products.length > 0) ? prodData.products : defaultProducts,
        categories: (catData && catData.categories && catData.categories.length > 0) ? catData.categories : defaultCategories,
        offers: (offerData && offerData.offers && offerData.offers.length > 0) ? offerData.offers : defaultOffers,
        loading: false
      });
    } catch (err) {
      console.warn("Using offline store data fallback:", err.message);
      set({
        products: defaultProducts,
        categories: defaultCategories,
        offers: defaultOffers,
        loading: false
      });
    }
  }
}));

