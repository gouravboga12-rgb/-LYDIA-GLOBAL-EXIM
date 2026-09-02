import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, X, Save, Shield, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

import defaultOffers from "../../data/offers.json";
import { supabase } from "../../utils/supabase";
import { useStoreData } from "../../store/useStoreData";
import { DeleteConfirmModal } from "../../components/admin/DeleteConfirmModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";

export function AdminOffersPage() {
  const [offers, setOffers] = useState(defaultOffers || []);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Edit/Create state
  const [editOffer, setEditOffer] = useState(null);
  const [formData, setFormData] = useState({ title: "", discount_percentage: 0, is_active: true });
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);
  
  // Apply Offer state
  const [applyOfferId, setApplyOfferId] = useState(null);
  const [applyMode, setApplyMode] = useState('category'); // 'category' or 'products'
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  
  // Products selection
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchOffers();
    fetchCategories();
    fetchProducts();
  }, []);

  const fetchOffers = async () => {
    try {
      const { data, error } = await supabase.from('offers').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) {
        const normalized = data.map(o => ({
          ...o,
          active: o.active ?? o.is_active ?? true,
          is_active: o.active ?? o.is_active ?? true,
        }));
        setOffers(normalized);
        return;
      }
      const token = localStorage.getItem("token");
      const h = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${BACKEND_URL}/admin/offers`, { headers: h }).catch(() => null);
      const resData = res ? await res.json().catch(() => ({})) : {};
      if (resData && resData.offers && resData.offers.length > 0) {
        const normalized = resData.offers.map(o => ({
          ...o,
          active: o.active ?? o.is_active ?? true,
          is_active: o.active ?? o.is_active ?? true,
        }));
        setOffers(normalized);
      } else {
        const normalized = (defaultOffers || []).map(o => ({
          ...o,
          active: o.active ?? o.is_active ?? true,
          is_active: o.active ?? o.is_active ?? true,
        }));
        setOffers(normalized);
      }
    } catch (err) {
      console.error(err);
      setOffers((defaultOffers || []).map(o => ({
        ...o,
        active: o.active ?? o.is_active ?? true,
        is_active: o.active ?? o.is_active ?? true,
      })));
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('id', { ascending: true });
      if (!error && data) {
        setCategories(data);
        return;
      }
      const token = localStorage.getItem("token");
      const h = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${BACKEND_URL}/admin/categories`, { headers: h }).catch(() => null);
      const resData = res ? await res.json().catch(() => ({})) : {};
      if (resData.categories) setCategories(resData.categories);
    } catch (err) {}
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('id', { ascending: false });
      if (!error && data) {
        setProducts(data);
        return;
      }
      const res = await fetch(`${BACKEND_URL}/general/products`).catch(() => null);
      const resData = res ? await res.json().catch(() => ({})) : {};
      if (resData.products) setProducts(resData.products);
    } catch (err) {}
  };

  const handleAdd = () => {
    setFormData({ title: "", code: "SAVE" + Math.floor(10 + Math.random() * 90), discount_percentage: 0, is_active: true, active: true });
    setEditOffer({});
    setIsNew(true);
  };

  const handleEdit = (offer) => {
    const isActive = Boolean(offer.active ?? offer.is_active ?? true);
    setFormData({
      ...offer,
      is_active: isActive,
      active: isActive
    });
    setEditOffer(offer);
    setIsNew(false);
  };

  const handleToggleActive = async (offer, e) => {
    e?.stopPropagation();
    const currentActive = Boolean(offer.active ?? offer.is_active ?? true);
    const newActive = !currentActive;
    
    // Immediate optimistic state update
    setOffers(prev => prev.map(o => o.id === offer.id ? { ...o, active: newActive, is_active: newActive } : o));
    
    try {
      const numId = Number(offer.id);
      await supabase.from('offers').update({ active: newActive }).eq('id', !isNaN(numId) ? numId : offer.id);
      
      const token = localStorage.getItem("token");
      await fetch(`${BACKEND_URL}/admin/offers/${offer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ active: newActive, is_active: newActive }),
      }).catch(() => null);
      
      await useStoreData.getState().fetchData();
    } catch (err) {
      console.error("Error toggling offer:", err);
      fetchOffers();
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const id = deleteTarget.id;
      // 1. Delete from Supabase
      const numId = Number(id);
      if (!isNaN(numId)) {
        const { error: sbErr } = await supabase.from('offers').delete().eq('id', numId);
        if (sbErr) console.warn("Supabase offer delete note:", sbErr);
      } else {
        await supabase.from('offers').delete().eq('id', id).catch(() => null);
      }

      // 2. Delete from Backend REST (if available)
      const token = localStorage.getItem("token");
      await fetch(`${BACKEND_URL}/admin/offers/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).catch(() => null);
      
      await fetchOffers();
      await useStoreData.getState().fetchData();
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      alert("Error deleting offer: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!formData.title?.trim()) {
        alert("Please enter an offer title");
        setSaving(false);
        return;
      }

      const isActive = Boolean(formData.is_active ?? formData.active ?? true);
      const payload = {
        title: formData.title.trim(),
        code: (formData.code || "SAVE" + Math.floor(10 + Math.random() * 90)).toUpperCase().trim(),
        discount_percentage: Number(formData.discount_percentage || 0),
        active: isActive,
        min_order_value: Number(formData.min_order_value || 0),
        min_qty: Number(formData.min_qty || 1)
      };

      // 1. Sync with Supabase Cloud DB
      if (isNew) {
        const { error: sbErr } = await supabase.from('offers').insert([payload]);
        if (sbErr) console.warn("Supabase offer insert note:", sbErr);
      } else {
        const numId = Number(editOffer.id);
        const { error: sbErr } = await supabase.from('offers').update(payload).eq('id', !isNaN(numId) ? numId : editOffer.id);
        if (sbErr) console.warn("Supabase offer update note:", sbErr);
      }

      // 2. Save via Backend REST (if available)
      const token = localStorage.getItem("token");
      const url = isNew ? `${BACKEND_URL}/admin/offers` : `${BACKEND_URL}/admin/offers/${editOffer.id}`;
      await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...payload, is_active: isActive }),
      }).catch(() => null);

      setEditOffer(null);
      await fetchOffers();
      await useStoreData.getState().fetchData();
    } catch (err) {
      console.error(err);
      alert("Error saving offer: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApplyAction = async () => {
    if (!applyOfferId) return;
    try {
      const token = localStorage.getItem("token");
      const payload = {};
      if (applyMode === 'category') {
        if (!selectedCategory) return alert("Select a category");
        payload.category = selectedCategory;
      } else {
        if (selectedProducts.length === 0) return alert("Select at least one product");
        payload.productIds = selectedProducts;
      }
      
      await fetch(`${BACKEND_URL}/admin/offers/${applyOfferId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      
      alert("Offer applied successfully!");
      setApplyOfferId(null);
      setSelectedCategory("");
      setSelectedProducts([]);
      setSearchQuery("");
      fetchProducts(); // refresh products data if needed
    } catch (err) {
      alert("Failed to apply offer");
    }
  };

  const toggleProductSelection = (id) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#45055B]/20 border-t-[#45055B] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#45055B]">Offers</h1>
          <p className="text-[#45055B]/40 text-xs font-sans mt-0.5">Manage promotional offers</p>
        </div>
        <button onClick={handleAdd}
          className="flex items-center gap-2 bg-[#45055B] hover:bg-[#D4AF37] text-white px-4 py-2.5 rounded-xl font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Create Offer
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {offers.map((offer, i) => {
          const isActive = Boolean(offer.active ?? offer.is_active ?? true);
          return (
            <motion.div key={offer.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`bg-white rounded-2xl border p-5 shadow-sm relative overflow-hidden flex flex-col justify-between transition-all ${
                isActive ? 'border-[#45055B]/15' : 'border-gray-200 bg-gray-50/60 opacity-80'
              }`}>
              <div 
                onClick={(e) => handleToggleActive(offer, e)}
                className={`absolute top-0 right-0 text-[10px] font-bold px-3 py-1 rounded-bl-xl cursor-pointer select-none transition-all flex items-center gap-1.5 shadow-sm ${
                  isActive 
                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
                title="Click to toggle status"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                {isActive ? 'ACTIVE' : 'INACTIVE'}
              </div>

              <div>
                <div className="flex justify-between items-start mb-4 pr-16">
                  <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200">
                    <Shield className="w-4 h-4" />
                    <span className="font-bold tracking-wider">{offer.title}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleEdit(offer)} className="text-[#45055B] hover:bg-[#45055B]/10 p-1.5 rounded transition-colors" title="Edit offer"><Edit2 className="w-4 h-4" /></button>
                    <button onClick={() => setDeleteTarget(offer)} className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors" title="Delete offer"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="font-serif text-xl font-bold text-[#45055B]">
                    {parseFloat(offer.discount_percentage)}% OFF
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[#45055B]/10 flex items-center gap-2">
                 <button onClick={() => setApplyOfferId(offer.id)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 text-[#45055B] transition-colors">
                   Apply Offer <ArrowRight className="w-4 h-4" />
                 </button>
                 <button 
                   onClick={(e) => handleToggleActive(offer, e)}
                   className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                     isActive ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                   }`}
                 >
                   {isActive ? 'Deactivate' : 'Activate'}
                 </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {editOffer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div className="bg-white border-b border-[#45055B]/10 px-6 py-4 flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-[#45055B]">{isNew ? "Create" : "Edit"} Offer</h2>
              <button onClick={() => setEditOffer(null)} className="text-[#45055B]/50 hover:text-[#45055B]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-sans font-semibold text-[#45055B]/70 mb-1 block">Offer Title</label>
                <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Diwali Special"
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF6F0] border border-[#45055B]/10 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-sans font-semibold text-[#45055B]/70 mb-1 block">Discount Percentage (%)</label>
                <input type="number" value={formData.discount_percentage} onChange={(e) => setFormData({ ...formData, discount_percentage: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg bg-[#FAF6F0] border border-[#45055B]/10 focus:outline-none" />
              </div>
              <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-[#45055B]/10 mt-4">
                <div className="flex flex-col">
                  <span className="text-sm font-sans font-semibold text-[#45055B]">Active Status</span>
                  <span className="text-[11px] text-[#45055B]/60">Make this offer active across the store</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    id="offer_active" 
                    checked={Boolean(formData.is_active ?? formData.active ?? true)} 
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked, active: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#45055B]"></div>
                </label>
              </div>
            </div>
            <div className="border-t border-[#45055B]/10 px-6 py-4 flex gap-3">
              <button onClick={() => setEditOffer(null)} className="flex-1 px-4 py-2 bg-[#FAF6F0] text-[#45055B] rounded-xl font-semibold">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-[#45055B] text-white rounded-xl font-semibold flex justify-center items-center gap-2">
                {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {applyOfferId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-white border-b border-[#45055B]/10 px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="font-serif text-xl font-bold text-[#45055B]">Apply Offer</h2>
              <button onClick={() => { setApplyOfferId(null); setSelectedCategory(""); setSelectedProducts([]); }} className="text-[#45055B]/50 hover:text-[#45055B]">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="flex border-b border-gray-200 mb-4">
                <button 
                  className={`flex-1 py-2 font-semibold text-sm ${applyMode === 'category' ? 'border-b-2 border-[#45055B] text-[#45055B]' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setApplyMode('category')}
                >
                  By Category
                </button>
                <button 
                  className={`flex-1 py-2 font-semibold text-sm ${applyMode === 'products' ? 'border-b-2 border-[#45055B] text-[#45055B]' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={() => setApplyMode('products')}
                >
                  Specific Products
                </button>
              </div>

              {applyMode === 'category' ? (
                <div className="space-y-2">
                  <label className="text-sm font-semibold block text-[#45055B]">Select Category</label>
                  <select 
                    value={selectedCategory} 
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#FAF6F0] border border-[#45055B]/10 focus:outline-none"
                  >
                    <option value="">-- Choose Category --</option>
                    {categories.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">This will apply the offer to all products currently in this category.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <input 
                      type="text" 
                      placeholder="Search products..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#FAF6F0] border border-[#45055B]/10 focus:outline-none text-sm"
                    />
                  </div>
                  <div className="max-h-[300px] overflow-y-auto border border-gray-100 rounded-lg p-2 space-y-1">
                    {filteredProducts.map(p => (
                      <label key={p.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedProducts.includes(p.id)}
                          onChange={() => toggleProductSelection(p.id)}
                          className="w-4 h-4 text-[#45055B]"
                        />
                        <div className="flex items-center gap-2">
                          <img src={p.image_url} alt="" className="w-8 h-8 rounded object-cover" />
                          <span className="text-sm font-semibold">{p.name}</span>
                        </div>
                        {p.offer_id && (
                          <span className="ml-auto text-[10px] bg-gray-100 px-2 py-1 rounded-full text-gray-500">Has Offer</span>
                        )}
                      </label>
                    ))}
                    {filteredProducts.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No products found</p>}
                  </div>
                  <div className="text-xs text-gray-500 text-right">
                    {selectedProducts.length} selected
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-[#45055B]/10 px-6 py-4 flex gap-3 shrink-0">
              <button onClick={() => { setApplyOfferId(null); setSelectedCategory(""); setSelectedProducts([]); }} className="flex-1 px-4 py-2 bg-[#FAF6F0] text-[#45055B] rounded-xl font-semibold">Cancel</button>
              <button onClick={handleApplyAction} className="flex-1 px-4 py-2 bg-[#45055B] text-white rounded-xl font-semibold">
                Apply Offer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Deletion Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Offer"
        itemName={deleteTarget?.title}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

