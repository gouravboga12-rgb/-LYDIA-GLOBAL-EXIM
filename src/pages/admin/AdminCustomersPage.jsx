import React, { useEffect, useState } from "react";
import { Users, Mail, Phone, Calendar, Search, Trash2, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

import { supabase } from "../../utils/supabase";
import { DeleteConfirmModal } from "../../components/admin/DeleteConfirmModal";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "/api";

function VerifiedBadge({ verified, label }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded">
      <CheckCircle className="w-3 h-3" /> {label}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
      <XCircle className="w-3 h-3" /> {label}
    </span>
  );
}

export function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      let combined = [];

      // 1. Fetch from Supabase profiles
      try {
        const { data: profiles, error } = await supabase.from('profiles').select('*');
        if (!error && profiles && profiles.length > 0) {
          combined = profiles.map(p => ({
            id: p.id,
            name: p.full_name || p.name || 'Customer',
            email: p.email || '',
            phone: p.phone || p.mobile || '',
            country: p.country || 'India',
            role: p.role || 'customer',
            created_at: p.created_at,
            is_email_verified: true,
            is_phone_verified: !!(p.phone || p.mobile)
          }));
        }
      } catch (e) {}

      // 2. Fetch from Backend API
      try {
        const token = localStorage.getItem("token");
        const h = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await fetch(`${BACKEND_URL}/admin/users`, { headers: h }).catch(() => null);
        const data = res ? await res.json().catch(() => ({})) : {};

        if (data && data.users && data.users.length > 0) {
          const existingEmails = new Set(combined.map(u => (u.email || '').toLowerCase()));
          const existingIds = new Set(combined.map(u => String(u.id)));

          for (const u of data.users) {
            const emailKey = (u.email || '').toLowerCase();
            const idKey = String(u.id || '');
            if ((!emailKey || !existingEmails.has(emailKey)) && (!idKey || !existingIds.has(idKey))) {
              combined.push({
                id: u.id,
                name: u.name || u.full_name || 'Customer',
                email: u.email || '',
                phone: u.phone || u.mobile || '',
                country: u.country || 'India',
                role: u.role || 'customer',
                created_at: u.created_at,
                is_email_verified: u.is_email_verified ?? true,
                is_phone_verified: u.is_phone_verified ?? !!(u.phone || u.mobile)
              });
            }
          }
        }
      } catch (e) {}

      // Filter out deleted / dummy users if any
      const validCustomers = combined.filter(c => c && !c.email?.startsWith('deleted_') && !c.is_deleted);
      setCustomers(validCustomers);
    } catch (err) {
      console.error("Failed to load customers:", err);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const confirmClearUser = async () => {
    if (!deleteTarget) return;
    const customer = deleteTarget;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${BACKEND_URL}/admin/users/${customer.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => null);

      // Also remove from Supabase profiles if exists
      try {
        if (customer.id) {
          await supabase.from('profiles').delete().eq('id', customer.id);
        }
        if (customer.email) {
          await supabase.from('profiles').delete().eq('email', customer.email);
        }
      } catch (e) {}

      setCustomers(prev => prev.filter(c => c.id !== customer.id && c.email !== customer.email));
      setDeleteTarget(null);
    } catch (err) {
      alert("Error clearing customer: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };


  const filtered = customers.filter(c =>
    (!search ||
      (c.name && c.name.toLowerCase().includes(search.toLowerCase())) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search))
    )
  );

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-[#45055B]/20 border-t-[#45055B] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="w-full max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#45055B]">Customers</h1>
          <p className="text-[#45055B]/40 text-xs font-sans mt-0.5">{customers.length} total users</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#45055B]/40" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full pl-9 pr-4 py-3 rounded-xl bg-white border border-[#45055B]/10 text-[#45055B] font-sans text-sm focus:outline-none focus:border-[#45055B]/30 shadow-sm" />
      </div>

      <div className="bg-white rounded-2xl border border-[#45055B]/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-sans min-w-[800px]">
            <thead>
              <tr className="bg-[#FAF6F0] text-[#45055B]/60 text-xs uppercase tracking-wider border-b border-[#45055B]/10">
                <th className="text-left py-4 px-4 font-semibold">Name</th>
                <th className="text-left py-4 px-4 font-semibold">Contact</th>
                <th className="text-left py-4 px-4 font-semibold">Country</th>
                <th className="text-left py-4 px-4 font-semibold">Joined / Type</th>
                <th className="text-left py-4 px-4 font-semibold">Role</th>
                <th className="py-4 px-4 font-semibold sticky right-0 bg-[#FAF6F0] z-10 shadow-[-4px_0_12px_rgba(0,0,0,0.03)]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#45055B]/5 relative">
              {filtered.map((customer, i) => (
                <motion.tr key={customer.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }} className="hover:bg-[#FAF6F0]/50 transition-colors">

                  {/* Name */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#45055B]/10 flex items-center justify-center text-[#45055B] font-bold shrink-0">
                        {(customer.name || "U")[0].toUpperCase()}
                      </div>
                      <span className="font-semibold text-[#45055B]">{customer.name || "Unknown"}</span>
                    </div>
                  </td>

                  {/* Contact (Email + Phone) */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-[#45055B]/70">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[160px]">{customer.email}</span>
                        <VerifiedBadge verified={customer.is_email_verified ?? customer.email_verified} label="" />
                      </div>
                      {customer.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-[#45055B]/70">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span>{customer.phone}</span>
                          <VerifiedBadge verified={customer.is_phone_verified ?? customer.phone_verified} label="" />
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Country */}
                  <td className="py-4 px-4 text-xs text-[#45055B]/70">
                    {customer.country || "—"}
                  </td>

                  {/* Joined / Type */}
                  <td className="py-4 px-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-[#45055B]/60">
                        <Calendar className="w-3.5 h-3.5" />
                        {customer.created_at ? new Date(customer.created_at).toLocaleDateString("en-IN") : "Recent"}
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          (customer.is_verified && !customer.email_verified && !customer.phone_verified) || (customer.avatar_url && customer.avatar_url.includes('google')) || customer.google_id || customer.auth_provider === 'google' || customer.provider === 'google' 
                            ? 'bg-red-50 text-red-600 border border-red-100' 
                            : 'bg-blue-50 text-blue-600 border border-blue-100'
                        }`}>
                          {(customer.is_verified && !customer.email_verified && !customer.phone_verified) || (customer.avatar_url && customer.avatar_url.includes('google')) || customer.google_id || customer.auth_provider === 'google' || customer.provider === 'google' ? 'Google' : 'Direct'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      customer.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                    }`}>
                      {customer.role || "user"}
                    </span>
                  </td>

                  {/* Clear action */}
                  <td className="py-4 px-4 text-center sticky right-0 bg-white z-10 shadow-[-4px_0_12px_rgba(0,0,0,0.03)] group-hover:bg-[#FAF6F0]/50">
                    {customer.role !== "admin" && (
                      <button
                        onClick={() => setDeleteTarget(customer)}
                        title="Clear customer record"
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </motion.tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#45055B]/50">
                    No registered customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky Deletion Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title="Clear Customer Record"
        itemName={deleteTarget?.name ? `${deleteTarget.name} (${deleteTarget.email || deleteTarget.phone})` : deleteTarget?.email}
        message={
          <>
            Are you sure you want to clear customer{" "}
            <span className="font-bold text-[#45055B] bg-[#FAF6F0] px-2 py-0.5 rounded-md border border-[#45055B]/10 mx-1 inline-block">
              {deleteTarget?.name || deleteTarget?.email}
            </span>
            ? This will remove their profile while preserving historical order analytics.
          </>
        }
        confirmText="Okay, Clear"
        isDeleting={isDeleting}
        onConfirm={confirmClearUser}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

