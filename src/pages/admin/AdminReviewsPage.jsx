import React, { useEffect, useState } from 'react';
import { Star, Plus, Trash2, Edit2, X, Save, MessageSquare, Upload, Image as ImageIcon, Search, CheckCircle2, Eye, EyeOff, Package, Sparkles, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

import defaultReviews from '../../data/reviews.json';
import { uploadToCloudinary, deleteFromCloudinary } from '../../utils/cloudinary';
import { supabase } from '../../utils/supabase';
import { useStoreData } from '../../store/useStoreData';
import { DeleteConfirmModal } from '../../components/admin/DeleteConfirmModal';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/api';

const EMPTY = { 
  product_id: '',
  name: '', 
  rating: 5, 
  review: '', 
  location: 'India',
  verified: true,
  image_url: '', 
  is_active: true 
};

export function AdminReviewsPage() {
  const [reviews, setReviews] = useState(defaultReviews || []);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | review object
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Search and Filters
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  const { products } = useStoreData();

  useEffect(() => { fetchReviews(); }, []);

  const fetchReviews = async () => {
    try {
      let combined = [];

      // 1. Fetch from Supabase reviews table
      try {
        const { data: sbReviews } = await supabase.from('reviews').select('*').order('id', { ascending: false });
        if (sbReviews && sbReviews.length > 0) {
          combined = sbReviews.map(r => ({
            id: r.id,
            product_id: r.product_id,
            name: r.user_name || r.name,
            user_name: r.user_name || r.name,
            rating: r.rating,
            review: r.comment || r.review,
            comment: r.comment || r.review,
            location: r.location || '',
            verified: r.verified ?? true,
            is_active: r.is_active ?? true,
            image_url: r.image_url || '',
            created_at: r.created_at
          }));
        }
      } catch (sbErr) {}

      // 2. Fetch from Backend REST API
      const token = localStorage.getItem('token');
      const h = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${BACKEND_URL}/admin/reviews`, { headers: h }).catch(() => null);
      const data = res ? await res.json().catch(() => ({})) : {};
      
      if (data && data.reviews && data.reviews.length > 0) {
        const existingIds = new Set(combined.map(r => String(r.id)));
        for (const rev of data.reviews) {
          if (!existingIds.has(String(rev.id))) {
            combined.push({
              ...rev,
              name: rev.name || rev.user_name,
              review: rev.review || rev.comment
            });
          }
        }
      }

      if (combined.length === 0) {
        combined = defaultReviews || [];
      }

      setReviews(combined);
    } catch (err) {
      console.error(err);
      setReviews(defaultReviews || []);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { 
    setForm({
      ...EMPTY,
      product_id: products[0]?.id || ''
    }); 
    setModal('add'); 
  };

  const openEdit = (r) => { 
    setForm({ 
      product_id: r.product_id || '',
      name: r.name || r.user_name || '', 
      rating: r.rating || 5, 
      review: r.review || r.comment || '', 
      location: r.location || '',
      verified: r.verified ?? true,
      image_url: r.image_url || '', 
      is_active: r.is_active ?? true 
    }); 
    setModal(r); 
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        setForm(prev => ({ ...prev, image_url: url }));
      } else {
        alert('Failed to upload image');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.review.trim()) return;
    setSaving(true);
    try {
      const isNew = modal === 'add';

      // 1. Sync with Supabase
      try {
        const numPid = form.product_id ? Number(form.product_id) : null;
        const supabaseReview = {
          user_name: form.name.trim(),
          rating: Number(form.rating),
          comment: form.review.trim(),
          location: form.location?.trim() || 'India',
          verified: form.verified !== false
        };
        if (numPid && !isNaN(numPid)) {
          supabaseReview.product_id = numPid;
        }

        if (isNew) {
          await supabase.from('reviews').insert([supabaseReview]);
        } else {
          const numId = Number(modal.id);
          if (!isNaN(numId)) {
            await supabase.from('reviews').update(supabaseReview).eq('id', numId);
          }
        }
      } catch (sbErr) {
        console.warn("Supabase review save note:", sbErr);
      }

      // 2. Save via Backend REST
      const token = localStorage.getItem('token');
      const url = isNew ? `${BACKEND_URL}/admin/reviews` : `${BACKEND_URL}/admin/reviews/${modal.id}`;
      await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          user_name: form.name,
          comment: form.review,
          is_admin: true
        })
      }).catch(() => null);

      setModal(null);
      await fetchReviews();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (review) => {
    try {
      const newStatus = review.is_active === false ? true : false;
      const updated = reviews.map(r => r.id === review.id ? { ...r, is_active: newStatus } : r);
      setReviews(updated);

      await fetch(`${BACKEND_URL}/admin/reviews/${review.id}/toggle`, { method: 'PUT' }).catch(() => null);
    } catch (err) {
      console.error(err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const reviewToDelete = deleteTarget;
      const id = reviewToDelete.id;
      if (reviewToDelete && reviewToDelete.image_url && reviewToDelete.image_url.includes('cloudinary.com')) {
        await deleteFromCloudinary(reviewToDelete.image_url).catch(() => null);
      }

      // 1. Delete from Supabase
      const numId = Number(id);
      if (!isNaN(numId)) {
        await supabase.from('reviews').delete().eq('id', numId).catch(() => null);
      } else {
        await supabase.from('reviews').delete().eq('id', id).catch(() => null);
      }

      // 2. Delete from Backend REST
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/admin/reviews/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(() => null);

      await fetchReviews();
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      alert("Error deleting review: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const StarPicker = ({ value, onChange }) => (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button key={n} type="button" onClick={() => onChange(n)} className="p-0.5 hover:scale-110 transition-transform">
          <Star className={`w-6 h-6 transition-colors ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
        </button>
      ))}
    </div>
  );

  const filteredReviews = reviews.filter(r => {
    const s = search.toLowerCase();
    const nameMatch = (r.name || r.user_name || '').toLowerCase().includes(s);
    const textMatch = (r.review || r.comment || '').toLowerCase().includes(s);
    const locMatch = (r.location || '').toLowerCase().includes(s);

    if (search && !nameMatch && !textMatch && !locMatch) return false;
    if (productFilter !== 'all') {
      if (productFilter === 'homepage' && r.product_id) return false;
      if (productFilter !== 'homepage' && String(r.product_id) !== String(productFilter)) return false;
    }
    if (statusFilter === 'active' && r.is_active === false) return false;
    if (statusFilter === 'hidden' && r.is_active !== false) return false;
    if (ratingFilter !== 'all' && Number(r.rating) !== Number(ratingFilter)) return false;

    return true;
  });

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#45055B]/20 border-t-[#45055B] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-[#45055B]/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#45055B] flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-brand-gold" />
            Product Reviews & Feedback Management
          </h1>
          <p className="text-sm text-[#45055B]/60 mt-1">Full administrative control over verified customer reviews, ratings, and visibility</p>
        </div>
        <button 
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#45055B] hover:bg-[#D4AF37] text-white px-5 py-2.5 rounded-xl font-semibold shadow-md transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" /> Add Review
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-[#45055B]/10">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#45055B]/40" />
          <input
            type="text"
            placeholder="Search by customer, text, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-[#FAF6F0] border border-[#45055B]/10 focus:outline-none focus:border-[#45055B]"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl bg-[#FAF6F0] border border-[#45055B]/10 focus:outline-none text-[#45055B]"
          >
            <option value="all">All Products & Testimonials</option>
            <option value="homepage">Homepage Testimonials Only</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl bg-[#FAF6F0] border border-[#45055B]/10 focus:outline-none text-[#45055B]"
          >
            <option value="all">All Star Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
            <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
            <option value="3">⭐⭐⭐ (3 Stars)</option>
            <option value="2">⭐⭐ (2 Stars)</option>
            <option value="1">⭐ (1 Star)</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl bg-[#FAF6F0] border border-[#45055B]/10 focus:outline-none text-[#45055B]"
          >
            <option value="all">All Status</option>
            <option value="active">Active (Visible)</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-2xl border border-[#45055B]/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF6F0] text-[11px] font-bold font-sans text-[#45055B]/70 uppercase tracking-wider border-b border-[#45055B]/10">
                <th className="px-4 py-3">Customer & Location</th>
                <th className="px-4 py-3">Product / Target</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Feedback</th>
                <th className="px-4 py-3">Verified Buyer</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#45055B]/10 text-sm">
              {filteredReviews.map(r => {
                const targetProd = products.find(p => String(p.id) === String(r.product_id));
                return (
                  <tr key={r.id} className="hover:bg-[#FAF6F0]/40 transition-colors">
                    
                    {/* Customer */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#45055B] text-brand-gold font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                          {(r.name || r.user_name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-[#45055B] text-sm block">{r.name || r.user_name}</span>
                          <span className="text-xs text-gray-400">{r.location || 'India'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3">
                      {targetProd ? (
                        <div className="flex items-center gap-2 max-w-[200px]">
                          <Package className="w-4 h-4 text-brand-gold shrink-0" />
                          <span className="text-xs font-semibold text-[#45055B] truncate" title={targetProd.name}>
                            {targetProd.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          Homepage Testimonial
                        </span>
                      )}
                    </td>

                    {/* Stars */}
                    <td className="px-4 py-3">
                      <div className="flex gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-amber-400' : 'text-gray-200'}`} />
                        ))}
                      </div>
                    </td>

                    {/* Comment */}
                    <td className="px-4 py-3 max-w-xs">
                      <p className="line-clamp-2 text-xs text-gray-700 font-normal">"{r.review || r.comment}"</p>
                    </td>

                    {/* Verified */}
                    <td className="px-4 py-3">
                      {r.verified !== false ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Verified
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-medium">Unverified</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(r)}
                        className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition ${
                          r.is_active !== false 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                        title="Click to toggle visibility"
                      >
                        {r.is_active !== false ? 'Active' : 'Hidden'}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => toggleStatus(r)} 
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                          title={r.is_active !== false ? "Hide Review" : "Unhide Review"}
                        >
                          {r.is_active !== false ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => openEdit(r)} 
                          className="p-1.5 text-[#45055B] hover:bg-[#45055B]/10 rounded"
                          title="Edit Review"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setDeleteTarget(r)} 
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredReviews.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-[#45055B]/50">
                    No reviews found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Review Modal */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-[#45055B]/20">
            <div className="bg-gradient-to-r from-[#45055B] to-[#2D023C] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="font-serif text-lg font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-gold" />
                {modal === 'add' ? 'Add Review' : 'Edit Review'}
              </h2>
              <button onClick={() => setModal(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto bg-slate-50/50">
              
              {/* Product Target */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Assign to Product (Optional)</label>
                <select
                  value={form.product_id || ''}
                  onChange={e => setForm({ ...form, product_id: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#45055B]"
                >
                  <option value="">General / Homepage Testimonial</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Customer Name & Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">Customer Name *</label>
                  <input 
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Ananya Mehta"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#45055B]" 
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">City / Location</label>
                  <input 
                    value={form.location || ''} 
                    onChange={e => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Mumbai, India"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#45055B]" 
                  />
                </div>
              </div>

              {/* Rating */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1.5 block">Rating Score</label>
                <StarPicker value={form.rating} onChange={v => setForm({ ...form, rating: v })} />
              </div>
              
              {/* Review Text */}
              <div>
                <label className="text-xs font-bold text-gray-700 mb-1 block">Review Text *</label>
                <textarea 
                  value={form.review} 
                  onChange={e => setForm({ ...form, review: e.target.value })}
                  rows={4} 
                  placeholder="Enter detailed customer feedback..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-medium focus:outline-none focus:border-[#45055B] resize-none" 
                />
              </div>
              
              {/* Toggles */}
              <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.verified}
                    onChange={e => setForm({ ...form, verified: e.target.checked })} 
                    className="w-4 h-4 accent-[#45055B]" 
                  />
                  <span className="text-xs font-bold text-[#45055B]">Verified Buyer Badge</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={form.is_active}
                    onChange={e => setForm({ ...form, is_active: e.target.checked })} 
                    className="w-4 h-4 accent-[#45055B]" 
                  />
                  <span className="text-xs font-bold text-[#45055B]">Active / Visible</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0 bg-white">
              <button 
                onClick={() => setModal(null)} 
                className="flex-1 px-4 py-2.5 bg-[#FAF6F0] text-[#45055B] rounded-xl font-bold hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving || uploading || !form.name.trim() || !form.review.trim()}
                className="flex-1 px-4 py-2.5 bg-[#45055B] text-brand-gold rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-[#D4AF37] hover:text-[#45055B] transition shadow-md"
              >
                {saving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Review</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Sticky Deletion Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Review"
        itemName={`review by "${deleteTarget?.name || deleteTarget?.user_name}"`}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

