import React, { useEffect, useState } from "react";
import { Plus, Trash2, Edit2, X, Save, Upload, FolderTree } from "lucide-react";
import { motion } from "framer-motion";

import defaultCategories from "../../data/categories.json";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary";
import { supabase } from "../../utils/supabase";
import { useStoreData } from "../../store/useStoreData";
import { DeleteConfirmModal } from "../../components/admin/DeleteConfirmModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState(defaultCategories || []);
  const [loading, setLoading] = useState(true);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({ name: "", models: [], image_url: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('*').order('id', { ascending: true });
      if (!error && data && data.length > 0) {
        setCategories(data);
        return;
      }
      const token = localStorage.getItem("token");
      const h = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${BACKEND_URL}/admin/categories`, { headers: h }).catch(() => null);
      const resData = res ? await res.json().catch(() => ({})) : {};
      if (resData && resData.categories && resData.categories.length > 0) {
        setCategories(resData.categories);
      } else {
        setCategories(defaultCategories || []);
      }
    } catch (err) {
      console.error(err);
      setCategories(defaultCategories || []);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        setFormData(prev => ({ ...prev, image_url: url }));
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Upload error");
    } finally {
      setUploading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ name: "", models: [], image_url: "" });
    setEditCategory({});
    setIsNew(true);
  };

  const handleEdit = (cat) => {
    setFormData({ name: cat.name || "", models: cat.models || [], image_url: cat.image_url || "" });
    setEditCategory(cat);
    setIsNew(false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const id = deleteTarget.id;
      if (deleteTarget.image_url && deleteTarget.image_url.includes('cloudinary.com')) {
        await deleteFromCloudinary(deleteTarget.image_url).catch(() => null);
      }

      // 1. Delete from Supabase
      const numId = Number(id);
      const targetId = !isNaN(numId) ? numId : id;
      const { error: sbErr } = await supabase.from('categories').delete().eq('id', targetId);
      if (sbErr) console.warn("Supabase category delete note:", sbErr);

      // 2. Delete from Backend REST
      const token = localStorage.getItem("token");
      await fetch(`${BACKEND_URL}/admin/categories/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).catch(() => null);

      await fetchCategories();
      await useStoreData.getState().fetchData();
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      alert("Error deleting category: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!formData.name.trim()) {
        alert("Please enter a category name");
        setSaving(false);
        return;
      }

      // Check if image was changed to delete the old one from Cloudinary
      if (!isNew && editCategory && editCategory.image_url && editCategory.image_url !== formData.image_url) {
        if (editCategory.image_url.includes('cloudinary.com')) {
          await deleteFromCloudinary(editCategory.image_url).catch(() => null);
        }
      }

      const payload = {
        name: formData.name.trim(),
        models: formData.models || [],
        image_url: formData.image_url || ""
      };

      // 1. Sync with Supabase Cloud DB
      if (isNew) {
        const { error: sbErr } = await supabase.from('categories').insert([payload]);
        if (sbErr) console.warn("Supabase category insert note:", sbErr);
      } else {
        const numId = Number(editCategory.id);
        const { error: sbErr } = await supabase.from('categories').update(payload).eq('id', !isNaN(numId) ? numId : editCategory.id);
        if (sbErr) console.warn("Supabase category update note:", sbErr);
      }

      // 2. Save via Backend REST (if available)
      const token = localStorage.getItem("token");
      const url = isNew ? `${BACKEND_URL}/admin/categories` : `${BACKEND_URL}/admin/categories/${editCategory.id}`;
      await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      }).catch(() => null);

      setEditCategory(null);
      await fetchCategories();
      await useStoreData.getState().fetchData();
    } catch (err) {
      console.error(err);
      alert("Error saving category: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#45055B]/20 border-t-[#45055B] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#45055B]">Categories</h1>
          <p className="text-[#45055B]/60 text-xs font-sans mt-0.5">Manage jewelry categories and cover images</p>
        </div>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#45055B] hover:bg-[#D4AF37] text-white px-4 py-2.5 rounded-xl font-semibold transition-colors shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat, index) => (
          <motion.div key={cat.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white rounded-2xl border border-[#45055B]/10 overflow-hidden shadow-sm flex flex-col justify-between">
            <div className="p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 rounded-2xl bg-[#FAF6F0] border border-[#45055B]/10 overflow-hidden flex items-center justify-center text-[#45055B] shrink-0 shadow-xs">
                  {cat.image_url ? (
                    <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <FolderTree className="w-6 h-6" />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif font-bold text-lg text-[#45055B] truncate">{cat.name}</h3>
                  <p className="text-xs text-[#45055B]/50 mt-0.5">Jewelry Category</p>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => handleEdit(cat)} className="p-2 text-[#45055B] hover:bg-[#45055B]/10 rounded-xl transition-colors cursor-pointer" title="Edit Category"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => setDeleteTarget(cat)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer" title="Delete Category"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </motion.div>
        ))}

        {categories.length === 0 && (
          <div className="col-span-full bg-white rounded-2xl border border-[#45055B]/10 p-12 text-center text-[#45055B]/50">
            No categories created yet. Click "Add Category" to get started.
          </div>
        )}
      </div>

      {editCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col shadow-2xl border border-[#45055B]/20">
            <div className="bg-white border-b border-[#45055B]/10 px-6 py-4 flex items-center justify-between shrink-0">
              <h2 className="font-serif text-xl font-bold text-[#45055B]">{isNew ? "Add" : "Edit"} Category</h2>
              <button onClick={() => setEditCategory(null)} className="text-[#45055B]/50 hover:text-[#45055B] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto">
              <div>
                <label className="text-xs font-sans font-semibold text-[#45055B]/70 mb-1.5 block">Category Name <span className="text-red-500">*</span></label>
                <input 
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Necklaces, Earrings, Bangles"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#45055B]/15 text-sm font-medium focus:outline-none focus:border-[#45055B]" 
                />
              </div>
              
              <div>
                <label className="text-xs font-sans font-semibold text-[#45055B]/70 mb-1.5 block">Category Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#FAF6F0] border border-[#45055B]/10 overflow-hidden flex items-center justify-center text-[#45055B] shrink-0 shadow-xs">
                    {formData.image_url ? (
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-[#45055B]/30" />
                    )}
                  </div>
                  <label className="px-4 py-2.5 bg-[#FAF6F0] text-[#45055B] border border-[#45055B]/20 rounded-xl font-semibold text-xs cursor-pointer hover:bg-[#45055B]/10 transition-colors">
                    {uploading ? "Uploading..." : "Upload Image"}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
            
            <div className="border-t border-[#45055B]/10 px-6 py-4 flex gap-3 shrink-0 bg-white">
              <button onClick={() => setEditCategory(null)} className="flex-1 px-4 py-2.5 bg-[#FAF6F0] text-[#45055B] rounded-xl font-semibold hover:bg-[#FAF6F0]/70 transition-colors cursor-pointer">Cancel</button>
              <button onClick={handleSave} disabled={saving || uploading || !formData.name} className="flex-1 px-4 py-2.5 bg-[#45055B] text-white rounded-xl font-semibold flex justify-center items-center gap-2 disabled:opacity-50 hover:bg-[#D4AF37] transition-colors shadow-sm cursor-pointer">
                {saving ? "Saving..." : <><Save className="w-4 h-4" /> Save Category</>}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Category"
        itemName={deleteTarget?.name}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
