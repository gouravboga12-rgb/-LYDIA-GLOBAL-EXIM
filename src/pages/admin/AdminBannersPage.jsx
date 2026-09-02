import React, { useEffect, useState } from "react";
import { ImageIcon, Plus, Trash2, Edit2, X, Save, Upload, Sparkles, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

import defaultBanners from "../../data/banners.json";
import { uploadToCloudinary, deleteFromCloudinary } from "../../utils/cloudinary";
import { supabase } from "../../utils/supabase";
import { useStoreData } from "../../store/useStoreData";

import banner1Velvet from '../../assets/banner_1_velvet_necklace.jpg';
import banner2Bridal from '../../assets/banner_2_bridal_kundan.jpg';
import banner3AntiTarnish from '../../assets/banner_3_antitarnish_gold.jpg';
import banner4Designer from '../../assets/banner_4_designer_jewelry.jpg';

const BANNER_ASSET_MAP = {
  '/assets/banner_1_velvet_necklace.jpg': banner1Velvet,
  '/assets/banner_2_bridal_kundan.jpg': banner2Bridal,
  '/assets/banner_3_antitarnish_gold.jpg': banner3AntiTarnish,
  '/assets/banner_4_designer_jewelry.jpg': banner4Designer,
  1: banner1Velvet,
  2: banner2Bridal,
  3: banner3AntiTarnish,
  4: banner4Designer,
};

function getBannerSrc(banner) {
  if (!banner) return '';
  if (banner.image_url && BANNER_ASSET_MAP[banner.image_url]) return BANNER_ASSET_MAP[banner.image_url];
  if (BANNER_ASSET_MAP[banner.id]) return BANNER_ASSET_MAP[banner.id];
  return banner.image_url || '';
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";

const EMPTY_FORM = {
  tag: "Exclusive Collection",
  titleLine1: "",
  titleLine2: "",
  title: "",
  subtitle: "",
  btn_text: "SHOP NOW",
  image_url: "",
  link_url: "/category/all",
  is_active: true
};

export function AdminBannersPage() {
  const [banners, setBanners] = useState(defaultBanners || []);
  const [loading, setLoading] = useState(true);
  const [editBanner, setEditBanner] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      let liveBanners = [];
      try {
        const { data, error } = await supabase.from('banners').select('*').order('id', { ascending: true });
        if (!error && data && data.length > 0) {
          liveBanners = data;
        }
      } catch (e) {}

      if (liveBanners.length === 0) {
        const token = localStorage.getItem("token");
        const h = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${BACKEND_URL}/admin/banners`, { headers: h }).catch(() => null);
        const data = res ? await res.json().catch(() => ({})) : {};
        if (data && data.banners && data.banners.length > 0) {
          liveBanners = data.banners;
        }
      }

      if (liveBanners.length === 0) {
        liveBanners = defaultBanners || [];
      }

      setBanners(liveBanners);
    } catch (err) {
      console.error(err);
      setBanners(defaultBanners || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData(EMPTY_FORM);
    setEditBanner({});
    setIsNew(true);
  };

  const handleEdit = (banner) => {
    const parts = (banner.title || '').split(',');
    const t1 = banner.titleLine1 || (parts[0] ? parts[0].trim() + (parts.length > 1 ? ',' : '') : '');
    const t2 = banner.titleLine2 || parts.slice(1).join(',').trim();

    setFormData({
      tag: banner.tag || "Exclusive Collection",
      titleLine1: t1,
      titleLine2: t2,
      title: banner.title || `${t1} ${t2}`.trim(),
      subtitle: banner.subtitle || "",
      btn_text: banner.btn_text || "SHOP NOW",
      image_url: banner.image_url || "",
      link_url: banner.link_url || "/category/all",
      is_active: banner.is_active !== false && banner.active !== false
    });
    setEditBanner(banner);
    setIsNew(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete banner? This will update the database and website globally.")) return;
    try {
      const bannerToDelete = banners.find(b => String(b.id) === String(id));
      if (bannerToDelete && bannerToDelete.image_url && bannerToDelete.image_url.includes('cloudinary.com')) {
        await deleteFromCloudinary(bannerToDelete.image_url);
      }

      // 1. Delete from Supabase
      const numId = Number(id);
      if (!isNaN(numId)) {
        const { error: sbErr } = await supabase.from('banners').delete().eq('id', numId);
        if (sbErr) console.warn("Supabase banner delete note:", sbErr);
      } else {
        await supabase.from('banners').delete().eq('id', id).catch(() => null);
      }

      // 2. Delete from Backend REST (if available)
      const token = localStorage.getItem("token");
      await fetch(`${BACKEND_URL}/admin/banners/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }).catch(() => null);

      await fetchBanners();
      await useStoreData.getState().fetchData();
    } catch (err) {
      console.error(err);
      alert("Error deleting banner: " + err.message);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!formData.image_url) {
        alert("Please upload or provide a banner image");
        setSaving(false);
        return;
      }

      // Check if image was replaced to purge old image from Cloudinary
      if (!isNew && editBanner && editBanner.image_url && editBanner.image_url !== formData.image_url) {
        if (editBanner.image_url.includes('cloudinary.com')) {
          await deleteFromCloudinary(editBanner.image_url);
        }
      }

      const fullTitle = `${formData.titleLine1 || ''} ${formData.titleLine2 || ''}`.trim() || formData.title || "Jewelry Banner";

      const payload = {
        tag: formData.tag || "Exclusive Collection",
        titleLine1: formData.titleLine1 || "",
        titleLine2: formData.titleLine2 || "",
        title: fullTitle,
        subtitle: formData.subtitle || "",
        btn_text: formData.btn_text || "SHOP NOW",
        image_url: formData.image_url,
        link_url: formData.link_url || "/category/all",
        active: formData.is_active ?? true
      };

      // 1. Sync with Supabase Cloud DB
      if (isNew) {
        const { error: sbErr } = await supabase.from('banners').insert([payload]);
        if (sbErr) console.warn("Supabase banner insert note:", sbErr);
      } else {
        const numId = Number(editBanner.id);
        const { error: sbErr } = await supabase.from('banners').update(payload).eq('id', !isNaN(numId) ? numId : editBanner.id);
        if (sbErr) console.warn("Supabase banner update note:", sbErr);
      }

      // 2. Save via Backend REST (if available)
      const token = localStorage.getItem("token");
      const url = isNew ? `${BACKEND_URL}/admin/banners` : `${BACKEND_URL}/admin/banners/${editBanner.id}`;
      await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...(isNew ? {} : { id: editBanner.id }),
          ...payload,
          is_active: payload.active
        }),
      }).catch(() => null);

      setEditBanner(null);
      await fetchBanners();
      await useStoreData.getState().fetchData();
    } catch (err) {
      console.error(err);
      alert("Error saving banner: " + err.message);
    } finally {
      setSaving(false);
    }
  };


  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      if (url) {
        setFormData({ ...formData, image_url: url });
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

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#45055B]/20 border-t-[#45055B] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#45055B]">Homepage Hero Banners</h1>
          <p className="text-[#45055B]/40 text-xs font-sans mt-0.5">Edit title lines, golden accents, descriptions, buttons, and background images</p>
        </div>
        <button onClick={handleAdd}
          className="flex items-center gap-2 bg-[#45055B] hover:bg-[#D4AF37] text-white px-4 py-2.5 rounded-xl font-semibold transition-colors cursor-pointer">
          <Plus className="w-4 h-4" /> Add Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {banners.map((banner, i) => {
          const imgSrc = getBannerSrc(banner);
          const isInactive = banner.is_active === false || banner.active === false;
          const parts = (banner.title || '').split(',');
          const t1 = banner.titleLine1 || (parts[0] ? parts[0].trim() + (parts.length > 1 ? ',' : '') : banner.title);
          const t2 = banner.titleLine2 || parts.slice(1).join(',').trim();

          return (
            <motion.div key={banner.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl border border-[#45055B]/10 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
              
              {/* Banner Visual Preview Box */}
              <div className="relative aspect-[16/8] bg-[#2A0835] overflow-hidden group">
                {imgSrc ? (
                  <img
                    src={imgSrc}
                    alt={banner.title}
                    className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      if (BANNER_ASSET_MAP[banner.id] && e.currentTarget.src !== BANNER_ASSET_MAP[banner.id]) {
                        e.currentTarget.src = BANNER_ASSET_MAP[banner.id];
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white/30"><ImageIcon className="w-10 h-10" /></div>
                )}
                
                {/* Gradient Overlay for Readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#2A0835]/90 via-[#2A0835]/60 to-transparent flex flex-col justify-center p-5 text-white">
                  {banner.tag && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D4AF37] mb-1 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> {banner.tag}
                    </span>
                  )}
                  <h3 className="font-serif font-extrabold text-sm sm:text-base leading-tight tracking-wide text-white">
                    {t1}
                  </h3>
                  {t2 && (
                    <h4 className="font-serif font-bold text-sm sm:text-base leading-tight text-[#D4AF37] mb-1.5">
                      {t2}
                    </h4>
                  )}
                  <p className="text-[11px] text-white/80 line-clamp-2 max-w-[75%] leading-relaxed">
                    {banner.subtitle || "Discover handcrafted luxury jewelry."}
                  </p>
                  <div className="mt-2.5">
                    <span className="inline-block bg-[#D4AF37] text-[#2A0835] text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {banner.btn_text || "SHOP NOW"}
                    </span>
                  </div>
                </div>

                {/* Edit & Delete Floating Buttons */}
                <div className="absolute top-2.5 right-2.5 flex gap-1.5 z-20">
                  <button onClick={() => handleDelete(banner.id)} className="bg-black/60 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors cursor-pointer">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleEdit(banner)} className="bg-black/60 hover:bg-[#D4AF37] text-white p-2 rounded-full shadow-lg transition-colors cursor-pointer">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isInactive && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none z-10">
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow">Inactive</span>
                  </div>
                )}
              </div>

              {/* Banner Details Footer */}
              <div className="p-4 bg-[#FAF6F0]/30 border-t border-[#45055B]/10 flex items-center justify-between text-xs text-[#45055B]/70">
                <span className="truncate max-w-[60%]">
                  <span className="font-bold text-[#45055B]">Link:</span> {banner.link_url || "/category/all"}
                </span>
                <span className={`font-semibold px-2 py-0.5 rounded-md ${isInactive ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                  {isInactive ? 'Hidden' : 'Live on Homepage'}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Edit / Add Modal */}
      {editBanner && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] shadow-2xl border border-[#45055B]/10">
            <div className="bg-[#FAF6F0] border-b border-[#45055B]/10 px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#45055B]">{isNew ? "Add New Hero Banner" : "Edit Hero Banner"}</h2>
                <p className="text-[11px] text-[#45055B]/50 font-sans">Configure all slide elements displayed on the website homepage hero slider</p>
              </div>
              <button onClick={() => setEditBanner(null)} className="text-[#45055B]/50 hover:text-[#45055B] cursor-pointer p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              
              {/* Tag / Badge */}
              <div>
                <label className="text-xs font-sans font-bold text-[#45055B] mb-1 block">Category / Tagline Badge</label>
                <input
                  type="text"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  placeholder="e.g. Bridal & Wedding Couture"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#45055B]/10 text-xs text-[#45055B] focus:outline-none focus:ring-2 focus:ring-[#45055B]/20"
                />
              </div>

              {/* Title Line 1 & Title Line 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-sans font-bold text-[#45055B] mb-1 block">Title Line 1 (Main White Heading)</label>
                  <input
                    type="text"
                    value={formData.titleLine1}
                    onChange={(e) => setFormData({ ...formData, titleLine1: e.target.value })}
                    placeholder="e.g. HERITAGE BRIDAL,"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#45055B]/10 text-xs text-[#45055B] font-bold focus:outline-none focus:ring-2 focus:ring-[#45055B]/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-sans font-bold text-[#D4AF37] mb-1 block">Title Line 2 (Golden Accent Heading)</label>
                  <input
                    type="text"
                    value={formData.titleLine2}
                    onChange={(e) => setFormData({ ...formData, titleLine2: e.target.value })}
                    placeholder="e.g. ROYAL KUNDAN ELEGANCE"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#D4AF37]/30 text-xs text-[#B38827] font-bold focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                  />
                </div>
              </div>

              {/* Subtitle / Description */}
              <div>
                <label className="text-xs font-sans font-bold text-[#45055B] mb-1 block">Subtitle / Description</label>
                <textarea
                  rows={2}
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g. Exquisite bridal necklaces, royal choker sets, and timeless luxury heirloom jewelry."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#45055B]/10 text-xs text-[#45055B] focus:outline-none focus:ring-2 focus:ring-[#45055B]/20 leading-relaxed"
                />
              </div>

              {/* Button Text & Target Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-sans font-bold text-[#45055B] mb-1 block">Button Text</label>
                  <input
                    type="text"
                    value={formData.btn_text}
                    onChange={(e) => setFormData({ ...formData, btn_text: e.target.value })}
                    placeholder="e.g. SHOP NOW"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#45055B]/10 text-xs text-[#45055B] font-semibold focus:outline-none focus:ring-2 focus:ring-[#45055B]/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-sans font-bold text-[#45055B] mb-1 block">Target Link URL</label>
                  <input
                    type="text"
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="e.g. /category/all"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF6F0] border border-[#45055B]/10 text-xs text-[#45055B] focus:outline-none focus:ring-2 focus:ring-[#45055B]/20"
                  />
                </div>
              </div>

              {/* Banner Background Image */}
              <div>
                <label className="text-xs font-sans font-bold text-[#45055B] mb-2 block">Background Banner Image</label>
                {formData.image_url ? (
                  <div className="relative aspect-[16/7] bg-[#2A0835] rounded-xl overflow-hidden mb-3 border border-[#45055B]/10">
                    <img src={formData.image_url} alt="Banner Preview" className="w-full h-full object-cover" />
                    
                    {/* Live preview overlay */}
                    <div className="absolute inset-0 bg-black/40 flex flex-col justify-center p-4 text-white">
                      <span className="text-[10px] text-[#D4AF37] font-bold uppercase">{formData.tag}</span>
                      <p className="font-serif font-bold text-xs">{formData.titleLine1 || formData.title}</p>
                      <p className="font-serif font-bold text-xs text-[#D4AF37]">{formData.titleLine2}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: "" })}
                      className="absolute top-2 right-2 bg-white text-red-500 p-1.5 rounded-full shadow hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full flex flex-col items-center justify-center px-4 py-7 bg-[#FAF6F0] border-2 border-dashed border-[#45055B]/20 rounded-xl cursor-pointer hover:border-[#45055B]/40 transition-colors">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <Upload className="w-7 h-7 text-[#45055B]/40 mb-1.5" />
                    <span className="text-xs font-semibold text-[#45055B]/70">{uploading ? "Uploading to Cloudinary..." : "Upload Image to Cloudinary"}</span>
                    <span className="text-[10px] text-[#45055B]/40 mt-0.5">Recommended aspect ratio 16:9 or 21:9</span>
                  </label>
                )}

                <div className="mt-2">
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="Or enter direct Image URL (https://...)"
                    className="w-full px-3 py-1.5 rounded-lg bg-[#FAF6F0] border border-[#45055B]/10 text-xs text-[#45055B]"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-2 pt-2 border-t border-[#45055B]/10">
                <input
                  type="checkbox"
                  id="banner_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#45055B] rounded cursor-pointer accent-[#45055B]"
                />
                <label htmlFor="banner_active" className="text-xs font-sans font-bold text-[#45055B] cursor-pointer">
                  Active (Show on Website Homepage)
                </label>
              </div>

            </div>

            <div className="border-t border-[#45055B]/10 px-6 py-4 flex gap-3 bg-[#FAF6F0]/50 shrink-0">
              <button
                type="button"
                onClick={() => setEditBanner(null)}
                className="flex-1 px-4 py-2.5 bg-white border border-[#45055B]/10 text-[#45055B] rounded-xl font-semibold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 px-4 py-2.5 bg-[#45055B] hover:bg-[#D4AF37] text-white rounded-xl font-semibold text-xs flex justify-center items-center gap-2 transition-colors cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? "Saving..." : "Save Banner"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
