import React, { useEffect, useState } from "react";
import { MessageSquare, Mail, Phone, Calendar, Trash2, Search, CheckCircle, ExternalLink, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../../utils/supabase";
import { DeleteConfirmModal } from "../../components/admin/DeleteConfirmModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";

export function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      // 1. Try fetching from Supabase first
      let data = [];
      try {
        const { data: sbData, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false });
        if (!error && sbData && sbData.length > 0) {
          data = sbData;
        }
      } catch (e) {}

      // 2. Fallback / merge with backend API
      if (data.length === 0) {
        const token = localStorage.getItem("token");
        const res = await fetch(`${BACKEND_URL}/admin/enquiries`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }).catch(() => null);
        const resData = res ? await res.json().catch(() => ({})) : {};
        if (resData.enquiries) data = resData.enquiries;
      }

      setEnquiries(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setIsDeleting(true);
    try {
      // 1. Delete from Supabase
      try {
        await supabase.from('enquiries').delete().eq('id', id);
      } catch (e) {}

      // 2. Delete from Backend REST
      const token = localStorage.getItem("token");
      await fetch(`${BACKEND_URL}/admin/enquiries/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).catch(() => null);

      setEnquiries(prev => prev.filter(e => String(e.id) !== String(id)));
      if (selectedEnquiry && String(selectedEnquiry.id) === String(id)) {
        setSelectedEnquiry(null);
      }
      setDeleteTarget(null);
    } catch (err) {
      alert("Failed to delete inquiry: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };


  const filtered = enquiries.filter(e =>
    !search ||
    (e.name && e.name.toLowerCase().includes(search.toLowerCase())) ||
    (e.email && e.email.toLowerCase().includes(search.toLowerCase())) ||
    (e.subject && e.subject.toLowerCase().includes(search.toLowerCase())) ||
    (e.message && e.message.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#45055B]">Customer Enquiries</h1>
          <p className="text-[#45055B]/50 text-xs font-sans mt-0.5">Manage customer questions, messages, and contact requests</p>
        </div>
        <button
          onClick={fetchEnquiries}
          className="inline-flex items-center gap-1.5 bg-white border border-[#45055B]/10 hover:border-[#45055B]/30 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#45055B] transition-colors self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#45055B]/10 p-4 mb-6">
        <div className="relative">
          <Search className="w-4 h-4 text-[#45055B]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search enquiries by name, email, or message..."
            className="w-full bg-[#FAF6F0]/50 border border-[#45055B]/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#45055B] placeholder:text-[#45055B]/40 focus:outline-none focus:ring-2 focus:ring-[#45055B]/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-4 border-[#45055B]/20 border-t-[#45055B] rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#45055B]/10 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-[#45055B]/20 mx-auto mb-3" />
          <p className="font-serif text-lg font-bold text-[#45055B]">No Enquiries Found</p>
          <p className="text-xs text-[#45055B]/50 mt-1">Customer contact requests and messages will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-[#45055B]/10 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-serif font-bold text-[#45055B] text-base">{item.name || "Anonymous Customer"}</h3>
                    <p className="text-[#B38827] text-xs font-semibold">{item.subject || "General Inquiry"}</p>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    title="Delete Inquiry"
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-[#FAF6F0]/60 rounded-xl p-3 text-xs text-[#45055B]/80 leading-relaxed mb-4 whitespace-pre-wrap">
                  {item.message || "No message provided."}
                </div>

                <div className="space-y-1.5 text-xs text-[#45055B]/60">
                  {item.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-[#45055B]/40 shrink-0" />
                      <a href={`mailto:${item.email}`} className="text-[#45055B] hover:text-[#B38827] transition-colors truncate">
                        {item.email}
                      </a>
                    </div>
                  )}
                  {item.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-[#45055B]/40 shrink-0" />
                      <a href={`tel:${item.phone}`} className="text-[#45055B] hover:text-[#B38827] transition-colors">
                        {item.phone}
                      </a>
                    </div>
                  )}
                  {item.created_at && (
                    <div className="flex items-center gap-2 text-[11px] text-[#45055B]/40">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>{new Date(item.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#45055B]/10 flex items-center justify-between gap-2">
                {item.email && (
                  <a
                    href={`mailto:${item.email}?subject=Re: ${encodeURIComponent(item.subject || 'Lydia Global Exim Inquiry')}`}
                    className="text-xs font-semibold bg-[#45055B] hover:bg-[#5A0E72] text-white px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <Mail className="w-3 h-3" /> Reply Email
                  </a>
                )}
                {item.phone && (
                  <a
                    href={`https://wa.me/${item.phone.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(item.name || 'there')},%20regarding%20your%20inquiry%20with%20Lydia%20Global%20Exim...`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3 h-3" /> WhatsApp
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Sticky Deletion Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Customer Inquiry"
        itemName={deleteTarget?.name ? `${deleteTarget.name} - ${deleteTarget.subject || 'Inquiry'}` : deleteTarget?.subject}
        message={
          <>
            Are you sure you want to permanently delete the inquiry from{" "}
            <span className="font-bold text-[#45055B] bg-[#FAF6F0] px-2 py-0.5 rounded-md border border-[#45055B]/10 mx-1 inline-block">
              {deleteTarget?.name || deleteTarget?.email || "this customer"}
            </span>
            ? This action cannot be undone.
          </>
        }
        confirmText="Okay, Delete"
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

