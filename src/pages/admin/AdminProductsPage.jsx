import React, { useEffect, useState } from "react";
import { Package, Plus, Trash2, Edit2, X, Save, Upload, Search, Film, Video, Image, Play, Sparkles, Tag, Layers } from "lucide-react";
import { motion } from "framer-motion";
import defaultProducts from "../../data/products.json";
import defaultCategories from "../../data/categories.json";
import defaultOffers from "../../data/offers.json";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary";
import { supabase } from "../../utils/supabase";
import { useStoreData } from "../../store/useStoreData";
import { DeleteConfirmModal } from "../../components/admin/DeleteConfirmModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";

const isVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  return /\.(mp4|webm|mov|avi|mkv|3gp)($|\?)/i.test(url) || url.includes('/video/upload/');
};

export function AdminProductsPage() {
  const [products, setProducts] = useState(defaultProducts || []);
  const [categories, setCategories] = useState(defaultCategories || []);
  const [offers, setOffers] = useState(defaultOffers || []);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const initialFormData = { 
    name: "", description: "", product_code: "", instagram_reel_url: "", category: "", model: "", is_active: true, allow_reviews: true,
    variants: [
      { color: "Gold", instagram_link: "", images: [], sizes: [{ size: "Standard", mrp: "", our_price: "", stock: 10, stock_delta: "", code: "", weight: "", offer_id: "", notes: "" }] }
    ],
    details: [],
    reviews: []
  };

  const [formData, setFormData] = useState(initialFormData);
  
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [search, setSearch] = useState("");
  const [stockSort, setStockSort] = useState("none");
  const [offerFilter, setOfferFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sbProds, sbCats, sbOffers] = await Promise.all([
        supabase.from('products').select('*').order('id', { ascending: false }),
        supabase.from('categories').select('*').order('id', { ascending: true }),
        supabase.from('offers').select('*').order('id', { ascending: true })
      ]);

      let liveProducts = (sbProds.data && sbProds.data.length > 0) ? sbProds.data.map(p => {
        let variants = Array.isArray(p.variants) && p.variants.length > 0 ? p.variants : null;
        if (!variants) {
          const match = (defaultProducts || []).find(dp => dp.id === p.id || dp.name === p.name);
          variants = match?.variants || [{
            color: p.color || "Gold",
            images: Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []),
            sizes: [{ size: "Standard", mrp: p.mrp || p.price || 0, our_price: p.price || 0, stock: p.stock !== undefined ? p.stock : 10, code: p.sku || p.product_code || "" }]
          }];
        }
        return {
          ...p,
          variants: variants,
          sizes: variants[0]?.sizes || [],
          stock: p.stock !== undefined ? p.stock : 10
        };
      }) : null;
      let liveCategories = (sbCats.data && sbCats.data.length > 0) ? sbCats.data : null;
      let liveOffers = (sbOffers.data && sbOffers.data.length > 0) ? sbOffers.data : null;

      if (!liveOffers) {
        const res = await fetch(`${BACKEND_URL}/general/offers`).then(r => r.ok ? r.json() : null).catch(() => null);
        if (res?.offers?.length > 0) liveOffers = res.offers;
      }

      const normalizedOffers = (liveOffers || defaultOffers || []).map(o => ({
        ...o,
        active: o.active ?? o.is_active ?? true,
        is_active: o.active ?? o.is_active ?? true
      }));

      setProducts(liveProducts || defaultProducts || []);
      setCategories(liveCategories || defaultCategories || []);
      setOffers(normalizedOffers);
    } catch (err) {
      console.error(err);
      setProducts(defaultProducts || []);
      setCategories(defaultCategories || []);
      setOffers((defaultOffers || []).map(o => ({
        ...o,
        active: o.active ?? o.is_active ?? true,
        is_active: o.active ?? o.is_active ?? true
      })));
    } finally {
      setLoading(false);
    }
  };

  const [uploadingVariantIndex, setUploadingVariantIndex] = useState(null);
  const [uploadProgress, setUploadProgress] = useState("");

  const handleMediaUpload = async (e, variantIndex) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    setUploadingVariantIndex(variantIndex);
    setUploadProgress(`Uploading 1 of ${files.length}...`);
    
    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);
        const url = await uploadToCloudinary(files[i]);
        if (url) uploadedUrls.push(url);
      }
      
      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          variants: prev.variants.map((v, vi) => {
            if (vi !== variantIndex) return v;
            return {
              ...v,
              images: [...(v.images || []), ...uploadedUrls]
            };
          })
        }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload error: " + err.message);
    } finally {
      setUploading(false);
      setUploadingVariantIndex(null);
      setUploadProgress("");
      try { e.target.value = ""; } catch (e) {}
    }
  };

  const handleRemoveMedia = (variantIndex, mediaIndex) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, vi) => {
        if (vi !== variantIndex) return v;
        return {
          ...v,
          images: (v.images || []).filter((_, mi) => mi !== mediaIndex)
        };
      })
    }));
  };

  const handleAdd = () => {
    setFormData({
      name: "",
      category: categories[0]?.name || "Necklaces",
      model: "",
      description: "",
      product_code: "",
      instagram_reel_url: "",
      is_active: true,
      allow_reviews: true,
      variants: [
        {
          color: "Gold",
          instagram_link: "",
          images: [],
          sizes: [{ size: "Standard", mrp: "", our_price: "", stock: 10, stock_delta: "", code: "", weight: "", offer_id: "", notes: "" }]
        }
      ],
      details: [],
      reviews: []
    });
    setEditProduct({});
    setIsNew(true);
  };

  const handleEdit = (product) => {
    let variants = product.variants;
    if (!variants || variants.length === 0) {
      const images = Array.isArray(product.images) && product.images.length > 0 
        ? product.images 
        : (product.image_url ? [product.image_url] : []);
      const sizes = product.sizes ? product.sizes.map(s => ({
         size: s.size || "Standard",
         mrp: s.mrp || s.price || 0, 
         our_price: s.our_price || s.price || 0,
         stock: s.stock || 0,
         code: s.sku || s.code || product.sku || product.product_code || "",
         weight: s.weight || "",
         offer_id: s.offer_id || "",
         notes: s.notes || ""
      })) : [{ size: "Standard", mrp: product.mrp || product.price || 0, our_price: product.price || 0, stock: product.stock || 10, code: product.sku || product.product_code || "" }];
      
      variants = [{
        color: product.color || "Gold",
        instagram_link: product.instagram_reel_url || "",
        images: images,
        sizes: sizes
      }];
    } else {
      variants = variants.map(v => ({
        color: v.color || "Gold",
        instagram_link: v.instagram_link || "",
        images: Array.isArray(v.images) ? v.images : (v.image_url ? [v.image_url] : []),
        sizes: Array.isArray(v.sizes) && v.sizes.length > 0 ? v.sizes.map(s => ({
          size: s.size || "Standard",
          mrp: s.mrp ?? s.price ?? 0,
          our_price: s.our_price ?? s.price ?? 0,
          stock: s.stock ?? 0,
          code: s.code || s.sku || product.sku || product.product_code || "",
          weight: s.weight || "",
          offer_id: s.offer_id || "",
          notes: s.notes || ""
        })) : [{ size: "Standard", mrp: 0, our_price: 0, stock: 10, code: product.sku || product.product_code || "" }]
      }));
    }

    setFormData({ 
      name: product.name || "",
      category: product.category || (categories[0]?.name || "Necklaces"),
      model: product.model || "",
      description: product.description || "",
      product_code: product.sku || product.product_code || "",
      instagram_reel_url: product.instagram_reel_url || "",
      is_active: product.is_active !== false,
      is_bestseller: product.is_bestseller || false,
      is_trending: product.is_trending || false,
      is_offer: product.is_offer || false,
      allow_reviews: product.allow_reviews ?? true,
      variants: variants,
      details: product.details || [],
      reviews: product.reviews || []
    });

    setEditProduct(product);
    setIsNew(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const prodToDelete = deleteTarget;
      const id = prodToDelete.id;
      const toDeleteImages = [];
      if (prodToDelete.image_url) toDeleteImages.push(prodToDelete.image_url);
      if (Array.isArray(prodToDelete.images)) toDeleteImages.push(...prodToDelete.images);
      if (Array.isArray(prodToDelete.variants)) {
        prodToDelete.variants.forEach(v => {
          if (Array.isArray(v.images)) toDeleteImages.push(...v.images);
        });
      }
      for (const imgUrl of toDeleteImages) {
        if (imgUrl && typeof imgUrl === 'string' && imgUrl.includes('cloudinary.com')) {
          await deleteFromCloudinary(imgUrl).catch(() => null);
        }
      }

      const numId = Number(id);
      if (!isNaN(numId)) {
        await supabase.from('products').delete().eq('id', numId);
      } else {
        await supabase.from('products').delete().eq('id', id).catch(() => null);
      }

      const token = localStorage.getItem("token");
      await fetch(`${BACKEND_URL}/admin/products/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).catch(() => null);

      await fetchData();
      await useStoreData.getState().fetchData();
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      alert("Error deleting product: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!formData.name.trim()) {
        alert("Please enter a product title");
        setSaving(false);
        return;
      }
      if (!formData.category) {
        alert("Please select a category");
        setSaving(false);
        return;
      }

      const payload = { ...formData };

      if (!isNew && editProduct) {
        const oldImages = [];
        if (editProduct.image_url) oldImages.push(editProduct.image_url);
        if (Array.isArray(editProduct.images)) oldImages.push(...editProduct.images);
        if (Array.isArray(editProduct.variants)) {
          editProduct.variants.forEach(v => {
            if (Array.isArray(v.images)) oldImages.push(...v.images);
          });
        }

        const newImages = new Set();
        if (payload.variants) {
          payload.variants.forEach(v => {
            if (Array.isArray(v.images)) v.images.forEach(img => newImages.add(img));
          });
        }

        for (const oldImg of oldImages) {
          if (oldImg && typeof oldImg === 'string' && oldImg.includes('cloudinary.com') && !newImages.has(oldImg)) {
            await deleteFromCloudinary(oldImg).catch(() => null);
          }
        }
      }

      const allVariantImages = (payload.variants || []).flatMap(v => v.images || []);
      const primaryImage = allVariantImages[0] || (payload.variants && payload.variants[0]?.images?.[0]) || payload.image_url || '';
      const allImages = allVariantImages.length > 0 ? allVariantImages : (payload.images || (primaryImage ? [primaryImage] : []));

      const supabasePayload = {
        name: payload.name.trim(),
        category: payload.category,
        description: payload.description || '',
        image_url: primaryImage,
        images: allImages,
        variants: payload.variants || [],
        sizes: payload.variants?.[0]?.sizes || [],
        model: payload.model || '',
        sku: payload.product_code || '',
        rating: payload.rating || 4.8,
        is_active: payload.is_active,
        is_bestseller: payload.is_bestseller,
        is_trending: payload.is_trending,
        is_offer: payload.is_offer,
        allow_reviews: payload.allow_reviews
      };

      if (isNew) {
        await supabase.from('products').insert([supabasePayload]);
      } else {
        const numId = Number(editProduct.id);
        await supabase.from('products').update(supabasePayload).eq('id', !isNaN(numId) ? numId : editProduct.id);
      }

      const token = localStorage.getItem("token");
      const url = isNew ? `${BACKEND_URL}/admin/products` : `${BACKEND_URL}/admin/products/${editProduct.id}`;
      await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }).catch(() => null);

      setEditProduct(null);
      await fetchData();
      await useStoreData.getState().fetchData();
    } catch (err) {
      console.error(err);
      alert("Error saving product: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const [togglingSkuId, setTogglingSkuId] = React.useState(null);

  const handleQuickStockToggle = async (row) => {
    setTogglingSkuId(row.skuId);
    try {
      const isCurrentlyInStock = Number(row.size.stock || 0) > 0;
      const newStock = isCurrentlyInStock ? 0 : 10;
      const targetProductId = row.product.id;

      // 1. Calculate updated variants for this product
      let variants = Array.isArray(row.product.variants) && row.product.variants.length > 0
        ? JSON.parse(JSON.stringify(row.product.variants))
        : [{
            color: row.product.color || "Gold",
            images: Array.isArray(row.product.images) ? row.product.images : (row.product.image_url ? [row.product.image_url] : []),
            sizes: [{ size: "Standard", mrp: row.product.mrp || row.product.price || 0, our_price: row.product.price || 0, stock: newStock, code: row.product.sku || row.product.product_code || "" }]
          }];

      const vIdx = row.vIndex ?? 0;
      const sIdx = row.sIndex ?? 0;

      if (!variants[vIdx]) {
        variants[vIdx] = {
          color: row.variant?.color || "Gold",
          images: [],
          sizes: [{ size: "Standard", mrp: 0, our_price: 0, stock: newStock, code: "" }]
        };
      }

      if (!Array.isArray(variants[vIdx].sizes) || variants[vIdx].sizes.length === 0) {
        variants[vIdx].sizes = [{ size: "Standard", mrp: 0, our_price: 0, stock: newStock, code: "" }];
      } else if (variants[vIdx].sizes[sIdx]) {
        variants[vIdx].sizes[sIdx].stock = newStock;
      } else {
        variants[vIdx].sizes[0].stock = newStock;
      }

      // 2. Optimistically update local component state immediately
      setProducts(prev => prev.map(p => {
        if (p.id === targetProductId) {
          return {
            ...p,
            variants: variants,
            sizes: variants[0]?.sizes || [],
            stock: newStock
          };
        }
        return p;
      }));

      // 3. Update global Zustand store optimistically
      useStoreData.setState(state => ({
        products: state.products.map(p => {
          if (p.id === targetProductId) {
            return {
              ...p,
              variants: variants,
              sizes: variants[0]?.sizes || [],
              stock: newStock
            };
          }
          return p;
        })
      }));

      // 4. Update Supabase
      const numId = Number(targetProductId);
      const supabaseId = !isNaN(numId) ? numId : targetProductId;

      await supabase.from('products').update({
        variants: variants,
        sizes: variants[0]?.sizes || [],
        stock: newStock
      }).eq('id', supabaseId);

      // 5. Update Backend REST API
      const token = localStorage.getItem("token");
      await fetch(`${BACKEND_URL}/admin/products/${targetProductId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...row.product, variants, sizes: variants[0]?.sizes || [], stock: newStock })
      }).catch(() => null);

    } catch (err) {
      console.error('Failed to toggle stock:', err);
      alert('Error updating stock: ' + err.message);
      await fetchData();
    } finally {
      setTogglingSkuId(null);
    }
  };

  const addVariant = () => {
    setFormData(prev => ({ 
      ...prev, 
      variants: [
        ...prev.variants, 
        { 
          color: "", 
          instagram_link: "", 
          images: [], 
          sizes: [{ size: "Standard", mrp: "", our_price: "", stock: 10, stock_delta: "", code: "", weight: "", offer_id: "", notes: "" }] 
        }
      ] 
    }));
  };
  
  const removeVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const addSizeToVariant = (vIndex) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, vi) => {
        if (vi !== vIndex) return v;
        return {
          ...v,
          sizes: [...v.sizes, { size: "Standard", mrp: "", our_price: "", stock: 10, stock_delta: "", code: "", weight: "", offer_id: "", notes: "" }]
        };
      })
    }));
  };
  
  const removeSizeFromVariant = (vIndex, sIndex) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, vi) => {
        if (vi !== vIndex) return v;
        return {
          ...v,
          sizes: v.sizes.filter((_, si) => si !== sIndex)
        };
      })
    }));
  };
  
  const updateSizeField = (vIndex, sIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, vi) => {
        if (vi !== vIndex) return v;
        return {
          ...v,
          sizes: v.sizes.map((s, si) => {
            if (si !== sIndex) return s;
            return { ...s, [field]: value };
          })
        };
      })
    }));
  };

  const updateVariantField = (vIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((v, vi) => (vi === vIndex ? { ...v, [field]: value } : v))
    }));
  };

  const addDetail = () => {
    setFormData({ ...formData, details: [...(formData.details || []), { label: "", value: "" }] });
  };

  const removeDetail = (index) => {
    const updated = [...formData.details];
    updated.splice(index, 1);
    setFormData({ ...formData, details: updated });
  };

  const updateDetailField = (index, field, value) => {
    const updated = [...formData.details];
    updated[index][field] = value;
    setFormData({ ...formData, details: updated });
  };

  const addReview = () => {
    setFormData({ ...formData, reviews: [...formData.reviews, { name: "", rating: 5, comment: "", color: "", size: "", date: new Date().toISOString() }] });
  };

  const removeReview = (index) => {
    const updated = [...formData.reviews];
    updated.splice(index, 1);
    setFormData({ ...formData, reviews: updated });
  };

  const updateReviewField = (index, field, value) => {
    const updated = [...formData.reviews];
    updated[index][field] = value;
    setFormData({ ...formData, reviews: updated });
  };
  
  const selectedCatObj = categories.find(c => c.name === formData.category);
  const availableModels = selectedCatObj?.models || [];

  const skuRows = [];
  products.forEach(p => {
    let variants = p.variants;
    if (!variants || variants.length === 0) {
      variants = [{ color: p.color || "Default", images: p.images || (p.image_url ? [p.image_url] : []) }];
    }
    variants.forEach((v, vIndex) => {
      const sizes = v.sizes && v.sizes.length > 0 ? v.sizes : [{ size: "Default", stock: p.stock || 0, code: p.product_code || "" }];
      sizes.forEach((s, sIndex) => {
        skuRows.push({
          product: p,
          variant: v,
          size: s,
          vIndex,
          sIndex,
          skuId: `${p.id}-${vIndex}-${sIndex}`
        });
      });
    });
  });

  const filteredSkus = skuRows.filter(row => {
    const s = search.toLowerCase();
    const nameMatch = row.product.name?.toLowerCase().includes(s);
    const catMatch = row.product.category?.toLowerCase().includes(s);
    const codeMatch = row.size.code?.toLowerCase().includes(s);
    const colorMatch = row.variant.color?.toLowerCase().includes(s);
    
    if (search && !nameMatch && !catMatch && !codeMatch && !colorMatch) return false;
    if (offerFilter === "has_offer" && !row.size.offer_id) return false;
    if (offerFilter === "no_offer" && row.size.offer_id) return false;
    if (categoryFilter !== "all" && row.product.category !== categoryFilter) return false;
    return true;
  }).sort((a, b) => {
    if (stockSort === "asc") return (a.size.stock || 0) - (b.size.stock || 0);
    if (stockSort === "desc") return (b.size.stock || 0) - (a.size.stock || 0);
    return 0;
  });

  const totalPages = Math.ceil(filteredSkus.length / itemsPerPage);
  const paginatedSkus = filteredSkus.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [search, stockSort, offerFilter, categoryFilter]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#45055B]/20 border-t-[#45055B] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#45055B]/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#45055B]">Products Management</h1>
          <p className="text-sm text-[#45055B]/60 mt-1">Manage catalog, multi-media uploads (photos & videos), variants, and inventory</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#45055B] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:bg-[#D4AF37] transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-[#45055B]/10">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#45055B]/40" />
          <input
            type="text"
            placeholder="Search by Title, Category, SKU or Color..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-[#FAF6F0] border border-[#45055B]/10 focus:outline-none focus:border-[#45055B]"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl bg-[#FAF6F0] border border-[#45055B]/10 focus:outline-none text-[#45055B]"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>

          <select
            value={offerFilter}
            onChange={(e) => setOfferFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl bg-[#FAF6F0] border border-[#45055B]/10 focus:outline-none text-[#45055B]"
          >
            <option value="all">All Offers</option>
            <option value="has_offer">With Offers</option>
            <option value="no_offer">Without Offers</option>
          </select>

          <select
            value={stockSort}
            onChange={(e) => setStockSort(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl bg-[#FAF6F0] border border-[#45055B]/10 focus:outline-none text-[#45055B]"
          >
            <option value="none">Sort by Stock</option>
            <option value="asc">Stock: Low to High</option>
            <option value="desc">Stock: High to Low</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#45055B]/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF6F0] text-[11px] font-bold font-sans text-[#45055B]/70 uppercase tracking-wider border-b border-[#45055B]/10">
                <th className="px-4 py-3">Product / Media</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3">Size & Code</th>
                <th className="px-4 py-3">MRP / Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3">Offer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#45055B]/10 text-sm">
              {paginatedSkus.map((row) => {
                const offerObj = row.size.offer_id ? offers.find(o => String(o.id) === String(row.size.offer_id)) : null;
                const mediaUrl = row.variant.images?.[0] || row.product.image_url;
                const isVid = isVideoUrl(mediaUrl);
                return (
                  <tr key={row.skuId} className="hover:bg-[#FAF6F0]/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#FAF6F0] border border-[#45055B]/10 overflow-hidden shrink-0 relative flex items-center justify-center">
                          {mediaUrl ? (
                            isVid ? (
                              <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-amber-400">
                                <Video className="w-5 h-5" />
                                <span className="text-[7px] font-bold">VIDEO</span>
                              </div>
                            ) : (
                              <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                            )
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-[#45055B]">{row.product.name}</p>
                          <p className="text-xs text-[#45055B]/50">{row.product.model || row.product.sku || 'Standard'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-[#45055B]">{row.product.category}</td>
                    <td className="px-4 py-3 text-xs text-[#45055B]">{row.variant.color || "Default"}</td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-xs text-[#45055B]">{row.size.size || "Standard"}</p>
                      <p className="text-[10px] text-[#45055B]/50 font-mono">#{row.size.code || row.product.product_code || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-[#45055B]">₹{Number(row.size.our_price || row.size.price || 0).toLocaleString('en-IN')}</span>
                        {row.size.mrp > row.size.our_price && (
                          <span className="text-[10px] line-through text-gray-400">₹{Number(row.size.mrp).toLocaleString('en-IN')}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleQuickStockToggle(row)}
                        disabled={togglingSkuId === row.skuId}
                        title="Click to toggle Available / Out of Stock"
                        className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs hover:scale-105 cursor-pointer border ${
                          Number(row.size.stock || 0) > 0 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100' 
                            : 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100'
                        }`}
                      >
                        {togglingSkuId === row.skuId ? (
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span className={`w-2 h-2 rounded-full ${Number(row.size.stock || 0) > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                        )}
                        <span>{Number(row.size.stock || 0) > 0 ? `✓ Available (${row.size.stock})` : '✗ Out of Stock'}</span>
                        <span className="text-[10px] text-gray-400 group-hover:text-gray-700 underline ml-1">
                          {Number(row.size.stock || 0) > 0 ? 'Set OOS' : 'Set In Stock'}
                        </span>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {row.size.notes ? (
                        <span className="text-[11px] text-[#45055B] bg-[#FAF6F0] border border-[#45055B]/15 px-2.5 py-1 rounded-lg max-w-[140px] truncate block font-medium">
                          {row.size.notes}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {offerObj ? (
                        <span className="text-[10px] font-bold text-white bg-blue-500 px-2 py-0.5 rounded-full">{offerObj.discount_percentage}% OFF</span>
                      ) : <span className="text-xs text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${row.product.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {row.product.is_active ? 'Active' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(row.product)} className="p-1.5 text-[#45055B] hover:bg-[#45055B]/10 rounded"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(row.product)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSkus.length === 0 && (
                <tr>
                  <td colSpan="10" className="px-4 py-12 text-center text-[#45055B]/50">No products/variants found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[#45055B]/10 bg-white">
            <span className="text-sm text-[#45055B]/60">Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredSkus.length)} of {filteredSkus.length} entries</span>
            <div className="flex gap-2">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1.5 border border-[#45055B]/20 rounded-lg text-sm font-semibold text-[#45055B] hover:bg-[#FAF6F0] disabled:opacity-50">Previous</button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1.5 border border-[#45055B]/20 rounded-lg text-sm font-semibold text-[#45055B] hover:bg-[#FAF6F0] disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>

      {editProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden max-h-[92vh] flex flex-col shadow-2xl border border-[#45055B]/20">
            <div className="bg-gradient-to-r from-[#45055B] to-[#2D023C] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-serif text-xl font-bold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {isNew ? "Add New Product" : `Edit Product: ${formData.name || 'Details'}`}
                </h2>
                <p className="text-xs text-white/70 mt-0.5">Upload photos & videos, configure variants, inventory, and pricing</p>
              </div>
              <button onClick={() => setEditProduct(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto bg-slate-50/50">
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="w-7 h-7 rounded-lg bg-[#45055B]/10 flex items-center justify-center text-[#45055B]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#45055B]">1. Basic Product Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-1 md:col-span-2">
                    <label className="text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1">
                      Product Title / Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Traditional Antique Gold Kundan Bridal Necklace Set"
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#45055B]/20 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#45055B]/20 focus:border-[#45055B]" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={formData.category} 
                      onChange={(e) => {
                        setFormData({ ...formData, category: e.target.value, model: "" });
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#45055B]/20 text-sm font-medium focus:outline-none focus:border-[#45055B]"
                    >
                      <option value="">-- Select Category --</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                      Model / Subcategory {availableModels.length > 0 ? '' : '(Optional)'}
                    </label>
                    {availableModels.length > 0 ? (
                      <select 
                        value={formData.model} 
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#45055B]/20 text-sm font-medium focus:outline-none focus:border-[#45055B]"
                      >
                        <option value="">Select Subcategory</option>
                        {availableModels.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        value={formData.model} 
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        placeholder="e.g. Choker, Long Haram, Temple"
                        className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#45055B]/20 text-sm font-medium focus:outline-none focus:border-[#45055B]" 
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1.5 block">
                    Product Description
                  </label>
                  <textarea 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    rows={3}
                    placeholder="Describe the jewelry design, craftsmanship, occasion, and styling recommendations..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#45055B]/20 text-sm font-medium focus:outline-none focus:border-[#45055B] resize-none" 
                  />
                </div>

                <div className="bg-[#FAF6F0] p-3 rounded-xl border border-[#45055B]/10 flex flex-wrap items-center gap-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 accent-[#45055B] rounded" />
                    <span className="text-xs font-bold text-[#45055B]">Active in Store</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_bestseller || false} onChange={(e) => setFormData({ ...formData, is_bestseller: e.target.checked })}
                      className="w-4 h-4 accent-[#45055B] rounded" />
                    <span className="text-xs font-bold text-[#45055B]">Best Seller Badge</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.is_trending || false} onChange={(e) => setFormData({ ...formData, is_trending: e.target.checked })}
                      className="w-4 h-4 accent-[#45055B] rounded" />
                    <span className="text-xs font-bold text-[#45055B]">Trending</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.allow_reviews ?? true} onChange={(e) => setFormData({ ...formData, allow_reviews: e.target.checked })}
                      className="w-4 h-4 accent-[#45055B] rounded" />
                    <span className="text-xs font-bold text-[#45055B]">Allow Customer Reviews</span>
                  </label>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-700">
                      <Film className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-base text-[#45055B]">2. Product Media (Photos & Videos) & Variants</h3>
                      <p className="text-[11px] text-gray-500">Multi-upload images, showcase videos, and configure sizes & pricing for each color</p>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={addVariant} 
                    className="text-xs bg-[#45055B] text-white px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow hover:bg-[#D4AF37] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5"/> Add Another Color Variant
                  </button>
                </div>

                <div className="space-y-6">
                  {formData.variants.map((variant, vIndex) => (
                    <div key={vIndex} className="bg-[#FAF6F0]/60 border border-[#45055B]/15 p-5 rounded-2xl relative space-y-4">
                      {formData.variants.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => removeVariant(vIndex)} 
                          className="absolute top-4 right-4 text-red-500 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                          title="Remove Color Variant"
                        >
                          <Trash2 className="w-4 h-4"/>
                        </button>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pr-8">
                        <div>
                          <label className="text-xs font-bold text-[#45055B] mb-1 block">
                            Color / Finish Name <span className="text-red-500">*</span>
                          </label>
                          <input 
                            value={variant.color} 
                            onChange={(e) => updateVariantField(vIndex, 'color', e.target.value)} 
                            placeholder="e.g. Gold, Rose Gold, Antique Matte, Ruby"
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#45055B]/20 text-sm font-semibold focus:outline-none focus:border-[#45055B]" 
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-[#45055B] mb-1 block">
                            Instagram Reel / Video URL (Optional)
                          </label>
                          <input 
                            value={variant.instagram_link || ""} 
                            onChange={(e) => updateVariantField(vIndex, 'instagram_link', e.target.value)} 
                            placeholder="e.g. https://www.instagram.com/reel/..."
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#45055B]/20 text-sm focus:outline-none focus:border-[#45055B]" 
                          />
                        </div>
                      </div>

                      <div className="bg-white p-4 rounded-xl border border-[#45055B]/10 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            <Video className="w-4 h-4 text-[#45055B]" /> Photos & Videos for {variant.color || 'this color'}
                          </label>
                          <span className="text-[11px] text-gray-500">Supports JPG, PNG, WEBP, MP4, WEBM (Multiple files)</span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          {variant.images.map((mediaUrl, imgIdx) => {
                            const isVid = isVideoUrl(mediaUrl);
                            return (
                              <div key={imgIdx} className="w-20 h-20 rounded-xl overflow-hidden border-2 border-[#45055B]/20 relative group bg-slate-900 shadow-sm">
                                {isVid ? (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-amber-400">
                                    <Play className="w-6 h-6 fill-amber-400" />
                                    <span className="text-[8px] font-bold mt-1 tracking-wider">VIDEO</span>
                                  </div>
                                ) : (
                                  <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                                )}

                                {imgIdx === 0 && (
                                  <span className="absolute top-1 left-1 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow">Cover</span>
                                )}

                                <button 
                                  type="button"
                                  onClick={() => handleRemoveMedia(vIndex, imgIdx)} 
                                  className="absolute inset-0 bg-red-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Delete Media"
                                >
                                  <Trash2 className="w-5 h-5 text-white" />
                                </button>
                              </div>
                            );
                          })}

                          {variant.images.length === 0 && (
                            <div className="w-20 h-20 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                              <Image className="w-5 h-5" />
                              <span className="text-[9px] mt-1 font-medium">No media</span>
                            </div>
                          )}

                          <div>
                            <input 
                              type="file" 
                              id={`media_up_${vIndex}`} 
                              multiple 
                              accept="image/*,video/*" 
                              onChange={(e) => handleMediaUpload(e, vIndex)} 
                              className="hidden" 
                            />
                            <label 
                              htmlFor={`media_up_${vIndex}`} 
                              className={`inline-flex items-center gap-2 border px-4 py-3 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm ${
                                uploadingVariantIndex === vIndex
                                  ? 'bg-amber-100 border-amber-400 text-amber-900 animate-pulse cursor-wait'
                                  : 'bg-[#FAF6F0] hover:bg-amber-50 text-[#45055B] border-[#45055B]/30 hover:border-[#45055B]'
                              }`}
                            >
                              {uploadingVariantIndex === vIndex ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-[#45055B] border-t-transparent rounded-full animate-spin shrink-0" />
                                  <span>{uploadProgress || "Uploading media..."}</span>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-4 h-4 text-[#45055B]" /> 
                                  <span>+ Upload Photos / Videos (Multi)</span>
                                </>
                              )}
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-[#45055B] flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-yellow-600" /> Sizes, SKU Code & Pricing
                          </label>
                          <button 
                            type="button"
                            onClick={() => addSizeToVariant(vIndex)} 
                            className="text-xs bg-white border border-[#45055B]/30 text-[#45055B] font-bold px-3 py-1 rounded-lg hover:bg-gray-50 flex items-center gap-1 shadow-sm"
                          >
                            <Plus className="w-3 h-3"/> + Add Size / Dimension
                          </button>
                        </div>

                        <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-1.5 bg-[#45055B]/5 rounded-lg text-[11px] font-bold text-[#45055B]/80 uppercase">
                          <div className="col-span-2">Size / Dimension</div>
                          <div className="col-span-2">Item Code / SKU *</div>
                          <div className="col-span-2">MRP Price (₹)</div>
                          <div className="col-span-2">Selling Price (₹)</div>
                          <div className="col-span-2">Stock Availability</div>
                          <div className="col-span-1">Offer</div>
                          <div className="col-span-1 text-right">Delete</div>
                        </div>

                        <div className="space-y-3">
                          {variant.sizes.map((sizeObj, sIndex) => {
                            const isStockAvailable = Number(sizeObj.stock || 0) > 0;
                            return (
                              <div key={sIndex} className="bg-white p-3.5 rounded-xl border border-[#45055B]/15 shadow-sm space-y-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2 items-center">
                                  <div className="lg:col-span-2">
                                    <label className="block lg:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5">Size Name</label>
                                    <input 
                                      value={sizeObj.size} 
                                      onChange={e => updateSizeField(vIndex, sIndex, 'size', e.target.value)} 
                                      placeholder="Size (e.g. Standard, 16 inch)" 
                                      className="w-full px-3 py-1.5 bg-[#FAF6F0] border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none" 
                                    />
                                  </div>
                                  <div className="lg:col-span-2">
                                    <label className="block lg:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5">Item Code / SKU *</label>
                                    <input 
                                      value={sizeObj.code || ""} 
                                      onChange={e => updateSizeField(vIndex, sIndex, 'code', e.target.value)} 
                                      placeholder="SKU Code (e.g. NK-01)" 
                                      className="w-full px-3 py-1.5 bg-[#FAF6F0] border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none" 
                                    />
                                  </div>
                                  <div className="lg:col-span-2">
                                    <label className="block lg:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5">MRP Price (₹)</label>
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">₹</span>
                                      <input 
                                        type="number" 
                                        value={sizeObj.mrp} 
                                        onChange={e => updateSizeField(vIndex, sIndex, 'mrp', e.target.value)} 
                                        placeholder="MRP Price" 
                                        className="w-full pl-6 pr-2 py-1.5 bg-[#FAF6F0] border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none" 
                                      />
                                    </div>
                                  </div>
                                  <div className="lg:col-span-2">
                                    <label className="block lg:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5">Selling Price (₹) *</label>
                                    <div className="relative">
                                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-yellow-600 font-bold">₹</span>
                                      <input 
                                        type="number" 
                                        value={sizeObj.our_price} 
                                        onChange={e => updateSizeField(vIndex, sIndex, 'our_price', e.target.value)} 
                                        placeholder="Selling Price" 
                                        className="w-full pl-6 pr-2 py-1.5 bg-[#FAF6F0] border border-[#45055B]/30 rounded-lg text-xs font-bold text-[#45055B] focus:outline-none" 
                                      />
                                    </div>
                                  </div>
                                  <div className="lg:col-span-2">
                                    <label className="block lg:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5">Stock Availability</label>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          updateSizeField(vIndex, sIndex, 'stock', isStockAvailable ? 0 : 10);
                                        }}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-2xs ${
                                          isStockAvailable 
                                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200' 
                                            : 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200'
                                        }`}
                                      >
                                        <span className={`w-2 h-2 rounded-full ${isStockAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                        {isStockAvailable ? '✓ Available' : '✗ Out of Stock'}
                                      </button>
                                      {isStockAvailable && (
                                        <input 
                                          type="number" 
                                          min="1"
                                          value={sizeObj.stock || 1} 
                                          onChange={e => {
                                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                                            updateSizeField(vIndex, sIndex, 'stock', val);
                                          }} 
                                          placeholder="Qty" 
                                          title="Available stock quantity"
                                          className="w-16 px-1.5 py-1.5 bg-[#FAF6F0] border border-emerald-300 rounded-lg text-xs font-bold text-emerald-900 text-center focus:outline-none" 
                                        />
                                      )}
                                    </div>
                                  </div>
                                  <div className="lg:col-span-1">
                                    <label className="block lg:hidden text-[10px] font-bold text-gray-500 uppercase mb-0.5">Offer</label>
                                    <select 
                                      value={sizeObj.offer_id || ""} 
                                      onChange={e => updateSizeField(vIndex, sIndex, 'offer_id', e.target.value)} 
                                      className="w-full px-2 py-1.5 bg-[#FAF6F0] border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none"
                                    >
                                      <option value="">None</option>
                                      {offers.filter(o => (o.active ?? o.is_active ?? true)).map(o => (
                                        <option key={o.id} value={o.id}>
                                          {o.title ? `${o.discount_percentage}%` : `${o.discount_percentage}%`}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="lg:col-span-1 flex justify-end">
                                    <button 
                                      type="button"
                                      onClick={() => removeSizeFromVariant(vIndex, sIndex)} 
                                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                      title="Delete Size"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 border-t border-gray-100">
                                  <div>
                                    <input 
                                      value={sizeObj.weight || ""} 
                                      onChange={e => updateSizeField(vIndex, sIndex, 'weight', e.target.value)} 
                                      placeholder="Weight (e.g. 35g)" 
                                      className="w-full px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none" 
                                    />
                                  </div>
                                  <div className="sm:col-span-3">
                                    <input 
                                      value={sizeObj.notes || ""} 
                                      onChange={e => updateSizeField(vIndex, sIndex, 'notes', e.target.value)} 
                                      placeholder="Special Notes / Tagline (e.g. 22k Gold Micron Plating, Includes matching earrings)" 
                                      className="w-full px-2.5 py-1 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 placeholder-amber-400 focus:outline-none" 
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h3 className="font-serif font-bold text-base text-[#45055B]">3. Product Specifications & Highlights</h3>
                  </div>
                  <button 
                    type="button"
                    onClick={addDetail} 
                    className="text-xs bg-[#FAF6F0] border border-[#45055B]/20 text-[#45055B] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-[#FAF6F0]/80 shadow-sm"
                  >
                    <Plus className="w-3 h-3"/> + Add Specification
                  </button>
                </div>
                <p className="text-xs text-gray-500">Add key jewelry specs like Material, Plating, Stone Type, Closure, Occasion, etc.</p>
                <div className="space-y-2">
                  {(formData.details || []).map((detail, dIndex) => (
                    <div key={dIndex} className="flex items-center gap-2 bg-[#FAF6F0]/60 p-2.5 rounded-xl border border-gray-200">
                      <input
                        value={detail.label}
                        onChange={e => updateDetailField(dIndex, 'label', e.target.value)}
                        placeholder="Spec Label (e.g. Material, Stone Type)"
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none"
                      />
                      <input
                        value={detail.value}
                        onChange={e => updateDetailField(dIndex, 'value', e.target.value)}
                        placeholder="Spec Value (e.g. Brass with 22k Gold Polish)"
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => removeDetail(dIndex)} 
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4"/>
                      </button>
                    </div>
                  ))}
                  {(!formData.details || formData.details.length === 0) && (
                    <p className="text-xs text-gray-400 italic">No extra specifications added yet.</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="border-t border-[#45055B]/10 px-6 py-4 flex gap-4 shrink-0 bg-white shadow-lg">
              <button 
                type="button"
                onClick={() => setEditProduct(null)} 
                className="flex-1 px-5 py-3 bg-[#FAF6F0] text-[#45055B] rounded-xl font-bold hover:bg-[#FAF6F0]/80 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSave} 
                disabled={saving || uploading || !formData.name || formData.variants.length === 0} 
                className="flex-1 px-5 py-3 bg-[#45055B] text-white rounded-xl font-bold flex justify-center items-center gap-2 shadow-lg shadow-[#45055B]/20 hover:bg-[#D4AF37] disabled:opacity-50 transition-all cursor-pointer"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4" /> Save Product</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Product"
        itemName={deleteTarget?.name}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
